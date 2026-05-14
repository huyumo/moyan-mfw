# 路由扁平化重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将嵌套路由结构扁平化，消除 EmptyLayout，简化路由构建逻辑，使 keep-alive 直接生效，并将菜单相关方法提取为独立文件。

**Architecture:** 所有页面路由直接作为 `/` 的扁平子路由注册。`defineModuleConfig` 保留但仅作为菜单分组元数据写入页面路由的 `meta.moduleInfo`，不再生成 EmptyLayout 中间层路由。菜单树由独立的 `menu-builder.ts` 根据 `meta.moduleInfo` 按路径前缀逻辑分组构建，与路由嵌套结构解耦。

**Tech Stack:** Vue 3.5, Vue Router 4.5, TypeScript, Vite

---

## 文件变更清单

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| **修改** | `packages/base/src/frontend/router/routes.ts` | 简化 `buildRoutesFromConfigs`：扁平路由 + 模块元数据 |
| **创建** | `packages/base/src/frontend/router/menu-builder.ts` | 菜单构建独立文件：从路由/配置生成菜单树 |
| **修改** | `packages/base/src/frontend/router/menu-tree.ts` | 简化：适配扁平路由，提取 `readRoutes` 到 menu-builder |
| **修改** | `packages/base/src/frontend/router/index.ts` | 适配扁平路由（去掉 children 嵌套处理） |
| **修改** | `packages/base/src/frontend/layouts/AdminLayout.vue` | 修复 keep-alive：key 改用 route.name |
| **删除** | `packages/base/src/frontend/layouts/EmptyLayout.vue` | 不再需要 |
| **修改** | `packages/base/src/frontend/types/router-meta.d.ts` | 新增 `moduleInfo` meta 字段 |
| **修改** | `packages/base/src/frontend/create-base-admin-app.ts` | 适配新的菜单构建 API |
| **修改** | `frontend/src/router.ts` | 适配 `buildRoutesFromConfigs` 新签名 |
| **修改** | `packages/extensions/extension-ad/src/frontend/index.ts` | 适配 `buildRoutesFromConfigs` 新签名 |

---

### Task 1: 新增 `moduleInfo` 路由元数据类型

**Files:**
- Modify: `packages/base/src/frontend/types/router-meta.d.ts`

- [ ] **Step 1: 在 RouteMeta 接口中添加 `moduleInfo` 字段**

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    menu?: boolean;
    menuLabel?: string;
    menuKey?: string;
    menuIcon?: string;
    menuBadge?: string;
    menuOrder?: number;
    affix?: boolean;
    /** 所属模块信息（用于菜单分组） */
    moduleInfo?: {
      /** 模块路径前缀（如 'sys'） */
      modulePath: string;
      /** 模块名称（如 '系统管理'） */
      moduleName: string;
      /** 模块图标 */
      moduleIcon?: string;
      /** 模块排序 */
      moduleOrder?: number;
    };
  }
}
```

- [ ] **Step 2: 运行类型检查确认零错误**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`
Expected: PASS

---

### Task 2: 简化 `buildRoutesFromConfigs` — 扁平路由 + 模块元数据

**Files:**
- Modify: `packages/base/src/frontend/router/routes.ts`

这是核心变更。`buildRoutesFromConfigs` 的逻辑从"构建树形嵌套路由"简化为"生成扁平路由列表 + 模块元数据注入"。

- [ ] **Step 1: 修改 `buildRoutesFromConfigs` 函数**

删除步骤 3（创建模块分组路由 + EmptyLayout）和步骤 4（构建树形结构）。改为：扫描模块配置 → 将模块信息注入到该模块下页面路由的 `meta.moduleInfo` 中 → 返回扁平路由数组。

新的 `buildRoutesFromConfigs` 逻辑：

```typescript
export function buildRoutesFromConfigs(
  allConfigs: Record<string, unknown>,
  options: {
    skipPaths?: string[];
    minSegments?: number;
  } = {}
): RouteRecordRaw[] {
  const { skipPaths = ['/not-found/', '/forbidden/', '/login/', '/install/', '/route-group/'], minSegments = 2 } = options;

  const moduleMap = new Map<string, ModuleConfig>();
  const pageConfigs = new Map<string, PageConfig<string>>();

  for (const [path, config] of Object.entries(allConfigs)) {
    if (skipPaths.some(skipPath => path.includes(skipPath))) {
      continue;
    }

    const relativePath = path
      .replace('../views/', '')
      .replace('./views/', '')
      .replace('/index.ts', '')
      .replace('/index.tsx', '');

    if (isModuleConfig(config)) {
      moduleMap.set(relativePath, config);
    } else if (isPageConfig(config)) {
      const segments = relativePath.split('/');
      if (segments.length >= minSegments) {
        pageConfigs.set(relativePath, config);
      }
    }
  }

  // 为每个页面路由找到所属模块，注入 moduleInfo
  const routes: RouteRecordRaw[] = [];

  for (const [relativePath, config] of pageConfigs.entries()) {
    const segments = relativePath.split('/').filter(Boolean);
    const routePath = config.path || segments[segments.length - 1] || '';

    // 查找所属模块：页面路径的第一段即为模块路径
    const modulePath = segments.length > 1 ? segments[0] : '';
    const moduleConfig = modulePath ? moduleMap.get(modulePath) : undefined;

    const route: RouteRecordRaw = {
      path: routePath,
      name: `Route_${segments.join('_')}` || 'Root',
      component: config.page as RouteRecordRaw['component'],
      meta: {
        title: config.name,
        menuLabel: config.name,
        menuIcon: config.icon,
        menuOrder: config.order ?? 50,
        requiresAuth: config.auth ?? true,
        hidden: config.hidden,
        permissions: config.permissions,
        permissionValue: config.permissionValue?.toString(),
        ...(moduleConfig
          ? {
              moduleInfo: {
                modulePath,
                moduleName: moduleConfig.name,
                moduleIcon: moduleConfig.icon,
                moduleOrder: moduleConfig.order ?? 50,
              },
            }
          : {}),
      },
    } as RouteRecordRaw;

    routes.push(route);
  }

  return routes;
}
```

关键变化：
1. **删除**步骤 3 的 EmptyLayout 模块路由创建
2. **删除**步骤 4 的树形嵌套构建逻辑
3. **新增**模块信息注入到 `meta.moduleInfo`
4. **返回**扁平 `RouteRecordRaw[]` 而非嵌套结构

- [ ] **Step 2: 删除 `createBaseAdminRoutes` 函数及 `baseAdminRoutes` 常量**

这两个导出已不再被使用（`createBaseAdminRouter` 在 `router/index.ts` 中直接组装路由）。删除 L271-L340。

- [ ] **Step 3: 删除不再需要的 import**

删除 `AdminLayout`、`Login`、`ForbiddenPage`、`NotFoundPage` 的 import（这些在 `createBaseAdminRoutes` 中使用，删除该函数后不再需要）。

- [ ] **Step 4: 运行类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`
Expected: 可能有类型错误（因为删除了导出），后续任务修复

---

### Task 3: 创建 `menu-builder.ts` — 菜单构建独立文件

**Files:**
- Create: `packages/base/src/frontend/router/menu-builder.ts`

将菜单相关方法从 `menu-tree.ts` 和 `routes.ts` 提取到此文件，并适配扁平路由 + moduleInfo 的方式构建菜单树。

- [ ] **Step 1: 创建 `menu-builder.ts`**

```typescript
/**
 * @fileoverview 菜单构建工具模块。
 * @description 从扁平路由配置构建菜单树。根据 meta.moduleInfo 对页面进行逻辑分组，
 * 无需路由嵌套结构即可生成层级菜单。
 */

import type { RouteRecordRaw } from 'vue-router';
import type { SideMenuItem } from '../types/layout-types';
import { buildRoutesFromConfigs } from './routes';

interface OrderedMenuItem extends SideMenuItem {
  order: number;
}

function normalizePath(path: string): string {
  return `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/**
 * 从扁平路由配置构建菜单树。
 * 根据 meta.moduleInfo 将页面分组到模块菜单下；
 * 无 moduleInfo 的页面作为顶级菜单项。
 */
export function createMenuTreeFromRoutes(
  routes: RouteRecordRaw[],
  context?: { parentPath?: string }
): SideMenuItem[] {
  const parentPath = context?.parentPath ?? '';
  const moduleGroups = new Map<string, OrderedMenuItem>();
  const topLevelItems: OrderedMenuItem[] = [];

  for (const route of routes) {
    const meta = (route.meta ?? {}) as Record<string, unknown>;

    if (meta.menu === false || meta.hidden === true) {
      continue;
    }

    const routePath = typeof route.path === 'string' ? route.path : '';
    const absolutePath = normalizePath(`${parentPath}/${routePath}`);

    const menuLabel =
      typeof meta.menuLabel === 'string'
        ? meta.menuLabel
        : typeof meta.title === 'string'
          ? meta.title
          : typeof route.name === 'string'
            ? route.name
            : '';

    if (!menuLabel) {
      continue;
    }

    const menuKey =
      typeof meta.menuKey === 'string'
        ? meta.menuKey
        : typeof route.name === 'string'
          ? route.name
          : absolutePath;

    const menuItem: OrderedMenuItem = {
      key: menuKey,
      label: String(menuLabel),
      to: absolutePath,
      icon: typeof meta.menuIcon === 'string' ? meta.menuIcon : undefined,
      badge: typeof meta.menuBadge === 'string' ? meta.menuBadge : undefined,
      order: typeof meta.menuOrder === 'number' ? meta.menuOrder : 50,
    };

    const moduleInfo = meta.moduleInfo as
      | { modulePath: string; moduleName: string; moduleIcon?: string; moduleOrder?: number }
      | undefined;

    if (moduleInfo) {
      if (!moduleGroups.has(moduleInfo.modulePath)) {
        moduleGroups.set(moduleInfo.modulePath, {
          key: `Module_${moduleInfo.modulePath}`,
          label: moduleInfo.moduleName,
          to: absolutePath,
          icon: moduleInfo.moduleIcon,
          order: moduleInfo.moduleOrder ?? 50,
          children: [],
        });
      }
      const group = moduleGroups.get(moduleInfo.modulePath)!;
      group.children!.push(menuItem);
    } else {
      topLevelItems.push(menuItem);
    }
  }

  const allItems: OrderedMenuItem[] = [
    ...Array.from(moduleGroups.values()),
    ...topLevelItems,
  ];

  return allItems
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...item }) => item);
}

/**
 * 菜单树去重。
 */
export function dedupeMenuTree(
  items: SideMenuItem[],
  existed = new Set<string>()
): SideMenuItem[] {
  const result: SideMenuItem[] = [];

  for (const item of items) {
    const children = item.children
      ? dedupeMenuTree(item.children, existed)
      : undefined;
    const path = typeof item.to === 'string' ? item.to : '';

    if (!path && (!children || children.length === 0)) {
      continue;
    }
    if (path && existed.has(path)) {
      continue;
    }
    if (path) {
      existed.add(path);
    }

    result.push({ ...item, children });
  }

  return result;
}

/**
 * 读取路由配置并转换为菜单格式（用于安装向导预览）。
 */
export function readRoutes(): SideMenuItem[] {
  const allConfigs = import.meta.glob('../views/**/index.{ts,tsx}', {
    eager: true,
    import: 'default',
  });

  const routes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 });
  return createMenuTreeFromRoutes(routes, { parentPath: '' });
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`

---

### Task 4: 简化 `menu-tree.ts`

**Files:**
- Modify: `packages/base/src/frontend/router/menu-tree.ts`

删除 `menu-tree.ts` 中的 `createMenuTreeFromRoutes`、`dedupeMenuTree`、`readRoutes`（已移至 `menu-builder.ts`）。保留文件但仅做重导出，避免破坏外部 import。

- [ ] **Step 1: 将 `menu-tree.ts` 改为从 `menu-builder.ts` 重导出**

```typescript
/**
 * @fileoverview 菜单树工具（重导出）。
 * @description 实际实现已迁移至 menu-builder.ts，此文件保留以兼容现有引用。
 */
export { createMenuTreeFromRoutes, dedupeMenuTree, readRoutes } from './menu-builder';
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`

---

### Task 5: 适配 `router/index.ts` — 扁平路由注册

**Files:**
- Modify: `packages/base/src/frontend/router/index.ts`

当前 `mergeRoutes` 按路径首段去重，适配扁平路由后逻辑不变，但不再需要处理 `children` 嵌套。

- [ ] **Step 1: 简化 `createBaseAdminRouter` 中的路由组装**

`mergedChildren` 现在是扁平路由列表（无嵌套 `children`），直接作为 `/` 的子路由注入即可。删除对 `route.redirect` 的特殊处理（扁平路由无模块重定向）。

修改 `children` 构建部分：

```typescript
children: [
  {
    path: '',
    name: 'RootRedirect',
    redirect: '/dashboard',
    meta: { requiresAuth: true },
  },
  ...mergedChildren.map((route) => ({
    ...route,
    path: route.path.replace(/^\//, ''),
  })),
],
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`

---

### Task 6: 修复 `AdminLayout.vue` 的 keep-alive

**Files:**
- Modify: `packages/base/src/frontend/layouts/AdminLayout.vue`

- [ ] **Step 1: 将 `:key` 从 `fullPath` 改为 `route.name`**

`route.name` 是稳定标识（如 `Route_sys_user`），不受 query/hash 影响，确保同一逻辑页面始终命中缓存。

修改模板 L44-49：

```html
<router-view v-slot="{ Component, route: slotRoute }">
  <keep-alive v-if="layoutStore.styleConfig.keepAlive">
    <component :is="Component" :key="slotRoute.name" />
  </keep-alive>
  <component v-else :is="Component" :key="slotRoute.name" />
</router-view>
```

关键变化：
1. `:key` 使用 `slotRoute.name` 替代 `slotRoute.fullPath`
2. `keep-alive` 作为条件渲染的包裹层，不再将 `v-if` 放在内部 component 上（之前 `v-if` 在 component 上会导致 keep-alive 内部缓存逻辑混乱）
3. 删除 `keepAliveKey` ref 及其递增逻辑（`name` 作为 key 已足够稳定，切换应用时 `loadPermissions` 会清空导航重置状态）

- [ ] **Step 2: 删除 `keepAliveKey` ref**

删除 script 中 `const keepAliveKey = ref(0);` 及 `handleAppSwitch` 中的 `keepAliveKey.value++;`

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`

---

### Task 7: 适配 `create-base-admin-app.ts`

**Files:**
- Modify: `packages/base/src/frontend/create-base-admin-app.ts`

- [ ] **Step 1: 更新 import 路径**

将 `createMenuTreeFromRoutes` 和 `dedupeMenuTree` 的导入从 `./router/menu-tree` 改为 `./router/menu-builder`（或保持从 `menu-tree` 重导出，此处无需改动）。

由于 Task 4 已将 `menu-tree.ts` 改为重导出，此处 **无需修改**。

- [ ] **Step 2: 确认 `createBaseAdminApp` 中的菜单构建逻辑正确**

检查 `buildBasePackageRoutes()` 返回扁平路由后，`createMenuTreeFromRoutes(allRoutes, { parentPath: '/' })` 是否正确分组。由于 `createMenuTreeFromRoutes` 现在基于 `meta.moduleInfo` 分组，需要确认扁平路由的 meta 中包含 moduleInfo。✓ Task 2 已确保注入。

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`

---

### Task 8: 删除 `EmptyLayout.vue`

**Files:**
- Delete: `packages/base/src/frontend/layouts/EmptyLayout.vue`

- [ ] **Step 1: 确认无其他代码引用 `EmptyLayout`**

搜索 `EmptyLayout` 引用。当前仅 `routes.ts` 的模块路由中使用（Task 2 已删除该引用）和 `docs/` 目录中的文档引用（不影响编译）。

- [ ] **Step 2: 删除文件**

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`

---

### Task 9: 适配业务层和扩展包

**Files:**
- Modify: `frontend/src/router.ts`
- Modify: `packages/extensions/extension-ad/src/frontend/index.ts`

- [ ] **Step 1: 检查 `frontend/src/router.ts`**

当前代码：
```typescript
export const businessRoutes: RouteRecordRaw[] = buildRoutesFromConfigs(allConfigs, { minSegments: 1 })
```
`buildRoutesFromConfigs` 新签名兼容，返回 `RouteRecordRaw[]`。此处 **无需修改**，因为函数签名未变，仅内部实现变更。

- [ ] **Step 2: 检查 `extension-ad/src/frontend/index.ts`**

当前代码：
```typescript
const allRoutes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 })
export const adTypeRoutes = allRoutes.filter(r => r.path?.startsWith('type'))
```
扁平路由返回后 `r.path` 不再有前导 `/`，但 `startsWith('type')` 匹配逻辑仍然有效（如 `type/xxx`）。此处 **无需修改**。

- [ ] **Step 3: 运行完整类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`
Run: `npx tsc --noEmit -p frontend/tsconfig.json` （如存在）

---

### Task 10: 全量类型检查 + 验证

**Files:** 无新增修改

- [ ] **Step 1: 运行完整类型检查**

Run: `npx tsc --noEmit -p packages/base/tsconfig.json`
Expected: 零错误

- [ ] **Step 2: 启动开发服务器验证**

Run: `pnpm --filter moyan-mfw-base dev:frontend`

访问以下路径验证：
- `/dashboard` — 首页正常渲染
- `/sys/user` — 用户管理正常渲染，无 EmptyLayout 嵌套
- `/sys/role` — 角色管理正常渲染
- 从 `/sys/user` 切换到 `/dashboard` 再切回 `/sys/user` — keep-alive 缓存生效，页面不重新加载

- [ ] **Step 3: 验证菜单分组**

侧边栏应仍显示"系统管理"分组，其下包含用户管理、角色管理等子项。
