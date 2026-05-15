/**
 * @fileoverview 认证守卫
 * @description 验证用户身份，解析 JWT Token 并注入到请求中
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

/**
 * 用户信息接口
 * @description 从 JWT Token 中解析的用户载荷
 */
export interface JwtPayload {
  sub: string; // 用户 ID
  username: string;
  roleIds?: string[];
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

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token);

      // 将用户信息注入到请求中
      request['user'] = {
        id: payload.sub,
        username: payload.username,
        roleIds: payload.roleIds,
      };
    } catch (error) {
      throw new UnauthorizedException('Token 无效或已过期');
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
