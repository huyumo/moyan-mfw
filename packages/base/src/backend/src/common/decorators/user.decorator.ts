/**
 * @fileoverview 用户装饰器
 * @description 从请求中提取用户信息的装饰器
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from '../../types/user.dto';

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
export const User = createParamDecorator(
  (data: keyof UserDto | undefined, ctx: ExecutionContext): UserDto | UserDto[keyof UserDto] | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserDto | undefined;

    if (!user) {
      return undefined;
    }

    // 如果指定了属性名，返回该属性；否则返回完整用户信息
    if (data) {
      return user[data];
    }

    return user;
  },
);