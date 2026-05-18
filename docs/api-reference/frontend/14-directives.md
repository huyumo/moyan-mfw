# 14 · 权限指令（v-permission）

按钮级权限控制指令，根据权限控制元素的显示/隐藏。

```typescript
import { vPermission, setupPermissionDirective } from 'moyan-mfw-base/frontend'
```

---

## `v-permission`

支持两种绑定格式：

### 格式 1：权限编码（传统）

```vue
<el-button v-permission="'sys:user:create'">新建用户</el-button>
```

检查用户是否有 `sys:user:create` 权限码，无权限则 `display: none`。

### 格式 2：权限值对象（新）

```vue
<!-- 自动推断当前页面的 permCode -->
<el-button v-permission="{ value: ['添加'] }">添加</el-button>

<!-- 指定 permCode -->
<el-button v-permission="{ permCode: 'sys:user', value: ['编辑', '删除'] }">
  操作
</el-button>
```

通过位运算检查用户是否有指定的权限值，无权限则隐藏元素并设置 `data-permission-hidden="true"`。

### 值的类型

```typescript
interface PermissionDirectiveValue {
  permCode?: string
  value: PermissionName[]  // 如 ['添加', '编辑']
}
```

---

## `setupPermissionDirective(app)`

手动注册权限指令到 Vue 应用。

```typescript
import { createApp } from 'vue'
import { setupPermissionDirective } from 'moyan-mfw-base/frontend'

const app = createApp(App)
setupPermissionDirective(app)
```

> 通常无需手动调用，`createBaseAdminApp()` 内部已注册。
