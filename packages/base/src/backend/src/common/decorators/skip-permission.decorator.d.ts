/**
 * @fileoverview 跳过权限校验装饰器
 * @description 标记接口跳过权限守卫检查，已认证用户可直接访问
 */
/**
 * 跳过权限校验标识键
 * @description 用于 Reflector 获取跳过权限标识
 */
export declare const SKIP_PERMISSION_KEY = "skip_permission";
/**
 * 跳过权限校验装饰器
 * @description 标记控制器方法跳过权限检查，已通过 AuthGuard 认证的用户可直接访问
 *
 * @example
 * ```typescript
 * @Controller('upload')
 * export class UploadController {
 *   @SkipPermission()
 *   @Post()
 *   async uploadFile() {}
 * }
 * ```
 */
export declare const SkipPermission: () => import("node_modules/@nestjs/common").CustomDecorator<string>;
