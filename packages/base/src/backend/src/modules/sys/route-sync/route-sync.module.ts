/**
 * @fileoverview 路由同步模块
 * @description 提供菜单树配置自动同步功能，在服务启动时执行
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permission } from "../permission/entities/permission.entity";
import { AppType } from "../app-type/entities/app-type.entity";
import { AppTypePermissionEntity } from "../app-type/entities/app-type-permission.entity";
import { Role } from "../role/entities/role.entity";
import { RolePermission } from "../role/entities/role-permission.entity";
import { RouteSyncState } from "./route-sync-state.entity";
import { RouteSyncService } from "./route-sync.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      AppType,
      AppTypePermissionEntity,
      Role,
      RolePermission,
      RouteSyncState,
    ]),
  ],
  providers: [RouteSyncService],
  exports: [RouteSyncService],
})
export class RouteSyncModule {}
