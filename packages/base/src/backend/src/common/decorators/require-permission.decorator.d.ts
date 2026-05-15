/**
 * @fileoverview 权限装饰器
 * @description 定义接口所需的权限编码和权限值，支持多种调用方式
 */
import type { BasePermissionName } from '../constants/permissions';
/**
 * 权限装饰器标识键
 */
export declare const REQUIRE_PERMISSION = "require_permission";
/**
 * 权限选项接口
 */
export interface RequirePermissionOptions {
    /** 权限编码，用于标识具体权限点 */
    permCode: string;
    /**
     * 权限值（位运算）- 必须使用字符串数组
     * @example ['添加', '编辑']、['删除']
     */
    permissionValue?: string[];
}
export declare function RequirePermission(optionsOrCode: RequirePermissionOptions | string, permissionValue?: string[]): MethodDecorator & ClassDecorator;
/**
 * 创建业务权限装饰器工厂函数
 * @param businessPermissions - 业务层权限值数组（readonly）
 * @returns 带有类型推断的业务权限装饰器
 *
 * @description 注册业务权限并返回一个带有完整类型推断的装饰器函数。
 * 业务层只需调用一次此函数，即可在所有控制器中获得类型提示。
 *
 * @example
 * ```typescript
 * // backend/src/permissions.ts
 * import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend';
 *
 * export const BUSINESS_PERMISSION_VALUES = ['上架', '发货', '退款'] as const;
 * export const RequireBusinessPermission = createBusinessPermissionDecorator(BUSINESS_PERMISSION_VALUES);
 *
 * // backend/src/modules/supplier/supplier.controller.ts
 * import { RequireBusinessPermission } from '../permissions';
 *
 * @RequireBusinessPermission('supplier:manage', ['上架', '发货', '添加'])  // 有完整类型推断
 * ```
 */
export declare function createBusinessPermissionDecorator<T extends readonly string[]>(businessPermissions: T): (permCode: string, permissionValue?: (BasePermissionName | T[number])[]) => MethodDecorator & ClassDecorator;
