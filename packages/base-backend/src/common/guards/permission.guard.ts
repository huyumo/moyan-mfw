/**
 * @fileoverview 权限守卫
 * @description 验证用户是否拥有所需的权限（基于位运算），支持多装饰器 OR 检查
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  REQUIRE_PERMISSION,
  RequirePermissionOptions,
} from '../decorators/require-permission.decorator';
import {
  PERMISSION_VALUES,
  buildPerValue,
} from '../constants/permissions';
import { RolePermission } from '../../modules/sys/permission/entities/role-permission.entity';

/**
 * 权限守卫
 * @description 基于位运算验证用户权限
 *
 * **支持多装饰器 OR 检查**：如果一个接口有多个 @RequirePermission 装饰器，
 * 用户只要匹配其中任意一个权限即可访问。
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @RequirePermission({ permCode: 'system:user-list', permissionValue: ['查看'] })
 * @RequirePermission({ permCode: 'system:role', permissionValue: ['查看'] })
 * @UseGuards(PermissionGuard)
 * async findAll() {}
 * ```
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取所有 @RequirePermission 装饰器（支持多次注解）
    const requirePermissions = this.reflector.getAllAndOverride<RequirePermissionOptions | RequirePermissionOptions[]>(
      REQUIRE_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    // 转换为数组（getAllAndOverride 可能返回单个对象或数组）
    const permissionsArray = Array.isArray(requirePermissions)
      ? requirePermissions
      : (requirePermissions ? [requirePermissions] : []);

    // 如果没有要求权限，直接放行
    if (permissionsArray.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未授权');
    }

    // 检查用户是否是开发者（拥有全部权限）
    if (user.isDeveloper === 1) {
      return true;
    }

    // 检查用户角色是否包含所需权限
    if (!user.roleIds || user.roleIds.length === 0) {
      throw new ForbiddenException('权限不足');
    }

    // 查询用户所有角色的权限（从数据库）
    const userRolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: request.user.roleIds },
      relations: ['permission'],
    });

    // 构建用户权限映射：permCode → permissionValue (位运算合并)
    const userPermissionMap = new Map<string, bigint>();
    for (const rp of userRolePermissions) {
      if (rp.permission && rp.permission.permStatus === 1) {
        const permCode = rp.permission.permCode;
        // TypeORM 返回的 permissionValue 可能是字符串，需要转换为 bigint
        const rpPermValue = typeof rp.permissionValue === 'string'
          ? BigInt(rp.permissionValue)
          : rp.permissionValue as bigint;
        const existing = userPermissionMap.get(permCode);
        if (existing) {
          // 合并权限值（位运算 OR）
          userPermissionMap.set(permCode, existing | rpPermValue);
        } else {
          userPermissionMap.set(permCode, rpPermValue);
        }
      }
    }

    // 多装饰器 OR 检查：只要匹配其中一个权限即可
    for (const options of permissionsArray) {
      const { permCode, permissionValue } = this.normalizeOptions(options);

      if (!permissionValue) {
        // 没有指定 permissionValue，只检查 permCode
        if (userPermissionMap.has(permCode)) {
          return true;
        }
      } else {
        // 检查用户是否有该 permCode 的权限
        const userValue = userPermissionMap.get(permCode);
        if (!userValue) {
          continue; // 用户没有该 permCode 的权限，检查下一个装饰器
        }

        // 位运算检查：用户权限是否包含所需权限
        // 公式：(userValue & requiredValue) === requiredValue
        // 或者至少包含一位：(userValue & requiredValue) !== 0n
        if ((userValue & permissionValue) !== 0n) {
          return true; // 用户拥有至少一位匹配的权限
        }
      }
    }

    // 所有装饰器都未匹配通过
    throw new ForbiddenException('权限不足');
  }

  /**
   * 规范化权限选项，将字符串数组转换为 bigint
   */
  private normalizeOptions(options: RequirePermissionOptions): {
    permCode: string;
    permissionValue: bigint;
  } {
    // 字符串数组转换为 bigint
    const permissionValue = buildPerValue(options.permissionValue);

    return {
      permCode: options.permCode,
      permissionValue,
    };
  }
}
