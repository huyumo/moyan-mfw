# 01 · 路由体系

## 目录

- [页面加载规则](#页面加载规则)
- [`definePageConfig()`](#definepageconfig) — 定义页面路由
- [`defineModuleConfig()`](#definemoduleconfig) — 定义模块分组
- [`buildRoutesFromConfigs()`](#buildroutesfromconfigs) — 从 glob 构建路由
- [`buildBasePackageRoutes()`](#buildbasepackageroutes) — 基包路由扫描
- [`createBaseAdminRouter()`](#createbaseadminrouter) — 创建路由实例
- [路由守卫](#路由守卫)

---

## 页面加载规则

1. 页面组件必须放在 `src/views/` 目录下
2. 每个页面是一个独立目录，目录内必须包含 `index.ts` 配置文件
3. 配置文件必须导出 `page`、`path`、`name`
4. **扁平路由架构**：所有页面路由直接作为 `/` 的子路由注册

```
src/views/
├── dashboard/
│   └── index.ts          → 定义页面配置
├── sys/
│   ├── index.ts           → 定义模块配置（菜单分组）
│   ├── user/index.ts
│   ├── role/index.ts
│   └── permission/index.ts
└── ...
```

---

## `defineModuleConfig()`

定义模块配置，**仅用于菜单分组**，不生成嵌套路由。

```typescript
import { defineModuleConfig } from 'moyan-mfw-base/frontend'

// src/views/sys/index.ts
export default defineModuleConfig({
  type: 'module',
  name: '系统管理',
  icon: 'Setting',
  order: 10,
})
```

### `ModuleConfig` 接口

```typescript
interface ModuleConfig {
  type?: 'module'     // 模块类型标识
  name: string         // 模块/菜单名称
  icon?: string        // 菜单图标（Element Plus 图标名）
  order?: number       // 菜单排序，越小越靠前
}
```

---

## `definePageConfig()`

定义页面配置。自动将 `permissions` 名称列表转为 `permissionValue` 位运算值。

```typescript
import { definePageConfig } from 'moyan-mfw-base/frontend'

// src/views/dashboard/index.ts
import Dashboard from './dashboard.vue'

export default definePageConfig({
  page: Dashboard,
  path: 'dashboard',
  name: '首页',
  icon: 'DataBoard',
  auth: true,
  order: 1,
})
```

### `PageConfig` 接口

```typescript
interface PageConfig<T extends string = string> {
  page: unknown            // Vue 组件（.vue 文件的默认导出）
  path: string             // 路由路径，如 'user' 或 'detail/:id'
  name: string             // 页面/菜单名称
  icon?: string            // 菜单图标
  auth?: boolean           // 是否需要认证，默认 true
  order?: number           // 菜单排序，默认 50
  hidden?: boolean          // 是否在菜单中隐藏
  permissions?: T[]        // 权限名称列表
  permissionValue?: bigint // 权限位值（框架自动计算，请勿手动设置）
  permCode?: string        // 权限编码，如 'ext:ad:placement'
  children?: PageConfig<T>[] // 子页面配置
}
```

### 权限页面示例

```typescript
export default definePageConfig({
  page: UserList,
  path: 'user',
  name: '用户管理',
  icon: 'User',
  permissions: ['添加', '编辑', '删除'],  // 框架自动转位值
})
```

---

## `buildRoutesFromConfigs()`

从 `import.meta.glob` 扫描结果构建扁平路由配置。

```typescript
import { buildRoutesFromConfigs } from 'moyan-mfw-base/frontend'

const routes = buildRoutesFromConfigs(
  import.meta.glob('../views/**/index.ts', { eager: true }),
  {
    skipPaths: ['/not-found/', '/forbidden/', '/login/', '/install/'],
    minSegments: 2,                              // 最少路径段数，过滤模块级 index.ts
    routePrefix: '',                             // 路由前缀，如 '/ext/ad'
  }
)
```

### 处理流程

1. 分离 `ModuleConfig`（`type: 'module'`）和 `PageConfig`（有 `page` 属性）
2. 为每个页面生成扁平路由，将所属模块信息注入 `meta.moduleInfo`
3. 为有子页面的模块生成纯重定向路由（如 `/sys` → `/sys/user`）

---

## `buildBasePackageRoutes()`

扫描基包 `views/` 目录下的所有页面，返回路由配置。由 `createBaseAdminRouter()` 内部调用。

```typescript
import { buildBasePackageRoutes } from 'moyan-mfw-base/frontend'

const baseRoutes = buildBasePackageRoutes()
```

---

## `createBaseAdminRouter()`

创建完整的路由实例，自动合并基包和业务路由，注册全局权限守卫。

```typescript
import { createBaseAdminRouter } from 'moyan-mfw-base/frontend'

const router = createBaseAdminRouter({
  history: createWebHistory(),     // 可选，默认 createWebHistory
  base: '/admin/',                 // 可选，路由基础路径
  title: '管理后台',                // 页面标题后缀
  routes: [/* 业务路由 */],        // 业务路由与基包路由合并（业务优先）
})
```

### 内置路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | Login | 登录页 |
| `/install` | InstallWizard | 系统初始化向导 |
| `/` | AdminLayout | 布局容器（含子路由） |
| `/403` | Forbidden | 权限不足 |
| `/404` | NotFound | 页面不存在 |
| `/:pathMatch(.*)*` | — | 通配 404 |

---

## 路由守卫

`setupRouteGuard()` 在 `createBaseAdminRouter()` 内部自动调用。

### 守卫流程

```
路由跳转
  → 检查系统初始化状态 → 未初始化则跳 /install
  → 白名单路由（/login, /install, /403, /404）→ 放行
  → 检查 Token → 无则跳 /login?redirect=xxx
  → 首次进入 → 初始化认证状态 (restoreToken + fetchUserInfo + fetchUserApps)
  → 多应用未选择 → 跳 /login 展示选择面板
  → 计算页面的 permissionValue（从 permissions 名称列表）
  → 检查页面权限 → 无权限则跳 /403 或 /dashboard
```

### 导出

```typescript
import { setupRouteGuard, resetRouteGuard } from 'moyan-mfw-base/frontend'
```

| 函数 | 说明 |
|------|------|
| `setupRouteGuard(router)` | 安装全局路由守卫 |
| `resetRouteGuard()` | 重置守卫状态（用于登出后重新初始化） |
