/**
 * @fileoverview 业务层权限配置
 * @description 定义业务层扩展权限值，并提供带有类型推断的装饰器
 */

import { createBusinessPermissionDecorator } from 'moyan-base-backend';

/**
 * 业务层扩展权限值
 * 在使用 @RequireBusinessPermission 装饰器时会获得完整的类型推断
 */
export const BUSINESS_PERMISSION_VALUES = ['上架', '发货', '退款'] as const;

/**
 * 业务权限装饰器（带有类型推断）
 * 
 * @example
 * ```typescript
 * import { RequireBusinessPermission } from '../permissions';
 * 
 * @RequireBusinessPermission('supplier:manage', ['上架', '发货', '添加'])
 * ```
 */
export const Permission = createBusinessPermissionDecorator(BUSINESS_PERMISSION_VALUES);