<!--
  @fileoverview MfwCardListPage 卡片列表页面组件
  @description 支持表格和卡片两种渲染模式的列表页面
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
    @search="(formData: Record<string, any>) => emit('search', formData)"
    @reset="() => emit('reset')"
    @page-change="(page: number, size: number) => emit('page-change', page, size)"
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
      <!-- 表格模式 -->
      <div v-if="renderMode === 'table'" class="mfw-card-list-page__table">
        <MfwTableList
          ref="tableRef"
          :data="data || []"
          :loading="loading"
          :el-props="{ emptyText }"
        >
          <template #empty>
            <slot name="empty">
              <ElEmpty :description="emptyText" />
            </slot>
          </template>
        </MfwTableList>
      </div>
      <!-- 卡片模式 -->
      <div v-else class="mfw-card-list-page__cards" :style="cardGridStyle">
        <template v-if="data.length > 0">
          <div
            v-for="(item, index) in data"
            :key="index"
            class="mfw-card-list-page__card"
          >
            <slot
              name="card-item"
              :item="item"
              :index="index"
            />
          </div>
        </template>
        <ElEmpty v-else :description="emptyText" />
      </div>
    </template>
  </MfwBaseListPage>
</template>

<script lang="ts" setup>
import { ref, computed, useSlots } from 'vue';
import { ElEmpty } from 'element-plus';
import MfwBaseListPage from '../base-list-page/index.vue';
import MfwTableList from '../../table/table-list/index';
import type {
  MfwCardListPageProps,
  MfwCardListPageEmits,
  MfwCardListPageInstance
} from './types';
import type { MfwBaseListPageInstance } from '../base-list-page/types';

const props = withDefaults(defineProps<MfwCardListPageProps>(), {
  searchTemplate: () => [],
  loadData: undefined,
  searchTrigger: undefined,
  showSearch: true,
  searchLabelWidth: undefined,
  showPagination: true,
  pageSize: 20,
  pageSizeOptions: () => [10, 20, 50, 100],
  renderMode: 'card',
  cardRender: undefined,
  cardGrid: () => ({ minWidth: 280, gap: 16 }),
  emptyText: '暂无数据'
});

const emit = defineEmits<MfwCardListPageEmits>();

const baseListPageRef = ref<MfwBaseListPageInstance>();
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

const cardGridStyle = computed(() => ({
  '--card-min-width': `${props.cardGrid?.minWidth || 280}px`,
  '--card-gap': `${props.cardGrid?.gap || 16}px`
}));

/**
 * 刷新数据
 */
const refresh = async () => {
  await baseListPageRef.value?.refresh();
};

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  baseListPageRef.value?.resetSearch();
};

/**
 * 设置加载状态
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

defineExpose<MfwCardListPageInstance>({
  refresh,
  resetSearch,
  setLoading,
  getSearchParams
});
</script>

<style lang="scss" scoped>
@import './style.scss';
</style>
