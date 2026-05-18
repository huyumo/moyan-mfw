# 00 · 快速开始：应用工厂函数

## 目录

- [`createBaseBackendApp()`](#createbasebackendapp) — 创建业务应用后端
- [`createExtensionBackendApp()`](#createextensionbackendapp) — 创建扩展包后端
- [导入的类型](#导入的类型)

---

## `createBaseBackendApp()`

创建完整的后端应用实例，自动组装 NestJS 模块、守卫、拦截器、管道、过滤器。

### 函数签名

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend'

function createBaseBackendApp(
  options?: CreateBaseBackendAppOptions
): Promise<BaseBackendAppInstance>
```

### 返回值 `BaseBackendAppInstance`

```typescript
interface BaseBackendAppInstance {
  /** NestJS 应用实例 */
  app: INestApplication
  /** 启动 HTTP 监听 */
  listen: (port: number) => Promise<void>
  /** 关闭应用（触发 beforeClose 钩子后关闭） */
  close: () => Promise<void>
}
```

### 配置选项 `CreateBaseBackendAppOptions`

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | `'Moyan MFW Backend'` | 应用名称，影响 Swagger 标题 |
| `database` | [`DatabaseConfig`](#databaseconfig) | — | 数据库连接配置，覆盖 `configService` |
| `redis` | [`RedisConfig`](#redisconfig) | — | Redis 连接配置 |
| `jwt` | [`JwtConfig`](#jwtconfig) | — | JWT 密钥与过期时间 |
| `cors` | `CorsOptions \| boolean` | `false` | CORS 配置，`true` 开启默认 CORS |
| `security` | `SecurityConfig` | — | Helmet / RateLimit 安全配置 |
| `logger` | `LoggerConfig` | — | 日志级别和格式 |
| `appTypes` | `AppTypeConfig[]` | `[]` | 业务应用类型配置 |
| `syncAppTypes` | `boolean` | `false` | 是否在启动时同步 `appTypes` 到数据库 |
| `userAttributes` | `UserAttributeConfig[]` | `[]` | 用户扩展属性 |
| `memberAttributes` | `MemberAttributeConfig[]` | `[]` | 成员扩展属性 |
| `permissionValues` | `string[]` | `[]` | 业务层权限名称数组，注册到全局权限系统 |
| `seeds` | `SeedConfig[]` | `[]` | 种子数据配置 |
| `modules` | `Type<any>[]` | `[]` | 额外 NestJS 模块 |
| `moduleRoutes` | `{ path: string; module: Type<any> }[]` | `[]` | 模块路由前缀（如 `'{ path: "ext/ad", module: AdModule }'`） |
| `extraEntities` | `Array<new () => any>` | `[]` | 额外 TypeORM 实体 |
| `providers` | `Provider[]` | `[]` | 额外 NestJS Provider |
| `middlewares` | `NestMiddleware[]` | `[]` | 额外中间件 |
| `exceptionFilters` | `ExceptionFilter[]` | `[]` | 额外异常过滤器 |
| `interceptors` | `NestInterceptor[]` | `[]` | 额外拦截器 |
| `migrations` | `MigrationConfig` | — | 数据库迁移配置 |
| `swagger` | [`SwaggerGroupConfig[]`](#swaggergroupconfig) | `[]` | Swagger 文档分组 |
| `hooks` | [`HookConfig`](#hookconfig) | — | 生命周期钩子 |
| `auditLog` | `AuditLogConfig` | — | 审计日志配置 |

### 配置子类型

#### `DatabaseConfig`

```typescript
interface DatabaseConfig {
  host?: string          // 默认 localhost
  port?: number          // 默认 3306
  username?: string
  password?: string
  database?: string
  charset?: string       // 默认 'utf8mb4'
  timezone?: string      // 默认 '+08:00'
  poolSize?: number      // 默认 100
  synchronize?: boolean  // 开发/测试环境默认 true
  logging?: boolean      // 默认 false
}
```

#### `RedisConfig`

```typescript
interface RedisConfig {
  host?: string
  port?: number
  password?: string
  db?: number
}
```

#### `JwtConfig`

```typescript
interface JwtConfig {
  secret?: string        // JWT 签名密钥
  expiresIn?: string | number  // 过期时间，默认 7200 秒
}
```

#### `AppTypeConfig`

```typescript
interface AppTypeConfig {
  typeName: string
  typeCode: string        // 应用类型唯一编码
  typeDesc?: string
  icon?: string
  multiAppEnabled: number // 是否支持多应用实例：1=是 0=否
  builtinRole: RoleConfig[]
}

interface RoleConfig {
  roleCode: string
  roleName: string
  isOwner?: number        // 是否为拥有者角色：1=是 0=否
}
```

#### `SwaggerGroupConfig`

```typescript
interface SwaggerGroupConfig {
  name: string            // 分组标识，访问路径 /api-docs/{name}
  title: string           // 文档标题
  description?: string
  include?: Type<any>[]   // 包含的模块
  exclude?: Type<any>[]   // 排除的模块
}
```

#### `HookConfig`

```typescript
interface HookConfig {
  onAppInit?: (ctx: AppContext) => Promise<void>
  onDatabaseReady?: (ctx: AppContext) => Promise<void>
  beforeLogin?: (ctx: AppContext, credentials: any) => Promise<void>
  afterLogin?: (ctx: AppContext, user: any, token: string) => Promise<void>
  afterRegister?: (ctx: AppContext, user: any) => Promise<void>
  beforeClose?: (ctx: AppContext) => Promise<void>
}
```

`AppContext` 提供 `app`（NestJS 应用）、`dataSource`（TypeORM 数据源）、`configService`（NestJS ConfigService）和 `getService<T>(type)` 泛型方法。

### 完整示例

```typescript
import { createBaseBackendApp, UserService } from 'moyan-mfw-base/backend'

async function bootstrap() {
  const { listen } = await createBaseBackendApp({
    name: '电商管理后台',
    database: {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'ec_shop',
    },
    jwt: { secret: 'prod-secret-key', expiresIn: 86400 },
    cors: true,
    permissionValues: ['发货', '充值', '退款', '对账'],
    syncAppTypes: true,
    appTypes: [{
      typeName: '电商后台',
      typeCode: 'ec_admin',
      multiAppEnabled: 1,
      builtinRole: [{ roleCode: 'ec_admin', roleName: '电商管理员', isOwner: 1 }],
    }],
    hooks: {
      onDatabaseReady: async (ctx) => {
        console.log('数据库已就绪，可以执行自定义初始化')
      },
      afterLogin: async (ctx, user, token) => {
        console.log(`用户 ${user.username} 已登录`)
      },
    },
  })

  await listen(3000)
  // 访问 Swagger: http://localhost:3000/api-docs/sys
}

bootstrap()
```

---

## `createExtensionBackendApp()`

扩展包专用工厂函数，在 `createBaseBackendApp()` 基础上自动配置路由前缀 `/ext/{name}`、Swagger 分组等。

### 函数签名

```typescript
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'

function createExtensionBackendApp(
  options: CreateExtensionBackendAppOptions
): Promise<BaseBackendAppInstance>
```

### 参数

```typescript
interface CreateExtensionBackendAppOptions {
  name: string       // 扩展名（如 'ad'），路由前缀自动为 /ext/{name}
  module: any        // 扩展的 NestJS 模块类
  entities?: any[]   // 扩展额外的 TypeORM 实体
  port?: number      // 端口号
}
```

### 示例

```typescript
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'
import { AdModule } from './ad.module'
import { AdPlacement } from './entities/ad-placement.entity'

async function bootstrap() {
  const { listen } = await createExtensionBackendApp({
    name: 'ad',
    module: AdModule,
    entities: [AdPlacement],
  })
  await listen(3001)
  // 路由前缀: /ext/ad/*
  // Swagger: /api-docs/ad
}

bootstrap()
```

---

## 导入的类型

所有配置相关类型均可从 `moyan-mfw-base/backend` 直接导入：

```typescript
import type {
  CreateBaseBackendAppOptions,
  BaseBackendAppInstance,
  CreateExtensionBackendAppOptions,
  AppTypeConfig,
  RoleConfig,
  HookConfig,
  AppContext,
  DatabaseConfig,
  RedisConfig,
  JwtConfig,
  SwaggerGroupConfig,
} from 'moyan-mfw-base/backend'
```
