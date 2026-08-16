# 后端 · 应用工厂与配置

## `createBaseBackendApp(options)`

创建完整后端应用，自动组装：ConfigModule、TypeORM、JwtModule、CacheModule、SysModule、健康检查、全局守卫/拦截器/管道/过滤器、CORS、Swagger、BigInt 序列化、静态资源（uploads）。

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend';

const app = await createBaseBackendApp({
  name: '墨焱业务后端',
  appTypes: appTypesConfig,
  syncAppTypes: true,
  modules: [AppModule],
  swagger: swaggerGroups,
  permissionValues: [...EXTENSION_PERMISSION_VALUES],
  hooks: {
    onAppInit: async (ctx) => {},
    afterLogin: async (ctx, user) => {},
  },
});

await app.listen(3000);
```

### 选项总览（当前版本实际生效项）

| 选项 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 应用名称（Swagger 标题），默认 `Moyan MFW Backend` |
| `modules` | `Type[]` | 业务 NestJS 模块（注册进动态根模块） |
| `moduleRoutes` | `{ path, module }[]` | 为模块加路由前缀（RouterModule），如 `{ path: 'ext/ad', module: AdModule }` → `/api/ext/ad/...` |
| `providers` | `Provider[]` | 额外全局 Provider |
| `extraEntities` | `Type[]` | 额外 TypeORM 实体 |
| `appTypes` | `AppTypeConfig[]` | 业务应用类型（内置 `system`/`admin` 不可覆盖） |
| `syncAppTypes` | `boolean` | 启动时同步应用类型与内置角色到数据库（仅已初始化系统生效） |
| `permissionValues` | `string[]` | 业务权限名称，注册进全局权限系统（等价 `registerPermissionValues`） |
| `swagger` | `SwaggerGroupConfig[]` | Swagger 分组（`/api-docs/{name}`） |
| `hooks` | `HookConfig` | 生命周期钩子（见下） |
| `database` | `DatabaseConfig` | 数据库连接，覆盖 `.env` |
| `redis` | `RedisConfig` | Redis 连接 |
| `jwt` | `JwtConfig` | JWT secret / expiresIn / refreshExpiresIn |
| `cors` | `CorsOptions \| boolean` | CORS；`true` 默认开启，`false` 关闭 |
| `nestOptions` | `NestApplicationOptions` | 透传 `NestFactory.create`（rawBody、bodyParser、abortOnError 等） |

> ⚠️ **遗留选项（类型中存在但工厂未消费，请勿使用）**：`security`、`logger`、`userAttributes`、`memberAttributes`、`permissions`（已废弃，用 `permissionValues`）、`seeds`、`middlewares`、`exceptionFilters`、`interceptors`、`migrations`、`auditLog`。这些字段是为早期版本设计的，当前实现不会处理它们，使用会静默失效。

### 返回值 `BaseBackendAppInstance`

```typescript
interface BaseBackendAppInstance {
  app: INestApplication;                 // NestJS 应用
  listen: (port: number) => Promise<void>;
  close: () => Promise<void>;            // 触发 beforeClose 钩子后关闭
}
```

### 生命周期钩子 `HookConfig`

| 钩子 | 触发时机 | 签名 |
|------|----------|------|
| `onDatabaseReady` | 数据库连接就绪 | `(ctx: AppContext) => Promise<void>` |
| `onAppInit` | 应用初始化完成 | `(ctx: AppContext) => Promise<void>` |
| `beforeLogin` | 用户登录前 | `(ctx, credentials) => Promise<void>` |
| `afterLogin` | 用户登录成功 | `(ctx, user, token) => Promise<void>` |
| `beforeRegister` | 用户注册前 | `(ctx, registerDto) => Promise<void>` |
| `afterRegister` | 用户注册成功 | `(ctx, user) => Promise<void>` |
| `beforeClose` | 应用关闭前 | `(ctx: AppContext) => Promise<void>` |

`AppContext`：`{ app, dataSource, configService, getService<T>(type) }`。

## `createExtensionBackendApp(options)`

扩展包专用工厂：在 `createBaseBackendApp` 基础上自动配置路由前缀 `/ext/{name}`、Swagger 分组与 CORS。

```typescript
import { createExtensionBackendApp } from 'moyan-mfw-base/backend';
import { AdModule } from './ad.module';

const app = await createExtensionBackendApp({
  name: 'ad',
  module: AdModule,
  entities: [AdPlacement],   // 可选：额外实体
  database: { host: 'localhost' }, // 可选，透传
  redis: {},                  // 可选，透传
  jwt: {},                    // 可选，透传
});

await app.listen(3001);
// 路由前缀: /api/ext/ad/*
// Swagger: /api-docs/ad
```

## 环境变量

工厂内部加载 `.env`、`.env.local`、`.env.{NODE_ENV}`（后者优先级低到高）。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 端口（业务层自行读取） | 3000 |
| `GLOBAL_PREFIX` 或 `globalPrefix` | 全局前缀 | `/api` |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | MySQL | localhost / 3306 |
| `JWT_SECRET` | JWT 密钥 | 空（生产必须设置） |
| `JWT_EXPIRES_IN` | access token 过期秒数 | 7200 |
| `JWT_REFRESH_EXPIRES_IN` | refresh token 过期秒数 | 7 天 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis | — |
| `CACHE_DRIVER` | 缓存驱动 `none`/`memory`/`redis` | none |
| `UPLOAD_DIR` | 本地上传目录（静态资源 `/uploads/`） | uploads |
| `OSS_*` | 阿里云 OSS 配置（见上传文档） | — |

## Swagger 分组

```typescript
const swaggerGroups: SwaggerGroupConfig[] = [
  { name: 'supplier', title: '供应商API', description: '...', include: [SupplierModule] },
  { name: 'merchant', title: '商家API', include: [MerchantModule] },
];
```

访问地址：`http://localhost:3000/api-docs/{name}`，内置系统文档为 `/api-docs/sys`。

## 前端示例参考

完整的业务后端入口见仓库 `demo/backend/src/main.ts`：包含扩展包接入、SPI 示例模块（merchant）、定时任务模块（scheduler）、账本模块（ledger-demo）等。
