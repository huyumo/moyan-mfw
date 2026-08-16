# 前端 · 路由与菜单树

> 当前版本（1.2.x）路由已从旧版 `import.meta.glob` 自动扫描迁移为**手动 menuTrees 配置**。旧方式（`definePageConfig`）已废弃。

## 菜单树：路由与权限的唯一数据源

```typescript
// src/menu-trees.ts
import type { FrontendAppTypeMenuConfig } from 'moyan-mfw-base/frontend';
import { SysUserPage, SysAppTypePage } from 'moyan-mfw-base/frontend';
import DashboardPage from '@/views/dashboard/Index.vue';

const systemMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: 'system',
  roleCode: 'super_admin',
  label: '系统管理',
  icon: 'Setting',
  children: [
    { path: 'dashboard', name: '首页', icon: 'DataBoard', component: DashboardPage },
    {
      path: 'sys',
      name: '系统管理',
      icon: 'Setting',
      children: [
        { path: 'app-type', name: '应用类型管理', icon: 'Grid', permissions: ['编辑'], component: SysAppTypePage },
        { path: 'user', name: '用户管理', icon: 'User', permissions: ['添加', '编辑', '删除'], component: SysUserPage },
      ],
    },
  ],
};

export const menuTrees: FrontendAppTypeMenuConfig[] = [systemMenuTree];
```

### 节点字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | `string` | ✅ | 路由片段（相对父节点） |
| `name` | `string` | ✅ | 显示名称（菜单标签 + 权限节点名） |
| `icon` | `string` | 否 | Element Plus 图标名（如 `User`、`Setting`） |
| `component` | `Component \| () => Promise<unknown>` | PAGE 必填 | 页面组件（同步或懒加载） |
| `children` | `FrontendMenuNode[]` | MENU 必填 | 子节点（有 children = 分组，生成重定向路由） |
| `permissions` | `string[]` | 否 | 页面操作权限名称（同步后生成按钮权限位） |
| `permCode` | `string` | 否 | 自定义权限编码（如 `ext:ad:placement`；缺省由同步服务生成） |
| `hidden` | `boolean` | 否 | 侧边栏隐藏 |
| `auth` | `boolean` | 否 | 是否需要登录，默认 true |
| `showMode` | `'NORMAL' \| 'DEV'` | 否 | `DEV` 仅开发者模式可见可访问 |

### 规则

1. 有 `children` 的节点 = MENU 分组 → 重定向到第一个子页面，无需 `component`。
2. 无 `children` 的节点 = PAGE 页面 → **必须提供 `component`**。
3. 最终路由路径 = `/{appTypeCode}/{父路径}/{path}`（首段是应用类型编码，守卫据此做 AppType 隔离）。
4. 每个业务 AppType 必须提供 `roleCode`（如 `super_admin` / `supplier_admin`），否则菜单树不会同步到后端。## 路由生成

`createBaseAdminApp` 内部完成：`buildRoutesFromMenuTrees(menuTrees)` 生成基包路由 → 与 `options.routes` 合并（业务路由覆盖同名基包路由）→ 挂到 `/`（AdminLayout）下。

内置路由：`/login`、`/install`（系统初始化向导）、`/403`、`/404`、`/:pathMatch(.*)*` → 404。

## 路由守卫

`setupRouteGuard()` 自动注册，流程：

```
跳转 → 检查系统初始化状态（未初始化 → /install）
  → 白名单放行（/login /install /403 /404）
  → 无 Token → /login?redirect=...
  → 首次进入：initializeAuth()（恢复 Token、拉用户/应用、自动选择应用）
  → 多应用未选择 → /login 展示应用选择面板
  → AppType 隔离校验（当前应用类型 ≠ 路由类型 → 拒绝）
  → showMode=DEV 且未开启开发者模式 → 拒绝
  → 权限菜单校验（permCode 或 routePath 不在权限菜单中 → /403）
```

## 路由同步到后端（权限同步）

菜单树变更后需要把权限数据推送到后端：

### 方式一：RouteSyncButton（推荐）

```typescript
import { RouteSyncButton } from 'moyan-mfw-base/frontend';

createBaseAdminApp({
  menuTrees,
  layoutExtensions: { sidebarFooter: RouteSyncButton }, // 仅开发者可见
});
```

### 方式二：手动调用 API

直接 POST 菜单树数据（需先剥离 component 字段，且仅序列化声明了 roleCode 的菜单树）到 `/api/route-sync/sync`。框架内部由 `serializeMenuTrees` 工具完成序列化（RouteSyncButton 即使用它），该工具不对外导出，业务侧可自行实现剥离逻辑或直接使用 RouteSyncButton。

同步内容：PC 权限（sys_permissions）、AppType 权限池、内置角色权限；自动清理不在新配置中的 `isAutoSync=1` 权限。

## 多 AppType 示例

```typescript
export const menuTrees: FrontendAppTypeMenuConfig[] = [
  systemMenuTree,     // appTypeCode: 'system'
  supplierMenuTree,   // appTypeCode: 'supplier'（roleCode: 'supplier_admin'）
];
```

用户切换应用时，侧边栏自动切换为该 AppType 的菜单树。

## 迁移指南（旧版 → 当前）

| 旧方式（v1.1.x） | 当前方式（v1.2.x+） |
|------------------|---------------------|
| 页面目录下 `index.ts` 导出 `definePageConfig({ page, path, name })` | 集中 `menu-trees.ts`，组件内联 `component` 字段 |
| `import.meta.glob` 自动扫描 | 手动导出 `menuTrees` 数组 |
| 权限同步需单独处理 | RouteSyncButton 一键同步 |