# 13 · 权限 Hook（usePermission）

提供按钮级权限检查功能。

```typescript
import { usePermission } from 'moyan-mfw-base/frontend'
import type { PermissionCheckOptions } from 'moyan-mfw-base/frontend'
```

---

## `usePermission()`

返回两个权限检查方法和一个过滤方法。

```typescript
const {
  hasPermissionValue,
  hasAnyPermissionValue,
  filterButtons,
} = usePermission()
```

### `hasPermissionValue(options)`

检查是否拥有**所有**指定权限。

```typescript
interface PermissionCheckOptions {
  permCode?: string    // 权限编码，可选，不传则从当前路由自动推断
  value: string[]      // 权限值数组，如 ['添加', '编辑']
}
```

```vue
<script setup>
const { hasPermissionValue } = usePermission()
</script>

<template>
  <el-button v-if="hasPermissionValue({ value: ['添加'] })">新建</el-button>
  <el-button v-if="hasPermissionValue({ value: ['编辑', '删除'] })">批量操作</el-button>
</template>
```

### `hasAnyPermissionValue(values)`

检查是否拥有**任意一个**指定权限（OR 逻辑）。

```typescript
const canEditOrDelete = hasAnyPermissionValue(['编辑', '删除'])
```

### `filterButtons(buttons)`

根据权限过滤按钮数组，返回有权限的按钮子集。
