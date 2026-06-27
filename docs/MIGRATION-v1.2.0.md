# v1.2.0-beta.1 升级指南

## 概述

v1.2.0 重构了页面路由系统，从基于 `import.meta.glob` 的自动扫描改为**手动菜单树配置**。这是不向后兼容的重大变更（Breaking Change）。

### 核心变更

| 变更 | 旧方案 | 新方案 |
|------|--------|--------|
| 页面发现 | `import.meta.glob` 自动扫描 `views/**/index.ts` | 手动编写 `menu-trees.ts` 菜单树 |
| 组件注册 | `definePageConfig({ page: Component, ... })` | `componentMap` 路径→组件映射 |
| 路由构建 | `buildBasePackageRoutes()` / `buildRoutesFromConfigs()` | `buildRoutesFromMenuTrees(menuTrees, componentMap)` |
| 菜单树 | 每个 AppType 共享同一菜单 | 不同 AppType 独立菜单树 |
| PC 权限管理 | 前端手动编辑（`permission-pc` 页面 + 权限池） | 后端 `RouteSyncService` 自动同步 |
| 权限池编辑 | 前端可编辑 PC 权限 | 前端仅编辑 NORMAL 权限（PC 由同步自动勾选） |

---

## 必须完成的迁移步骤

### 1. 创建菜单树配置

在 `shared/src/menu-trees.ts`（与 `permissions.ts` 同级）中定义每个 AppType 的菜单树：

```typescript
import type { AppTypeMenuConfig } from 'moyan-mfw-base/shared';

export const menuTrees: AppTypeMenuConfig[] = [
  {
    appTypeCode: 'system',
    label: '系统管理',
    icon: 'Setting',
    order: 100,
    children: [
      { path: 'dashboard', name: '首页', icon: 'DataBoard', order: 1 },
      {
        path: 'sys', name: '系统管理', icon: 'Setting', order: 100,
        children: [
          { path: 'app-type', name: '应用类型管理', permissions: ['编辑'] },
          { path: 'user', name: '用户管理', permissions: ['添加', '编辑', '删除'] },
          { path: 'role', name: '角色管理', permissions: ['添加', '编辑', '删除'] },
          // ... 其他系统页面
        ],
      },
    ],
  },
];
```

> **注意**：子节点 path 为**相对路径**（如 `'user'`，非 `'sys/user'`），父路径由框架自动拼接。

### 2. 创建组件映射表

在前端 `router.ts` 中使用 `defineComponentMap` 以嵌套结构定义组件：

```typescript
import { defineComponentMap } from 'moyan-mfw-base/frontend';

export const componentMap = defineComponentMap({
  dashboard: () => import('./views/dashboard/Index.vue'),
  sys: {
    'app-type': () => import('moyan-mfw-base/frontend').then(m => m.SysAppTypePage),
    user: () => import('moyan-mfw-base/frontend').then(m => m.SysUserPage),
    role: () => import('moyan-mfw-base/frontend').then(m => m.SysRolePage),
  },
  business: {
    orders: () => import('./views/business/orders/Index.vue'),
  },
});
```

### 3. 更新前端入口 `main.ts`

```typescript
// 旧写法（已废弃）
const admin = createBaseAdminApp({
  routes: [...businessRoutes, ...adRoutes],  // 不再支持
});

// ✅ 新写法
import { menuTrees } from 'moyan-mfw-shared';     // 共享包
import { componentMap } from './router';            // 前端本地

const admin = createBaseAdminApp({
  menuTrees,       // 必填
  componentMap,    // 必填
  routes: [...adRoutes],  // 扩展包路由
});
```

### 4. 更新后端入口 `main.ts`（可选，推荐）

启用路由数据自动同步：

```typescript
import { menuTrees } from 'moyan-mfw-shared';

const app = await createBaseBackendApp({
  // ... 其他配置
  routeSync: {
    enabled: true,
    menuTrees,
  },
});
```

### 5. 删除旧页面配置文件

删除所有 `views/**/index.ts` 中的 `definePageConfig` 配置（这些文件不再被扫描）：

```bash
rm src/views/sys/user/index.ts
rm src/views/sys/role/index.ts
# ... 以及其他所有 views/*/index.ts
```

---

## 新增 API

### `defineComponentMap(nested)`

嵌套 → 扁平化的组件映射工具函数，与菜单树结构对齐：

```typescript
defineComponentMap({
  sys: { app: AppComponent, user: UserComponent }
})
// → { 'sys/app': AppComponent, 'sys/user': UserComponent }
```

### `buildRoutesFromMenuTrees(menuTrees, componentMap)`

从菜单树配置生成 Vue Router 路由，替代旧的自动扫描。

### `buildRoutesFromMenuTreeWithPrefix(menuNodes, componentMap, options)`

扩展包路由构建，自动添加 `/ext/{name}/` 前缀。

### `RouteSyncService`

后端自动同步服务，无需手动调用。配置 `routeSync.enabled = true` 后启动时自动执行：
1. 同步 PC 权限到 `sys_permissions`
2. 同步权限池到 `sys_app_type_permissions`（按 AppType 自动勾选）
3. 同步内置角色权限到 `sys_role_permissions`

---

## 移除的 API

| 移除项 | 替代方案 |
|--------|----------|
| `buildBasePackageRoutes()` | `buildRoutesFromMenuTrees()` |
| `buildRoutesFromConfigs()` | `buildRoutesFromMenuTrees()` |
| `definePageConfig()` | `MenuNode` 类型 + `defineComponentMap()` |
| `defineModuleConfig()` | `MenuNode` 类型（有 children 即 MENU） |
| `permission-pc` 页面 | `RouteSyncService` 自动同步 |
| 权限池 PC 标签页 | NORMAL 标签页保留，PC 由同步自动管理 |

---

## AppType 权限隔离说明

v1.2.0 中，每个 AppType 拥有独立的权限命名空间：

```
sys_permissions:
  pc_root:system:dashboard          ← system 专用
  pc_root:system:sys:user
  pc_root:supplier:dashboard        ← supplier 专用
  pc_root:supplier:business:orders

sys_app_type_permissions:
  system  → 仅 pc_root:system:*   （不含 supplier 权限）
  supplier → 仅 pc_root:supplier:*（不含 system 权限）
```

启动日志示例：
```
🔄 [RouteSync] 开始菜单树同步检查...（2 个 AppType）
✅ [RouteSync] RouteSyncService 获取成功，开始同步...
✅ [RouteSync] 路由数据同步完成：2 个应用类型，24 个权限变动
```