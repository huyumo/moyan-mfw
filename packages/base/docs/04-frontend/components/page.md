# 组件 · 页面（page）

## `MfwPageWrapper` — 页面容器

提供面包屑、标题、工具栏、刷新等页面骨架：

```vue
<MfwPageWrapper title="订单管理" :show-breadcrumb="false">
  <template #toolbar>
    <el-button type="primary" @click="onAdd">新增订单</el-button>
  </template>
  <MfwListPage ... />
</MfwPageWrapper>
```

| Prop | 类型 | 说明 |
|------|------|------|
| `showBreadcrumb` / `showTitle` | `boolean` | 是否显示面包屑 / 标题（默认 true） |
| `headerMode` | `'breadcrumb' / 'title'` | 头部模式 |
| `showRefresh` | `boolean` | 刷新按钮 |
| `title` / `breadcrumb` | `string` / `BreadcrumbItem[]` | 覆盖自动生成 |
| `padding` / `bordered` / `background` | — | 内容区样式 |

插槽：`default` / `header` / `header-extra` / `breadcrumb` / `breadcrumb-extra` / `toolbar` / `footer`。

## `MfwListPage` — 标准列表页（搜索 + 表格 + 分页）

```vue
<MfwListPage
  ref="listRef"
  :search-template="searchTemplate"
  :columns="columns"
  :action-column="actionColumn"
  :load-data="loadData"
  :page-size="20"
/>
```

```typescript
import { MfwListPage, type SearchTemplateItem, type TableData, type LoadParams } from 'moyan-mfw-base/frontend';

const searchTemplate: SearchTemplateItem[] = [
  { key: 'keyword', label: '关键词', type: 'input', placeholder: '名称/编码' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    elProps: { options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
    immediate: true,   // change 模式下立即触发搜索
  },
  { key: 'createdAt', label: '创建时间', type: 'date-range' },
];

async function loadData(params: LoadParams): Promise<TableData> {
  const res = await new ApiOrderList({ query: params });
  return { list: res.data.list, total: res.data.total };
}

// 自定义筛选项（render 函数）
const customItem: SearchTemplateItem = {
  key: 'custom',
  label: '自定义',
  type: 'custom',
  render: ({ value, setValue, formData }) =>
    h(ElSelect, { modelValue: value, 'onUpdate:modelValue': setValue }, /* options */),
};
```

### 搜索表单项 `SearchTemplateItem`

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` / `label` | `string` | 字段 / 标签 |
| `type` | `'input' 'select' 'date-picker' 'date-range' 'tree-select' 'radio-group' 'checkbox-group' 'custom'` | 表单项类型 |
| `elProps` | `Record` | Element Plus 组件属性 |
| `defaultValue` / `placeholder` / `required` | — | 默认值 / 占位 / 必填 |
| `immediate` | `boolean` | change 模式立即搜索 |
| `render` | `({ value, setValue, formData, item }) => VNode` | 自定义渲染 |
| `slot` | `string` | 自定义插槽名（默认 `search-item-${key}`） |
| `component` | `Component` | 自定义组件（v-model 协议） |
| `testId` / `labelWidth` / `componentWidth` | — | 布局与测试 |### MfwListPage Props / Emits / 实例

| 类型 | 内容 |
|------|------|
| Props | `searchTemplate` / `columns` / `formatters` / `actionColumn` / `loadData` / `searchTrigger`（change/submit）/ `showSearch` / `showPagination` / `pageSize` / `pageSizeOptions` / `border` / `stripe` / `rowSelection` / `showIndex` / `rowKey` / `emptyText` / `tableHeight` / `elProps` |
| Emits | `search` / `reset` / `selection-change` / `page-change` / `sort-change` |
| 实例 | `refresh()` / `resetSearch()` / `getSelection()` / `clearSelection()` / `setLoading()` / `getSearchParams()` |
| 插槽 | `default` / `search-actions` / `search-extra` / `table-header` / `table-footer` / `empty` / `action-column` |

## `MfwCardListPage` — 卡片列表页

与 `MfwListPage` 同构（同样的 searchTemplate / loadData），但以卡片栅格渲染数据：

```vue
<MfwCardListPage
  :search-template="searchTemplate"
  :load-data="loadData"
  :card-render="cardRender"
  :card-grid="{ minWidth: 280, gap: 16 }"
>
  <template #card-item="{ item, index }">
    <el-card>{{ item.companyName }}</el-card>
  </template>
</MfwCardListPage>
```

| Prop | 类型 | 说明 |
|------|------|------|
| `renderMode` | `'table' / 'card'` | 渲染模式 |
| `cardRender` | `(item, index) => VNode` | 卡片渲染函数 |
| `cardGrid` | `{ minWidth, gap }` | 栅格配置 |
| 其余 | 同 MfwListPage | — |

## `MfwSearchPanel` — 独立搜索面板

```vue
<MfwSearchPanel
  ref="searchRef"
  :search-template="searchTemplate"
  search-trigger="submit"
  @search="onSearch"
  @reset="onReset"
/>
```

实例方法：`reset()` / `getFormValues()` / `setFormValues(values)` / `doSearch()`。

## `MfwBaseListPage` — 无搜索的基础列表页

不带搜索面板的精简列表页（只有表格 + 分页 + 操作列），适合无需筛选的场景。

## 使用规范

1. 列表页首选 `MfwListPage`（搜索 + 表格 + 分页一体）；卡片场景用 `MfwCardListPage`。
2. `loadData` 返回 `{ list, total }`，内部自动处理 loading 与分页参数。
3. 搜索触发默认 `change`（输入即搜），高频/重查询建议 `submit`。
4. 自定义筛选优先 `render` / 插槽，避免魔改组件内部。
5. 旧版 `MfwPageScene` 为 `MfwListPage` 的兼容别名，新代码直接使用 `MfwListPage`。
