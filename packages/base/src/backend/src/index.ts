/**
 * @fileoverview 包入口文件
 */

// === 应用工厂 ===
export { createBaseBackendApp } from './create-base-backend-app';
export { createExtensionBackendApp } from './create-extension-backend-app';
export type {
  CreateExtensionBackendAppOptions,
} from './create-extension-backend-app';
export type {
  CreateBaseBackendAppOptions,
  BaseBackendAppInstance,
  AppTypeConfig,
  RoleConfig,
  HookConfig,
  AppContext,
  DatabaseConfig,
  RedisConfig,
  JwtConfig,
  SwaggerGroupConfig,
} from './create-base-backend-app';

// === 公共模块 ===
export * from './common/index';

// === 核心实体类 ===
export { User as UserEntity } from './modules/sys/user/entities/user.entity';
export { Role } from './modules/sys/role/entities/role.entity';
export { Permission } from './modules/sys/permission/entities/permission.entity';
export { AppType } from './modules/sys/app-type/entities/app-type.entity';
export { App } from './modules/sys/app/entities/app.entity';
export { AppMember } from './modules/sys/app/entities/app-member.entity';
export { AuditLog } from './modules/sys/audit-log/entities/audit-log.entity';

// === 核心服务 ===
export { AuthService } from './modules/sys/auth/auth.service';
export type {
  AuthHookType,
  AuthHookFn,
} from './modules/sys/auth/auth.service';
export { UserService } from './modules/sys/user/user.service';
export { RoleService } from './modules/sys/role/role.service';
export { PermissionService } from './modules/sys/permission/permission.service';
export { AppTypeService } from './modules/sys/app-type/app-type.service';
export { AppService } from './modules/sys/app/service/app.service';
export { AppMemberService } from './modules/sys/app/service/app-member.service';
export { AuditLogService } from './modules/sys/audit-log/audit-log.service';
export { InstallService } from './modules/sys/install/install.service';

// === 管理 SPI（业务方集成：抽象类=业务层入口 / 监听器接口=框架层入口）===
export { SpiEventBus } from './modules/sys/spi';
export {
  AppEntitySpi,
  UserEntitySpi,
  RoleEntitySpi,
  AppTypeEntitySpi,
  DefaultAppEntitySpi,
  DefaultUserEntitySpi,
  DefaultRoleEntitySpi,
  DefaultAppTypeEntitySpi,
} from './modules/sys/spi';
export type {
  CreateAppSpiInput,
  UpdateAppSpiInput,
  AppSpiResult,
  CreateUserSpiInput,
  CreateRoleSpiInput,
  AssignPermissionsSpiInput,
} from './modules/sys/spi';
export type {
  MemberEventListener,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRolesChangedEvent,
  UserEventListener,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  RoleEventListener,
  RoleCreatedEvent,
  RoleUpdatedEvent,
  RoleDeletedEvent,
  RolePermissionsChangedEvent,
} from './modules/sys/spi';

// === 类型定义 ===
export type { LoginDto } from './modules/sys/auth/dto';

// === 数据库种子 ===
export { runSeeds } from './database/seeds/index';

// === 应用类型同步 ===
export { syncAppTypesConfig } from './modules/sys/app-type/app-type-sync';

// === 数据字典种子 ===
export { seedDicts } from './database/seeds/dict.seeder';