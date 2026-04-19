# 页面包装组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建统一的页面包装组件 `MfwPageWrapper` 和重构列表页面组件 `MfwListPage`，消除代码冗余，统一页面布局。

**Architecture:** 分层架构 - `MfwPageWrapper` 负责页面级布局（面包屑、标题、刷新），`MfwListPage` 负责列表业务（筛选、表格、分页），内部复用 `MfwTableList`。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + SCSS

---

## 文件结构

```
src/components/page/
├── index.ts                    # 修改：导出 page-wrapper 和 list-page
├── page-wrapper/
│   ├── index.tsx               # 创建：MfwPageWrapper 组件
│   ├── types.ts                # 创建：类型定义
│   ├── style.scss              # 创建：样式（使用 ui-ux-pro-max 设计）
│   └── mod.ts                  # 创建：导出模块
├── list-page/
│   ├── index.tsx               # 创建：MfwListPage 组件
│   ├── types.ts                # 创建：类型定义
│   ├── style.scss              # 创建：样式（使用 ui-ux-pro-max 设计）
│   ├── mod.ts                  # 创建：导出模块
│   └── SearchPanel.tsx         # 创建：筛选面板子组件
└── page-scene/                 # 最终删除（迁移完成后）

src/layouts/
├── AdminLayout.vue             # 修改：移除 MainPanel，保留 TabsPanel
├── panels/
│   ├── MainPanel.vue           # 最终删除
│   └── TabsPanel.vue           # 保留

src/views/sys/user/Index.vue    # 修改：使用新组件（示例页面）
```

---

## Task 1: 创建 MfwPageWrapper 类型定义

**Files:**
- Create: `src/components/page/page-wrapper/types.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
/**
 * @fileoverview MfwPageWrapper 类型定义
 */

import type { VNode } from 'vue';

/** 面包屑项 */
export interface BreadcrumbItem {
  /** 路径 */
  path?: string;
  /** 标题 */
  title: string;
  /** 是否可点击 */
  clickable?: boolean;
}

/** MfwPageWrapper Props 接口 */
export interface MfwPageWrapperProps {
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

/** MfwPageWrapper Emits 接口 */
export interface MfwPageWrapperEmits {
  /** 刷新事件 */
  (e: 'refresh'): void;
}

/** MfwPageWrapper Slots 接口 */
export interface MfwPageWrapperSlots {
  /** 页面主要内容 */
  default?: () => VNode[];
  /** 自定义整个头部区域 */
  header?: () => VNode[];
  /** 标题右侧额外内容 */
  'header-extra'?: () => VNode[];
  /** 自定义面包屑 */
  breadcrumb?: () => VNode[];
  /** 面包屑右侧额外内容 */
  'breadcrumb-extra'?: () => VNode[];
  /** 工具栏区域 */
  toolbar?: () => VNode[];
  /** 页面底部区域 */
  footer?: () => VNode[];
}

/** MfwPageWrapper 暴露实例接口 */
export interface MfwPageWrapperInstance {
  /** 刷新页面 */
  refresh: () => void;
  /** 获取当前页面标题 */
  getTitle: () => string;
  /** 获取面包屑数据 */
  getBreadcrumb: () => BreadcrumbItem[];
}
```

- [ ] **Step 2: 创建导出模块文件**

文件: `src/components/page/page-wrapper/mod.ts`

```typescript
/**
 * @fileoverview MfwPageWrapper 导出模块
 */

export { default as MfwPageWrapper } from './index';
export * from './types';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/page/page-wrapper/types.ts src/components/page/page-wrapper/mod.ts
git commit -m "feat(page-wrapper): add type definitions"
```

---

## Task 2: 创建 MfwPageWrapper 样式（使用 ui-ux-pro-max）

**Files:**
- Create: `src/components/page/page-wrapper/style.scss`

- [ ] **Step 1: 使用 ui-ux-pro-max skill 设计样式**

调用 `ui-ux-pro-max` skill，设计页面包装组件的样式：
- 现代简洁风格
- 支持暗色模式
- 响应式布局
- 使用 Element Plus CSS 变量

- [ ] **Step 2: 创建样式文件**

```scss
/**
 * @fileoverview MfwPageWrapper 样式
 */

.mfw-page-wrapper {
  --mfw-page-padding: 16px;
  --mfw-page-bg: var(--el-bg-color);
  --mfw-page-border: var(--el-border-color);
  --mfw-page-title-size: 18px;
  --mfw-page-title-weight: 600;

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--mfw-page-bg);
  overflow: hidden;

  &__header {
    padding: var(--mfw-page-padding);
    padding-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  &__title {
    font-size: var(--mfw-page-title-size);
    font-weight: var(--mfw-page-title-weight);
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  &__header-extra {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__breadcrumb-wrap {
    padding: 0 var(--mfw-page-padding);
    padding-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__breadcrumb {
    flex: 1;
  }

  &__breadcrumb-extra {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__toolbar {
    padding: 0 var(--mfw-page-padding);
    padding-bottom: 12px;
  }

  &__content {
    flex: 1;
    padding: var(--mfw-page-padding);
    overflow: auto;
  }

  &__footer {
    padding: var(--mfw-page-padding);
    padding-top: 0;
  }

  &--bordered {
    border: 1px solid var(--mfw-page-border);
    border-radius: 8px;
    margin: var(--mfw-page-padding);
  }

  &--no-padding {
    .mfw-page-wrapper__content {
      padding: 0;
    }
  }

  @media (max-width: 768px) {
    --mfw-page-padding: 12px;
    --mfw-page-title-size: 16px;

    &__header {
      flex-wrap: wrap;
    }

    &__header-extra {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/page/page-wrapper/style.scss
git commit -m "feat(page-wrapper): add styles with dark mode support"
```

---

## Task 3: 创建 MfwPageWrapper 组件

**Files:**
- Create: `src/components/page/page-wrapper/index.tsx`

- [ ] **Step 1: 创建组件实现**

```tsx
/**
 * @fileoverview MfwPageWrapper 页面包装组件
 * @description 统一的页面布局容器，提供面包屑、标题、刷新等功能
 */

import './style.scss';

import { defineComponent, computed, ref, type PropType } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElBreadcrumb, ElBreadcrumbItem, ElButton, ElIcon, ElSpace } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type {
  MfwPageWrapperProps,
  MfwPageWrapperEmits,
  MfwPageWrapperInstance,
  BreadcrumbItem
} from './types';

export default defineComponent({
  name: 'MfwPageWrapper',

  props: {
    showBreadcrumb: {
      type: Boolean as PropType<MfwPageWrapperProps['showBreadcrumb']>,
      default: true
    },
    showTitle: {
      type: Boolean as PropType<MfwPageWrapperProps['showTitle']>,
      default: true
    },
    showRefresh: {
      type: Boolean as PropType<MfwPageWrapperProps['showRefresh']>,
      default: true
    },
    title: {
      type: String as PropType<MfwPageWrapperProps['title']>
    },
    breadcrumb: {
      type: Array as PropType<MfwPageWrapperProps['breadcrumb']>
    },
    padding: {
      type: [String, Number] as PropType<MfwPageWrapperProps['padding']>,
      default: '16px'
    },
    bordered: {
      type: Boolean as PropType<MfwPageWrapperProps['bordered']>,
      default: false
    },
    background: {
      type: String as PropType<MfwPageWrapperProps['background']>
    }
  },

  emits: {
    refresh: () => true
  },

  setup(props, { emit, expose, slots }) {
    const route = useRoute();
    const router = useRouter();
    const isRefreshing = ref(false);

    const pageTitle = computed(() => {
      if (props.title) return props.title;
      const metaTitle = route.meta?.title;
      if (typeof metaTitle === 'string') return metaTitle;
      return '';
    });

    const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
      if (props.breadcrumb) return props.breadcrumb;

      const items: BreadcrumbItem[] = [];
      const matched = route.matched.filter(r => r.meta?.title);

      if (matched.length > 0) {
        matched.forEach((r, index) => {
          const title = typeof r.meta?.title === 'string' ? r.meta.title : '';
          if (title) {
            items.push({
              path: index < matched.length - 1 ? r.path : undefined,
              title,
              clickable: index < matched.length - 1
            });
          }
        });
      }

      return items;
    });

    const handleBreadcrumbClick = (item: BreadcrumbItem) => {
      if (item.path && item.clickable) {
        router.push(item.path);
      }
    };

    const handleRefresh = async () => {
      if (isRefreshing.value) return;
      isRefreshing.value = true;
      emit('refresh');
      setTimeout(() => {
        isRefreshing.value = false;
      }, 500);
    };

    const contentStyle = computed(() => ({
      padding: typeof props.padding === 'number' ? `${props.padding}px` : props.padding,
      background: props.background
    }));

    expose<MfwPageWrapperInstance>({
      refresh: handleRefresh,
      getTitle: () => pageTitle.value,
      getBreadcrumb: () => breadcrumbItems.value
    });

    return () => (
      <div
        class={[
          'mfw-page-wrapper',
          props.bordered && 'mfw-page-wrapper--bordered',
          props.padding === 0 && 'mfw-page-wrapper--no-padding'
        ]}
      >
        {slots.header ? (
          <div class="mfw-page-wrapper__header">
            {slots.header()}
          </div>
        ) : (
          props.showTitle && pageTitle.value && (
            <div class="mfw-page-wrapper__header">
              <div class="mfw-page-wrapper__title-wrap">
                <h1 class="mfw-page-wrapper__title">{pageTitle.value}</h1>
                {props.showRefresh && (
                  <ElButton
                    link
                    type="primary"
                    loading={isRefreshing.value}
                    onClick={handleRefresh}
                  >
                    <ElIcon><Refresh /></ElIcon>
                    刷新
                  </ElButton>
                )}
              </div>
              {slots['header-extra']?.()}
            </div>
          )
        )}

        {slots.breadcrumb ? (
          <div class="mfw-page-wrapper__breadcrumb-wrap">
            {slots.breadcrumb()}
          </div>
        ) : (
          props.showBreadcrumb && breadcrumbItems.value.length > 0 && (
            <div class="mfw-page-wrapper__breadcrumb-wrap">
              <ElBreadcrumb class="mfw-page-wrapper__breadcrumb" separator="/">
                {breadcrumbItems.value.map((item, index) => (
                  <ElBreadcrumbItem
                    key={index}
                    to={item.path && item.clickable ? { path: item.path } : undefined}
                  >
                    {item.title}
                  </ElBreadcrumbItem>
                ))}
              </ElBreadcrumb>
              {slots['breadcrumb-extra']?.()}
            </div>
          )
        )}

        {slots.toolbar?.() && (
          <div class="mfw-page-wrapper__toolbar">
            {slots.toolbar()}
          </div>
        )}

        <div class="mfw-page-wrapper__content" style={contentStyle.value}>
          {slots.default?.()}
        </div>

        {slots.footer?.() && (
          <div class="mfw-page-wrapper__footer">
            {slots.footer()}
          </div>
        )}
      </div>
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/page-wrapper/index.tsx
git commit -m "feat(page-wrapper): implement MfwPageWrapper component"
```

---

## Task 4: 创建 MfwListPage 类型定义

**Files:**
- Create: `src/components/page/list-page/types.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
/**
 * @fileoverview MfwListPage 类型定义
 */

import type { VNode } from 'vue';
import type { TableColumnConfig, ActionColumnConfig } from '../../table/table-list/types';

/** 搜索表单项类型 */
export type SearchItemType = 'input' | 'select' | 'date-picker' | 'date-range' | 'tree-select' | 'radio-group' | 'checkbox-group';

/** 搜索表单项配置 */
export interface SearchTemplateItem {
  /** 字段名 */
  key: string;
  /** 标签文本 */
  label: string;
  /** 表单项类型 */
  type: SearchItemType;
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

/** 加载参数 */
export interface LoadParams {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 搜索参数 */
  [key: string]: any;
}

/** 表格数据响应 */
export interface TableData {
  /** 数据列表 */
  list: any[];
  /** 总数 */
  total: number;
}

/** 排序信息 */
export interface SortInfo {
  prop: string;
  order: 'ascending' | 'descending' | null;
}

/** MfwListPage Props 接口 */
export interface MfwListPageProps {
  /** 搜索表单模板 */
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

/** MfwListPage Emits 接口 */
export interface MfwListPageEmits {
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

/** MfwListPage Slots 接口 */
export interface MfwListPageSlots {
  /** 表格底部额外内容 */
  default?: () => VNode[];
  /** 筛选面板按钮区 */
  'search-actions'?: (props: { loading: boolean }) => VNode[];
  /** 筛选面板底部 */
  'search-extra'?: () => VNode[];
  /** 自定义表格头部 */
  'table-header'?: () => VNode[];
  /** 表格底部额外内容 */
  'table-footer'?: () => VNode[];
  /** 自定义空数据展示 */
  empty?: () => VNode[];
  /** 自定义操作列 */
  'action-column'?: (props: { row: any; $index: number }) => VNode[];
}

/** MfwListPage 暴露实例接口 */
export interface MfwListPageInstance {
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

/** 分页配置 */
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  total: number;
  pageSizeOptions: number[];
}

/** 表格状态 */
export interface TableState {
  loading: boolean;
  data: any[];
  sortProp: string | null;
  sortOrder: 'ascending' | 'descending' | null;
  selection: any[];
}
```

- [ ] **Step 2: 创建导出模块文件**

文件: `src/components/page/list-page/mod.ts`

```typescript
/**
 * @fileoverview MfwListPage 导出模块
 */

export { default as MfwListPage } from './index';
export * from './types';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/page/list-page/types.ts src/components/page/list-page/mod.ts
git commit -m "feat(list-page): add type definitions"
```

---

## Task 5: 创建 MfwListPage 样式（使用 ui-ux-pro-max）

**Files:**
- Create: `src/components/page/list-page/style.scss`

- [ ] **Step 1: 使用 ui-ux-pro-max skill 设计样式**

调用 `ui-ux-pro-max` skill，设计列表页面组件的样式：
- 筛选面板：默认一行，展开按钮在右侧
- 表格区域：简洁现代风格
- 分页区域：右对齐
- 支持暗色模式

- [ ] **Step 2: 创建样式文件**

```scss
/**
 * @fileoverview MfwListPage 样式
 */

.mfw-list-page {
  --mfw-list-gap: 16px;
  --mfw-search-padding: 16px;
  --mfw-search-bg: var(--el-bg-color);
  --mfw-search-border: var(--el-border-color);
  --mfw-search-radius: 8px;
  --mfw-search-item-width: 240px;
  --mfw-search-row-height: 40px;

  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--mfw-list-gap);

  &__search {
    padding: var(--mfw-search-padding);
    background: var(--mfw-search-bg);
    border: 1px solid var(--mfw-search-border);
    border-radius: var(--mfw-search-radius);

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    &-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }

    &-form {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;

      .el-form-item {
        margin-bottom: 0;
        width: var(--mfw-search-item-width);
      }

      .el-input,
      .el-select,
      .el-date-editor {
        width: 100%;
      }
    }

    &-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: auto;
      flex-shrink: 0;
    }

    &-extra {
      margin-top: 12px;
    }

    &--collapsed {
      .mfw-list-page__search-form {
        max-height: calc(var(--mfw-search-row-height) + 8px);
        overflow: hidden;
      }
    }
  }

  &__expand-btn {
    color: var(--el-color-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  &__table {
    flex: 1;
    background: var(--el-bg-color);
    border-radius: var(--mfw-search-radius);
    overflow: hidden;

    .el-table {
      height: 100%;
    }
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding: 12px 0;
  }

  @media (max-width: 768px) {
    --mfw-search-padding: 12px;
    --mfw-search-item-width: 100%;

    &__search-form {
      .el-form-item {
        width: 100%;
      }
    }

    &__search-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 12px;
      margin-left: 0;
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/page/list-page/style.scss
git commit -m "feat(list-page): add styles with expand/collapse support"
```

---

## Task 6: 创建 SearchPanel 子组件

**Files:**
- Create: `src/components/page/list-page/SearchPanel.tsx`

- [ ] **Step 1: 创建筛选面板组件**

```tsx
/**
 * @fileoverview SearchPanel 筛选面板组件
 */

import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElTreeSelect,
  ElRadioGroup,
  ElRadio,
  ElCheckboxGroup,
  ElCheckbox,
  ElButton,
  ElIcon,
  type FormInstance
} from 'element-plus';
import { Search, RefreshLeft, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import type { SearchTemplateItem } from './types';

export default defineComponent({
  name: 'SearchPanel',

  props: {
    template: {
      type: Array as PropType<SearchTemplateItem[]>,
      default: () => []
    },
    modelValue: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    },
    searchTrigger: {
      type: String as PropType<'change' | 'submit'>,
      default: 'change'
    },
    collapsed: {
      type: Boolean,
      default: true
    },
    maxVisibleItems: {
      type: Number,
      default: 3
    }
  },

  emits: {
    'update:modelValue': (value: Record<string, any>) => true,
    'update:collapsed': (value: boolean) => true,
    search: () => true,
    reset: () => true,
    change: (key: string, value: any) => true
  },

  setup(props, { emit, expose, slots }) {
    const formRef = ref<FormInstance>();
    const isCollapsed = ref(props.collapsed);
    const searchForm = ref<Record<string, any>>({ ...props.modelValue });

    const visibleItems = computed(() => {
      if (!isCollapsed.value) return props.template;
      return props.template.slice(0, props.maxVisibleItems);
    });

    const hasMoreItems = computed(() => props.template.length > props.maxVisibleItems);

    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value;
      emit('update:collapsed', isCollapsed.value);
    };

    const updateFormValue = (key: string, value: any) => {
      searchForm.value[key] = value;
      emit('update:modelValue', { ...searchForm.value });
      emit('change', key, value);

      if (props.searchTrigger === 'change') {
        emit('search');
      }
    };

    const handleSearch = () => {
      emit('search');
    };

    const handleReset = () => {
      formRef.value?.resetFields();
      props.template.forEach((item) => {
        if (item.defaultValue !== undefined) {
          searchForm.value[item.key] = item.defaultValue;
        } else if (item.type === 'checkbox-group') {
          searchForm.value[item.key] = [];
        } else {
          searchForm.value[item.key] = undefined;
        }
      });
      emit('update:modelValue', { ...searchForm.value });
      emit('reset');
    };

    const renderFormItem = (item: SearchTemplateItem) => {
      const placeholder = item.placeholder || `请输入${item.label}`;
      const disabled = props.loading;

      switch (item.type) {
        case 'input':
          return (
            <ElInput
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              placeholder={placeholder}
              disabled={disabled}
              clearable
              onKeyup={(e: KeyboardEvent) => e.key === 'Enter' && handleSearch()}
            />
          );

        case 'select':
          return (
            <ElSelect
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              placeholder={item.placeholder || `请选择${item.label}`}
              disabled={disabled}
              clearable
              {...item.elProps}
            >
              {(item.elProps?.options || []).map((opt: any) => (
                <ElOption key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </ElSelect>
          );

        case 'date-picker':
          return (
            <ElDatePicker
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              type="date"
              placeholder={item.placeholder || '选择日期'}
              disabled={disabled}
              valueFormat="YYYY-MM-DD"
              {...item.elProps}
            />
          );

        case 'date-range':
          return (
            <ElDatePicker
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              type="daterange"
              startPlaceholder={item.placeholder?.split('/')[0] || '开始日期'}
              endPlaceholder={item.placeholder?.split('/')[1] || '结束日期'}
              disabled={disabled}
              valueFormat="YYYY-MM-DD"
              {...item.elProps}
            />
          );

        case 'tree-select':
          return (
            <ElTreeSelect
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              placeholder={item.placeholder || `请选择${item.label}`}
              disabled={disabled}
              clearable
              {...item.elProps}
            />
          );

        case 'radio-group':
          return (
            <ElRadioGroup
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              disabled={disabled}
              {...item.elProps}
            >
              {(item.elProps?.options || []).map((opt: any) => (
                <ElRadio key={opt.value} label={opt.value}>{opt.label}</ElRadio>
              ))}
            </ElRadioGroup>
          );

        case 'checkbox-group':
          return (
            <ElCheckboxGroup
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              disabled={disabled}
              {...item.elProps}
            >
              {(item.elProps?.options || []).map((opt: any) => (
                <ElCheckbox key={opt.value} label={opt.value}>{opt.label}</ElCheckbox>
              ))}
            </ElCheckboxGroup>
          );

        default:
          return (
            <ElInput
              modelValue={searchForm.value[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              placeholder={placeholder}
              disabled={disabled}
            />
          );
      }
    };

    watch(
      () => props.modelValue,
      (val) => {
        searchForm.value = { ...val };
      },
      { deep: true }
    );

    expose({
      reset: handleReset,
      getFormValues: () => ({ ...searchForm.value })
    });

    return () => (
      <div class={['mfw-list-page__search', isCollapsed.value && 'mfw-list-page__search--collapsed']}>
        <ElForm ref={formRef} model={searchForm.value} class="mfw-list-page__search-form" inline>
          {visibleItems.value.map((item) => (
            <ElFormItem key={item.key} label={item.label} prop={item.key} required={item.required}>
              {renderFormItem(item)}
            </ElFormItem>
          ))}
        </ElForm>

        <div class="mfw-list-page__search-actions">
          {slots['search-actions']?.({ loading: props.loading })}
          {hasMoreItems.value && (
            <span class="mfw-list-page__expand-btn" onClick={toggleCollapse}>
              <ElIcon>{isCollapsed.value ? <ArrowDown /> : <ArrowUp />}</ElIcon>
              {isCollapsed.value ? '展开' : '收起'}
            </span>
          )}
          <ElButton type="primary" icon={Search} loading={props.loading} onClick={handleSearch}>
            查询
          </ElButton>
          <ElButton icon={RefreshLeft} disabled={props.loading} onClick={handleReset}>
            重置
          </ElButton>
        </div>

        {slots['search-extra']?.()}
      </div>
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/list-page/SearchPanel.tsx
git commit -m "feat(list-page): add SearchPanel component with expand/collapse"
```

---

## Task 7: 创建 MfwListPage 组件

**Files:**
- Create: `src/components/page/list-page/index.tsx`

- [ ] **Step 1: 创建组件实现**

```tsx
/**
 * @fileoverview MfwListPage 列表页面组件
 * @description 集成筛选面板、表格、分页的列表页面组件
 */

import './style.scss';

import { defineComponent, ref, computed, watch, onMounted, type PropType } from 'vue';
import { ElPagination, ElEmpty } from 'element-plus';
import MfwTableList from '../../table/table-list';
import SearchPanel from './SearchPanel';
import type {
  MfwListPageProps,
  MfwListPageEmits,
  MfwListPageInstance,
  SearchTemplateItem,
  PaginationConfig,
  TableState,
  LoadParams,
  TableData
} from './types';

export default defineComponent({
  name: 'MfwListPage',

  props: {
    searchTemplate: {
      type: Array as PropType<SearchTemplateItem[]>,
      default: () => []
    },
    columns: {
      type: Array as PropType<MfwListPageProps['columns']>,
      default: () => []
    },
    actionColumn: {
      type: Object as PropType<MfwListPageProps['actionColumn']>
    },
    loadData: {
      type: Function as PropType<MfwListPageProps['loadData']>
    },
    searchTrigger: {
      type: String as PropType<MfwListPageProps['searchTrigger']>,
      default: 'change'
    },
    showSearch: {
      type: Boolean as PropType<MfwListPageProps['showSearch']>,
      default: true
    },
    showPagination: {
      type: Boolean as PropType<MfwListPageProps['showPagination']>,
      default: true
    },
    pageSize: {
      type: Number as PropType<MfwListPageProps['pageSize']>,
      default: 20
    },
    pageSizeOptions: {
      type: Array as PropType<MfwListPageProps['pageSizeOptions']>,
      default: () => [10, 20, 50, 100]
    },
    border: {
      type: Boolean as PropType<MfwListPageProps['border']>,
      default: true
    },
    stripe: {
      type: Boolean as PropType<MfwListPageProps['stripe']>,
      default: false
    },
    rowSelection: {
      type: Boolean as PropType<MfwListPageProps['rowSelection']>,
      default: false
    },
    showIndex: {
      type: Boolean as PropType<MfwListPageProps['showIndex']>,
      default: false
    },
    rowKey: {
      type: String as PropType<MfwListPageProps['rowKey']>,
      default: 'id'
    },
    emptyText: {
      type: String as PropType<MfwListPageProps['emptyText']>,
      default: '暂无数据'
    },
    tableHeight: {
      type: [String, Number] as PropType<MfwListPageProps['tableHeight']>,
      default: 'auto'
    },
    elProps: {
      type: Object as PropType<MfwListPageProps['elProps']>,
      default: () => ({})
    }
  },

  emits: {
    search: (formData: Record<string, any>) => true,
    reset: () => true,
    'selection-change': (selection: any[]) => true,
    'page-change': (page: number, pageSize: number) => true,
    'sort-change': (info: { prop: string; order: 'ascending' | 'descending' | null }) => true
  },

  setup(props, { emit, expose, slots }) {
    const searchPanelRef = ref<any>();
    const tableRef = ref<any>();

    const searchForm = ref<Record<string, any>>({});
    const pagination = ref<PaginationConfig>({
      currentPage: 1,
      pageSize: props.pageSize,
      total: 0,
      pageSizeOptions: props.pageSizeOptions
    });

    const tableState = ref<TableState>({
      loading: false,
      data: [],
      sortProp: null,
      sortOrder: null,
      selection: []
    });

    const loading = computed(() => tableState.value.loading);
    const tableData = computed(() => tableState.value.data);

    const initSearchForm = () => {
      searchForm.value = {};
      props.searchTemplate.forEach((item) => {
        if (item.defaultValue !== undefined) {
          searchForm.value[item.key] = item.defaultValue;
        } else if (item.type === 'checkbox-group') {
          searchForm.value[item.key] = [];
        } else {
          searchForm.value[item.key] = undefined;
        }
      });
    };

    const loadTableData = async () => {
      if (!props.loadData) return;

      tableState.value.loading = true;
      try {
        const params: LoadParams = {
          ...searchForm.value,
          page: pagination.value.currentPage,
          pageSize: pagination.value.pageSize,
          sortProp: tableState.value.sortProp,
          sortOrder: tableState.value.sortOrder
        };

        const result: TableData = await props.loadData(params);
        tableState.value.data = result.list || [];
        pagination.value.total = result.total || 0;
      } catch (error) {
        console.error('加载数据失败:', error);
        tableState.value.data = [];
        pagination.value.total = 0;
      } finally {
        tableState.value.loading = false;
      }
    };

    const handleSearch = () => {
      pagination.value.currentPage = 1;
      emit('search', { ...searchForm.value });
      loadTableData();
    };

    const handleReset = () => {
      initSearchForm();
      pagination.value.currentPage = 1;
      emit('reset');
      loadTableData();
    };

    const handleSearchChange = (key: string, value: any) => {
      emit('search', { ...searchForm.value });
    };

    const handlePageChange = (page: number) => {
      pagination.value.currentPage = page;
      emit('page-change', page, pagination.value.pageSize);
      loadTableData();
    };

    const handleSizeChange = (size: number) => {
      pagination.value.pageSize = size;
      pagination.value.currentPage = 1;
      emit('page-change', 1, size);
      loadTableData();
    };

    const handleSelectionChange = (selection: any[]) => {
      tableState.value.selection = selection;
      emit('selection-change', selection);
    };

    const handleSortChange = ({ prop, order }: any) => {
      tableState.value.sortProp = prop;
      tableState.value.sortOrder = order;
      emit('sort-change', { prop, order });
      loadTableData();
    };

    expose<MfwListPageInstance>({
      refresh: async () => {
        await loadTableData();
      },
      resetSearch: () => {
        handleReset();
      },
      getSelection: () => tableState.value.selection,
      clearSelection: () => {
        tableRef.value?.clearSelection();
        tableState.value.selection = [];
      },
      setLoading: (loading: boolean) => {
        tableState.value.loading = loading;
      },
      getSearchParams: () => ({ ...searchForm.value })
    });

    onMounted(() => {
      initSearchForm();
      if (props.loadData) {
        loadTableData();
      }
    });

    watch(
      () => props.pageSize,
      (newVal) => {
        pagination.value.pageSize = newVal;
      }
    );

    return () => (
      <div class="mfw-list-page">
        {props.showSearch && props.searchTemplate.length > 0 && (
          <SearchPanel
            ref={searchPanelRef}
            template={props.searchTemplate}
            modelValue={searchForm.value}
            loading={loading.value}
            searchTrigger={props.searchTrigger}
            onUpdate:modelValue={(val: any) => { searchForm.value = val; }}
            onSearch={handleSearch}
            onReset={handleReset}
            onChange={handleSearchChange}
          >
            {slots['search-actions'] && (
              <template #search-actions={searchSlotProps}>
                {slots['search-actions']?.(searchSlotProps)}
              </template>
            )}
            {slots['search-extra'] && (
              <template #search-extra>
                {slots['search-extra']?.()}
              </template>
            )}
          </SearchPanel>
        )}

        <div class="mfw-list-page__table">
          {slots['table-header']?.()}
          <MfwTableList
            ref={tableRef}
            data={tableData.value}
            columns={props.columns}
            loading={loading.value}
            border={props.border}
            stripe={props.stripe}
            selection={props.rowSelection}
            index={props.showIndex}
            actionColumn={props.actionColumn}
            elProps={{
              ...props.elProps,
              rowKey: props.rowKey,
              height: props.tableHeight === 'auto' ? undefined : props.tableHeight,
              emptyText: props.emptyText
            }}
            onSelection-change={handleSelectionChange}
            onSort-change={handleSortChange}
          >
            {slots['action-column'] && (
              <template #default={tableSlotProps}>
                {slots['action-column']?.(tableSlotProps)}
              </template>
            )}
            {slots.empty && (
              <template #empty>
                {slots.empty?.()}
              </template>
            )}
          </MfwTableList>
          {slots['table-footer']?.()}
        </div>

        {props.showPagination && pagination.value.total > 0 && (
          <div class="mfw-list-page__pagination">
            <ElPagination
              currentPage={pagination.value.currentPage}
              pageSize={pagination.value.pageSize}
              pageSizes={pagination.value.pageSizeOptions}
              total={pagination.value.total}
              layout="total, sizes, prev, pager, next, jumper"
              onCurrent-change={handlePageChange}
              onSize-change={handleSizeChange}
            />
          </div>
        )}

        {slots.default?.()}
      </div>
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/list-page/index.tsx
git commit -m "feat(list-page): implement MfwListPage component using MfwTableList"
```

---

## Task 8: 更新 page 组件导出

**Files:**
- Modify: `src/components/page/index.ts`

- [ ] **Step 1: 更新导出文件**

```typescript
/**
 * @fileoverview 页面类组件导出
 */

export * from './page-wrapper/mod';
export * from './list-page/mod';

// 向后兼容：MfwPageScene 指向 MfwListPage
export { MfwListPage as MfwPageScene } from './list-page/mod';
export * from './list-page/types';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/index.ts
git commit -m "feat(page): export MfwPageWrapper and MfwListPage, backward compat for MfwPageScene"
```

---

## Task 9: 修改 AdminLayout.vue

**Files:**
- Modify: `src/layouts/AdminLayout.vue`

- [ ] **Step 1: 移除 MainPanel 引用，保留 TabsPanel**

修改 `AdminLayout.vue`，将 `MainPanel` 替换为直接渲染 `TabsPanel` 和 `router-view`：

```vue
<template>
  <div class="mfw-admin-shell" :style="shellVars" :class="shellClasses">
    <HeaderPanel ... />

    <div class="mfw-admin-main">
      <AsidePanel ... />

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

    <SettingsPanel ... />
  </div>
</template>

<script setup lang="ts">
// 移除 MainPanel 导入
import AsidePanel from './panels/AsidePanel.vue';
import HeaderPanel from './panels/HeaderPanel.vue';
import TabsPanel from './panels/TabsPanel.vue';
import SettingsPanel from './panels/SettingsPanel.vue';
import { useAdminLayout } from './composables/use-admin-layout';
// ... 其他代码保持不变
</script>

<style scoped lang="scss">
.mfw-admin-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color-page);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/AdminLayout.vue
git commit -m "refactor(layout): remove MainPanel, keep TabsPanel as standalone"
```

---

## Task 10: 更新示例页面（用户管理）

**Files:**
- Modify: `src/views/sys/user/Index.vue`

- [ ] **Step 1: 更新页面使用新组件**

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
          <el-icon><Plus /></el-icon>
          新建用户
        </el-button>
      </template>
    </MfwListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { ElMessage, ElMessageBox, ElTag, ElButton, ElSwitch } from 'element-plus';
import { Plus, Edit, Delete, Lock } from '@element-plus/icons-vue';
import MfwPageWrapper from '../../../components/page/page-wrapper';
import MfwListPage from '../../../components/page/list-page';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
// ... 其他代码保持不变
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/sys/user/Index.vue
git commit -m "refactor(user): use MfwPageWrapper and MfwListPage"
```

---

## Task 11: 更新其他业务页面

**Files:**
- Modify: `src/views/sys/role/Index.vue`
- Modify: `src/views/sys/member/Index.vue`
- Modify: `src/views/sys/app/Index.vue`
- Modify: `src/views/sys/app-type/Index.vue`
- Modify: `src/views/sys/audit-log/Index.vue`

- [ ] **Step 1: 批量更新页面**

对每个页面执行相同的更新：
1. 导入 `MfwPageWrapper` 和 `MfwListPage`
2. 用 `MfwPageWrapper` 包裹页面
3. 将 `MfwPageScene` 替换为 `MfwListPage`
4. 更新类型导入

- [ ] **Step 2: Commit**

```bash
git add src/views/sys/
git commit -m "refactor(sys): update all pages to use MfwPageWrapper and MfwListPage"
```

---

## Task 12: 删除旧组件

**Files:**
- Delete: `src/layouts/panels/MainPanel.vue`
- Delete: `src/components/page/page-scene/` (整个目录)

- [ ] **Step 1: 删除 MainPanel.vue**

```bash
git rm src/layouts/panels/MainPanel.vue
```

- [ ] **Step 2: 删除 page-scene 目录**

```bash
git rm -r src/components/page/page-scene/
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: remove deprecated MainPanel and page-scene components"
```

---

## Task 13: 运行类型检查和测试

- [ ] **Step 1: 运行类型检查**

```bash
pnpm run typecheck:vue
```

Expected: 无类型错误

- [ ] **Step 2: 运行单元测试**

```bash
pnpm run test:unit
```

Expected: 所有测试通过

- [ ] **Step 3: 运行构建**

```bash
pnpm run build
```

Expected: 构建成功

---

## Task 14: 最终提交和验证

- [ ] **Step 1: 检查 git 状态**

```bash
git status
```

Expected: 所有变更已提交

- [ ] **Step 2: 推送到远程**

```bash
git push origin docs/layered-architecture
```

---

## 注意事项

1. **样式设计**：Task 2 和 Task 5 需要调用 `ui-ux-pro-max` skill 进行样式设计，确保风格统一、支持暗色模式、响应式布局。

2. **向后兼容**：`MfwPageScene` 通过导出别名指向 `MfwListPage`，现有代码可逐步迁移。

3. **测试覆盖**：建议后续添加单元测试，覆盖筛选面板展开/收起、筛选触发模式等关键功能。

4. **迁移顺序**：建议先完成组件创建，再逐个迁移业务页面，最后删除旧组件。