/**
 * @fileoverview 权限装饰器
 * @description 定义接口所需的权限编码和权限值，支持多次注解和字符串数组
 */

import { SetMetadata } from '@nestjs/common';
import type { PermissionName } from '../constants/permissions';

/**
 * 权限装饰器标识键
 */
export const REQUIRE_PERMISSION = 'require_permission';

/**
 * 权限选项接口
 */
export interface RequirePermissionOptions {
  /** 权限编码，用于标识具体权限点 */
  permCode: string;
  /**
   * 权限值（位运算）- 必须使用字符串数组
   * @example ['查看']、['添加', '编辑']、['删除']
   */
  permissionValue: PermissionName[];
}

/**
 * 权限装饰器
 * @description 标记接口所需的权限，配合 PermissionGuard 使用
 *
 * **支持多次注解**：一个接口可以有多个 @RequirePermission 装饰器，
 * 用户只要匹配其中任意一个权限即可访问（OR 逻辑）。
 *
 * @param options - 权限选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 方式 1：单个权限
 * @RequirePermission({ permCode: 'system:user-list', permissionValue: ['查看'] })
 *
 * // 方式 2：组合权限
 * @RequirePermission({ permCode: 'system:user-list', permissionValue: ['查看', '添加', '编辑'] })
 *
 * // 方式 3：多次注解（OR 逻辑）
 * @RequirePermission({ permCode: 'system:user-list', permissionValue: ['查看'] })
 * @RequirePermission({ permCode: 'system:role', permissionValue: ['查看'] })
 * ```
 */
export const RequirePermission = (options: RequirePermissionOptions) =>
  SetMetadata(REQUIRE_PERMISSION, options);
