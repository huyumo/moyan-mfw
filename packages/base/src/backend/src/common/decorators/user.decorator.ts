/**
 * @fileoverview 用户装饰器
 * @description 从请求中提取用户信息的装饰器
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from '../types/user.dto';

/**
 * 用户装饰器
 * @description 从请求对象中提取用户信息，避免手动从 @Request() 中获取
 *
 * 可配合 @Public() 使用：在公开接口中，当请求携带有效 Token 时，AuthGuard 会自动
 * 解析并注入用户信息，此时 @User() 返回 UserDto；未携带 Token 或 Token 无效时返回 undefined。
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
 *
 * // 配合 @Public() 使用：登录与未登录均可访问，登录后可获取用户信息
 * @Public()
 * @Get('article/:id')
 * async getArticle(@Param('id') id: string, @User() user?: UserDto) {
 *   const article = await this.articleService.findById(id);
 *   // 未登录时 user 为 undefined，登录后可据此返回个性化数据
 *   return { ...article, isLiked: user ? this.likeService.check(id, user.id) : false };
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