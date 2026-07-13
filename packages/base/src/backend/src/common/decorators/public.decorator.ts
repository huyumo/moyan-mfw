/**
 * @fileoverview 公共接口装饰器
 * @description 标记接口为公共接口，无需认证即可访问
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 公共接口标识键
 * @description 用于 Reflector 获取公共接口标识
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 公共接口装饰器
 * @description 标记控制器方法为公共接口，无需认证即可访问
 *
 * 行为说明：认证为可选。未携带 Token 时直接放行；携带有效 Token 时，AuthGuard 会
 * 解析并注入用户信息，此时可配合 @User() 获取当前登录用户。适用于同一接口需要
 * 同时服务公开访问与登录后个性化数据的场景。
 *
 * @example
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   @Public()
 *   @Post('login')
 *   async login(@Body() dto: LoginDto) {}
 * }
 *
 * // 公开与登录均可访问，登录后可获取用户信息
 * @Controller('article')
 * export class ArticleController {
 *   @Public()
 *   @Get(':id')
 *   async getArticle(@Param('id') id: string, @User() user?: UserDto) {
 *     const article = await this.articleService.findById(id);
 *     return { ...article, isLiked: user ? this.likeService.check(id, user.id) : false };
 *   }
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
