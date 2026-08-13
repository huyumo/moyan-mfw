/**
 * @fileoverview SPI 抽象类统一导出
 * @description 导出框架提供给业务方的实体管理 SPI 抽象类与入参/结果类型
 */

export { AppEntitySpi } from './app-entity-spi';
export type {
  CreateAppSpiInput,
  UpdateAppSpiInput,
  AppSpiResult,
} from './app-entity-spi';

export { UserEntitySpi } from './user-entity-spi';
export type { CreateUserSpiInput } from './user-entity-spi';

export { RoleEntitySpi } from './role-entity-spi';
export type {
  CreateRoleSpiInput,
  AssignPermissionsSpiInput,
} from './role-entity-spi';

export { AppTypeEntitySpi } from './app-type-entity-spi';
