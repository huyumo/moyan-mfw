/**
 * @fileoverview 角色模块
 * @description 角色模块定义，包含角色服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

/**
 * 角色模块
 * @description 提供角色管理相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UserRole, RolePermission]),
  ],
  providers: [RoleService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
