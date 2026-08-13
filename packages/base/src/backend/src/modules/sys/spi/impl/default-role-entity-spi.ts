/**
 * @fileoverview 角色实体 SPI 默认实现
 * @description 委托 RoleService 实现角色创建/权限分配逻辑。
 * 业务方可直接注入 RoleEntitySpi 抽象类使用，或继承本类覆盖个别方法。
 */

import { Injectable } from '@nestjs/common';
import {
  RoleEntitySpi,
  CreateRoleSpiInput,
  AssignPermissionsSpiInput,
} from '../abstractions/role-entity-spi';
import { RoleService } from '../../role/role.service';
import { Role } from '../../role/entities/role.entity';
import { CreateRoleDto, AssignPermissionsDto } from '../../role/dto';

/**
 * 角色实体 SPI 默认实现
 */
@Injectable()
export class DefaultRoleEntitySpi extends RoleEntitySpi {
  constructor(private roleService: RoleService) {
    super();
  }

  async createRole(input: CreateRoleSpiInput): Promise<Role> {
    return this.roleService.create(input as CreateRoleDto);
  }

  async assignPermissions(
    roleId: string,
    permissionTrees: AssignPermissionsSpiInput,
  ): Promise<void> {
    await this.roleService.assignPermissions(roleId, {
      permissionTrees,
    } as AssignPermissionsDto);
  }

  async getRole(roleId: string): Promise<Role> {
    return this.roleService.findById(roleId);
  }
}
