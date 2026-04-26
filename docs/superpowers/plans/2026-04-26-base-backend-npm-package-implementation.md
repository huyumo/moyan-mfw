# moyan-base-backend NPM 包改造实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 base-backend 改造为可发布的 npm 包，提供 createBaseBackendApp() 工厂函数。

**Architecture:** 采用工厂函数模式，与前端 createBaseAdminApp() 保持对称。核心模块不可修改，通过配置注入业务模块和钩子扩展。

**Tech Stack:** NestJS, TypeORM, @nestjs/swagger, TypeScript

***

## 文件结构

### 新建文件

| 文件                                | 职责              |
| --------------------------------- | --------------- |
| `src/create-base-backend-app.ts`  | 工厂函数入口，类型定义     |
| `src/types/app-config.types.ts`   | 配置接口定义          |
| `src/utils/swagger-setup.ts`      | Swagger 多文档分组工具 |
| `src/utils/hooks-executor.ts`     | 钩子执行器           |
| `src/utils/app-type-validator.ts` | 应用类型冲突检测        |

### 修改文件

| 文件                  | 修改内容                                                           |
| ------------------- | -------------------------------------------------------------- |
| `src/app.module.ts` | 导出 entities、createTypeOrmOptions、DatabaseHealthService 供工厂函数使用 |
| `src/main.ts`       | 改为调用工厂函数（保留兼容）                                                 |
| `package.json`      | 配置 npm 发布字段                                                    |

### 新建文件（补充）

| 文件             | 职责                 |
| -------------- | ------------------ |
| `src/index.ts` | 包入口导出文件（当前不存在，需新建） |

***

## Task 1: 创建类型定义文件

**Files:**

- Create: `src/types/app-config.types.ts`
- [ ] **Step 1: 创建配置类型定义文件**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/types/app-config.types.ts
git commit -m "feat(base-backend): add app config type definitions"
```

***

## Task 2: 创建应用类型验证器

**Files:**

- Create: `src/utils/app-type-validator.ts`
- [ ] **Step 1: 创建应用类型冲突检测工具**

```typescript
/**
 * @fileoverview 应用类型验证器
 */

import { AppTypeConfig } from '../types/app-config.types';

/** 内置应用类型 typeCode */
export const BUILTIN_APP_TYPES = ['system', 'admin'];

/**
 * 验证使用者配置的应用类型是否与内置类型冲突
 */
export function validateAppTypes(userAppTypes: AppTypeConfig[]): void {
  if (!userAppTypes || userAppTypes.length === 0) {
    return;
  }

  for (const appType of userAppTypes) {
    if (BUILTIN_APP_TYPES.includes(appType.typeCode)) {
      throw new Error(
        `应用类型 typeCode "${appType.typeCode}" 是内置类型，不可覆盖。内置类型: ${BUILTIN_APP_TYPES.join(', ')}`,
      );
    }
  }
}

/**
 * 获取内置应用类型配置
 */
export function getBuiltinAppTypes(): AppTypeConfig[] {
  return [
    {
      typeName: '系统管理',
      typeCode: 'system',
      typeDesc: '系统管理员，拥有全部权限',
      multiAppEnabled: 0,
      builtinRole: [
        { roleCode: 'system_admin', roleName: '系统管理员' },
      ],
    },
    {
      typeName: '管理员',
      typeCode: 'admin',
      typeDesc: '应用管理员，管理单个应用',
      multiAppEnabled: 1,
      builtinRole: [
        { roleCode: 'app_admin', roleName: '应用管理员' },
      ],
    },
  ];
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/utils/app-type-validator.ts
git commit -m "feat(base-backend): add app type validator"
```

***

## Task 3: 创建 Swagger 多文档分组工具

**Files:**

- Create: `src/utils/swagger-setup.ts`
- [ ] **Step 1: 创建 Swagger 多文档分组工具**

```typescript
/**
 * @fileoverview Swagger 多文档分组配置工具
 */

import { INestApplication } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { SwaggerGroupConfig } from '../types/app-config.types';
import { SysModule } from '../modules/sys/sys.module';

/** 核心 API 文档配置 */
const SYS_SWAGGER_CONFIG: SwaggerGroupConfig = {
  name: 'sys',
  title: '核心API文档',
  description: 'base-backend 内置模块 API',
  include: [SysModule],
};

/**
 * 设置 Swagger 多文档分组
 */
export function setupSwaggerGroups(
  app: INestApplication,
  groups: SwaggerGroupConfig[] = [],
  appName: string = 'Moyan MFW Backend',
  appVersion: string = '1.0.0',
): void {
  // 核心 API 文档（始终存在）
  setupSwaggerDocument(app, SYS_SWAGGER_CONFIG, appName, appVersion);

  // 业务 API 文档分组
  for (const group of groups) {
    setupSwaggerDocument(app, group, appName, appVersion);
  }
}

/**
 * 设置单个 Swagger 文档
 */
function setupSwaggerDocument(
  app: INestApplication,
  config: SwaggerGroupConfig,
  appName: string,
  appVersion: string,
): void {
  const builder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description || `${appName} - ${config.title}`)
    .setVersion(appVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入 JWT Token',
      },
      'Authorization',
    );

  const documentConfig = builder.build();

  const document = SwaggerModule.createDocument(app, documentConfig, {
    include: config.include,
    exclude: config.exclude,
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      const controllerName = controllerKey.replace(/Controller$/, '');
      const methodName = methodKey.charAt(0).toUpperCase() + methodKey.slice(1);
      return `${controllerName}${methodName}`;
    },
  });

  SwaggerModule.setup(`api-docs/${config.name}`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(`[Swagger] Document "${config.name}" available at /api-docs/${config.name}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/utils/swagger-setup.ts
git commit -m "feat(base-backend): add swagger multi-document setup"
```

***

## Task 4: 创建钩子执行器

**Files:**

- Create: `src/utils/hooks-executor.ts`
- [ ] **Step 1: 创建钩子执行器**

```typescript
/**
 * @fileoverview 钩子执行器
 */

import { INestApplication } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Type } from '@nestjs/common';
import { HookConfig, AppContext } from '../types/app-config.types';

/**
 * 创建应用上下文
 */
export function createAppContext(
  app: INestApplication,
  dataSource: DataSource,
): AppContext {
  const configService = app.get(ConfigService);

  return {
    app,
    dataSource,
    configService,
    getService: <T>(type: Type<T>): T => app.get(type),
  };
}

/**
 * 执行钩子函数
 */
export async function executeHook(
  hookFn: ((ctx: AppContext, ...args: any[]) => Promise<void>) | undefined,
  ctx: AppContext,
  ...args: any[]
): Promise<void> {
  if (!hookFn) {
    return;
  }

  try {
    await hookFn(ctx, ...args);
  } catch (error) {
    console.error('[Hooks] Hook execution failed:', error);
    throw error;
  }
}

/**
 * 钩子执行器类
 */
export class HooksExecutor {
  private ctx: AppContext | null = null;
  private hooks: HookConfig;

  constructor(hooks: HookConfig = {}) {
    this.hooks = hooks;
  }

  /**
   * 初始化上下文
   */
  initContext(app: INestApplication, dataSource: DataSource): void {
    this.ctx = createAppContext(app, dataSource);
  }

  /**
   * 执行数据库就绪钩子
   */
  async onDatabaseReady(): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.onDatabaseReady, this.ctx);
  }

  /**
   * 执行应用初始化钩子
   */
  async onAppInit(): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.onAppInit, this.ctx);
  }

  /**
   * 执行登录前钩子
   */
  async beforeLogin(credentials: any): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.beforeLogin, this.ctx, credentials);
  }

  /**
   * 执行登录后钩子
   */
  async afterLogin(user: any, token: string): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.afterLogin, this.ctx, user, token);
  }

  /**
   * 执行注册后钩子
   */
  async afterRegister(user: any): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.afterRegister, this.ctx, user);
  }

  /**
   * 执行关闭前钩子
   */
  async beforeClose(): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.beforeClose, this.ctx);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/utils/hooks-executor.ts
git commit -m "feat(base-backend): add hooks executor"
```

***

## Task 5: 修改 app.module.ts 导出必要内容

**Files:**

- Modify: `src/app.module.ts`

- [ ] **Step 1: 在 app.module.ts 底部添加导出**

在文件末尾添加以下导出语句：

```typescript
// 导出供工厂函数使用的内容
export { DatabaseHealthService } from './app.module';
export { createTypeOrmOptions } from './app.module';
export { entities } from './app.module';
```

注意：由于 `DatabaseHealthService`、`createTypeOrmOptions`、`entities` 已在文件内定义，只需在文件末尾添加导出语句即可（无需重复定义）。

实际修改：在 `AppModule` 类定义之后添加：

```typescript
// === 导出供 createBaseBackendApp 使用 ===
export { DatabaseHealthService, createTypeOrmOptions, entities };
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/app.module.ts
git commit -m "refactor(base-backend): export entities and helpers from app.module"
```

***

## Task 6: 创建工厂函数

**Files:**

- Create: `src/create-base-backend-app.ts`
- [ ] **Step 1: 创建工厂函数入口文件**

```typescript
/**
 * @fileoverview 基础后端应用创建入口
 */

import { config } from 'dotenv';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { ValidationPipe, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

import {
  CreateBaseBackendAppOptions,
  BaseBackendAppInstance,
  DatabaseConfig,
  JwtConfig,
} from './types/app-config.types';
import { validateAppTypes, getBuiltinAppTypes } from './utils/app-type-validator';
import { setupSwaggerGroups } from './utils/swagger-setup';
import { HooksExecutor, createAppContext } from './utils/hooks-executor';
import { AllExceptionsFilter, LoggingInterceptor, TransformInterceptor, AuditInterceptor } from './common';
import { databaseConfig, appConfig, redisConfig, userConfig } from './config';
import { AppModule, DatabaseHealthService, createTypeOrmOptions, entities } from './app.module';
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { RolePermission } from './modules/sys/role/entities/role-permission.entity';

config({ path: '.env' });

/**
 * 创建后端应用实例
 */
export async function createBaseBackendApp(
  options: CreateBaseBackendAppOptions = {},
): Promise<BaseBackendAppInstance> {
  // 验证应用类型配置
  validateAppTypes(options.appTypes || []);

  // 合并内置应用类型与使用者配置
  const allAppTypes = [...getBuiltinAppTypes(), ...(options.appTypes || [])];

  // 创建动态模块
  const DynamicAppModule = await createDynamicAppModule(options, allAppTypes);

  // 创建应用实例
  const app = await NestFactory.create<NestExpressApplication>(DynamicAppModule);

  // 配置 BigInt 序列化
  setupBigIntSerialization(app);

  // 获取配置服务
  const configService = app.get(ConfigService);

  // 静态文件服务
  setupStaticFiles(app, configService);

  // 全局前缀
  const globalPrefix = configService.get<string>('globalPrefix', '/api');
  app.setGlobalPrefix(globalPrefix);

  // 全局过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局拦截器
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new AuditInterceptor(app.get(Reflector)),
  );

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS 配置
  setupCors(app, options, configService);

  // Swagger 文档
  setupSwaggerGroups(
    app,
    options.swagger || [],
    options.name || configService.get<string>('appName', 'Moyan MFW Backend'),
    '1.0.0',
  );

  // 获取 DataSource 并执行钩子
  const dataSource = app.get(DataSource);
  const hooksExecutor = new HooksExecutor(options.hooks || {});
  hooksExecutor.initContext(app, dataSource);

  // 数据库就绪钩子
  await hooksExecutor.onDatabaseReady();

  // 应用初始化钩子
  await hooksExecutor.onAppInit();

  // 返回应用实例
  return {
    app,
    listen: async (port: number) => {
      await app.listen(port);
      printStartupMessage(port, globalPrefix, configService);
    },
    close: async () => {
      await hooksExecutor.beforeClose();
      await app.close();
    },
  };
}

/**
 * 创建动态应用模块
 */
async function createDynamicAppModule(
  options: CreateBaseBackendAppOptions,
  allAppTypes: any[],
): Promise<any> {
  const { Module } = await import('@nestjs/common');
  const { SysModule } = await import('./modules/sys/sys.module');
  const { HealthModule } = await import('./modules/health/health.module');

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local', '.env'],
        load: [databaseConfig, appConfig, redisConfig, userConfig],
        ignoreEnvFile: false,
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const dbConfig = options.database || configService.get<any>('databaseConfig') || {};
          return {
            type: 'mysql',
            host: dbConfig.host || process.env.DB_HOST || 'localhost',
            port: dbConfig.port || parseInt(process.env.DB_PORT || '3306', 10),
            username: dbConfig.username || process.env.DB_USERNAME,
            password: dbConfig.password || process.env.DB_PASSWORD,
            database: dbConfig.database || process.env.DB_NAME,
            charset: dbConfig.charset || 'utf8mb4',
            timezone: dbConfig.timezone || '+08:00',
            poolSize: dbConfig.poolSize || 100,
            synchronize: dbConfig.synchronize ?? (process.env.NODE_ENV === 'development'),
            logging: dbConfig.logging ?? (process.env.NODE_ENV === 'development'),
            entities: entities,
            keepConnectionAlive: true,
            retryAttempts: 10,
            retryDelay: 3000,
          } as TypeOrmModuleOptions;
        },
        inject: [ConfigService],
      }),
      JwtModule.register({
        global: true,
        secret: options.jwt?.secret || process.env.JWT_SECRET || 'default_jwt_secret',
        signOptions: {
          expiresIn: options.jwt?.expiresIn || 7200,
        },
      }),
      SysModule,
      HealthModule,
      ...(options.modules || []),
    ],
    providers: [
      DatabaseHealthService,
      {
        provide: 'APP_GUARD',
        useFactory: (jwtService: JwtService, reflector: Reflector) => {
          return new AuthGuard(jwtService, reflector);
        },
        inject: [JwtService, Reflector],
      },
      {
        provide: 'APP_GUARD',
        useFactory: (reflector: Reflector, dataSource: DataSource) => {
          const rolePermissionRepository = dataSource.getRepository(RolePermission);
          return new PermissionGuard(reflector, rolePermissionRepository);
        },
        inject: [Reflector, DataSource],
      },
      ...(options.providers || []),
    ],
  })
  class DynamicAppModule {}

  return DynamicAppModule;
}

/**
 * 配置 BigInt 序列化
 */
function setupBigIntSerialization(app: NestExpressApplication): void {
  app.use((_req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      return originalJson(
        JSON.parse(
          JSON.stringify(data, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          ),
        ),
      );
    };
    next();
  });
}

/**
 * 配置静态文件服务
 */
function setupStaticFiles(app: NestExpressApplication, configService: ConfigService): void {
  const uploadDir = configService.get<string>('UPLOAD_DIR', 'uploads');
  const absoluteUploadDir = path.resolve(uploadDir);
  app.useStaticAssets(absoluteUploadDir, { prefix: '/uploads/' });
}

/**
 * 配置 CORS
 */
function setupCors(
  app: NestExpressApplication,
  options: CreateBaseBackendAppOptions,
  configService: ConfigService,
): void {
  const corsConfig = options.cors ?? configService.get('cors');
  app.enableCors(corsConfig);
}

/**
 * 打印启动消息
 */
function printStartupMessage(port: number, globalPrefix: string, configService: ConfigService): void {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 Moyan MFW Backend is running!                        ║
  ║                                                           ║
  ║   ➜  Local:    http://localhost:${port}${globalPrefix}           ║
  ║   ➜  Swagger:  http://localhost:${port}/api-docs/sys            ║
  ║   ➜  Environment: ${configService.get<string>('env', 'development')}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

// 导出类型
export type {
  CreateBaseBackendAppOptions,
  BaseBackendAppInstance,
  AppTypeConfig,
  HookConfig,
  AppContext,
  DatabaseConfig,
  RedisConfig,
  JwtConfig,
  SwaggerGroupConfig,
} from './types/app-config.types';
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/create-base-backend-app.ts
git commit -m "feat(base-backend): add createBaseBackendApp factory function"
```

***---

## Task 7: 创建 index.ts 导出文件

**Files:**
- Create: `src/index.ts`
- [ ] **Step 1: 修改 index.ts 导出结构**

```typescript
/**
 * @fileoverview 包入口文件
 */

// === 应用工厂 ===
export { createBaseBackendApp } from './create-base-backend-app';
export type {
  CreateBaseBackendAppOptions,
  BaseBackendAppInstance,
  AppTypeConfig,
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
export { User } from './modules/sys/user/entities/user.entity';
export { Role } from './modules/sys/role/entities/role.entity';
export { Permission } from './modules/sys/permission/entities/permission.entity';
export { AppType } from './modules/sys/app-type/entities/app-type.entity';
export { App } from './modules/sys/app/entities/app.entity';
export { AppMember } from './modules/sys/app/entities/app-member.entity';
export { AuditLog } from './modules/sys/audit-log/entities/audit-log.entity';

// === 核心服务 ===
export { AuthService } from './modules/sys/auth/auth.service';
export { UserService } from './modules/sys/user/user.service';
export { RoleService } from './modules/sys/role/role.service';
export { PermissionService } from './modules/sys/permission/permission.service';
export { AppTypeService } from './modules/sys/app-type/app-type.service';
export { AppService } from './modules/sys/app/service/app.service';
export { AppMemberService } from './modules/sys/app/service/app-member.service';
export { AuditLogService } from './modules/sys/audit-log/audit-log.service';
export { InstallService } from './modules/sys/install/install.service';

// === 类型定义 ===
export type { LoginDto } from './modules/sys/auth/dto';
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/index.ts
git commit -m "feat(base-backend): complete index.ts exports"
```

***---

## Task 8: 配置 package.json 发布字段

**Files:**

- Modify: `package.json`
- [ ] **Step 1: 修改 package.json**

需要修改的字段：

1. 移除 `"private": true`
2. 添加 `"main": "./dist/index.js"`
3. 添加 `"types": "./dist/index.d.ts"`
4. 添加 `"exports"` 配置
5. 添加 `"files"` 配置
6. 添加 `"peerDependencies"` 配置
7. 添加 `"prepublishOnly"` 脚本

```json
{
  "name": "moyan-base-backend",
  "version": "1.0.0",
  "description": "墨焱基础后端框架 - NestJS 管理后台基础设施",
  "author": "Moyan Team",
  "license": "MIT",
  "type": "commonjs",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "nest build",
    "prepublishOnly": "npm run build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,tests}/**/*.ts\" --fix",
    "test": "jest --config jest.config.ts",
    "test:watch": "jest --watch",
    "test:cov": "jest --config jest.config.ts --coverage",
    "test:integration": "jest --config jest.config.ts --testPathPatterns=integration",
    "typeorm": "ts-node -r tsconfig-paths/register --project ../../tsconfig.json ../../node_modules/typeorm/cli.js",
    "migration:generate": "pnpm typeorm migration:generate -d src/database/data-source.ts",
    "migration:run": "pnpm typeorm migration:run -d src/database/data-source.ts",
    "migration:revert": "pnpm typeorm migration:revert -d src/database/data-source.ts",
    "migration:show": "pnpm typeorm migration:show -d src/database/data-source.ts",
    "seed:run": "ts-node -r tsconfig-paths/register src/database/run-seeds.ts",
    "db:clear": "ts-node -r tsconfig-paths/register src/database/clear-database.ts"
  },
  "peerDependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "typeorm": "^0.3.17",
    "mysql2": "^3.6.0",
    "redis": "^4.6.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.14.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "multer": "^2.1.1",
    "mysql2": "^3.6.0",
    "redis": "^4.6.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0",
    "typeorm": "^0.3.17"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/dotenv": "^8.2.3",
    "@types/express": "^4.17.17",
    "@types/jest": "^30.0.0",
    "@types/multer": "^2.1.0",
    "@types/node": "^20.0.0",
    "@types/supertest": "^7.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "dotenv": "^17.3.1",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^30.3.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.2.2",
    "ts-jest": "^29.4.6",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/package.json
git commit -m "feat(base-backend): configure package.json for npm publish"
```

***---

## Task 9: 修改 main.ts 保持兼容

**Files:**

- Modify: `src/main.ts`
- [ ] **Step 1: 修改 main.ts 使用工厂函数**

```typescript
/**
 * @fileoverview 应用入口文件
 * @description NestJS 应用启动入口（兼容模式）
 */

import { createBaseBackendApp } from './create-base-backend-app';

async function bootstrap() {
  const app = await createBaseBackendApp();
  await app.listen(3000);
}

bootstrap();
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/main.ts
git commit -m "refactor(base-backend): use createBaseBackendApp in main.ts"
```

***

## Task 10: 验证构建

- [ ] **Step 1: 运行构建命令**

Run: `cd packages/base-backend && pnpm build`
Expected: 构建成功，无错误

- [ ] **Step 2: 检查 dist 目录**

Run: `ls packages/base-backend/dist`
Expected: 存在 `index.js`, `index.d.ts`, `create-base-backend-app.js` 等文件

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(base-backend): verify build output"
```

***

## Task 11: 编写使用示例文档

**Files:**

- Modify: `README.md`
- [ ] **Step 1: 更新 README.md**

添加 npm 包使用说明：

````markdown
# moyan-base-backend

墨焱基础后端框架 - NestJS 管理后台基础设施

## 安装

```bash
npm install moyan-base-backend
````

## 使用方式

```typescript
import { createBaseBackendApp, RequirePermission, User, UserInfo, Base, AppMember } from 'moyan-base-backend';

// 创建扩展实体
@Entity('supplier_member_profile')
export class SupplierMemberProfile extends Base {
  @Column()
  companyName: string;

  @ManyToOne(() => AppMember)
  @JoinColumn()
  member: AppMember;
}

// 创建应用
const app = await createBaseBackendApp({
  appTypes: [
    { typeName: '供应商', typeCode: 'supplier', builtinRole: [...] },
  ],
  modules: [SupplierModule],
  swagger: [
    { name: 'business', title: '业务API', include: [SupplierModule] },
  ],
  hooks: {
    onAppInit: async (ctx) => {
      // 初始化逻辑
    },
  },
});

await app.listen(3000);
```

## 导出内容

- `createBaseBackendApp` - 应用工厂函数
- 核心实体: `User`, `Role`, `Permission`, `AppType`, `App`, `AppMember`, `AuditLog`
- 核心服务: `AuthService`, `UserService`, `RoleService`, etc.
- 装饰器: `@Public`, `@RequirePermission`, `@User`, `@AuditLog`
- 工具: `PaginationX`, `hashPassword`, `hasPermission`, etc.

````

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/README.md
git commit -m "docs(base-backend): update README with npm package usage"
````

***

## 完成检查清单

- [ ] 所有新建文件已创建
- [ ] 所有修改文件已更新
- [ ] 构建成功无错误
- [ ] 导出结构完整
- [ ] package.json 配置正确
- [ ] README 文档已更新

