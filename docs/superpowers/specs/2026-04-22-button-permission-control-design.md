# 按钮权限控制设计方案

> 基于 permissionValue 位运算实现按钮级权限控制

---

## 一、需求背景

### 1.1 当前问题

现有权限系统只支持菜单级权限控制（通过 `v-permission` 指令检查 `permCode`），无法实现按钮级权限控制。

**典型场景**：
- 应用管理页面：用户可能有"查看"权限但没有"添加"、"编辑"、"删除"权限
- 表格操作列：需要根据用户权限动态显示/隐藏操作按钮

### 1.2 目标

实现基于 `permissionValue` 位运算的按钮级权限控制：
- 支持自动推断 `permCode`（根据当前路由）
- 支持显式指定 `permCode`（跨页面权限检查）
- 兼容现有菜单级权限检查

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        后端 API 层                               │
│  getUserPermissions API 返回:                                   │
│  - menuTree: 权限菜单树                                          │
│  - permissionValueMap: { permCode → permissionValue } 映射       │
└────────────────────┬────────────────────────────────────────────┘
                     │ API 响应
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      前端 Store 层                               │
│  authStore:                                                      │
│  - permissionMenu: 权限菜单树                                    │
│  - permissionValueMap: 权限值映射                                │
│  - routePermCodeMap: routePath → permCode 映射（自动构建）        │
└────────────────────┬────────────────────────────────────────────┘
                     │ Provide/Inject
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      权限检查层                                  │
│  - v-permission 指令（模板中使用）                               │
│  - usePermission Hook（组合式函数）                              │
│  - hasPermissionValue 函数（render 函数中使用）                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ 权限检查结果
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI 组件层                                   │
│  - 按钮显示/隐藏                                                 │
│  - 操作列按钮控制                                                │
│  - 弹窗按钮控制                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、后端改动

### 3.1 扩展 getUserPermissions API

**文件**：`packages/base-backend/src/modules/sys/auth/auth.service.ts`

**改动内容**：
1. 在现有 SQL 查询基础上，构建 `permissionValueMap`
2. 返回新增字段 `permissionValueMap`

**实现逻辑**：

```typescript
async getUserPermissions(userId: string, appId: string): Promise<UserPermissionsResponseDto> {
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
  `;

  const result = await executeRawSql(this.entityManager, sql, { userId });
  const menuTree = flatToTree(result);
  const permissions = result.map((item) => item.permCode);

  // 构建 permissionValueMap
  const permissionValueMap: Record<string, string> = {};
  for (const item of result) {
    if (item.permissionValue) {
      permissionValueMap[item.permCode] = item.permissionValue.toString();
    }
  }

  return {
    menuTree,
    permissions,
    appTypeId: result[0]?.appTypeId || '',
    permissionValueMap,
  };
}
```

### 3.2 扩展 DTO

**文件**：`packages/base-backend/src/modules/sys/auth/dto/res/user-permissions-response.dto.ts`

**新增字段**：

```typescript
@ApiProperty({
  description: '权限值映射（permCode → permissionValue）',
  example: { 'pc_root:sys:app': '7', 'pc_root:sys:role': '3' },
})
permissionValueMap: Record<string, string>;
```

---

## 四、前端改动

### 4.1 authStore 扩展

**文件**：`packages/base-frontend/src/store/auth-store.ts`

**新增状态**：

```typescript
const permissionValueMap = ref<Record<string, string>>({});
const routePermCodeMap = ref<Map<string, string>>(new Map());
```

**新增方法**：

```typescript
// 构建 routePath → permCode 映射
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

// 根据当前路由获取 permCode
function getPermCodeByRoute(currentPath: string): string | undefined {
  // 1. 直接匹配
  if (routePermCodeMap.value.has(currentPath)) {
    return routePermCodeMap.value.get(currentPath);
  }

  // 2. 前缀匹配（处理动态路由）
  for (const [routePath, permCode] of routePermCodeMap.value) {
    if (currentPath.startsWith(routePath + '/') || currentPath === routePath) {
      return permCode;
    }
  }

  return undefined;
}
```

**修改 loadPermissions 方法**：

```typescript
async function loadPermissions(appId: string): Promise<PermissionMenuItem[]> {
  const response = await new ApiAuthGetUserPermissions({ query: { appId } });

  const menuNodes = response.menuTree || [];
  permissionMenu.value = transformPermissionMenu(menuNodes);
  permissionValueMap.value = response.permissionValueMap || {};

  // 构建 routePath → permCode 映射
  buildRoutePermCodeMap(menuNodes);

  // 同步到侧边栏菜单
  const { useLayoutStore } = await import('./layout-store');
  const layoutStore = useLayoutStore();
  const sideMenu = transformPermissionMenuToSideMenu(permissionMenu.value);
  layoutStore.setNavigation({ sideMenu });

  return permissionMenu.value;
}
```

### 4.2 权限检查 Hook

**新文件**：`packages/base-frontend/src/hooks/usePermission.ts`

**接口定义**：

```typescript
export interface PermissionCheckOptions {
  permCode?: string;
  value: string[];
}
```

**核心函数**：

```typescript
export function usePermission() {
  const route = useRoute();
  const authStore = useAuthStore();

  function hasPermissionValue(options: PermissionCheckOptions): boolean {
    const { permCode, value } = options;

    const targetPermCode = permCode || authStore.getPermCodeByRoute(route.path);
    if (!targetPermCode) {
      console.warn('[Permission] 无法获取 permCode，请显式指定');
      return false;
    }

    const userValue = authStore.permissionValueMap[targetPermCode];
    if (!userValue) {
      return false;
    }

    const requiredValue = buildPerValue(value);
    return (BigInt(userValue) & requiredValue) !== 0n;
  }

  function hasAnyPermissionValue(values: string[], permCode?: string): boolean {
    return values.some(v => hasPermissionValue({ value: [v], permCode }));
  }

  function hasAllPermissionValues(values: string[], permCode?: string): boolean {
    return values.every(v => hasPermissionValue({ value: [v], permCode }));
  }

  return {
    hasPermissionValue,
    hasAnyPermissionValue,
    hasAllPermissionValues,
  };
}
```

### 4.3 扩展 v-permission 指令

**文件**：`packages/base-frontend/src/directives/permission.ts`

**接口定义**：

```typescript
interface PermissionDirectiveValue {
  permCode?: string;
  value: string[];
}
```

**改动内容**：
1. 兼容旧格式（字符串 permCode）
2. 支持新格式（`{ permCode?, value: ['添加'] }`）

**核心逻辑**：

```typescript
function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const route = useRoute();
  const authStore = useAuthStore();

  const value = binding.value;

  // 兼容旧格式：字符串 permCode
  if (typeof value === 'string') {
    const hasAccess = checkPermissionInMenu(value, authStore.permissionMenu);
    el.style.display = hasAccess ? '' : 'none';
    return;
  }

  // 新格式：{ permCode?, value: ['添加'] }
  const { permCode, value: permValues } = value;

  const targetPermCode = permCode || authStore.getPermCodeByRoute(route.path);
  if (!targetPermCode) {
    el.style.display = 'none';
    return;
  }

  const userValue = authStore.permissionValueMap[targetPermCode];
  if (!userValue) {
    el.style.display = 'none';
    return;
  }

  const requiredValue = buildPerValue(permValues);
  const hasAccess = (BigInt(userValue) & requiredValue) !== 0n;

  el.style.display = hasAccess ? '' : 'none';
}
```

### 4.4 更新前端 DTO

**文件**：`packages/base-frontend/src/apis/sys/schemas.ts`

**新增字段**：

```typescript
export type UserPermissionsResponseDto = {
  menuTree: PermissionTreeNodeDto[];
  permissions: string[];
  appTypeId: string;
  permissionValueMap: Record<string, string>;
};
```

---

## 五、使用示例

### 5.1 模板中使用指令

```vue
<template>
  <!-- 自动推断 permCode -->
  <el-button v-permission="{ value: ['添加'] }">新建应用</el-button>

  <!-- 显式指定 permCode -->
  <el-button v-permission="{ permCode: 'pc_root:sys:app', value: ['编辑'] }">编辑</el-button>

  <!-- 多个权限（OR 逻辑） -->
  <el-button v-permission="{ value: ['添加', '编辑'] }">添加或编辑</el-button>

  <!-- 兼容旧格式 -->
  <el-button v-permission="'pc_root:sys:app'">查看</el-button>
</template>
```

### 5.2 render 函数中使用（表格操作列）

```typescript
import { usePermission } from '@/hooks/usePermission';

const { hasPermissionValue } = usePermission();

const actionColumn = {
  render: ({ row }) => h('div', { class: 'action-buttons' }, [
    hasPermissionValue({ value: ['添加'] }) && h(ElButton, { onClick: () => handleAdd(row) }, () => '添加'),
    hasPermissionValue({ value: ['编辑'] }) && h(ElButton, { onClick: () => handleEdit(row) }, () => '编辑'),
    hasPermissionValue({ value: ['删除'] }) && h(ElButton, { onClick: () => handleDelete(row) }, () => '删除'),
  ].filter(Boolean)),
};
```

### 5.3 组合式函数中使用

```vue
<script setup>
import { usePermission } from '@/hooks/usePermission';

const { hasPermissionValue, hasAnyPermissionValue } = usePermission();

const canAdd = computed(() => hasPermissionValue({ value: ['添加'] }));
const canAddOrEdit = computed(() => hasAnyPermissionValue(['添加', '编辑']));
</script>

<template>
  <el-button v-if="canAdd">新建</el-button>
  <el-button v-if="canAddOrEdit">操作</el-button>
</template>
```

---

## 六、边界情况处理

### 6.1 动态路由参数

**场景**：详情页路由 `/sys/app/:id`，实际访问 `/sys/app/abc-123`

**解决方案**：使用前缀匹配

```typescript
// 当前路由: /sys/app/abc-123
// 权限菜单 routePath: /sys/app
// 前缀匹配成功，返回 pc_root:sys:app
```

### 6.2 权限菜单异步加载

**场景**：组件渲染时权限菜单尚未加载完成

**解决方案**：
- 权限菜单加载前，按钮默认隐藏
- 使用响应式数据，菜单加载后自动更新按钮状态

### 6.3 弹窗/对话框中的按钮

**场景**：弹窗不属于独立路由

**解决方案**：显式指定 `permCode`

```vue
<el-button v-permission="{ permCode: 'pc_root:sys:app', value: ['添加'] }">新建</el-button>
```

### 6.4 公共组件跨页面使用

**场景**：公共组件在多个页面使用

**解决方案**：通过 props 传递 `permCode` 或显式指定

---

## 七、文件改动清单

| 层级 | 文件 | 改动类型 | 说明 |
|------|------|---------|------|
| 后端 | `auth.service.ts` | 修改 | 构建 `permissionValueMap` |
| 后端 | `user-permissions-response.dto.ts` | 修改 | 新增 `permissionValueMap` 字段 |
| 前端 | `auth-store.ts` | 修改 | 新增状态和方法 |
| 前端 | `usePermission.ts` | 新增 | 权限检查 Hook |
| 前端 | `permission.ts` | 修改 | 扩展指令支持新格式 |
| 前端 | `schemas.ts` | 修改 | 更新 DTO 类型定义 |

---

## 八、测试要点

### 8.1 后端测试

- 验证 `permissionValueMap` 返回格式正确
- 验证位运算值转换为字符串格式
- 验证多角色权限合并（OR 运算）

### 8.2 前端测试

- 验证自动推断 `permCode` 功能
- 验证显式指定 `permCode` 功能
- 验证动态路由前缀匹配
- 验证指令和 Hook 功能一致性
- 验证权限菜单异步加载场景

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-04-22 | 初始版本 |