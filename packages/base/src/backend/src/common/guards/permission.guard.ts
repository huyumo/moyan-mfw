/**
 * @fileoverview 权限守卫
 * @description 验证用户是否拥有所需的权限（基于位运算），支持多装饰器 OR 检查
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  REQUIRE_PERMISSION,
  RequirePermissionOptions,
} from '../../decorators/require-permission.decorator';
import {
  SKIP_PERMISSION_KEY,
} from '../../decorators/skip-permission.decorator';
import {
  buildPerValue,
} from '../../constants/permissions';
import { RolePermission } from '../../../modules/sys/role/entities/role-permission.entity';
import { UserRole } from '../../../modules/sys/role/entities/user-role.entity';
import { resolveAppId } from '../../decorators/app-id.decorator';

/**
 * 权限守卫
 * @description 基于位运算验证用户权限，支持 appId 级别的角色作用域过滤
 *
 * **支持多装饰器 OR 检查**：如果一个接口有多个 @RequirePermission 装饰器，
 * 用户只要匹配其中任意一个权限即可访问。
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @RequirePermission({ permCode: 'system:user-list' })
 * @RequirePermission({ permCode: 'system:role' })
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
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipPermission = this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipPermission) {
      return true;
    }

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

    // 提取当前请求的 appId，按应用实例过滤有效角色
    const appId = resolveAppId(request);
    const effectiveRoleIds = appId
      ? await this.resolveEffectiveRoleIds(user.id, appId)
      : user.roleIds;

    // 查询用户当前应用下的有效角色权限
    const userRolePermissions = effectiveRoleIds.length > 0
      ? await this.rolePermissionRepository.find({
          where: { roleId: In(effectiveRoleIds) },
          relations: ['permission'],
        })
      : [];

    // 构建用户权限映射：permCode → permissionValue (位运算合并)
    const userPermissionMap = new Map<string, bigint>();
    for (const rp of userRolePermissions) {
      if (rp.permission && rp.permission.permStatus === 1) {
        const permCode = rp.permission.permCode;
        // TypeORM 返回的 permissionValue 可能是 number/string/bigint，统一转换为 bigint
        const rpPermValue = typeof rp.permissionValue === 'string'
          ? BigInt(rp.permissionValue)
          : typeof rp.permissionValue === 'number'
            ? BigInt(rp.permissionValue)
            : rp.permissionValue;
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
    const permissionValue = buildPerValue(options.permissionValue || []);

    return {
      permCode: options.permCode,
      permissionValue,
    };
  }

  /**
   * 解析用户在指定应用实例下的有效角色 ID
   * @description 查询 sys_user_roles 获取该用户在此应用下被分配的角色
   */
  private async resolveEffectiveRoleIds(userId: string, appId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId, appId },
    });
    return userRoles.map((ur) => ur.roleId);
  }
}
