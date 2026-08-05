/**
 * @fileoverview TypeORM 连接选项构建
 * @description 全框架唯一的数据库连接配置构建入口。运行时工厂与测试根模块共用，避免配置逻辑重复维护导致漂移。
 * 合并优先级：用户 `extra` > 用户类型化字段 > 框架默认值。
 */

import { Type } from "@nestjs/common";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DatabaseConfig } from "../types/database.types";

// 实体 - 直接静态导入确保打包后可用
import { User } from "../modules/sys/user/entities/user.entity";
import { Role } from "../modules/sys/role/entities/role.entity";
import { UserRole } from "../modules/sys/role/entities/user-role.entity";
import { Permission } from "../modules/sys/permission/entities/permission.entity";
import { RolePermission } from "../modules/sys/role/entities/role-permission.entity";
import { AppType } from "../modules/sys/app-type/entities/app-type.entity";
import { AppTypePermissionEntity } from "../modules/sys/app-type/entities/app-type-permission.entity";
import { App } from "../modules/sys/app/entities/app.entity";
import { AppMember } from "../modules/sys/app/entities/app-member.entity";
import { AuditLog } from "../modules/sys/audit-log/entities/audit-log.entity";
import { PermissionValue } from "../modules/sys/permission/entities/permission-value.entity";
import { RouteSyncState } from "../modules/sys/route-sync/route-sync-state.entity";

/** 系统内置实体列表 */
export const entities: Type<any>[] = [
  User,
  Role,
  UserRole,
  Permission,
  RolePermission,
  AppType,
  AppTypePermissionEntity,
  App,
  AppMember,
  AuditLog,
  PermissionValue,
  RouteSyncState,
];

/** 构建 TypeORM 连接选项的覆盖项 */
export interface BuildTypeOrmOptionsOverrides {
  /** 数据库连接配置，业务方显式传入时优先于 ConfigService 与 .env */
  database?: Partial<DatabaseConfig>;
  /** 追加的业务实体 */
  extraEntities?: Type<any>[];
  /** 迁移文件路径（CLI / 测试环境使用） */
  migrations?: string[];
}

/**
 * 构建 TypeORM 连接选项
 * @param overrides - 覆盖项
 * @returns TypeORM 连接选项
 */
export function buildTypeOrmOptions(
  overrides: BuildTypeOrmOptionsOverrides = {},
): TypeOrmModuleOptions {
  const db = overrides.database || {};

  // 连接池/连接行为类型化字段：仅当用户显式传入时写入 extra，未传入则保持 mysql2 默认行为
  const poolExtra: Record<string, any> = {
    multipleStatements: db.multipleStatements ?? true,
  };
  if (db.connectionLimit != null)
    poolExtra.connectionLimit = db.connectionLimit;
  if (db.waitForConnections != null)
    poolExtra.waitForConnections = db.waitForConnections;
  if (db.queueLimit != null) poolExtra.queueLimit = db.queueLimit;
  if (db.enableKeepAlive != null)
    poolExtra.enableKeepAlive = db.enableKeepAlive;
  if (db.keepAliveInitialDelay != null)
    poolExtra.keepAliveInitialDelay = db.keepAliveInitialDelay;
  if (db.connectTimeout != null) poolExtra.connectTimeout = db.connectTimeout;
  // 空闲连接超时回收（毫秒）：避免池子只扩不缩
  if (db.idleTimeout != null) poolExtra.idleTimeout = db.idleTimeout;

  return {
    type: "mysql",
    host: db.host || process.env.DB_HOST || "localhost",
    port: db.port || parseInt(process.env.DB_PORT || "3306", 10),
    username: db.username || process.env.DB_USERNAME,
    password: db.password || process.env.DB_PASSWORD,
    database: db.database || process.env.DB_NAME,
    charset: db.charset || "utf8mb4",
    timezone: db.timezone || "+08:00",
    poolSize: db.poolSize || 20,
    synchronize:
      db.synchronize ??
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"),
    logging: db.logging ?? false,
    entities: [...entities, ...(overrides.extraEntities || [])],
    migrations: overrides.migrations,
    autoLoadEntities: true,
    extra: {
      ...poolExtra,
      ...(db.extra || {}),
    },
    keepConnectionAlive: true,
    retryAttempts: 10,
    retryDelay: 3000,
  } as TypeOrmModuleOptions;
}
