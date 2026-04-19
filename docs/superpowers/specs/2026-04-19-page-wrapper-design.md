# 页面包装组件设计文档

## 概述

本设计文档描述了页面包装组件的重构方案，旨在解决以下问题：

1. `MfwPageScene` 内部直接使用 `ElTable`，未复用 `MfwTableList`，造成代码冗余
2. `MainPanel.vue` 功能分散，与页面包装职责重叠
3. 缺乏统一的页面布局容器

## 设计目标

- 统一布局容器：页面的 padding、网格等
- 统一的页面刷新、导航面包屑、页面名称
- 消除代码冗余：`MfwListPage` 内部复用 `MfwTableList`
- 提供灵活的扩展能力：通过插槽满足定制需求

## 架构设计

### 组件层级关系

```
AdminLayout
├── HeaderPanel
├── AsidePanel
├── TabsPanel（独立保留）
└── <router-view />  →  页面组件
                         └── MfwPageWrapper（页面包装）
                              ├── 面包屑 + 页面标题
                              ├── 刷新按钮
                              └── <slot>（页面内容）
                                   └── MfwListPage（列表页面）
                                        ├── 筛选面板
                                        └── MfwTableList（表格）
```

### 职责划分

| 组件 | 职责 |
|------|------|
| `MfwPageWrapper` | 页面级布局包装：面包屑、标题、刷新按钮、内容区样式 |
| `MfwListPage` | 列表页面业务：筛选面板、表格、分页 |
| `MfwTableList` | 纯表格渲染：列配置、数据展示 |
| `TabsPanel` | 标签栏管理：多标签页切换、关闭 |

## MfwPageWrapper 组件设计

### Props 定义

```typescript
interface MfwPageWrapperProps {
  /** 是否显示面包屑 */
  showBreadcrumb?: boolean;
  /** 是否显示页面标题 */
  showTitle?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 自定义页面标题（覆盖自动生成） */
  title?: string;
  /** 自定义面包屑（覆盖自动生成） */
  breadcrumb?: BreadcrumbItem[];
  /** 内容区 padding */
  padding?: string | number;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 背景色 */
  background?: string;
}

interface BreadcrumbItem {
  /** 路径 */
  path?: string;
  /** 标题 */
  title: string;
  /** 是否可点击 */
  clickable?: boolean;
}
```

### Slots 定义

| 插槽名 | 位置 | 用途 |
|--------|------|------|
| `default` | 内容区 | 页面主要内容 |
| `header` | 标题区域 | 自定义整个头部区域（替换默认） |
| `header-extra` | 标题右侧 | 标题旁的额外操作按钮 |
| `breadcrumb` | 面包屑区域 | 自定义面包屑（替换默认） |
| `breadcrumb-extra` | 面包屑右侧 | 面包屑旁的额外内容 |
| `toolbar` | 内容区上方 | 工具栏区域 |
| `footer` | 内容区下方 | 页面底部区域 |

### Emits 定义

```typescript
interface MfwPageWrapperEmits {
  /** 刷新事件 */
  (e: 'refresh'): void;
}
```

### 暴露实例

```typescript
interface MfwPageWrapperInstance {
  /** 刷新页面（触发 refresh 事件） */
  refresh: () => void;
  /** 获取当前页面标题 */
  getTitle: () => string;
  /** 获取面包屑数据 */
  getBreadcrumb: () => BreadcrumbItem[];
}
```

### 面包屑自动生成逻辑

1. 从当前路由的 `meta.breadcrumb` 获取自定义面包屑配置
2. 若无配置，则从路由匹配链中提取 `meta.title` 生成面包屑
3. 首页固定为第一项，路径为 `homePath` 或 `/dashboard`
4. 当前页面为最后一项，不可点击

### 样式设计

```scss
.mfw-page-wrapper {
  --mfw-page-padding: 16px;
  --mfw-page-bg: var(--el-bg-color);
  --mfw-page-border: var(--el-border-color);

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--mfw-page-bg);

  &__header {
    padding: var(--mfw-page-padding);
    padding-bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__breadcrumb {
    padding: var(--mfw-page-padding);
    padding-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__content {
    flex: 1;
    padding: var(--mfw-page-padding);
    overflow: auto;
  }

  &--bordered {
    border: 1px solid var(--mfw-page-border);
    border-radius: 4px;
  }
}
```

## MfwListPage 组件设计

### Props 定义

```typescript
interface MfwListPageProps {
  /** 筛选表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 表格列配置 */
  columns?: TableColumnConfig[];
  /** 操作列配置 */
  actionColumn?: ActionColumnConfig;
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
  /** 是否显示边框 */
  border?: boolean;
  /** 是否斑马纹 */
  stripe?: boolean;
  /** 是否支持行选择 */
  rowSelection?: boolean;
  /** 是否显示序号列 */
  showIndex?: boolean;
  /** 行键名 */
  rowKey?: string;
  /** 空数据提示文本 */
  emptyText?: string;
  /** 表格高度 */
  tableHeight?: string | number;
  /** Element Plus Table Props */
  elProps?: Record<string, any>;
}

interface LoadParams {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 搜索参数 */
  [key: string]: any;
}

interface TableData {
  /** 数据列表 */
  list: any[];
  /** 总数 */
  total: number;
}
```

### Slots 定义

| 插槽名 | 位置 | 用途 |
|--------|------|------|
| `default` | 表格下方 | 表格底部额外内容 |
| `search-actions` | 筛选面板按钮区 | 筛选面板右侧额外按钮 |
| `search-extra` | 筛选面板底部 | 筛选面板额外内容 |
| `table-header` | 表格头部 | 自定义表格头部 |
| `table-footer` | 表格底部 | 表格底部额外内容 |
| `empty` | 空数据 | 自定义空数据展示 |
| `action-column` | 操作列 | 自定义操作列 |

### Emits 定义

```typescript
interface MfwListPageEmits {
  /** 搜索事件 */
  (e: 'search', formData: Record<string, any>): void;
  /** 重置事件 */
  (e: 'reset'): void;
  /** 选择变化事件 */
  (e: 'selection-change', selection: any[]): void;
  /** 分页变化事件 */
  (e: 'page-change', page: number, pageSize: number): void;
  /** 排序变化事件 */
  (e: 'sort-change', info: SortInfo): void;
}
```

### 暴露实例

```typescript
interface MfwListPageInstance {
  /** 刷新表格 */
  refresh: () => Promise<void>;
  /** 重置搜索条件 */
  resetSearch: () => void;
  /** 获取选中行 */
  getSelection: () => any[];
  /** 清空选中行 */
  clearSelection: () => void;
  /** 设置表格加载状态 */
  setLoading: (loading: boolean) => void;
  /** 获取当前搜索条件 */
  getSearchParams: () => Record<string, any>;
}
```

### 筛选面板设计

#### 默认一行展示

- 筛选表单项默认显示一行（约 3-4 个表单项）
- 每个表单项宽度固定为 240px
- 使用 flex 布局，自动换行

#### 展开按钮

- 当筛选条件超过一行时，右侧按钮区显示"展开"按钮
- 点击展开按钮，显示所有筛选条件
- 展开后按钮变为"收起"

#### 筛选触发模式

- `change` 模式：表单项值变化时自动触发搜索（默认）
- `submit` 模式：点击查询按钮触发搜索

```typescript
interface SearchTemplateItem {
  /** 字段名 */
  key: string;
  /** 标签文本 */
  label: string;
  /** 表单项类型 */
  type: 'input' | 'select' | 'date-picker' | 'date-range' | 'tree-select' | 'radio-group' | 'checkbox-group';
  /** Element Plus 组件属性 */
  elProps?: Record<string, any>;
  /** 默认值 */
  defaultValue?: any;
  /** 占位文本 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否立即触发搜索（change 模式下） */
  immediate?: boolean;
}
```

### 样式设计

```scss
.mfw-list-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__search {
    padding: 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &-form {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .el-form-item {
        margin-bottom: 0;
      }

      .el-input,
      .el-select,
      .el-date-picker {
        width: 240px;
      }
    }

    &-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: auto;
    }

    &--collapsed {
      .mfw-list-page__search-form {
        max-height: 40px;
        overflow: hidden;
      }
    }
  }

  &__table {
    flex: 1;
    background: var(--el-bg-color);
    border-radius: 4px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
  }
}
```

## AdminLayout 变更

### 移除 MainPanel.vue

- 删除 `MainPanel.vue` 文件
- 从 `AdminLayout.vue` 中移除 `MainPanel` 引用

### TabsPanel 保留

- `TabsPanel` 保留在 `AdminLayout` 中
- 位于 `<router-view />` 上方

### 新结构

```vue
<template>
  <div class="mfw-admin-shell">
    <HeaderPanel />
    <div class="mfw-admin-main">
      <AsidePanel />
      <div class="mfw-admin-content-area">
        <TabsPanel
          v-if="layoutStore.styleConfig.showTabs"
          v-model="activeTabPath"
          :visited-tabs="layoutStore.visitedTabs"
          @tab-remove="removeTab"
          @tab-command="handleTabCommand"
        />
        <router-view />
      </div>
    </div>
    <SettingsPanel />
  </div>
</template>
```

### 样式调整

```scss
.mfw-admin-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color-page);
}
```

## 使用示例

### 列表页面

```vue
<template>
  <MfwPageWrapper>
    <MfwListPage
      ref="listPage"
      :search-template="searchTemplate"
      :columns="columns"
      :action-column="actionColumn"
      :load-data="loadData"
      search-trigger="change"
    >
      <template #search-actions="{ loading }">
        <el-button type="primary" :loading="loading" @click="handleAdd">
          新建用户
        </el-button>
      </template>
    </MfwListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MfwPageWrapper from '@/components/page/page-wrapper';
import MfwListPage from '@/components/page/list-page';
import type { MfwListPageInstance } from '@/components/page/list-page/types';

const listPage = ref<MfwListPageInstance>();

const searchTemplate = [
  { key: 'username', label: '用户名', type: 'input' },
  { key: 'status', label: '状态', type: 'select', elProps: { options: [...] } },
];

const columns = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
];

const loadData = async (params) => {
  return await api.getUsers(params);
};

const handleAdd = () => {
  // 新建逻辑
  listPage.value?.refresh();
};
</script>
```

### 非列表页面

```vue
<template>
  <MfwPageWrapper title="用户详情">
    <template #header-extra>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>

    <UserDetailForm ref="form" />
  </MfwPageWrapper>
</template>
```

### 自定义面包屑

```vue
<template>
  <MfwPageWrapper
    :breadcrumb="[
      { path: '/users', title: '用户管理' },
      { title: '用户详情' }
    ]"
  >
    <!-- 内容 -->
  </MfwPageWrapper>
</template>
```

## 文件结构

```
src/components/page/
├── index.ts                    # 导出入口
├── page-wrapper/
│   ├── index.tsx               # MfwPageWrapper 组件
│   ├── types.ts                # 类型定义
│   ├── style.scss              # 样式
│   └── mod.ts                  # 导出模块
├── list-page/
│   ├── index.tsx               # MfwListPage 组件
│   ├── types.ts                # 类型定义
│   ├── style.scss              # 样式
│   ├── mod.ts                  # 导出模块
│   └── SearchPanel.tsx         # 筛选面板子组件
└── page-scene/                 # 待删除（重构为 list-page）
    └── ...

src/layouts/
├── AdminLayout.vue             # 修改：移除 MainPanel
├── panels/
│   ├── MainPanel.vue           # 删除
│   ├── TabsPanel.vue           # 保留
│   └── ...
```

## 迁移计划

1. 创建 `MfwPageWrapper` 组件
2. 创建 `MfwListPage` 组件（重构 `MfwPageScene`）
3. 修改 `AdminLayout.vue`，移除 `MainPanel`
4. 更新现有业务页面，使用新组件
5. 删除 `MainPanel.vue` 和 `page-scene` 目录

## 兼容性考虑

- `MfwPageScene` 保留导出，指向 `MfwListPage`，保持向后兼容
- 现有使用 `MfwPageScene` 的页面可逐步迁移

## 测试要点

1. 面包屑自动生成正确性
2. 筛选面板展开/收起功能
3. 筛选触发模式（change/submit）
4. 分页功能
5. 表格排序、选择功能
6. 插槽扩展能力
7. 刷新按钮功能