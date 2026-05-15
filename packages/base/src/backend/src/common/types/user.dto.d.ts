/**
 * @fileoverview 用户 DTO
 * @description 从 JWT Token 中解析的用户信息，用于 @User() 装饰器
 */
/**
 * 用户 DTO
 * @description 从请求中获取的用户信息，由 AuthGuard 从 JWT Token 解析注入
 */
export declare class UserDto {
    /**
     * 用户 ID
     */
    id: string;
    /**
     * 用户名
     */
    username: string;
    /**
     * 角色 ID 列表
     */
    roleIds?: string[];
}
