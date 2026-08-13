/**
 * @fileoverview 角色实体 SPI 抽象类
 * @description 框架提供给业务方的角色管理接口，入口在业务层：
 * 业务方在业务实体管理中同步框架内部角色状态（创建角色、分配权限等）。
 * 框架提供默认实现 DefaultRoleEntitySpi，业务方可继承并覆盖个别方法。
 */

import { Role } from '../../role/entities/role.entity';
import { AssignPermissionsDto } from '../../role/dto';

/** 创建角色入参 */
export interface CreateRoleSpiInput {
  roleName: string;
  roleCode: string;
  roleDesc?: string;
  /** 应用实例 ID（应用级角色）；与 appTypeId 二选一 */
  appId?: string;
  /** 应用类型 ID（应用类型级内置角色） */
  appTypeId?: string;
  sortOrder?: number;
  roleStatus?: number;
}

/** 分配权限入参（复用框架权限树结构） */
export type AssignPermissionsSpiInput = AssignPermissionsDto['permissionTrees'];

/**
 * 角色实体 SPI（抽象类，业务层入口）
 * @description 业务方通过依赖注入获取本抽象类的框架默认实现，
 * 在业务实体管理接口中调用，同步维护框架内部角色状态。
 */
export abstract class RoleEntitySpi {
  /**
   * 创建角色（roleCode 全局唯一校验由框架默认实现保证）
   */
  abstract createRole(input: CreateRoleSpiInput): Promise<Role>;

  /**
   * 为角色分配权限（全量替换，权限池校验由框架默认实现保证）
   */
  abstract assignPermissions(
    roleId: string,
    permissionTrees: AssignPermissionsSpiInput,
  ): Promise<void>;

  /**
   * 查询角色
   */
  abstract getRole(roleId: string): Promise<Role>;
}
