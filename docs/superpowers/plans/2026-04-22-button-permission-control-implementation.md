# 按钮权限控制实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现基于 permissionValue 位运算的按钮级权限控制，支持自动推断 permCode 和显式指定 permCode。

**Architecture:** 扩展后端 getUserPermissions API 返回 permissionValueMap，前端 authStore 存储权限值映射并构建 routePermCodeMap，通过 usePermission Hook 和扩展的 v-permission 指令实现按钮权限检查。

**Tech Stack:** NestJS (后端), Vue 3 + Pinia (前端), TypeScript, BigInt 位运算

---

## 文件结构

| 层级 | 文件 | 改动类型 | 责责 |
|------|------|---------|------|
| 后端 | `packages/base-backend/src/modules/sys/auth/auth.service.ts` | 修改 | 构建 permissionValueMap |
| 后端 | `packages/base-backend/src/modules/sys/auth/dto/res/user-permissions-response.dto.ts` | 修改 | 新增 permissionValueMap 字段 |
| 前端 | `packages/base-frontend/src/store/auth-store.ts` | 修改 | 新增状态和方法 |
| 前端 | `packages/base-frontend/src/hooks/usePermission.ts` | 新增 | 权限检查 Hook |
| 前端 | `packages/base-frontend/src/directives/permission.ts` | 修改 | 扩展指令支持新格式 |
| 前端 | `packages/base-frontend/src/apis/sys/schemas.ts` | 修改 | 更新 DTO 类型定义 |

---

## Task 1: 后端 - 扩展 DTO

**Files:**
- Modify: `packages/base-backend/src/modules/sys/auth/dto/res/user-permissions-response.dto.ts`

- [ ] **Step 1: 添加 permissionValueMap 字段到 DTO**

在 `UserPermissionsResponseDto` 类中添加新字段：

```typescript
/**
 * 权限值映射
 * @description 用户权限值映射（permCode → permissionValue）
 */
@ApiProperty({
  description: '权限值映射（permCode → permissionValue）',
  example: { 'pc_root:sys:app': '7', 'pc_root:sys:role': '3' },
  required: false,
})
permissionValueMap?: Record<string, string>;
```

- [ ] **Step 2: 验证 DTO 编译通过**

Run: `cd packages/base-backend && npm run build`
Expected: 编译成功，无错误

- [ ] **Step 3: Commit**

```bash
git add packages/base-backend/src/modules/sys/auth/dto/res/user-permissions-response.dto.ts
git commit -m "feat(auth): add permissionValueMap field to UserPermissionsResponseDto"
```

---

## Task 2: 后端 - 扩展 auth.service.ts

**Files:**
- Modify: `packages/base-backend/src/modules/sys/auth/auth.service.ts:317-356`

- [ ] **Step 1: 修改 getUserPermissions 方法**

在 `getUserPermissions` 方法中构建 `permissionValueMap`：

找到 `getUserPermissions` 方法（约第 317 行），修改返回逻辑：

```typescript
async getUserPermissions(
  userId: string,
  appId: string,
): Promise<UserPermissionsResponseDto> {

  const sql = `
  SELECT 
    sp.id,
    sp.permCode,
    sp.permName,
    sp.permissionType,
    sp.nodeType,
    sp.parentId,
    sp.routePath,
    sp.externalUrl,
    sp.iconName,
    sp.sortOrder,
    sp.isVisible,
    sp.isCache,
    sp.showMode,
    BIT_OR(sp.permissionValue) permissionValue
  FROM sys_user_roles sur
  INNER JOIN sys_roles sr ON sur.roleId = sr.id
  INNER JOIN sys_role_permissions srp ON srp.roleId = sr.id
  INNER JOIN sys_permissions sp ON sp.id = srp.permissionId
  WHERE sur.userId = :userId AND sp.isVisible = 1
  GROUP BY sp.permCode
  ORDER BY sp.sortOrder ASC;
  `

  const result = await executeRawSql(this.entityManager, sql, { userId });
  const menuTree = flatToTree(result)
  const permissions = result.map((item)=>item.permCode)
  const appTypeId = result[0]?.appTypeId || ''

  // 构建 permissionValueMap
  const permissionValueMap: Record<string, string> = {};
  for (const item of result) {
    if (item.permissionValue) {
      permissionValueMap[item.permCode] = item.permissionValue.toString();
    }
  }

  return {
    menuTree,
    permissions: permissions,
    appTypeId: appTypeId,
    permissionValueMap,
  };
}
```

- [ ] **Step 2: 验证后端编译通过**

Run: `cd packages/base-backend && npm run build`
Expected: 编译成功，无错误

- [ ] **Step 3: Commit**

```bash
git add packages/base-backend/src/modules/sys/auth/auth.service.ts
git commit -m "feat(auth): build permissionValueMap in getUserPermissions"
```

---

## Task 3: 前端 - 更新 DTO 类型定义

**Files:**
- Modify: `packages/base-frontend/src/apis/sys/schemas.ts`

- [ ] **Step 1: 查找 UserPermissionsResponseDto 类型定义**

搜索 `UserPermissionsResponseDto` 类型定义位置。

- [ ] **Step 2: 添加 permissionValueMap 字段**

在 `UserPermissionsResponseDto` 类型中添加新字段：

```typescript
export type UserPermissionsResponseDto = {
  menuTree: PermissionTreeNodeDto[];
  permissions: string[];
  appTypeId: string;
  permissionValueMap?: Record<string, string>;
};
```

- [ ] **Step 3: 验证前端编译通过**

Run: `cd packages/base-frontend && npm run type-check`
Expected: 类型检查通过，无错误

- [ ] **Step 4: Commit**

```bash
git add packages/base-frontend/src/apis/sys/schemas.ts
git commit -m "feat(frontend): add permissionValueMap to UserPermissionsResponseDto type"
```

---

## Task 4: 前端 - 扩展 auth-store.ts

**Files:**
- Modify: `packages/base-frontend/src/store/auth-store.ts`

- [ ] **Step 1: 添加新状态**

在状态定义区域（约第 73-80 行）添加新状态：

```typescript
const permissionValueMap = ref<Record<string, string>>({});
const routePermCodeMap = ref<Map<string, string>>(new Map());
```

- [ ] **Step 2: 添加 buildRoutePermCodeMap 方法**

在方法定义区域添加新方法：

```typescript
function buildRoutePermCodeMap(nodes: PermissionTreeNodeDto[]): void {
  for (const node of nodes) {
    if (node.routePath && node.permCode) {
      routePermCodeMap.value.set(node.routePath, node.permCode);
    }
    if (node.children) {
      buildRoutePermCodeMap(node.children);
    }
  }
}
```

- [ ] **Step 3: 添加 getPermCodeByRoute 方法**

```typescript
function getPermCodeByRoute(currentPath: string): string | undefined {
  if (routePermCodeMap.value.has(currentPath)) {
    return routePermCodeMap.value.get(currentPath);
  }

  for (const [routePath, permCode] of routePermCodeMap.value) {
    if (currentPath.startsWith(routePath + '/') || currentPath === routePath) {
      return permCode;
    }
  }

  return undefined;
}
```

- [ ] **Step 4: 修改 loadPermissions 方法**

找到 `loadPermissions` 方法（约第 294 行），修改为：

```typescript
async function loadPermissions(appId: string): Promise<PermissionMenuItem[]> {
  try {
    const response = await new ApiAuthGetUserPermissions({
      query: { appId },
    });

    const menuNodes = response.menuTree || [];
    permissionMenu.value = transformPermissionMenu(menuNodes);
    permissionValueMap.value = response.permissionValueMap || {};

    buildRoutePermCodeMap(menuNodes);

    console.log('加载权限菜单:', permissionMenu.value);
    console.log('加载权限值映射:', permissionValueMap.value);

    const { useLayoutStore } = await import('./layout-store');
    const layoutStore = useLayoutStore();
    const sideMenu = transformPermissionMenuToSideMenu(permissionMenu.value);
    layoutStore.setNavigation({ sideMenu });

    console.log('已更新侧边栏菜单:', sideMenu);
    
    return permissionMenu.value;
  } catch (error) {
    console.error('加载权限菜单失败:', error);
    permissionMenu.value = [];
    permissionValueMap.value = {};
    routePermCodeMap.value.clear();
    return [];
  }
}
```

- [ ] **Step 5: 更新返回对象**

在 return 语句中添加新状态和方法：

```typescript
return {
  // 状态
  token,
  refreshToken: refreshTokenValue,
  user,
  apps,
  currentApp,
  permissionMenu,
  permissionValueMap,
  routePermCodeMap,
  tokenExpiresAt,
  loading,

  // 计算属性
  isAuthenticated,
  isLoggedIn,
  hasApps,
  needSelectApp,

  // 方法
  restoreToken,
  saveToken,
  clearToken,
  isTokenExpiringSoon,
  login,
  logout,
  refreshAccessToken,
  fetchUserInfo,
  fetchUserApps,
  selectApp,
  autoSelectApp,
  loadPermissions,
  setPermissionMenu,
  initializeAuth,
  getPermCodeByRoute,
};
```

- [ ] **Step 6: 验证前端编译通过**

Run: `cd packages/base-frontend && npm run type-check`
Expected: 类型检查通过，无错误

- [ ] **Step 7: Commit**

```bash
git add packages/base-frontend/src/store/auth-store.ts
git commit -m "feat(auth-store): add permissionValueMap and routePermCodeMap"
```

---

## Task 5: 前端 - 创建 usePermission Hook

**Files:**
- Create: `packages/base-frontend/src/hooks/usePermission.ts`

- [ ] **Step 1: 创建 hooks 目录（如果不存在）**

Run: `mkdir -p packages/base-frontend/src/hooks`

- [ ] **Step 2: 创建 usePermission.ts 文件**

```typescript
/**
 * @fileoverview 权限检查 Hook
 * @description 提供按钮级权限检查功能
 */

import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth-store';
import { buildPerValue, type PermissionName } from '../utils/permissions';

/**
 * 权限检查选项
 */
export interface PermissionCheckOptions {
  /** 权限编码（可选，不传则自动推断） */
  permCode?: string;
  /** 权限值数组，如 ['添加', '编辑'] */
  value: PermissionName[];
}

/**
 * 权限检查 Hook
 * @description 提供按钮级权限检查功能
 *
 * @example
 * ```typescript
 * const { hasPermissionValue, hasAnyPermissionValue } = usePermission();
 *
 * // 检查单个权限
 * const canAdd = hasPermissionValue({ value: ['添加'] });
 *
 * // 检查多个权限（OR 逻辑）
 * const canAddOrEdit = hasAnyPermissionValue(['添加', '编辑']);
 * ```
 */
export function usePermission() {
  const route = useRoute();
  const authStore = useAuthStore();

  /**
   * 检查是否拥有指定权限
   * @param options 权限检查选项
   * @returns 是否有权限
   */
  function hasPermissionValue(options: PermissionCheckOptions): boolean {
    const { permCode, value } = options;

    const targetPermCode = permCode || authStore.getPermCodeByRoute(route.path);
    if (!targetPermCode) {
      console.warn('[usePermission] 无法获取 permCode，请显式指定');
      return false;
    }

    const userValue = authStore.permissionValueMap[targetPermCode];
    if (!userValue) {
      return false;
    }

    const requiredValue = buildPerValue(value);
    return (BigInt(userValue) & requiredValue) !== 0n;
  }

  /**
   * 检查是否拥有任意一个权限（OR 逻辑）
   * @param values 权限值数组
   * @param permCode 权限编码（可选）
   * @returns 是否有任意一个权限
   */
  function hasAnyPermissionValue(values: PermissionName[], permCode?: string): boolean {
    return values.some((v) => hasPermissionValue({ value: [v], permCode }));
  }

  /**
   * 检查是否拥有所有权限（AND 逻辑）
   * @param values 权限值数组
   * @param permCode 权限编码（可选）
   * @returns 是否拥有所有权限
   */
  function hasAllPermissionValues(values: PermissionName[], permCode?: string): boolean {
    return values.every((v) => hasPermissionValue({ value: [v], permCode }));
  }

  /**
   * 获取当前页面的 permCode
   * @returns 当前页面的 permCode
   */
  function getCurrentPermCode(): string | undefined {
    return authStore.getPermCodeByRoute(route.path);
  }

  return {
    hasPermissionValue,
    hasAnyPermissionValue,
    hasAllPermissionValues,
    getCurrentPermCode,
  };
}
```

- [ ] **Step 3: 验证前端编译通过**

Run: `cd packages/base-frontend && npm run type-check`
Expected: 类型检查通过，无错误

- [ ] **Step 4: Commit**

```bash
git add packages/base-frontend/src/hooks/usePermission.ts
git commit -m "feat(hooks): create usePermission hook for button-level permission check"
```

---

## Task 6: 前端 - 扩展 v-permission 指令

**Files:**
- Modify: `packages/base-frontend/src/directives/permission.ts`

- [ ] **Step 1: 添加新接口定义**

在文件顶部添加接口定义：

```typescript
import { buildPerValue, type PermissionName } from '../utils/permissions';

/**
 * 权限指令值接口（新格式）
 */
interface PermissionDirectiveValue {
  /** 权限编码（可选） */
  permCode?: string;
  /** 权限值数组 */
  value: PermissionName[];
}
```

- [ ] **Step 2: 修改指令类型定义**

修改指令类型：

```typescript
export const vPermission: Directive<HTMLElement, PermissionDirectiveValue | string> = {
```

- [ ] **Step 3: 创建统一的权限检查函数**

在指令定义之前添加：

```typescript
/**
 * 检查按钮级权限
 */
function checkButtonPermission(
  permCode: string | undefined,
  permValues: PermissionName[],
  authStore: ReturnType<typeof useAuthStore>
): boolean {
  if (!permCode) {
    return false;
  }

  const userValue = authStore.permissionValueMap[permCode];
  if (!userValue) {
    return false;
  }

  const requiredValue = buildPerValue(permValues);
  return (BigInt(userValue) & requiredValue) !== 0n;
}
```

- [ ] **Step 4: 修改 mounted 和 updated 钩子**

修改 `mounted` 和 `updated` 钩子逻辑：

```typescript
mounted(el: HTMLElement, binding: DirectiveBinding<PermissionDirectiveValue | string>) {
  checkPermissionDirective(el, binding);
},

updated(el: HTMLElement, binding: DirectiveBinding<PermissionDirectiveValue | string>) {
  checkPermissionDirective(el, binding);
},
```

- [ ] **Step 5: 创建统一的检查函数**

添加 `checkPermissionDirective` 函数：

```typescript
function checkPermissionDirective(
  el: HTMLElement,
  binding: DirectiveBinding<PermissionDirectiveValue | string>
) {
  const authStore = useAuthStore();
  const route = useRoute();

  const value = binding.value;

  if (!value) {
    el.style.display = '';
    el.removeAttribute('data-permission-hidden');
    return;
  }

  let hasAccess = false;

  if (typeof value === 'string') {
    hasAccess = hasPermission(value);
  } else if (typeof value === 'object' && 'value' in value) {
    const permCode = value.permCode || authStore.getPermCodeByRoute(route.path);
    hasAccess = checkButtonPermission(permCode, value.value, authStore);
  }

  if (!hasAccess) {
    el.style.display = 'none';
    el.setAttribute('data-permission-hidden', 'true');
  } else {
    el.style.display = '';
    el.removeAttribute('data-permission-hidden');
  }
}
```

- [ ] **Step 6: 验证前端编译通过**

Run: `cd packages/base-frontend && npm run type-check`
Expected: 类型检查通过，无错误

- [ ] **Step 7: Commit**

```bash
git add packages/base-frontend/src/directives/permission.ts
git commit -m "feat(directive): extend v-permission to support permissionValue check"
```

---

## Task 7: 前端 - 导出 usePermission Hook

**Files:**
- Modify: `packages/base-frontend/src/hooks/index.ts` (如果存在)
- Or create: `packages/base-frontend/src/hooks/index.ts`

- [ ] **Step 1: 创建或修改 hooks/index.ts**

```typescript
/**
 * @fileoverview Hooks 导出
 */

export { usePermission } from './usePermission';
export type { PermissionCheckOptions } from './usePermission';
```

- [ ] **Step 2: 验证前端编译通过**

Run: `cd packages/base-frontend && npm run type-check`
Expected: 类型检查通过，无错误

- [ ] **Step 3: Commit**

```bash
git add packages/base-frontend/src/hooks/index.ts
git commit -m "feat(hooks): export usePermission hook"
```

---

## Task 8: 验证整体功能

- [ ] **Step 1: 启动后端服务**

Run: `cd packages/base-backend && npm run dev`
Expected: 服务启动成功

- [ ] **Step 2: 启动前端服务**

Run: `cd packages/base-frontend && npm run dev`
Expected: 服务启动成功

- [ ] **Step 3: 测试 API 返回**

登录后调用 `/api/auth/permissions?appId=xxx`，验证返回数据包含 `permissionValueMap`。

- [ ] **Step 4: 测试前端权限检查**

在页面中使用 `v-permission="{ value: ['添加'] }"`，验证按钮显示/隐藏正确。

---

## Task 9: 最终 Commit

- [ ] **Step 1: 确保所有改动已提交**

Run: `git status`
Expected: 无未提交的改动

- [ ] **Step 2: 创建功能分支合并**

```bash
git checkout main
git merge --no-ff feature/button-permission-control
git push origin main
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-04-22 | 初始版本 |