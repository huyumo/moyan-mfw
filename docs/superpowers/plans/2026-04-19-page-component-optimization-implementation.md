# 页面组件优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化页面组件架构，实现 SearchPanel 独立化、标题/面包屑互斥、刷新按钮优化、新增卡片列表组件。

**Architecture:** SearchPanel 抽取为独立组件，MfwPageWrapper 添加 headerMode prop，MfwListPage 使用独立 SearchPanel，新增 MfwCardListPage 支持表格/卡片双模式。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + SCSS

---

## 文件结构

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

---

## Task 1: 创建 MfwSearchPanel 类型定义

**Files:**
- Create: `src/components/page/search-panel/types.ts`
- Create: `src/components/page/search-panel/mod.ts`

- [ ] **Step 1: 创建 types.ts 文件**

```typescript
/**
 * @fileoverview MfwSearchPanel 类型定义
 */

import type { VNode } from 'vue';
import type { SearchTemplateItem } from '../list-page/types';

/** MfwSearchPanel Props 接口 */
export interface MfwSearchPanelProps {
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

/** MfwSearchPanel Emits 接口 */
export interface MfwSearchPanelEmits {
  /** 搜索事件 */
  (e: 'search', formData: Record<string, any>): void;
  /** 重置事件 */
  (e: 'reset'): void;
  /** 表单变化事件 */
  (e: 'change', key: string, value: any, formData: Record<string, any>): void;
}

/** MfwSearchPanel Slots 接口 */
export interface MfwSearchPanelSlots {
  /** 按钮区左侧 */
  'search-actions'?: (props: { loading: boolean }) => VNode[];
  /** 面板底部 */
  'search-extra'?: () => VNode[];
}

/** MfwSearchPanel 暴露实例接口 */
export interface MfwSearchPanelInstance {
  /** 重置表单 */
  reset: () => void;
  /** 获取表单值 */
  getFormValues: () => Record<string, any>;
  /** 设置表单值 */
  setFormValues: (values: Record<string, any>) => void;
  /** 触发搜索 */
  doSearch: () => void;
}
```

- [ ] **Step 2: 创建 mod.ts 文件**

```typescript
/**
 * @fileoverview MfwSearchPanel 导出模块
 */

export { default as MfwSearchPanel } from './index';
export * from './types';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/page/search-panel/types.ts src/components/page/search-panel/mod.ts
git commit -m "feat(search-panel): add type definitions"
```

---

## Task 2: 创建 MfwSearchPanel 样式

**Files:**
- Create: `src/components/page/search-panel/style.scss`

- [ ] **Step 1: 创建 style.scss 文件**

```scss
/**
 * @fileoverview MfwSearchPanel 筛选面板样式
 */

.search-panel {
  --search-panel-padding: 16px;
  --search-panel-bg: var(--el-bg-color);
  --search-panel-border: var(--el-border-color);
  --search-panel-radius: 8px;
  --search-panel-item-width: 240px;

  padding: var(--search-panel-padding);
  background: var(--search-panel-bg);
  border: 1px solid var(--search-panel-border);
  border-radius: var(--search-panel-radius);

  &__form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px;

    .el-form-item {
      margin-bottom: 0;
      width: var(--search-panel-item-width);
    }

    .el-input,
    .el-select,
    .el-date-editor {
      width: 100%;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
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
    font-size: 13px;

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  &__extra {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  @media (max-width: 768px) {
    --search-panel-padding: 12px;
    --search-panel-item-width: 100%;

    &__form {
      .el-form-item {
        width: 100%;
      }
    }

    &__actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 12px;
      margin-left: 0;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/search-panel/style.scss
git commit -m "feat(search-panel): add styles with right-aligned buttons"
```

---

## Task 3: 创建 MfwSearchPanel 组件

**Files:**
- Create: `src/components/page/search-panel/index.tsx`

- [ ] **Step 1: 创建 index.tsx 文件**

参考现有 `list-page/SearchPanel.tsx` 的实现，创建独立组件：

```tsx
/**
 * @fileoverview MfwSearchPanel 筛选面板组件
 * @description 配置驱动的筛选面板，支持多种表单项类型、展开/收起、两种触发模式
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  reactive,
  watch,
  type PropType
} from 'vue';
import {
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElTreeSelect,
  ElRadioGroup,
  ElRadioButton,
  ElRadio,
  ElCheckboxGroup,
  ElCheckboxButton,
  ElCheckbox,
  ElButton,
  type FormInstance
} from 'element-plus';
import { Search, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import type { SearchTemplateItem } from '../list-page/types';
import type {
  MfwSearchPanelProps,
  MfwSearchPanelEmits,
  MfwSearchPanelInstance
} from './types';

export default defineComponent({
  name: 'MfwSearchPanel',

  props: {
    searchTemplate: {
      type: Array as PropType<SearchTemplateItem[]>,
      default: () => []
    },
    searchTrigger: {
      type: String as PropType<'change' | 'submit'>,
      default: 'submit'
    },
    maxVisibleItems: {
      type: Number,
      default: 3
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    itemSpan: {
      type: Number,
      default: 6
    },
    showSearchButton: {
      type: Boolean,
      default: true
    },
    showResetButton: {
      type: Boolean,
      default: true
    }
  },

  emits: {
    search: (formData: Record<string, any>) => true,
    reset: () => true,
    change: (key: string, value: any, formData: Record<string, any>) => true
  },

  setup(props, { emit, expose, slots }) {
    const formRef = ref<FormInstance>();
    const isCollapsed = ref(true);
    const searchForm = reactive<Record<string, any>>({});

    const visibleItems = computed(() => {
      if (!isCollapsed.value) return props.searchTemplate;
      return props.searchTemplate.slice(0, props.maxVisibleItems);
    });

    const hasMoreItems = computed(() => props.searchTemplate.length > props.maxVisibleItems);

    const initSearchForm = () => {
      props.searchTemplate.forEach((item) => {
        if (item.defaultValue !== undefined) {
          searchForm[item.key] = item.defaultValue;
        } else if (item.type === 'checkbox-group') {
          searchForm[item.key] = [];
        } else {
          searchForm[item.key] = undefined;
        }
      });
    };

    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value;
    };

    const updateFormValue = (key: string, value: any) => {
      searchForm[key] = value;
      emit('change', key, value, { ...searchForm });
      if (props.searchTrigger === 'change') {
        emit('search', { ...searchForm });
      }
    };

    const handleSearch = () => {
      emit('search', { ...searchForm });
    };

    const handleReset = () => {
      formRef.value?.resetFields();
      initSearchForm();
      emit('reset');
    };

    const renderFormItem = (item: SearchTemplateItem) => {
      const placeholder = item.placeholder || `请输入${item.label}`;
      const disabled = props.loading;

      switch (item.type) {
        case 'input':
          return (
            <ElInput
              modelValue={searchForm[item.key]}
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
              modelValue={searchForm[item.key]}
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
              modelValue={searchForm[item.key]}
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
              modelValue={searchForm[item.key]}
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
              modelValue={searchForm[item.key]}
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
              modelValue={searchForm[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              disabled={disabled}
              {...item.elProps}
            >
              {(item.elProps?.options || []).map((opt: any) => (
                <ElRadioButton key={opt.value} label={opt.value}>{opt.label}</ElRadioButton>
              ))}
            </ElRadioGroup>
          );
        case 'checkbox-group':
          return (
            <ElCheckboxGroup
              modelValue={searchForm[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              disabled={disabled}
              {...item.elProps}
            >
              {(item.elProps?.options || []).map((opt: any) => (
                <ElCheckboxButton key={opt.value} label={opt.value}>{opt.label}</ElCheckboxButton>
              ))}
            </ElCheckboxGroup>
          );
        default:
          return (
            <ElInput
              modelValue={searchForm[item.key]}
              onUpdate:modelValue={(val: any) => updateFormValue(item.key, val)}
              placeholder={placeholder}
              disabled={disabled}
            />
          );
      }
    };

    expose<MfwSearchPanelInstance>({
      reset: handleReset,
      getFormValues: () => ({ ...searchForm }),
      setFormValues: (values: Record<string, any>) => {
        Object.assign(searchForm, values);
      },
      doSearch: handleSearch
    });

    watch(
      () => props.searchTemplate,
      () => {
        initSearchForm();
      },
      { immediate: true }
    );

    return () => {
      if (!props.showSearch) return null;

      return (
        <div class="search-panel">
          <ElForm ref={formRef} model={searchForm} class="search-panel__form" inline>
            <ElRow gutter={16}>
              {visibleItems.value.map((item) => (
                <ElCol key={item.key} span={props.itemSpan}>
                  <ElFormItem label={item.label} prop={item.key} required={item.required}>
                    {renderFormItem(item)}
                  </ElFormItem>
                </ElCol>
              ))}
              <ElCol span={24 - visibleItems.value.length * props.itemSpan}>
                <div class="search-panel__actions">
                  {slots['search-actions']?.({ loading: props.loading })}
                  {hasMoreItems.value && (
                    <span class="search-panel__expand-btn" onClick={toggleCollapse}>
                      <ElIcon>{isCollapsed.value ? <ArrowDown /> : <ArrowUp />}</ElIcon>
                      {isCollapsed.value ? '展开' : '收起'}
                    </span>
                  )}
                  {props.showSearchButton && (
                    <ElButton type="primary" icon={Search} loading={props.loading} onClick={handleSearch}>
                      查询
                    </ElButton>
                  )}
                  {props.showResetButton && (
                    <ElButton icon={Refresh} disabled={props.loading} onClick={handleReset}>
                      重置
                    </ElButton>
                  )}
                </div>
              </ElCol>
            </ElRow>
          </ElForm>
          {slots['search-extra']?.()}
        </div>
      );
    };
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/search-panel/index.tsx
git commit -m "feat(search-panel): implement MfwSearchPanel component"
```

---

## Task 4: 修改 MfwPageWrapper 类型定义

**Files:**
- Modify: `src/components/page/page-wrapper/types.ts`

- [ ] **Step 1: 添加 headerMode 类型**

在 `MfwPageWrapperProps` 接口中添加：

```typescript
/** 头部显示模式 */
headerMode?: 'breadcrumb' | 'title';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/page-wrapper/types.ts
git commit -m "feat(page-wrapper): add headerMode type"
```

---

## Task 5: 修改 MfwPageWrapper 样式

**Files:**
- Modify: `src/components/page/page-wrapper/style.scss`

- [ ] **Step 1: 添加头部布局样式**

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
    min-width: 0;
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

- [ ] **Step 2: Commit**

```bash
git add src/components/page/page-wrapper/style.scss
git commit -m "feat(page-wrapper): add header layout styles"
```

---

## Task 6: 修改 MfwPageWrapper 组件

**Files:**
- Modify: `src/components/page/page-wrapper/index.tsx`

- [ ] **Step 1: 添加 headerMode prop**

```tsx
props: {
  // ... 现有 props
  headerMode: {
    type: String as PropType<'breadcrumb' | 'title'>,
    default: 'breadcrumb'
  }
}
```

- [ ] **Step 2: 修改渲染逻辑**

```tsx
// 根据 headerMode 渲染不同头部
{props.headerMode === 'breadcrumb' ? (
  // 渲染面包屑
  <div class="mfw-page-wrapper__header-row">
    <div class="mfw-page-wrapper__header-left">
      <ElBreadcrumb ...>
        {breadcrumbItems.value.map(...)}
      </ElBreadcrumb>
    </div>
    <div class="mfw-page-wrapper__header-right">
      {slots['header-extra']?.()}
      {props.showRefresh && (
        <ElButton type="default" icon={Refresh} loading={isRefreshing.value} onClick={handleRefresh}>
          刷新
        </ElButton>
      )}
    </div>
  </div>
) : (
  // 渲染标题
  <div class="mfw-page-wrapper__header-row">
    <div class="mfw-page-wrapper__header-left">
      <h1 class="mfw-page-wrapper__title">{pageTitle.value}</h1>
    </div>
    <div class="mfw-page-wrapper__header-right">
      {slots['header-extra']?.()}
      {props.showRefresh && (
        <ElButton type="default" icon={Refresh} loading={isRefreshing.value} onClick={handleRefresh}>
          刷新
        </ElButton>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/page/page-wrapper/index.tsx
git commit -m "feat(page-wrapper): implement headerMode and refresh button optimization"
```

---

## Task 7: 修改 MfwListPage 使用独立 SearchPanel

**Files:**
- Modify: `src/components/page/list-page/index.tsx`
- Delete: `src/components/page/list-page/SearchPanel.tsx`
- Delete: `src/components/page/list-page/SearchPanel.scss`

- [ ] **Step 1: 修改导入**

```tsx
// 移除
// import SearchPanel from './SearchPanel';

// 添加
import { MfwSearchPanel } from '../search-panel';
```

- [ ] **Step 2: 修改渲染逻辑**

```tsx
// 使用 MfwSearchPanel
<MfwSearchPanel
  ref={searchPanelRef}
  searchTemplate={props.searchTemplate}
  searchTrigger={props.searchTrigger}
  loading={loading.value}
  onSearch={handleSearch}
  onReset={handleReset}
>
  {slots['search-actions'] && (
    <template #search-actions={searchSlotProps}>
      {slots['search-actions']?.(searchSlotProps)}
    </template>
  )}
</MfwSearchPanel>
```

- [ ] **Step 3: 删除旧文件**

```bash
git rm src/components/page/list-page/SearchPanel.tsx src/components/page/list-page/SearchPanel.scss
```

- [ ] **Step 4: Commit**

```bash
git add src/components/page/list-page/index.tsx
git commit -m "refactor(list-page): use independent MfwSearchPanel"
```

---

## Task 8: 创建 MfwCardListPage 类型定义

**Files:**
- Create: `src/components/page/card-list-page/types.ts`
- Create: `src/components/page/card-list-page/mod.ts`

- [ ] **Step 1: 创建 types.ts 文件**

```typescript
/**
 * @fileoverview MfwCardListPage 类型定义
 */

import type { VNode } from 'vue';
import type { SearchTemplateItem, LoadParams, TableData } from '../list-page/types';

/** 卡片栅格配置 */
export interface CardGridConfig {
  /** 每行卡片数 */
  cols?: number;
  /** 卡片间距 */
  gap?: number;
}

/** MfwCardListPage Props 接口 */
export interface MfwCardListPageProps {
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
  
  /** 卡片渲染函数 */
  cardRender?: (item: any, index: number) => VNode;
  
  /** 卡片栅格配置 */
  cardGrid?: CardGridConfig;
  
  /** 空数据提示文本 */
  emptyText?: string;
}

/** MfwCardListPage Emits 接口 */
export interface MfwCardListPageEmits {
  (e: 'search', formData: Record<string, any>): void;
  (e: 'reset'): void;
  (e: 'page-change', page: number, pageSize: number): void;
}

/** MfwCardListPage Slots 接口 */
export interface MfwCardListPageSlots {
  /** 底部额外内容 */
  default?: () => VNode[];
  /** 筛选按钮区 */
  'search-actions'?: (props: { loading: boolean }) => VNode[];
  /** 卡片渲染 */
  'card-item'?: (props: { item: any; index: number }) => VNode[];
  /** 空数据 */
  empty?: () => VNode[];
}

/** MfwCardListPage 暴露实例接口 */
export interface MfwCardListPageInstance {
  refresh: () => Promise<void>;
  resetSearch: () => void;
  setLoading: (loading: boolean) => void;
  getSearchParams: () => Record<string, any>;
}
```

- [ ] **Step 2: 创建 mod.ts 文件**

```typescript
/**
 * @fileoverview MfwCardListPage 导出模块
 */

export { default as MfwCardListPage } from './index';
export * from './types';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/page/card-list-page/types.ts src/components/page/card-list-page/mod.ts
git commit -m "feat(card-list-page): add type definitions"
```

---

## Task 9: 创建 MfwCardListPage 样式

**Files:**
- Create: `src/components/page/card-list-page/style.scss`

- [ ] **Step 1: 创建 style.scss 文件**

```scss
/**
 * @fileoverview MfwCardListPage 卡片列表页面样式
 */

.mfw-card-list-page {
  --card-cols: 4;
  --card-gap: 16px;

  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__cards {
    display: grid;
    grid-template-columns: repeat(var(--card-cols), 1fr);
    gap: var(--card-gap);
  }

  &__card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
  }

  @media (max-width: 1200px) {
    --card-cols: 3;
  }

  @media (max-width: 900px) {
    --card-cols: 2;
  }

  @media (max-width: 600px) {
    --card-cols: 1;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/card-list-page/style.scss
git commit -m "feat(card-list-page): add styles"
```

---

## Task 10: 创建 MfwCardListPage 组件

**Files:**
- Create: `src/components/page/card-list-page/index.tsx`

- [ ] **Step 1: 创建 index.tsx 文件**

```tsx
/**
 * @fileoverview MfwCardListPage 卡片列表页面组件
 * @description 支持表格和卡片两种渲染模式的列表页面
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  type PropType
} from 'vue';
import { ElPagination, ElEmpty } from 'element-plus';
import { MfwSearchPanel } from '../search-panel';
import MfwTableList from '../../table/table-list';
import type {
  MfwCardListPageProps,
  MfwCardListPageEmits,
  MfwCardListPageInstance,
  SearchTemplateItem,
  LoadParams,
  TableData
} from './types';

export default defineComponent({
  name: 'MfwCardListPage',

  props: {
    searchTemplate: {
      type: Array as PropType<SearchTemplateItem[]>,
      default: () => []
    },
    loadData: {
      type: Function as PropType<(params: LoadParams) => Promise<TableData>>
    },
    searchTrigger: {
      type: String as PropType<'change' | 'submit'>,
      default: 'change'
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    pageSize: {
      type: Number,
      default: 20
    },
    pageSizeOptions: {
      type: Array as PropType<number[]>,
      default: () => [10, 20, 50, 100]
    },
    renderMode: {
      type: String as PropType<'table' | 'card'>,
      default: 'card'
    },
    cardRender: {
      type: Function as PropType<(item: any, index: number) => VNode>
    },
    cardGrid: {
      type: Object as PropType<{ cols?: number; gap?: number }>,
      default: () => ({ cols: 4, gap: 16 })
    },
    emptyText: {
      type: String,
      default: '暂无数据'
    }
  },

  emits: {
    search: (formData: Record<string, any>) => true,
    reset: () => true,
    'page-change': (page: number, pageSize: number) => true
  },

  setup(props, { emit, expose, slots }) {
    const searchPanelRef = ref<any>();
    const tableRef = ref<any>();

    const searchForm = ref<Record<string, any>>({});
    const pagination = ref({
      currentPage: 1,
      pageSize: props.pageSize,
      total: 0,
      pageSizeOptions: props.pageSizeOptions
    });

    const loading = ref(false);
    const tableData = ref<any[]>([]);

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

      loading.value = true;
      try {
        const params: LoadParams = {
          ...searchForm.value,
          page: pagination.value.currentPage,
          pageSize: pagination.value.pageSize
        };

        const result = await props.loadData(params);
        tableData.value = result.list || [];
        pagination.value.total = result.total || 0;
      } catch (error) {
        console.error('加载数据失败:', error);
        tableData.value = [];
        pagination.value.total = 0;
      } finally {
        loading.value = false;
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

    expose<MfwCardListPageInstance>({
      refresh: async () => {
        await loadTableData();
      },
      resetSearch: () => {
        handleReset();
      },
      setLoading: (isLoading: boolean) => {
        loading.value = isLoading;
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

    const cardGridStyle = computed(() => ({
      '--card-cols': props.cardGrid?.cols || 4,
      '--card-gap': `${props.cardGrid?.gap || 16}px`
    }));

    return () => (
      <div class="mfw-card-list-page" style={cardGridStyle.value}>
        {props.showSearch && props.searchTemplate.length > 0 && (
          <MfwSearchPanel
            ref={searchPanelRef}
            searchTemplate={props.searchTemplate}
            searchTrigger={props.searchTrigger}
            loading={loading.value}
            onSearch={handleSearch}
            onReset={handleReset}
          >
            {slots['search-actions'] && (
              <template #search-actions={searchSlotProps}>
                {slots['search-actions']?.(searchSlotProps)}
              </template>
            )}
          </MfwSearchPanel>
        )}

        {props.renderMode === 'table' ? (
          <MfwTableList
            ref={tableRef}
            data={tableData.value || []}
            loading={loading.value}
            emptyText={props.emptyText}
          >
            {slots.empty && (
              <template #empty>
                {slots.empty?.()}
              </template>
            )}
          </MfwTableList>
        ) : (
          <div class="mfw-card-list-page__cards">
            {tableData.value.length > 0 ? (
              tableData.value.map((item, index) => (
                <div key={index} class="mfw-card-list-page__card">
                  {slots['card-item']?.({ item, index }) || 
                    (props.cardRender?.(item, index))}
                </div>
              ))
            ) : (
              <ElEmpty description={props.emptyText} />
            )}
          </div>
        )}

        {props.showPagination && pagination.value.total > 0 && (
          <div class="mfw-card-list-page__pagination">
            <ElPagination
              currentPage={pagination.value.currentPage}
              pageSize={pagination.value.pageSize}
              pageSizes={pagination.value.pageSizeOptions}
              total={pagination.value.total}
              layout="total, sizes, prev, pager, next, jumper"
              onCurrentChange={handlePageChange}
              onSizeChange={handleSizeChange}
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
git add src/components/page/card-list-page/index.tsx
git commit -m "feat(card-list-page): implement MfwCardListPage component"
```

---

## Task 11: 更新组件导出

**Files:**
- Modify: `src/components/page/index.ts`

- [ ] **Step 1: 更新导出**

```typescript
/**
 * @fileoverview 页面类组件导出
 */

export * from './page-wrapper/mod';
export * from './list-page/mod';
export * from './search-panel/mod';
export * from './card-list-page/mod';

// 向后兼容：MfwPageScene 指向 MfwListPage
export { MfwListPage as MfwPageScene } from './list-page/mod';
export type * from './list-page/types';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/page/index.ts
git commit -m "feat(page): export MfwSearchPanel and MfwCardListPage"
```

---

## Task 12: 运行类型检查和构建

- [ ] **Step 1: 运行类型检查**

```bash
pnpm run typecheck:vue
```

Expected: 无类型错误

- [ ] **Step 2: 运行构建**

```bash
pnpm run build
```

Expected: 构建成功

---

## Task 13: 最终提交和验证

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

1. **向后兼容**：`MfwListPage` 保持现有 API 兼容，`MfwPageScene` 别名继续指向 `MfwListPage`

2. **样式设计**：SearchPanel 按钮右对齐，刷新按钮改为独立按钮样式

3. **headerMode**：默认为 `breadcrumb`，保持现有行为不变

4. **测试覆盖**：建议后续添加单元测试，覆盖 headerMode 切换、renderMode 切换等关键功能