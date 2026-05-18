# 09 · 表格 / 选择器 / 组合式函数

## 表格类组件

### `MfwTableList`

标准表格组件，封装 ElTable 提供列配置、分页、排序。

```typescript
import { MfwTableList } from 'moyan-mfw-base/frontend'
```

```vue
<MfwTableList
  :data="list"
  :columns="columns"
  :total="total"
  :page="page"
  :page-size="pageSize"
  @page-change="handlePageChange"
  @sort-change="handleSortChange"
/>
```

### `ActionButtons`

表格操作按钮组件，支持按钮配置化和权限控制。

```typescript
import { ActionButtons, renderActionButtons } from 'moyan-mfw-base/frontend'
import type { ActionButtonConfig, ActionButtonsOptions } from 'moyan-mfw-base/frontend'
```

```vue
<ActionButtons
  :row="row"
  :buttons="[
    { label: '编辑', type: 'primary', permission: ['编辑'], onClick: handleEdit },
    { label: '删除', type: 'danger', permission: ['删除'], onClick: handleDelete },
  ]"
/>
```

### `renderActionButtons`

函数式渲染操作按钮（用于 ElTable 的 `el-table-column`）。

```typescript
renderActionButtons(row, buttons, ctx)
```

---

## 选择器组件

```typescript
import {
  MfwUserPicker,    // 用户选择器
  MfwIconPicker,    // 图标选择器
  MfwAppSelector,   // 应用选择器
  MfwRadioGroup,    // 单选按钮组
} from 'moyan-mfw-base/frontend'
```

### `MfwUserPicker`

用户选择器。

```vue
<MfwUserPicker v-model="selectedUsers" :multiple="true" />
```

### `MfwIconPicker`

Element Plus 图标选择器。

```vue
<MfwIconPicker v-model="selectedIcon" />
```

### `MfwAppSelector`

应用实例选择器。

```vue
<MfwAppSelector v-model="selectedAppId" />
```

### `MfwRadioGroup`

单选按钮组。

```vue
<MfwRadioGroup v-model="selected" :options="options" />
```

---

## 组合式函数

```typescript
import { useColorMode, useThemeSwitch } from 'moyan-mfw-base/frontend'
```

### `useColorMode()`

亮/暗模式切换。

```typescript
const { colorMode, setColorMode, toggleColorMode } = useColorMode()

setColorMode('dark')
toggleColorMode()
```

使用 View Transitions API 实现平滑过渡动画。

### `useThemeSwitch()`

主题包切换。提供主题的读取、设置和 CSS 变量注入。

```typescript
const { currentTheme, themes, setTheme } = useThemeSwitch()

const themes = useThemeSwitch().themes  // 可用主题列表
setTheme('ocean')
```
