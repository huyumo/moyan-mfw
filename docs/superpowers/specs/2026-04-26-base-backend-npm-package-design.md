# moyan-base-backend NPM 包改造设计文档

## 一、概述

### 1.1 目标

将 `base-backend` 改造为可发布的 npm 包，使用者通过 `createBaseBackendApp()` 工厂函数创建业务后端系统，与前端 `createBaseAdminApp()` 模式保持对称。

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| 前后端对称 | 与 `createBaseAdminApp()` 保持一致的使用模式 |
| 核心不可修改 | 内置模块、实体、服务不可被使用者覆盖 |
| 遵循标准 | 使用者必须遵循框架规范扩展业务 |
| 暴露基础设施 | 装饰器、服务、实体、工具类可复用 |
| 统一版本 | 与 `moyan-mfw-base-frontend` 版本号同步 |

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    业务后端（使用者创建）                          │
│                                                                 │
│  createBaseBackendApp({                                         │
│    appTypes: [...],        // 应用类型配置                        │
│    modules: [BusinessModule], // 业务模块                        │
│    hooks: {...},           // 钩子扩展                           │
│  })                                                             │
├─────────────────────────────────────────────────────────────────┤
│                    moyan-base-backend（npm 包）                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  createBaseBackendApp()  ← 应用工厂函数                      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  核心模块（不可修改）                                         ││
│  │  ├── AuthModule      → 认证/登录/JWT                         ││
│  │  ├── UserModule      → 用户管理                              ││
│  │  ├── RoleModule      → 角色管理                              ││
│  │  ├── PermissionModule → 权限管理                             ││
│  │  ├── AppTypeModule   → 应用类型管理                          ││
│  │  ├── AppModule       → 应用实例/成员管理                     ││
│  │  ├── AuditLogModule  → 审计日志                              ││
│  │  ├── UploadModule    → 文件上传                              ││
│  │  ├── HealthModule    → 健康检查                              ││
│  │  └── InstallModule   → 系统初始化                            ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  公共基础设施（暴露给使用者）                                  ││
│  │  ├── decorators/     → @Public, @RequirePermission, @User   ││
│  │  ├── guards/         → AuthGuard, PermissionGuard            ││
│  │  ├── interceptors/   → TransformInterceptor, AuditInterceptor││
│  │  ├── filters/        → AllExceptionsFilter                   ││
│  │  ├── entities/       → Base, 核心实体类                      ││
│  │  ├── services/       → 核心服务类（可调用）                   ││
│  │  ├── utils/          → 分页、加密、权限位运算                 ││
│  │  └── types/          → 类型定义                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 与前端对称对比

| 前端 | 后端 |
|------|------|
| `createBaseAdminApp()` | `createBaseBackendApp()` |
| `routes: [...]` 注入业务页面 | `modules: [...]` 注入业务模块 |
| `layoutExtensions` 扩展布局组件 | `hooks` 扩展核心流程 |
| 暴露组件、布局、工具 | 暴露装饰器、服务、实体、工具 |

---

## 三、工厂函数 API 设计

### 3.1 接口定义

```typescript
/**
 * 创建后端应用实例。
 */
export interface CreateBaseBackendAppOptions {
  // === 基础配置 ===
  /** 应用名称 */
  name?: string;
  /** 数据库配置 */
  database?: DatabaseConfig;
  /** Redis 配置 */
  redis?: RedisConfig;
  /** JWT 配置 */
  jwt?: JwtConfig;
  /** CORS 配置 */
  cors?: CorsOptions | boolean;
  /** 安全配置 */
  security?: SecurityConfig;
  /** 日志配置 */
  logger?: LoggerConfig;

  // === 业务扩展配置 ===
  /** 应用类型配置（追加到内置类型，不可覆盖） */
  appTypes?: AppTypeConfig[];
  /** 用户扩展属性配置 */
  userAttributes?: UserAttributeConfig[];
  /** 成员扩展属性配置（按应用类型） */
  memberAttributes?: MemberAttributeConfig[];
  /** 扩展权限名称 */
  permissions?: PermissionConfig[];
  /** 种子数据配置 */
  seeds?: SeedConfig[];

  // === 模块与 Provider ===
  /** 业务模块注册 */
  modules?: Type<any>[];
  /** 全局 Provider 注册 */
  providers?: Provider[];

  // === 中间件/过滤器/拦截器 ===
  /** 全局中间件 */
  middlewares?: Array<NestMiddleware>;
  /** 全局异常过滤器（追加到内置过滤器） */
  exceptionFilters?: Array<Type<ExceptionFilter>>;
  /** 全局拦截器（追加到内置拦截器） */
  interceptors?: Array<Type<Interceptor>>;

  // === 数据库迁移 ===
  /** 数据库迁移配置 */
  migrations?: MigrationConfig;

  // === OpenAPI 文档 ===
  /** OpenAPI 文档分组配置 */
  swagger?: SwaggerGroupConfig[];

  // === 钩子扩展 ===
  /** 钩子配置 */
  hooks?: HookConfig;

  // === 审计日志 ===
  /** 审计日志配置 */
  auditLog?: AuditLogConfig;
}

/**
 * 应用实例返回值。
 */
export interface BaseBackendAppInstance {
  /** NestJS 应用实例 */
  app: INestApplication;
  /** 启动应用 */
  listen: (port: number) => Promise<void>;
  /** 关闭应用 */
  close: () => Promise<void>;
}
```

### 3.2 配置项详细定义

```typescript
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
  expiresIn?: string;
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
  /** 分组名称，对应 URL: /api-docs/{name} */
  name: string;
  /** 文档标题 */
  title: string;
  /** 文档描述 */
  description?: string;
  /** 包含的模块 */
  include?: Type<any>[];
  /** 排除的模块 */
  exclude?: Type<any>[];
}

/** 钩子配置 */
export interface HookConfig {
  /** 应用初始化完成后 */
  onAppInit?: (ctx: AppContext) => Promise<void>;
  /** 数据库连接建立后 */
  onDatabaseReady?: (ctx: AppContext) => Promise<void>;
  /** 用户登录前 */
  beforeLogin?: (ctx: AppContext, credentials: LoginDto) => Promise<void>;
  /** 用户登录后 */
  afterLogin?: (ctx: AppContext, user: UserInfo, token: string) => Promise<void>;
  /** 用户注册后 */
  afterRegister?: (ctx: AppContext, user: UserInfo) => Promise<void>;
  /** 应用关闭前 */
  beforeClose?: (ctx: AppContext) => Promise<void>;
}

/** 应用上下文（传递给钩子） */
export interface AppContext {
  /** NestJS 应用实例 */
  app: INestApplication;
  /** 数据库连接 */
  dataSource: DataSource;
  /** 配置服务 */
  configService: ConfigService;
  /** 获取任意已注册的服务 */
  getService<T>(type: Type<T>): T;
}

/** 数据库迁移配置 */
export interface MigrationConfig {
  /** 迁移文件目录 */
  directory?: string;
  /** 启动时自动运行迁移 */
  autoRun?: boolean;
}

/** 种子数据配置 */
export interface SeedConfig {
  /** 实体类 */
  entity: Type<any>;
  /** 种子数据 */
  data: any[];
}
```

---

## 四、暴露给使用者的基础设施

### 4.1 包导出结构

```typescript
// moyan-base-backend/src/index.ts

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
} from './create-base-backend-app';

// === 公共模块（统一导出） ===
export * from './common/index';

// === 核心实体类（供继承/关联） ===
export { User } from './modules/sys/user/entities/user.entity';
export { Role } from './modules/sys/role/entities/role.entity';
export { Permission } from './modules/sys/permission/entities/permission.entity';
export { AppType } from './modules/sys/app-type/entities/app-type.entity';
export { App } from './modules/sys/app/entities/app.entity';
export { AppMember } from './modules/sys/app/entities/app-member.entity';
export { AuditLog } from './modules/sys/audit-log/entities/audit-log.entity';

// === 核心服务（供调用） ===
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

### 4.2 公共模块详细导出（common/index.ts）

```typescript
// === 实体基类 ===
export { Base } from './entities/base.entity';

// === 异常类 ===
export { BusinessException } from './exceptions/business.exception';
export { NotFoundError } from './exceptions/not-found.exception';
export { ForbiddenError } from './exceptions/forbidden.exception';
export { UnauthorizedError } from './exceptions/unauthorized.exception';

// === 异常过滤器 ===
export { AllExceptionsFilter } from './filters/all-exceptions.filter';

// === 守卫 ===
export { AuthGuard } from './guards/auth.guard';
export { PermissionGuard } from './guards/permission.guard';

// === 拦截器 ===
export { LoggingInterceptor } from './interceptors/logging.interceptor';
export { TransformInterceptor } from './interceptors/transform.interceptor';
export { AuditInterceptor } from './interceptors/audit.interceptor';

// === 装饰器 ===
export { Public, IS_PUBLIC_KEY } from './decorators/public.decorator';
export {
  RequirePermission,
  REQUIRE_PERMISSION,
  type RequirePermissionOptions,
} from './decorators/require-permission.decorator';
export {
  AuditLog,
  AUDIT_LOG,
  AuditModule,
  type AuditLogOptions,
} from './decorators/audit-log.decorator';
export { ApiPaginatedResponse } from './decorators/api-paginated-response.decorator';
export { User } from './decorators/user.decorator';

// === 工具函数 ===
export { hashPassword, verifyPassword } from './utils/encrypt';
export {
  PaginationX,
  PaginationResult,
  PaginationQueryDto,
} from './utils/pagination-x.util';
export { executeRawSql, WhereBuilder } from './utils/sql.util';
export {
  QueryBuilderHelper,
  type QueryCondition,
  type ConditionGroup,
} from './utils/query-builder.util';

// === 类型定义 ===
export type {
  UserInfo,
  PageQuery,
  PageResult,
  CommonOptions,
} from './types/common.types';
export type {
  ApiResponse,
  ApiResponseUtil,
  ErrorResponse,
} from './types/api.types';
export {
  ImageResourceDto,
  MediaResourceDto,
  FileResourceDto,
  ResourceType,
} from './types/resource.types';
export { UserDto } from './types/user.dto';

// === 权限常量与工具 ===
export {
  PERMISSION_VALUES,
  buildPerValue,
  getPermValue,
  parsePerValue,
  hasPermission,
  type PermissionName,
} from './constants/permissions';
```

### 4.2 使用者使用示例

```typescript
// 业务后端示例

import { 
  createBaseBackendApp,
  AppMember,
  AppTypeService,
  AppService,
  RequirePermission,
  User,
  UserInfo,
  Base,
} from 'moyan-base-backend';

// 1. 创建扩展实体（关联到 AppMember）
@Entity('supplier_member_profile')
export class SupplierMemberProfile extends Base {
  @Column()
  companyName: string;

  @Column()
  businessLicense: string;

  @ManyToOne(() => AppMember)
  @JoinColumn()
  member: AppMember;
}

// 2. 业务服务调用核心服务
@Injectable()
export class SupplierService {
  constructor(
    private appTypeService: AppTypeService,
    private appService: AppService,
  ) {}

  async createSupplierApp(data: CreateSupplierDto) {
    return this.appService.create({
      typeCode: 'supplier',
      name: data.name,
      ...data,
    });
  }
}

// 3. 业务 Controller 使用装饰器
@Controller('supplier')
@RequirePermission('供应商管理')
export class SupplierController {
  @Get('list')
  async getList(@User() user: UserInfo) {
    // user 包含当前登录用户信息
  }
}

// 4. 创建应用
const app = createBaseBackendApp({
  appTypes: [
    { typeName: '供应商', typeCode: 'supplier', builtinRole: [...] },
  ],
  modules: [SupplierModule],
});
```

---

## 五、OpenAPI 多文档分组

### 5.1 文档 URL 规则

| 文档 | URL | 说明 |
|------|-----|------|
| 核心 API | `/api-docs/sys` | base-backend 内置模块，自动生成 |
| 业务 API | `/api-docs/{name}` | 使用者配置的业务模块分组 |

### 5.2 配置示例

```typescript
const app = createBaseBackendApp({
  swagger: [
    {
      name: 'business',
      title: '业务API文档',
      description: '商城业务模块API',
      include: [SupplierModule, ProductModule, OrderModule],
    },
    {
      name: 'delivery',
      title: '配送API文档',
      include: [DeliveryModule],
    },
  ],
});
```

### 5.3 API 生成脚本分离

```
┌─────────────────────────────────────────────────────────────────┐
│  base-frontend（npm 包）                                         │
│  api.build.cjs → 只生成 base-backend 核心 API                    │
│  configs = [{ jsonurl: '/api-docs/sys-json', ... }]             │
├─────────────────────────────────────────────────────────────────┤
│  业务前端（使用者项目）                                           │
│  api.build.cjs → 生成业务后端 API                                │
│  configs = [{ jsonurl: '/api-docs/business-json', ... }]        │
├─────────────────────────────────────────────────────────────────┤
│  base-backend（npm 包）                                          │
│  提供 /api-docs/sys-json（核心）                                 │
│  提供 /api-docs/{name}-json（业务分组）                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、钩子扩展机制

### 6.1 钩子执行时机

```
应用启动流程
│
├─ 1. 创建 NestJS 应用
│
├─ 2. 连接数据库
│    └─ onDatabaseReady(ctx) ← 钩子
│
├─ 3. 运行内置初始化（系统核心数据）
│
├─ 4. 注入使用者配置（appTypes、permissions 等）
│
├─ 5. 运行数据库迁移（如有）
│
├─ 6. 运行种子数据（如有）
│
├─ 7. 初始化 Swagger 文档
│
├─ 8. 应用启动完成
│    └─ onAppInit(ctx) ← 钩子
│
└─ 监听端口
```

### 6.2 使用示例

```typescript
const app = createBaseBackendApp({
  appTypes: [
    { typeName: '供应商', typeCode: 'supplier', builtinRole: [...] },
  ],
  
  hooks: {
    // 数据库准备好后，执行业务初始化逻辑
    onDatabaseReady: async (ctx) => {
      const supplierService = ctx.getService(SupplierService);
      const count = await supplierService.count();
      if (count === 0) {
        await supplierService.initDefaultData();
      }
    },
    
    // 应用初始化完成后
    onAppInit: async (ctx) => {
      const supplierService = ctx.getService(SupplierService);
      await supplierService.initDefaultSuppliers();
    },
    
    // 用户登录后
    afterLogin: async (ctx, user, token) => {
      const auditService = ctx.getService(AuditLogService);
      await auditService.log({
        action: '业务登录',
        userId: user.id,
        extra: { loginSource: 'supplier_portal' },
      });
    },
  },
});
```

---

## 七、内置应用类型保护机制

### 7.1 内置应用类型

| typeCode | typeName | 说明 |
|----------|----------|------|
| `system` | 系统管理 | 系统管理员，拥有全部权限 |
| `admin` | 管理员 | 应用管理员，管理单个应用 |

### 7.2 冲突检测机制

```typescript
const BUILTIN_APP_TYPES = ['system', 'admin'];

function validateAppTypes(userAppTypes: AppTypeConfig[]): void {
  for (const appType of userAppTypes) {
    if (BUILTIN_APP_TYPES.includes(appType.typeCode)) {
      throw new Error(
        `应用类型 typeCode "${appType.typeCode}" 是内置类型，不可覆盖。` +
        `内置类型: ${BUILTIN_APP_TYPES.join(', ')}`
      );
    }
  }
}
```

### 7.3 合并流程

```
启动时
│
├─ 1. 加载内置应用类型配置
│    ├── system（系统管理）
│    └── admin（管理员）
│
├─ 2. 验证使用者配置
│    └─ 检测 typeCode 冲突
│
├─ 3. 合并应用类型
│    └─ 内置类型 + 使用者类型（追加）
│
├─ 4. 创建内置角色
│    └─ 为每个应用类型创建 builtinRole
│
└─ 5. 写入数据库（首次初始化时）
```

---

## 八、实体扩展方式

### 8.1 关联扩展实体模式

使用者创建扩展实体，通过外键关联核心实体：

```typescript
// 使用者定义扩展实体
@Entity('supplier_member_profile')
export class SupplierMemberProfile extends Base {
  @Column()
  companyName: string;

  @Column()
  businessLicense: string;

  @ManyToOne(() => AppMember)
  @JoinColumn()
  member: AppMember;
}

// 注册到业务模块
@Module({
  imports: [TypeOrmModule.forFeature([SupplierMemberProfile])],
})
export class SupplierModule {}
```

### 8.2 TypeORM 自动创建表

| 方式 | 适用场景 | 说明 |
|------|----------|------|
| `synchronize: true` | 开发环境 | 自动同步实体定义到数据库表 |
| 迁移脚本 | 生产环境 | 通过 `migration:run` 创建表 |

---

## 九、package.json 配置

### 9.1 base-backend package.json

```json
{
  "name": "moyan-base-backend",
  "version": "1.0.0",
  "description": "墨焱基础后端框架 - NestJS 管理后台基础设施",
  "type": "commonjs",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "license": "MIT",
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
    "prepublishOnly": "npm run build"
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
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 9.2 版本同步策略

| 包 | 版本 | 说明 |
|---|------|------|
| `moyan-base-backend` | 1.0.0 | 后端基础包 |
| `moyan-mfw-base-frontend` | 1.0.0 | 前端基础包 |

**同步规则：**
- 主版本号、次版本号、补丁版本号完全同步
- 发布时同时发布两个包
- 使用者应使用相同版本号的前后端包

---

## 十、实现要点

### 10.1 需遵循的规范

- 严格遵循 base-backend 现有代码风格
- 导出结构以实际代码为准，命名保持一致
- 装饰器、服务、实体命名保持一致

### 10.2 核心改造任务

1. 创建 `create-base-backend-app.ts` 工厂函数
2. 重构 `app.module.ts` 为可配置的动态模块
3. 添加 OpenAPI 多文档分组支持
4. 实现钩子扩展机制
5. 实现内置应用类型保护机制
6. 完善 `index.ts` 导出结构
7. 配置 `package.json` 发布字段
8. 编写使用文档和示例