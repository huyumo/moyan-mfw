/**
 * @fileoverview 认证守卫
 * @description 验证用户身份，解析 JWT Token 并注入到请求中
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
/**
 * 用户信息接口
 * @description 从 JWT Token 中解析的用户载荷
 */
export interface JwtPayload {
    sub: string;
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
export declare class AuthGuard implements CanActivate {
    private jwtService;
    private reflector;
    constructor(jwtService: JwtService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    /**
     * 从请求头中提取 Token
     * @param request - HTTP 请求对象
     * @returns Token 字符串或 null
     */
    private extractTokenFromHeader;
}
