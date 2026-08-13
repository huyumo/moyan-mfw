/**
 * @fileoverview 系统管理领域模块
 * @description 聚合 sys 下的所有子模块，作为系统管理域的统一入口；
 * @Global 使对外导出的 SPI 抽象类全局可注入，业务方无需 import 即可使用
 */

import { Module, Global } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { AppTypeModule } from './app-type/app-type.module';
import { AppModule as SysAppModule } from './app/app.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { InstallModule } from './install/install.module';
import { UploadFileModule } from './upload/upload.module';
import { RouteSyncModule } from './route-sync/route-sync.module';
import {
  SpiEventBus,
  AppEntitySpi,
  UserEntitySpi,
  RoleEntitySpi,
  AppTypeEntitySpi,
  SpiModule,
} from './spi';
import {
  DefaultAppEntitySpi,
  DefaultUserEntitySpi,
  DefaultRoleEntitySpi,
  DefaultAppTypeEntitySpi,
} from './spi';

@Global()
@Module({
  imports: [
    SpiModule,
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AppTypeModule,
    SysAppModule,
    AuditLogModule,
    InstallModule,
    UploadFileModule,
    RouteSyncModule,
  ],
  providers: [
    // SPI 抽象类（业务层入口：业务方注入调用 / 继承扩展）
    { provide: AppEntitySpi, useClass: DefaultAppEntitySpi },
    { provide: UserEntitySpi, useClass: DefaultUserEntitySpi },
    { provide: RoleEntitySpi, useClass: DefaultRoleEntitySpi },
    { provide: AppTypeEntitySpi, useClass: DefaultAppTypeEntitySpi },
  ],
  exports: [
    AppEntitySpi,
    UserEntitySpi,
    RoleEntitySpi,
    AppTypeEntitySpi,
  ],
})
export class SysModule {}
