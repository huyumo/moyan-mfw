/**
 * @fileoverview 认证守卫
 * @description 验证用户身份，解析 JWT Token 并注入到请求中。公共接口可选认证，非公共接口强制认证
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REDIS_ONLY_SERVICE } from '../../cache/cache.module';
import { IRedisOnlyService } from '../../cache/interfaces/cache-service.interface';
import { UserDto } from '../types/user.dto';

/**
 * 用户信息接口
 * @description 从 JWT Token 中解析的用户载荷
 */
export interface JwtPayload {
  sub: string; // 用户 ID
  username: string;
  roleIds?: string[];
  isDeveloper?: number;
  jti?: string;
}

/**
 * 认证守卫
 * @description 验证请求是否携带有效的 JWT Token
 *
 * 行为说明：
 * - 普通接口：必须携带有效 Token，否则抛出 UnauthorizedException
 * - @Public() 公共接口：认证为可选。携带有效 Token 时注入用户信息（配合 @User() 使用），
 *   无 Token 或 Token 无效时直接放行，不注入用户信息
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * providers: [AuthGuard],
 *
 * // 在控制器中使用
 * @UseGuards(AuthGuard)
 * class MyController {}
 * ```
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @Optional() @Inject(REDIS_ONLY_SERVICE) private readonly redis?: IRedisOnlyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // 公共接口：可选认证，有有效 Token 时注入用户信息，无 Token 或 Token 无效时直接放行
    if (isPublic) {
      if (token) {
        await this.authenticate(request, token, { required: false });
      }
      return true;
    }

    // 非公共接口：必须携带有效 Token
    if (!token) {
      throw new UnauthorizedException('未授权，请先登录');
    }

    await this.authenticate(request, token, { required: true });
    return true;
  }

  /**
   * 解析 Token 并注入用户信息到请求对象
   * @param request - HTTP 请求对象
   * @param token - JWT Token 字符串
   * @param options.required - 是否为必需认证。为 true 时 Token 无效或已黑名单将抛出异常；
   *                           为 false（公共接口）时静默跳过，不注入用户信息
   * @returns 是否成功注入用户信息
   */
  private async authenticate(
    request: any,
    token: string,
    options: { required: boolean },
  ): Promise<boolean> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      if (options.required) {
        throw new UnauthorizedException('Token 无效或已过期');
      }
      return false;
    }

    if (this.redis && payload.jti) {
      try {
        const blacklisted = await this.redis.isBlacklisted(payload.jti);
        if (blacklisted) {
          if (options.required) {
            throw new UnauthorizedException('Token 已失效，请重新登录');
          }
          return false;
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        this.logger.warn('Redis 黑名单检查失败，降级放行', error instanceof Error ? error.message : error);
      }
    }

    request['user'] = {
      id: payload.sub,
      username: payload.username,
      roleIds: payload.roleIds,
      isDeveloper: payload.isDeveloper,
    } as UserDto;

    return true;
  }

  /**
   * 从请求头中提取 Token
   * @param request - HTTP 请求对象
   * @returns Token 字符串或 null
   */
  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
