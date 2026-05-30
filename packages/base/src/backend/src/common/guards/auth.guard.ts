/**
 * @fileoverview 认证守卫
 * @description 验证用户身份，解析 JWT Token 并注入到请求中
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REDIS_ONLY_SERVICE } from '../../cache/cache.module';
import { IRedisOnlyService } from '../../cache/interfaces/cache-service.interface';

/**
 * 用户信息接口
 * @description 从 JWT Token 中解析的用户载荷
 */
export interface JwtPayload {
  sub: string; // 用户 ID
  username: string;
  roleIds?: string[];
  jti?: string;
}

/**
 * 认证守卫
 * @description 验证请求是否携带有效的 JWT Token
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

    // 如果是公共接口，直接放行
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未授权，请先登录');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token 无效或已过期');
    }

    request['user'] = {
      id: payload.sub,
      username: payload.username,
      roleIds: payload.roleIds,
    };

    if (this.redis && payload.jti) {
      try {
        const blacklisted = await this.redis.isBlacklisted(payload.jti);
        if (blacklisted) {
          throw new UnauthorizedException('Token 已失效，请重新登录');
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        throw new UnauthorizedException('Token 已失效，请重新登录');
      }
    }

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
