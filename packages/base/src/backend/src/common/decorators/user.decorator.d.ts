/**
 * @fileoverview 用户装饰器
 * @description 从请求中提取用户信息的装饰器
 */
import { UserDto } from '../types/user.dto';
/**
 * 用户装饰器
 * @description 从请求对象中提取用户信息，避免手动从 @Request() 中获取
 *
 * @example
 * ```typescript
 * // 获取完整用户信息
 * @Get('profile')
 * async getProfile(@User() user: UserDto) {
 *   return { userId: user.id, username: user.username };
 * }
 *
 * // 获取单个属性
 * @Get('my-posts')
 * async getMyPosts(@User('id') userId: string) {
 *   return this.postService.findByUserId(userId);
 * }
 *
 * // 获取角色 ID 列表
 * @Get('roles')
 * async getRoles(@User('roleIds') roleIds: string[]) {
 *   return this.roleService.findByIds(roleIds);
 * }
 * ```
 */
export declare const User: (...dataOrPipes: (keyof UserDto | import("node_modules/@nestjs/common").PipeTransform<any, any> | import("node_modules/@nestjs/common").Type<import("node_modules/@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
