# 页面组件优化设计文档

## 概述

本设计文档描述了页面组件的优化方案，旨在解决以下问题：

1. SearchPanel 需要作为独立组件复用（支持卡片列表页面）
2. 搜索面板按钮需要右对齐
3. 页面标题与面包屑重复显示，需要互斥控制
4. 刷新按钮位置需要优化（右对齐，按钮形式）

## 设计目标

- SearchPanel 独立化：可被 MfwListPage 和 MfwCardListPage 共用
- 搜索面板按钮右对齐：查询/重置按钮放在筛选面板右侧
- 标题/面包屑互斥：通过 headerMode prop 控制
- 刷新按钮优化：右对齐，以按钮形式展示
- 新增卡片列表组件：支持表格和卡片两种渲染模式

## 组件架构

```
src/components/page/
├── page-wrapper/
│   ├── index.tsx           # 修改：headerMode prop，刷新按钮位置
│   ├── types.ts             # 修改：添加 headerMode 类型
│   └── style.scss           # 修改：调整布局样式
├── search-panel/
│   ├── index.tsx            # 新建：独立筛选面板组件
│   ├── types.ts             # 新建：类型定义
│   ├── style.scss           # 新建：样式（按钮右对齐）
│   └── mod.ts               # 新建：导出模块
├── list-page/
│   ├── index.tsx            # 修改：使用 SearchPanel 组件
│   ├── SearchPanel.tsx      # 删除：移至 search-panel 目录
│   ├── SearchPanel.scss     # 删除：移至 search-panel 目录
│   └── ...                  # 其他文件保持
├── card-list-page/
│   ├── index.tsx            # 新建：卡片列表页面组件
│   ├── types.ts             # 新建：类型定义
│   ├── style.scss           # 新建：样式
│   └── mod.ts               # 新建：导出模块
└── index.ts                 # 修改：导出新组件
```

## MfwPageWrapper 修改设计

### 新增 Props

```typescript
interface MfwPageWrapperProps {
  // ... 现有 props 保持不变
  
  /** 头部显示模式 */
  headerMode?: 'breadcrumb' | 'title';
  // - 'breadcrumb': 显示面包屑，不显示标题（默认）
  // - 'title': 显示标题，不显示面包屑
}
```

### 布局调整

**headerMode='breadcrumb'（默认）：**
```
┌─────────────────────────────────────────────────┐
│ 面包屑: 首页 / 用户管理              [刷新按钮] │
├─────────────────────────────────────────────────┤
│ 内容区                                           │
└─────────────────────────────────────────────────┘
```

**headerMode='title'：**
```
┌─────────────────────────────────────────────────┐
│ 页面标题: 用户管理                   [刷新按钮] │
├─────────────────────────────────────────────────┤
│ 内容区                                           │
└─────────────────────────────────────────────────┘
```

### 刷新按钮样式

- 类型：`type="default"`（非 link 类型）
- 位置：头部栏右侧
- 图标：Refresh
- 文本："刷新"

### 样式修改

```scss
.mfw-page-wrapper {
  // ... 现有样式
  
  &__header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--mfw-page-padding);
    padding-bottom: 8px;
  }
  
  &__header-left {
    flex: 1;
    min-width: 0;  // 防止内容溢出
  }
  
  &__header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &__refresh-btn {
    // 独立按钮样式
  }
}
```

## MfwSearchPanel 设计（独立组件）

### 位置

`src/components/page/search-panel/`

### Props 定义

```typescript
interface MfwSearchPanelProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 筛选触发模式 */
  searchTrigger?: 'change' | 'submit';
  /** 最大可见项数（一行显示的项数） */
  maxVisibleItems?: number;
  /** 是否显示筛选面板 */
  showSearch?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 每项占用的栅格数 */
  itemSpan?: number;
  /** 是否显示查询按钮 */
  showSearchButton?: boolean;
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
}
```

### Emits 定义

```typescript
interface MfwSearchPanelEmits {
  /** 搜索事件 */
  (e: 'search', formData: Record<string, any>): void;
  /** 重置事件 */
  (e: 'reset'): void;
  /** 表单变化事件 */
  (e: 'change', key: string, value: any, formData: Record<string, any>): void;
}
```

### Slots 定义

| 插槽名 | 位置 | 用途 |
|--------|------|------|
| `search-actions` | 按钮区左侧 | 自定义操作按钮（如新建） |
| `search-extra` | 面板底部 | 额外内容 |

### 暴露实例

```typescript
interface MfwSearchPanelInstance {
  reset: () => void;
  getFormValues: () => Record<string, any>;
  setFormValues: (values: Record<string, any>) => void;
  doSearch: () => void;
}
```

### 布局设计

```
┌─────────────────────────────────────────────────────────────┐
│ [表单项1] [表单项2] [表单项3]     [自定义按钮] [展开] [查询] [重置] │
└─────────────────────────────────────────────────────────────┘
```

- 表单项：左对齐，使用栅格布局
- 自定义按钮插槽：在按钮组左侧
- 展开/收起按钮：在查询按钮左侧
- 查询/重置按钮：右对齐

### 样式设计

```scss
.search-panel {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  
  &__form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  
  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;  // 右对齐
    gap: 8px;
    margin-left: auto;
    flex-shrink: 0;
  }
  
  &__expand-btn {
    color: var(--el-color-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
```

## MfwListPage 修改设计

### 改动内容

1. 移除内嵌的 SearchPanel 组件（`SearchPanel.tsx`、`SearchPanel.scss`）
2. 导入并使用独立的 `MfwSearchPanel` 组件
3. 保持现有 Props 和 API 兼容

### 修改后的结构

```tsx
// MfwListPage 使用 MfwSearchPanel
<MfwSearchPanel
  ref="searchPanelRef"
  :search-template="searchTemplate"
  :search-trigger="searchTrigger"
  :loading="loading"
  @search="handleSearch"
  @reset="handleReset"
>
  <template #search-actions="{ loading }">
    <slot name="search-actions" :loading="loading" />
  </template>
</MfwSearchPanel>
```

## MfwCardListPage 设计（新建）

### Props 定义

```typescript
interface MfwCardListPageProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 数据加载函数 */
  loadData?: (params: LoadParams) => Promise<TableData>;
  /** 筛选触发模式 */
  searchTrigger?: 'change' | 'submit';
  /** 是否显示筛选面板 */
  showSearch?: boolean;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 每页条数 */
  pageSize?: number;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  
  /** 渲染模式 */
  renderMode?: 'table' | 'card';
  // - 'table': 使用 MfwTableList 渲染（默认）
  // - 'card': 使用卡片布局渲染
  
  /** 卡片渲染函数（renderMode='card' 时使用） */
  cardRender?: (item: any, index: number) => VNode;
  
  /** 卡片栅格配置 */
  cardGrid?: {
    cols?: number;      // 每行卡片数
    gap?: number;       // 卡片间距
  };
  
  /** 空数据提示文本 */
  emptyText?: string;
}
```

### Slots 定义

| 插槽名 | 位置 | 用途 |
|--------|------|------|
| `default` | 底部 | 额外内容 |
| `search-actions` | 筛选按钮区 | 自定义操作按钮 |
| `card-item` | 卡片区域 | 自定义卡片渲染（覆盖 cardRender） |
| `empty` | 空数据 | 自定义空数据展示 |

### Emits 定义

```typescript
interface MfwCardListPageEmits {
  (e: 'search', formData: Record<string, any>): void;
  (e: 'reset'): void;
  (e: 'page-change', page: number, pageSize: number): void;
}
```

### 暴露实例

```typescript
interface MfwCardListPageInstance {
  refresh: () => Promise<void>;
  resetSearch: () => void;
  setLoading: (loading: boolean) => void;
  getSearchParams: () => Record<string, any>;
}
```

### 布局设计

**renderMode='table'：**
```
┌─────────────────────────────────────────┐
│ MfwSearchPanel                           │
├─────────────────────────────────────────┤
│ MfwTableList                             │
├─────────────────────────────────────────┤
│ 分页                                     │
└─────────────────────────────────────────┘
```

**renderMode='card'：**
```
┌─────────────────────────────────────────┐
│ MfwSearchPanel                           │
├─────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │卡片1│ │卡片2│ │卡片3│ │卡片4│       │
│ └─────┐ └─────┐ └─────┐ └─────┐       │
│ │卡片5│ │卡片6│ │卡片7│ │卡片8│       │
│ └─────┘ └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────────────┤
│ 分页                                     │
└─────────────────────────────────────────┘
```

### 样式设计

```scss
.mfw-card-list-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &__cards {
    display: grid;
    grid-template-columns: repeat(var(--card-cols, 4), 1fr);
    gap: var(--card-gap, 16px);
  }
  
  &__card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 16px;
  }
  
  &__pagination {
    display: flex;
    justify-content: flex-end;
  }
}
```

## 使用示例

### MfwPageWrapper 使用

```vue
<!-- 显示面包屑（默认） -->
<MfwPageWrapper>
  <MfwListPage ... />
</MfwPageWrapper>

<!-- 显示标题 -->
<MfwPageWrapper header-mode="title">
  <MfwCardListPage ... />
</MfwPageWrapper>
```

### MfwSearchPanel 独立使用

```vue
<MfwSearchPanel
  :search-template="searchTemplate"
  :loading="loading"
  @search="handleSearch"
>
  <template #search-actions>
    <el-button type="primary">新建</el-button>
  </template>
</MfwSearchPanel>
```

### MfwCardListPage 使用

```vue
<!-- 表格模式 -->
<MfwCardListPage
  :search-template="searchTemplate"
  :load-data="loadData"
  :columns="columns"
/>

<!-- 卡片模式 -->
<MfwCardListPage
  render-mode="card"
  :search-template="searchTemplate"
  :load-data="loadData"
  :card-render="renderCard"
>
  <template #card-item="{ item, index }">
    <div class="custom-card">{{ item.name }}</div>
  </template>
</MfwCardListPage>
```

## 迁移计划

1. 创建 `search-panel` 目录和组件
2. 修改 `MfwPageWrapper` 添加 headerMode
3. 修改 `MfwListPage` 使用独立 SearchPanel
4. 创建 `MfwCardListPage` 组件
5. 更新导出文件
6. 删除 `list-page/SearchPanel.tsx` 和 `SearchPanel.scss`

## 兼容性考虑

- `MfwListPage` 保持现有 API 兼容
- `MfwPageWrapper` 默认行为保持不变（显示面包屑）
- 现有使用 `list-page/SearchPanel` 的代码需要更新导入路径

## 测试要点

1. headerMode 切换正确性
2. 刷新按钮位置和样式
3. SearchPanel 按钮右对齐
4. MfwCardListPage 表格/卡片模式切换
5. 分页功能
6. 筛选触发模式