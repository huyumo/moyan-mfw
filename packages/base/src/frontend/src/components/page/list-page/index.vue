<!--
  @fileoverview MfwListPage 列表页面组件
  @description 集成搜索面板、表格、分页的列表页面组件
  @example
  ```vue
  <MfwListPage
    :search-template="searchTemplate"
    :columns="columns"
    :load-data="loadData"
    @search="handleSearch"
  />
  ```
-->

<template>
  <MfwBaseListPage
    ref="baseListPageRef"
    :search-template="searchTemplate"
    :load-data="loadData"
    :search-trigger="searchTrigger"
    :show-search="showSearch"
    :search-label-width="searchLabelWidth"
    :show-pagination="showPagination"
    :page-size="pageSize"
    :page-size-options="pageSizeOptions"
    :empty-text="emptyText"
    @search="handleSearch"
    @reset="handleReset"
    @page-change="handlePageChange"
  >
    <template #search-actions>
      <slot name="search-actions" />
    </template>
    <template #search-extra>
      <slot name="search-extra" />
    </template>
    <template
      v-for="(_, name) in searchItemSlots"
      #[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps" />
    </template>
    <template #content="{ data, loading }">
      <div class="mfw-list-page__table">
        <slot name="table-header" />

        <MfwTableList
          ref="tableRef"
          :data="data ?? []"
          :columns="columns ?? []"
          :formatters="formatters"
          :action-column="actionColumn"
          :loading="loading"
          :border="border"
          :stripe="stripe"
          :selection="rowSelection"
          :index="showIndex"
          :el-props="{
            rowKey,
            height: tableHeight !== 'auto' ? tableHeight : undefined,
            emptyText,
            onSelectionChange: handleSelectionChange,
            onSortChange: handleSortChange,
            ...elProps
          }"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <template #default>
            <slot />
          </template>
          <template #empty>
            <slot name="empty">
              <ElEmpty :description="emptyText" />
            </slot>
          </template>
        </MfwTableList>

        <slot name="table-footer" />
      </div>
    </template>
    <template #default>
      <slot name="default" />
    </template>
  </MfwBaseListPage>
</template>

<script lang="ts" setup>
import { ref, inject, computed, useSlots } from 'vue';
import { ElEmpty } from 'element-plus';
import MfwBaseListPage from '../base-list-page/index.vue';
import MfwTableList from '../../table/table-list/index';
import type {
  MfwListPageProps,
  MfwListPageEmits,
  MfwListPageInstance
} from './types';
import type { MfwBaseListPageInstance } from '../base-list-page/types';

const props = withDefaults(defineProps<MfwListPageProps>(), {
  searchTemplate: () => [],
  columns: () => [],
  formatters: () => ({}),
  actionColumn: undefined,
  loadData: undefined,
  searchTrigger: undefined,
  showSearch: true,
  searchLabelWidth: undefined,
  showPagination: true,
  pageSize: 20,
  pageSizeOptions: () => [10, 20, 50, 100],
  border: true,
  stripe: false,
  rowSelection: false,
  showIndex: false,
  rowKey: 'id',
  emptyText: '暂无数据',
  tableHeight: 'auto',
  elProps: () => ({})
});

const emit = defineEmits<MfwListPageEmits>();

const baseListPageRef = ref<MfwBaseListPageInstance>();
const tableRef = ref<any>();
const slots = useSlots();

// 筛选出 search-item-* 和自定义 slot 名称的插槽，转发给 MfwBaseListPage
const searchItemSlots = computed(() => {
  const result: Record<string, any> = {};
  const slotNames = Object.keys(slots);
  for (const name of slotNames) {
    if (name.startsWith('search-item-')) {
      result[name] = slots[name];
    }
  }
  for (const item of props.searchTemplate) {
    if (item.slot && slots[item.slot]) {
      result[item.slot] = slots[item.slot];
    }
  }
  return result;
});

// 表格状态
const tableState = ref({
  sortProp: null as string | null,
  sortOrder: null as 'ascending' | 'descending' | null,
  selection: [] as any[]
});

const refreshContext = inject<{ registerRefresh: (callback: () => void | Promise<void>) => void }>(
  'mfw-page-refresh-context',
  { registerRefresh: () => {} }
);

/**
 * 刷新表格
 */
const refresh = async () => {
  await baseListPageRef.value?.refresh();
};

refreshContext.registerRefresh(refresh);

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  baseListPageRef.value?.resetSearch();
};

/**
 * 获取选中行
 */
const getSelection = () => {
  return tableState.value.selection;
};

/**
 * 清空选中行
 */
const clearSelection = () => {
  tableRef.value?.clearSelection();
  tableState.value.selection = [];
};

/**
 * 设置表格加载状态
 */
const setLoading = (isLoading: boolean) => {
  baseListPageRef.value?.setLoading(isLoading);
};

/**
 * 获取当前搜索条件
 */
const getSearchParams = () => {
  return baseListPageRef.value?.getSearchParams() || {};
};

/**
 * 处理搜索
 */
const handleSearch = (formData: Record<string, any>) => {
  emit('search', formData);
};

/**
 * 处理重置
 */
const handleReset = () => {
  emit('reset');
};

/**
 * 处理分页变化
 */
const handlePageChange = (page: number, pageSize: number) => {
  emit('page-change', page, pageSize);
};

/**
 * 处理排序变化
 */
const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  tableState.value.sortProp = prop;
  tableState.value.sortOrder = order as 'ascending' | 'descending' | null;
  emit('sort-change', { prop, order: order as 'ascending' | 'descending' | null });
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: any[]) => {
  tableState.value.selection = selection;
  emit('selection-change', selection);
};

// 暴露实例方法
defineExpose<MfwListPageInstance>({
  refresh,
  resetSearch,
  getSelection,
  clearSelection,
  setLoading,
  getSearchParams
});
</script>

<style lang="scss" scoped>
.mfw-list-page {
  &__table {
    background: var(--el-bg-color);
    border-radius: 4px;

    .mfw-table-list {
      border-radius: 0px;
      overflow: hidden;
    }
  }
}
</style>
