/**
 * @fileoverview 权限装饰器
 * @description 定义接口所需的权限编码和权限值，支持多种调用方式
 */

import { registerPermissionValues } from '../constants/permissions';
import type { BasePermissionName } from '../constants/permissions';

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
   * @example ['添加', '编辑']、['删除']
   */
  permissionValue?: string[];
}

/**
 * 权限装饰器（基础框架使用）
 * @description 标记接口所需的权限，配合 PermissionGuard 使用
 *
 * **支持两种调用方式**：
 * 1. 对象形式：@RequirePermission({ permCode: 'system:user', permissionValue: ['添加'] })
 * 2. 简化形式：@RequirePermission('system:user', ['添加'])
 *
 * **支持多次注解**：一个接口可以有多个 @RequirePermission 装饰器，
 * 用户只要匹配其中任意一个权限即可访问（OR 逻辑）。
 *
 * @param optionsOrCode - 权限选项对象或权限编码字符串
 * @param permissionValue - 权限值数组（仅简化形式使用）
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 方式 1：对象形式 - 单个权限（查看权限不需要指定 permissionValue）
 * @RequirePermission({ permCode: 'system:user-list' })
 *
 * // 方式 2：对象形式 - 组合权限
 * @RequirePermission({ permCode: 'system:user-list', permissionValue: ['添加', '编辑'] })
 *
 * // 方式 3：简化形式 - 单个权限
 * @RequirePermission('system:user-list')
 *
 * // 方式 4：简化形式 - 组合权限
 * @RequirePermission('system:user-list', ['添加', '编辑'])
 *
 * // 方式 5：多次注解（OR 逻辑）
 * @RequirePermission('system:user-list')
 * @RequirePermission('system:role')
 * ```
 */
/**
 * 将权限选项累加到已有元数据数组中
 * @description 解决 NestJS SetMetadata 多次调用时后者覆盖前者的问题，
 * 使同一 handler 上的多个 @RequirePermission 装饰器可以共存（OR 逻辑）。
 */
function accumulateMetadata(
  metadataTarget: any,
  options: RequirePermissionOptions,
): void {
  const existing: RequirePermissionOptions[] =
    Reflect.getMetadata(REQUIRE_PERMISSION, metadataTarget) || [];
  const existingArray = Array.isArray(existing) ? existing : [existing];
  existingArray.push(options);
  Reflect.defineMetadata(REQUIRE_PERMISSION, existingArray, metadataTarget);
}

export function RequirePermission(
  optionsOrCode: RequirePermissionOptions | string,
  permissionValue?: string[],
): MethodDecorator & ClassDecorator {
  const options: RequirePermissionOptions =
    typeof optionsOrCode === 'string'
      ? { permCode: optionsOrCode, permissionValue }
      : optionsOrCode;

  return (target: any, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    const metadataTarget = descriptor ? descriptor.value : target;
    accumulateMetadata(metadataTarget, options);
    if (descriptor) {
      return descriptor;
    }
    return target;
  };
}

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
export function createBusinessPermissionDecorator<T extends readonly string[]>(
  businessPermissions: T,
): (
  permCode: string,
  permissionValue?: (BasePermissionName | T[number])[],
) => MethodDecorator & ClassDecorator {
  registerPermissionValues([...businessPermissions]);

  return function BusinessRequirePermission(
    permCode: string,
    permissionValue?: (BasePermissionName | T[number])[],
  ): MethodDecorator & ClassDecorator {
    const options: RequirePermissionOptions = {
      permCode,
      permissionValue: permissionValue as string[],
    };
    return (target: any, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
      const metadataTarget = descriptor ? descriptor.value : target;
      accumulateMetadata(metadataTarget, options);
      if (descriptor) {
        return descriptor;
      }
      return target;
    };
  };
}