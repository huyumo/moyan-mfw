/**
 * @fileoverview 系统管理领域模块
 * @description 聚合 sys 下的所有子模块，作为系统管理域的统一入口
 */

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { AppTypeModule } from './app-type/app-type.module';
import { AppModule as SysAppModule } from './app/app.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { InstallModule } from './install/install.module';
import { UploadFileModule } from './upload/upload.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AppTypeModule,
    SysAppModule,
    AuditLogModule,
    InstallModule,
    UploadFileModule,
  ],
})
export class SysModule {}
