# 01 · 路由菜单体系

> **v1.2.0 重大变更**：路由定义已从 `import.meta.glob` + `definePageConfig()` 自动扫描方式，迁移为**手动 `menu-trees.ts` 配置**方式。菜单树成为路由与权限的唯一数据源。

## 目录

- [设计理念](#设计理念)
- [快速上手](#快速上手)
- [菜单节点类型](#菜单节点类型)
- [菜单树配置详解](#菜单树配置详解)
  - [FrontendAppTypeMenuConfig](#frontendapptypemenuconfig)
  - [FrontendMenuNode](#frontendmenunode)
- [路由生成机制](#路由生成机制)
- [权限控制](#权限控制)
- [路由同步到后端](#路由同步到后端)
- [应用入口集成](#应用入口集成)
- [路由守卫流程](#路由守卫流程)
- [完整示例](#完整示例)
- [迁移指南（旧 definePageConfig → menuTrees）](#迁移指南旧-definepageconfig--menutrees)

---

## 设计理念

**菜单树是前端唯一数据源**，兼具三重职责：

1. **路由生成** — `buildRoutesFromMenuTrees()` 根据菜单树自动生成 Vue Router 路由
2. **侧边栏渲染** — `createMenuTreeFromRoutes()` 根据路由构建侧边栏菜单树
3. **权限同步** — 开发者通过 `RouteSyncButton` 将菜单树推送到后端，自动完成权限表同步

**核心原则：**

- 有 `children` 的节点 = **MENU 分组** → 生成重定向路由（跳转到第一个子页面）
- 无 `children` 的节点 = **PAGE 页面** → 必须提供 `component` 字段
- 子节点 `path` 为相对路径，自动拼接父路径为完整路由
- 每个 `AppType` 拥有独立的菜单树，切换应用时侧边栏自动切换

---

## 快速上手

### 1. 创建菜单树配置文件

在业务项目 `src/` 下创建 `menu-trees.ts`：

```typescript
// src/menu-trees.ts
import type { FrontendAppTypeMenuConfig } from "moyan-mfw-base/frontend";
import DashboardPage from "@/views/dashboard/Index.vue";
import UserPage from "@/views/sys/user/Index.vue";

const systemMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: "system",
  roleCode: "super_admin",
  label: "系统管理",
  icon: "Setting",
  children: [
    // PAGE 节点：无 children，必须提供 component
    {
      path: "dashboard",
      name: "首页",
      icon: "DataBoard",
      component: DashboardPage,
    },
    // MENU 节点：有 children，无需 component
    {
      path: "sys",
      name: "系统管理",
      icon: "Setting",
      children: [
        {
          path: "user",
          name: "用户管理",
          icon: "User",
          permissions: ["添加", "编辑", "删除"],
          component: UserPage,
        },
      ],
    },
  ],
};

export const menuTrees: FrontendAppTypeMenuConfig[] = [systemMenuTree];
```

### 2. 在 main.ts 中传入

```typescript
// src/main.ts
import { createBaseAdminApp } from "moyan-mfw-base/frontend";
import { menuTrees } from "./menu-trees";

const admin = createBaseAdminApp({
  menuTrees,          // ← 传入菜单树
  layout: { layoutMode: "dual" },
  navigation: { brandName: "管理后台", homePath: "/dashboard" },
});

await admin.mount("#app");
```

---

## 菜单节点类型

### PAGE 节点（叶子节点）

无 `children`，代表一个实际页面。**必须提供 `component` 字段**。

```typescript
{
  path: "user",              // 相对路径片段
  name: "用户管理",           // 显示名称
  icon: "User",              // Element Plus 图标名
  component: UserPage,       // Vue 组件（必填）
  permissions: ["添加", "编辑", "删除"],  // 操作权限（可选）
  permCode: "ext:ad:user",   // 自定义权限编码（可选）
  hidden: false,             // 是否在菜单中隐藏（可选）
  auth: true,                // 是否需要认证（可选，默认 true）
}
```

最终路由路径 = 父 MENU 路径 + 当前 path。例如父 `sys` + 子 `user` = `/sys/user`。

### MENU 节点（分组节点）

有 `children`，代表菜单分组。**不需要 `component`**，框架自动生成重定向路由到第一个子页面。

```typescript
{
  path: "sys",               // 分组路径
  name: "系统管理",           // 分组显示名称
  icon: "Setting",           // 分组图标
  children: [
    // 子节点可以是 PAGE 或嵌套 MENU
  ],
}
```

最终路由：访问 `/sys` 自动重定向到 `/sys/user`（第一个子页面）。

---

## 菜单树配置详解

### FrontendAppTypeMenuConfig

每个 `AppType` 对应一个菜单树配置：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `appTypeCode` | `string` | ✅ | 绑定的应用类型编码，如 `"system"`、`"supplier"` |
| `roleCode` | `string` | 业务必填 | 绑定的角色编码，如 `"super_admin"`。同步时仅同步该角色的权限数据 |
| `label` | `string` | ✅ | 菜单树分组显示标签 |
| `icon` | `string` | 否 | 分组图标（Element Plus 图标名） |
| `children` | `FrontendMenuNode[]` | ✅ | 该应用类型下的顶级菜单节点 |

> **注意**：`roleCode` 对业务 AppType 必填，扩展包可省略。无 `roleCode` 的菜单树不会同步到后端。

### FrontendMenuNode

菜单节点，PAGE 和 MENU 共用：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | `string` | ✅ | 路由路径片段（相对父路径） |
| `name` | `string` | ✅ | 显示名称 |
| `icon` | `string` | 否 | Element Plus 图标名 |
| `component` | `Component \| () => Promise<unknown>` | PAGE 必填 | Vue 组件（同步或懒加载） |
| `children` | `FrontendMenuNode[]` | MENU 必填 | 子节点 |
| `permissions` | `string[]` | 否 | 操作权限名称列表，如 `["添加", "编辑", "删除"]` |
| `permCode` | `string` | 否 | 自定义权限编码，如 `"ext:ad:placement"`。不设置则由后端自动生成 |
| `hidden` | `boolean` | 否 | 是否在菜单中隐藏，默认 `false` |
| `auth` | `boolean` | 否 | 是否需要认证，默认 `true` |

---

## 路由生成机制

### buildRoutesFromMenuTrees()

核心函数，位于 `packages/base/src/frontend/src/router/routes.ts`：

```
遍历 menuTrees
  └→ 递归处理 children
       ├─ 有 children → 生成 MENU 重定向路由
       │    path: "sys"
       │    redirect: "/sys/user"  (第一个子页面)
       │    meta: { title, menuLabel, menuIcon, moduleInfo }
       │
       └─ 无 children → 生成 PAGE 路由
            path: "sys/user"
            component: UserPage
            meta: { title, permissions, permCode, moduleInfo }
```

生成的路由自动携带 `meta.moduleInfo`，包含 `appTypeCode`，供侧边栏按应用分组。

### 路由合并策略

在 `createBaseAdminRouter()` 中，基包路由与业务路由通过 `mergeRoutes()` 合并：

- 使用 `Map<path, RouteRecordRaw>` 去重
- 业务路由覆盖同名基包路由

### 最终路由结构

```
/login           → Login 页
/install         → 系统初始化向导
/                → AdminLayout（布局容器）
  ├─ /dashboard  → 仪表盘
  ├─ /sys        → 重定向到 /sys/app-type
  ├─ /sys/app-type → 应用类型管理
  ├─ /sys/user   → 用户管理
  └─ ...
/403             → 权限不足
/404             → 页面不存在
/:pathMatch(.*)* → 通配 404
```

---

## 权限控制

### 页面级权限

在 `menu-trees.ts` 中声明 `permissions` 字段，路由守卫自动检查：

```typescript
{
  path: "user",
  name: "用户管理",
  permissions: ["添加", "编辑", "删除"],
  component: UserPage,
}
```

守卫流程：路由跳转 → 检查 `meta.permissions` → 用户权限值是否包含对应位 → 无权限跳 `/403`。

### 自定义权限编码

默认 `permCode` 由后端同步服务自动生成（格式 `pc_root:{appTypeCode}:{path}`），也可手动指定：

```typescript
{
  path: "placement",
  name: "广告位管理",
  permCode: "ext:ad:placement",   // 自定义编码
  permissions: ["添加", "编辑", "删除"],
  component: AdPlacementList,
}
```

### 按钮级权限：v-permission

支持两种格式：

```html
<!-- 方式一：权限编码 -->
<el-button v-permission="'sys:user:create'">新增</el-button>

<!-- 方式二：权限名称列表（位运算自动匹配） -->
<el-button v-permission="{ value: ['添加'] }">新增</el-button>
```

无权限时元素自动 `display: none`。

### 注册业务权限值

如果业务有自定义操作权限（如"发货"、"充值"），需在 `main.ts` 中注册：

```typescript
import { registerPermissionValues } from "moyan-mfw-base/frontend";

registerPermissionValues(["发货", "充值", "接待"]);
```

---

## 路由同步到后端

菜单树变更后，需同步到后端以更新权限表。

### 方式一：RouteSyncButton（推荐）

在 `main.ts` 中将 `RouteSyncButton` 注册到侧边栏底部：

```typescript
import { RouteSyncButton } from "moyan-mfw-base/frontend";

const admin = createBaseAdminApp({
  menuTrees,
  layoutExtensions: {
    sidebarFooter: RouteSyncButton,   // ← 仅 developer 可见
  },
});
```

点击按钮自动调用 `ApiRouteSyncSync`，将菜单树（剥离 `component` 字段后）发送到后端。

### 方式二：手动调用 API

```typescript
import { serializeMenuTrees } from "moyan-mfw-base/frontend";

const payload = serializeMenuTrees(menuTrees);
// POST /api/route-sync/sync
```

### 同步内容

后端 `RouteSyncService` 在收到菜单树后自动：

1. 计算配置 SHA256 哈希，与数据库比对
2. 同步 PC 权限到 `sys_permissions` 表
3. 同步 AppType 权限池到 `sys_app_type_permissions`
4. 同步内置角色权限到 `sys_role_permissions`
5. 自动清除不在新配置中的 `isAutoSync=1` 权限

---

## 应用入口集成

`createBaseAdminApp()` 的完整调用流程：

```
createBaseAdminApp({ menuTrees, ... })
  ├─ 创建 Vue App + Pinia + Router
  ├─ buildRoutesFromMenuTrees(menuTrees) → 基包路由
  ├─ mergeRoutes(baseRoutes, options.routes) → 合并路由
  ├─ createMenuTreeFromRoutes(allRoutes) → 侧边栏菜单树
  ├─ dedupeMenuTree() → 去重
  ├─ layoutStore.setNavigation() → 注入导航配置
  ├─ app.provide('mfw:menuTrees', menuTrees) → 注入菜单树
  └─ 返回 { app, router, pinia, mount, ... }
```

### CreateBaseAdminAppOptions 完整参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `menuTrees` | `FrontendAppTypeMenuConfig[]` | ✅ | 菜单树配置 |
| `routes` | `RouteRecordRaw[]` | 否 | 额外业务路由（覆盖基包同名路由） |
| `title` | `string` | 否 | 页面标题后缀 |
| `layout` | `Partial<LayoutStyleConfig>` | 否 | 布局样式配置 |
| `navigation` | `Partial<AdminNavigationConfig>` | 否 | 导航配置（品牌名、首页路径等） |
| `layoutExtensions` | `LayoutExtensionComponents` | 否 | 布局扩展组件 |
| `loginExtensions` | `LoginExtensionComponents` | 否 | 登录页扩展组件 |

---

## 路由守卫流程

`setupRouteGuard()` 在 `createBaseAdminRouter()` 内部自动调用：

```
路由跳转
  ├─ 检查系统初始化状态 → 未初始化 → /install
  ├─ 已初始化访问 /install → /login
  ├─ 白名单 (/login, /install, /403, /404) → 放行
  ├─ 无 Token → /login?redirect=xxx
  ├─ 首次进入 → initializeAuth() 初始化认证 + 多应用选择
  ├─ 多应用未选择 → /login 展示选择面板
  ├─ 计算 permissionValue（从 permissions 名称列表）
  ├─ 检查页面权限
  │    ├─ permCode 存在 → 递归匹配 permCode
  │    └─ permCode 不存在 → 递归匹配 routePath
  └─ 无权限 → /dashboard（非首页）或 /403
```

后置守卫：自动设置 `document.title`。

---

## 完整示例

### 多 AppType 菜单树

```typescript
// src/menu-trees.ts
import type { FrontendAppTypeMenuConfig } from "moyan-mfw-base/frontend";
import { SysUserPage, SysRolePage } from "moyan-mfw-base/frontend";
import DashboardPage from "@/views/dashboard/Index.vue";
import OrdersPage from "@/views/business/orders/Index.vue";

// AppType 1：系统管理
const systemMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: "system",
  roleCode: "super_admin",
  label: "系统管理",
  icon: "Setting",
  children: [
    {
      path: "dashboard",
      name: "首页",
      icon: "DataBoard",
      component: DashboardPage,
    },
    {
      path: "sys",
      name: "系统管理",
      icon: "Setting",
      children: [
        {
          path: "user",
          name: "用户管理",
          icon: "User",
          permissions: ["添加", "编辑", "删除"],
          component: SysUserPage,
        },
        {
          path: "role",
          name: "角色管理",
          icon: "UserFilled",
          permissions: ["添加", "编辑", "删除"],
          component: SysRolePage,
        },
      ],
    },
  ],
};

// AppType 2：供应商管理
const supplierMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: "supplier",
  roleCode: "supplier_admin",
  label: "供应商管理",
  icon: "Shop",
  children: [
    {
      path: "dashboard",
      name: "首页",
      icon: "DataBoard",
      component: DashboardPage,
    },
    {
      path: "business",
      name: "业务中心",
      icon: "Briefcase",
      children: [
        {
          path: "orders",
          name: "订单中心",
          icon: "Tickets",
          permissions: ["发货", "充值"],
          component: OrdersPage,
        },
      ],
    },
  ],
};

export const menuTrees: FrontendAppTypeMenuConfig[] = [
  systemMenuTree,
  supplierMenuTree,
];
```

### main.ts 完整示例

```typescript
import {
  createBaseAdminApp,
  registerPermissionValues,
  RouteSyncButton,
} from "moyan-mfw-base/frontend";
import { menuTrees } from "./menu-trees";

// 注册业务自定义权限值
registerPermissionValues(["发货", "充值", "接待"]);

const admin = createBaseAdminApp({
  menuTrees,
  layout: {
    layoutMode: "dual",
    showTabs: true,
  },
  navigation: {
    brandName: "墨焱管理后台",
    homePath: "/dashboard",
  },
  layoutExtensions: {
    sidebarFooter: RouteSyncButton,
  },
});

// 初始化权限缓存
const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

// 挂载应用
await admin.mount("#app");
```

---

## 迁移指南（旧 definePageConfig → menuTrees）

### 旧方式（v1.1.x）

```typescript
// src/views/user/index.ts
import { definePageConfig } from "moyan-mfw-base/frontend";
import UserPage from "./Index.vue";

export default definePageConfig({
  page: UserPage,
  path: "user",
  name: "用户管理",
  icon: "User",
  permissions: ["添加", "编辑", "删除"],
});

// src/main.ts — 自动扫描
const routes = buildRoutesFromConfigs(
  import.meta.glob("../views/**/index.ts", { eager: true })
);
```

### 新方式（v1.2.0+）

```typescript
// src/menu-trees.ts — 集中配置
import UserPage from "@/views/sys/user/Index.vue";

const systemMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: "system",
  roleCode: "super_admin",
  label: "系统管理",
  icon: "Setting",
  children: [
    {
      path: "user",
      name: "用户管理",
      icon: "User",
      permissions: ["添加", "编辑", "删除"],
      component: UserPage,
    },
  ],
};
```

### 关键差异

| | 旧方式 | 新方式 |
|------|------|------|
| 配置位置 | 分散在各 `views/*/index.ts` | 集中在 `src/menu-trees.ts` |
| 扫描方式 | `import.meta.glob` 自动扫描 | 手动导出数组 |
| 组件引用 | `definePageConfig({ page: ... })` | 内联 `component: ...` |
| 权限同步 | 需单独处理 | 内置 RouteSyncButton |
| 类型推断 | `definePageConfig` 泛型 | `FrontendAppTypeMenuConfig` 接口 |
