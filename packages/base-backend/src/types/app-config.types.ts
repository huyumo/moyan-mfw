/**
 * @fileoverview 应用配置类型定义
 */

import { Type } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ExceptionFilter, Interceptor, NestMiddleware, Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

/** 数据库配置 */
export interface DatabaseConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  charset?: string;
  timezone?: string;
  poolSize?: number;
  synchronize?: boolean;
  logging?: boolean;
}

/** Redis 配置 */
export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

/** JWT 配置 */
export interface JwtConfig {
  secret?: string;
  expiresIn?: string | number;
}

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

/** 应用类型配置 */
export interface AppTypeConfig {
  typeName: string;
  typeCode: string;
  typeDesc?: string;
  icon?: string;
  multiAppEnabled: number;
  builtinRole: Array<{
    roleCode: string;
    roleName: string;
  }>;
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

/** 扩展权限配置 */
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
  userAttributes?: UserAttributeConfig[];
  memberAttributes?: MemberAttributeConfig[];
  permissions?: PermissionConfig[];
  seeds?: SeedConfig[];
  modules?: Type<any>[];
  providers?: Provider[];
  middlewares?: Array<NestMiddleware>;
  exceptionFilters?: Array<Type<ExceptionFilter>>;
  interceptors?: Array<Type<Interceptor>>;
  migrations?: MigrationConfig;
  swagger?: SwaggerGroupConfig[];
  hooks?: HookConfig;
  auditLog?: AuditLogConfig;
}

/** 应用实例 */
export interface BaseBackendAppInstance {
  app: INestApplication;
  listen: (port: number) => Promise<void>;
  close: () => Promise<void>;
}