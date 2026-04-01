/**
 * @fileoverview 权限装饰器
 * @description 定义接口所需的权限编码和权限值
 */

import { SetMetadata } from '@nestjs/common';

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
  /** 权限值（位运算），默认为 0 */
  permissionValue?: bigint;
}

/**
 * 权限装饰器
 * @description 标记接口所需的权限，配合 PermissionGuard 使用
 *
 * @param options - 权限选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(PermissionGuard)
 * export class UserController {
 *   // 需要查看权限（permissionValue: 32n = VIEW）
 *   @RequirePermission({ permCode: 'system:user-list', permissionValue: 32n })
 *   @Get()
 *   async findAll() {}
 *
 *   // 需要新增权限（permissionValue: 1n = ADD）
 *   @RequirePermission({ permCode: 'system:user-list', permissionValue: 1n })
 *   @Post()
 *   async create() {}
 * }
 * ```
 */
export const RequirePermission = (options: RequirePermissionOptions) =>
  SetMetadata(REQUIRE_PERMISSION, options);
