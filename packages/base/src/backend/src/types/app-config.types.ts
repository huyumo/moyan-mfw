/**
 * @fileoverview 应用配置类型定义
 */

import {
  Type,
  ExceptionFilter,
  NestInterceptor,
  NestMiddleware,
  Provider,
  INestApplication,
  NestApplicationOptions,
} from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";

// 基础设施配置类型已拆分到独立文件，此处 import 供本文件使用并 re-export 保持公共 API 不变
import type { DatabaseConfig } from "./database.types";
import type { RedisConfig } from "./redis.types";
import type { JwtConfig } from "./jwt.types";
export type { DatabaseConfig } from "./database.types";
export type { RedisConfig } from "./redis.types";
export type { JwtConfig } from "./jwt.types";

/** 安全配置 */
export interface SecurityConfig {
  helmet?: any;
  rateLimit?: {
    windowMs?: number;
    max?: number;
  };
}

/** 日志配置 */
export interface LoggerConfig {
  level?: string;
  format?: string;
}

/** 内置角色配置 */
export interface RoleConfig {
  roleCode: string;
  roleName: string;
  isOwner?: number;
}

/** 应用类型配置 */
export interface AppTypeConfig {
  typeName: string;
  typeCode: string;
  typeDesc?: string;
  icon?: string;
  multiAppEnabled: number;
  builtinRole: RoleConfig[];
}

/** 用户扩展属性配置 */
export interface UserAttributeConfig {
  name: string;
  type: string;
  required?: boolean;
}

/** 成员扩展属性配置 */
export interface MemberAttributeConfig {
  typeCode: string;
  attributes: Array<{
    name: string;
    type: string;
    required?: boolean;
  }>;
}

/** 扩展权限配置（已废弃，请使用 permissionValues） */
export interface PermissionConfig {
  name: string;
  description?: string;
}

/** OpenAPI 文档分组配置 */
export interface SwaggerGroupConfig {
  name: string;
  title: string;
  description?: string;
  include?: Type<any>[];
  exclude?: Type<any>[];
}

/** 应用上下文 */
export interface AppContext {
  app: INestApplication;
  dataSource: DataSource;
  configService: ConfigService;
  getService<T>(type: Type<T>): T;
}

/** 钩子配置 */
export interface HookConfig {
  onAppInit?: (ctx: AppContext) => Promise<void>;
  onDatabaseReady?: (ctx: AppContext) => Promise<void>;
  beforeLogin?: (ctx: AppContext, credentials: any) => Promise<void>;
  afterLogin?: (ctx: AppContext, user: any, token: string) => Promise<void>;
  afterRegister?: (ctx: AppContext, user: any) => Promise<void>;
  beforeClose?: (ctx: AppContext) => Promise<void>;
}

/** 数据库迁移配置 */
export interface MigrationConfig {
  directory?: string;
  autoRun?: boolean;
}

/** 种子数据配置 */
export interface SeedConfig {
  entity: Type<any>;
  data: any[];
}

/** 审计日志配置 */
export interface AuditLogConfig {
  enabled?: boolean;
  excludePaths?: string[];
}

/** 创建后端应用选项 */
export interface CreateBaseBackendAppOptions {
  name?: string;
  database?: DatabaseConfig;
  redis?: RedisConfig;
  jwt?: JwtConfig;
  cors?: CorsOptions | boolean;
  security?: SecurityConfig;
  logger?: LoggerConfig;
  appTypes?: AppTypeConfig[];
  /** 是否在启动时同步应用类型配置到数据库，默认 false */
  syncAppTypes?: boolean;
  userAttributes?: UserAttributeConfig[];
  memberAttributes?: MemberAttributeConfig[];
  permissions?: PermissionConfig[];
  permissionValues?: string[];
  seeds?: SeedConfig[];
  modules?: Type<any>[];
  /**
   * 模块路由前缀配置，用于为指定模块的控制器路径添加前缀。
   * 内部通过 NestJS RouterModule 实现，前缀格式如 'ext/ad'。
   *
   * @example [{ path: 'ext/ad', module: AdModule }]
   * 效果：AdModule 中 @Controller('ad-placements') → /api/ext/ad/ad-placements
   */
  moduleRoutes?: Array<{ path: string; module: Type<any> }>;
  extraEntities?: Array<new (...args: any[]) => any>;
  providers?: Provider[];
  middlewares?: Array<NestMiddleware>;
  exceptionFilters?: Array<Type<ExceptionFilter>>;
  interceptors?: Array<Type<NestInterceptor>>;
  migrations?: MigrationConfig;
  swagger?: SwaggerGroupConfig[];
  hooks?: HookConfig;
  auditLog?: AuditLogConfig;
  /**
   * 透传给 NestFactory.create 的原生应用选项
   * （如 rawBody、bodyParser、abortOnError、httpsOptions 等）。
   * 注意：顶层 `cors` 字段由 setupCors 统一处理，建议优先使用顶层 `cors`；
   * 若同时在此设置 cors，以 setupCors 的配置为准（其在创建后执行）。
   */
  nestOptions?: NestApplicationOptions;
}

/** 应用实例 */
export interface BaseBackendAppInstance {
  app: INestApplication;
  listen: (port: number) => Promise<void>;
  close: () => Promise<void>;
}
