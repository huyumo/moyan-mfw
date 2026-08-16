# 02 · 核心概念

## 1. 权限体系：RBAC + BigInt 位运算

框架的权限模型 = **角色（Role）+ 权限点（Permission）+ 权限值（PermissionValue，BigInt 位运算）**。

### 1.1 权限值（PermissionValue）

系统把「操作权限」抽象为有限的**权限名称**（如 `添加`、`编辑`、`删除`、`导出`、`导入`），每个名称在数据库中占一个二进制位（`bitValue`，如 `添加 = 1`、`编辑 = 2`、`删除 = 4`）。一个接口/按钮需要多个权限时，用**按位或**合成一个 BigInt：

```typescript
import { buildPerValue } from 'moyan-mfw-base/backend';

buildPerValue(['添加', '编辑']); // 1n | 2n = 3n
```

用户权限值 = 其角色权限值按位或的结果。校验时 `(userValue & requiredValue) !== 0n` 即通过。

### 1.2 权限值分层

| 层级 | 内容 | 来源 |
|------|------|------|
| 默认权限值 | `添加 / 编辑 / 删除 / 导出 / 导入` | 框架内置 `DEFAULT_PERMISSION_VALUES` |
| 扩展权限值 | `审批 / 拒绝 / 发布 / 归档` | 框架内置 `EXTENSION_PERMISSION_VALUES` |
| 业务权限值 | `上架 / 发货 / 退款 / 对账` 等 | 业务层通过 `registerPermissionValues()` 注册 |

后端注册：`createBaseBackendApp({ permissionValues: [...] })` 或 `registerPermissionValues([...])`。
前端注册：`registerPermissionValues([...])`。

### 1.3 权限点（Permission）

权限点是树形菜单节点：`MENU`（分组）/ `PAGE`（页面）/ `TAG`（标签）。每个页面节点有 `permCode`（如 `pc_root:system:sys:user` 或自定义 `ext:ad:placement`），并挂载一组权限值。

### 1.4 角色（Role）

- 内置角色：`super_admin`（平台超级管理员）、`admin`；`isOwner=1` 的角色是应用拥有者角色。
- 业务角色：由 `AppTypeConfig.builtinRole` 声明，随应用类型同步创建。
- 开发者（`isDeveloper: 1`）绕过所有权限校验。

### 1.5 前后端权限链路

```
menu-trees.ts（前端唯一数据源）
  → RouteSyncButton / POST /api/route-sync/sync（仅开发者）
  → sys_permissions / sys_app_type_permissions / sys_role_permissions
  → GET /api/auth/permissions（用户在某应用下的权限菜单 + permissionValueMap）
  → 前端路由守卫 / v-permission / usePermission
```

## 2. 多租户设计：AppType / App / 成员

| 概念 | 说明 | 示例 |
|------|------|------|
| `AppType`（应用类型） | 应用类别，拥有独立权限池与内置角色 | `system`、`supplier`、`merchant` |
| `App`（应用实例） | AppType 的具体实例，业务方通常用业务实体（如商家）对应一个 App | 某供应商实例 |
| `AppMember`（成员） | 用户与应用的绑定关系，含角色分配 | 用户 A 是「供应商 X」的拥有者 |

- 一个用户可属于多个应用实例（`multiAppEnabled = 1`），登录后选择当前应用。
- 路由按 `/{appTypeCode}/...` 组织，前端守卫做 **AppType 隔离**：当前应用类型与目标路由类型不一致时拒绝访问。
- 业务后端通过 **SPI**（`AppEntitySpi` 等）在业务实体管理时同步维护应用/成员/角色状态，详见 [SPI 集成](./03-backend/spi.md)。

## 3. 菜单树：前端唯一数据源

`menuTrees` 同时承担**路由生成**、**侧边栏渲染**、**权限同步**三重职责：

```typescript
type FrontendAppTypeMenuConfig = {
  appTypeCode: string;   // 应用类型编码
  roleCode?: string;     // 绑定的角色编码（业务 AppType 必填）
  label: string;         // 菜单树分组标签
  icon?: string;         // Element Plus 图标名
  children: FrontendMenuNode[];
}
```

节点规则：

| 节点类型 | 判定 | 要求 | 生成的路由 |
|----------|------|------|------------|
| MENU 分组 | 有 `children` | 不需要 `component` | 重定向路由（跳第一个子页面） |
| PAGE 页面 | 无 `children` | **必须提供 `component`** | 实际页面路由 |

子节点 `path` 为相对路径（相对父节点），最终路径 = `/{appTypeCode}/{父路径}/{path}`。

## 4. 后端请求流水线

```
HTTP Request
  → CORS
  → AuthGuard（JWT 认证，@Public 可跳过）
  → PermissionGuard（位运算权限，@SkipPermission 可跳过）
  → ValidationPipe（whitelist + transform）
  → CacheInterceptor（@Cacheable 命中直接返回）
  → LoggingInterceptor（请求日志）
  → Controller（业务代码）
  → AppInfoInterceptor（注入请求 App 信息）
  → TransformInterceptor（统一响应包装 { code, data, message, timestamp }）
  → AllExceptionsFilter（统一异常处理）
  → HTTP Response
```

### 统一响应格式

```json
{
  "code": 0,
  "data": {},
  "message": "success",
  "timestamp": "2026-07-01T10:00:00.000Z"
}
```

## 5. 前端启动流程

```
main.ts
  → registerPermissionValues() 注册业务权限值
  → createBaseAdminApp({ menuTrees, layout, navigation, ... })
  │    ├─ 创建 Vue App + Pinia + Router
  │    ├─ buildRoutesFromMenuTrees(menuTrees) → 路由
  │    ├─ setupRouteGuard() → 鉴权/权限守卫
  │    ├─ 注入 layoutExtensions（如 RouteSyncButton）
  │    └─ 返回 { app, router, pinia, mount, fetchPermissionValues, initPermissionCache }
  → await admin.fetchPermissionValues() → admin.initPermissionCache(values)
  → await admin.mount('#app')
```

## 6. 环境变量（后端）

后端通过 dotenv 加载 `.env` / `.env.local` / `.env.{NODE_ENV}`，常用变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | MySQL 连接 | localhost / 3306 |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT 密钥与过期秒数 | 7200 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接（缓存/黑名单用） | — |
| `CACHE_DRIVER` | 缓存驱动：`none` / `memory` / `redis` | none |
| `UPLOAD_DIR` | 本地上传目录 | uploads |
| `VITE_*`（前端） | 前端环境变量见前端文档 | — |

## 7. 常见误区（务必阅读）

- ❌ 旧版文档中的 `routes: [...]` + `definePageConfig` + `import.meta.glob` 自动扫描路由的方式**已废弃**，请使用 `menuTrees`。
- ❌ `createBaseBackendApp({ security / logger / userAttributes / memberAttributes / seeds / middlewares / exceptionFilters / interceptors / migrations / auditLog })` 这些选项在类型中保留但**工厂当前未消费**，不要依赖它们。
- ✅ 内置系统页面（用户/角色/应用等）不再自动挂路由，需在 menuTrees 中显式引入（`SysUserPage` 等）。
- ✅ 审计日志需在控制器方法上显式使用 `@AuditLog`，并注册 `AuditInterceptor`（框架默认全局注册了 Logging/Transform/Cache/AppInfo 四个拦截器）。
