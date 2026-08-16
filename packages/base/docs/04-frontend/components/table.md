# 组件 · 表格（table）

## `MfwTableList` — 配置化表格

```vue
<template>
  <MfwTableList
    :data="rows"
    :columns="columns"
    :loading="loading"
    :action-column="actionColumn"
    stripe
    @selection-change="onSelectionChange"
  />
</template>

<script setup lang="ts">
import { MfwTableList, type TableColumnConfig, type ActionColumnConfig } from 'moyan-mfw-base/frontend';

const columns: TableColumnConfig[] = [
  { prop: 'companyName', label: '公司名称', minWidth: 160 },
  { prop: 'status', label: '状态', formatter: (value) => (value === 1 ? '启用' : '禁用') },
  { prop: 'createdAt', label: '创建时间', formatter: 'dateTime' },   // 内置格式化
  { prop: 'phone', label: '联系电话', cp: true },                   // 点击复制
  {
    prop: 'logo',
    label: 'Logo',
    render: (scope) => h(MfwImageFormat, { value: scope.row.logo, width: 60 }),
  },
];

const actionColumn: ActionColumnConfig = {
  label: '操作',
  width: 160,
  render: (scope) =>
    h(ActionButtons, {
      row: scope.row,
      buttons: [
        { label: '编辑', type: 'primary', onClick: (row) => onEdit(row) },
        {
          label: '删除',
          type: 'danger',
          onClick: (row) => onDelete(row),
          permission: ['删除'],        // 权限控制（可选）
          visible: (row) => row.status === 1,  // 动态可见（可选）
        },
      ],
    }),
};
</script>
```

### `TableColumnConfig`

| 字段 | 类型 | 说明 |
|------|------|------|
| `prop` / `label` | `string` | 字段 / 标签 |
| `width` / `minWidth` | `number / string` | 列宽 |
| `fixed` | `boolean / 'left' / 'right'` | 固定列 |
| `sortable` | `boolean / 'custom'` | 排序 |
| `align` | `'left' / 'center' / 'right'` | 对齐 |
| `render` | `(scope) => VNode / string` | 自定义渲染（优先于 formatter） |
| `formatter` | `string / (value, row) => any` | 命名格式化（内置 `copyable`、`dateTime`）或函数 |
| `cp` | `boolean` | 点击复制文本 |
| `showOverflowTooltip` | `boolean` | 超长 Tooltip |
| `children` | `TableColumnConfig[]` | 子列 |

### Props / Emits / 实例

| 类型 | 内容 |
|------|------|
| Props | `data` / `columns` / `formatters` / `loading` / `border` / `stripe` / `selection` / `index` / `actionColumn` / `elProps` |
| Emits | `selection-change` / `sort-change` |
| 实例 | `clearSelection()` / `toggleAllSelection()` / `setCurrentRow(row)` / `tableData` |

## `ActionButtons` — 操作列按钮组

```typescript
import { ActionButtons, type ActionButtonConfig } from 'moyan-mfw-base/frontend';

const buttons: ActionButtonConfig[] = [
  { label: '编辑', type: 'primary', icon: Edit, onClick: (row) => {} },
  {
    label: '删除',
    type: 'danger',
    onClick: (row) => {},
    permission: ['删除'],                        // 无权限自动隐藏
    disabled: (row) => row.status === 0,          // 动态禁用
    visible: (row) => row.id !== currentId,       // 动态可见
    testId: 'btn-delete',
  },
];

// 超出 maxVisible 个自动折叠到「更多」下拉
<ActionButtons :buttons="buttons" :row="row" :max-visible="3" />
```

## 使用规范

1. 列渲染优先级：`render` > `formatter` > 默认文本。
2. 通用格式化优先用内置命名 formatter（`copyable` / `dateTime`），业务格式化用 `formatters` 注册表。
3. 操作按钮统一用 `ActionButtons`（自带权限/禁用/可见控制与折叠）。
4. 复杂页面直接用 `MfwListPage`（自带搜索/分页/操作列，见 [页面组件](./page.md)）。
