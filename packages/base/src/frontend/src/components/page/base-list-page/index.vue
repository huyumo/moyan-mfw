<!--
  @fileoverview MfwBaseListPage 基础列表页面组件
  @description 提取列表页面的公共逻辑：搜索面板、分页器、数据加载
-->

<template>
  <div class="mfw-base-list-page">
    <!-- 搜索面板 -->
    <div v-if="showSearch && searchTemplate.length > 0" class="mfw-base-list-page__search">
      <MfwSearchPanel
        ref="searchPanelRef"
        :search-template="searchTemplate"
        :search-trigger="resolvedSearchTrigger"
        :loading="loading"
        :label-width="searchLabelWidth"
        @search="handleSearch"
        @reset="handleReset"
      >
        <template v-if="$slots['search-actions']" #search-actions>
          <slot name="search-actions" :loading="loading" />
        </template>
        <template v-if="$slots['search-extra']" #search-extra>
          <slot name="search-extra" />
        </template>
        <template
          v-for="(_, name) in searchItemSlots"
          #[name]="slotProps"
        >
          <slot :name="name" v-bind="slotProps" />
        </template>
      </MfwSearchPanel>
    </div>

    <!-- 内容区域 -->
    <div class="mfw-base-list-page__content">
      <slot
        name="content"
        :data="tableData"
        :loading="loading"
        :pagination="{
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize,
          total: pagination.total
        }"
      />
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="mfw-base-list-page__pagination">
      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="pagination.pageSizeOptions"
        :total="pagination.total"
        background
        layout="sizes, total, prev, pager, next"
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 默认插槽 -->
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, useSlots } from 'vue';
import { ElPagination } from 'element-plus';
import MfwSearchPanel from '../search-panel/index';
import { useLayoutStore } from '../../../store/layout-store';
import type { MfwBaseListPageProps, MfwBaseListPageInstance, LoadParams } from './types';
import type { MfwSearchPanelInstance } from '../search-panel/types';

const props = withDefaults(defineProps<MfwBaseListPageProps>(), {
  searchTemplate: () => [],
  searchTrigger: undefined,
  showSearch: true,
  searchLabelWidth: undefined,
  showPagination: true,
  pageSize: 20,
  pageSizeOptions: () => [10, 20, 50, 100],
  emptyText: '暂无数据'
});

const emit = defineEmits<{
  search: [formData: Record<string, any>];
  reset: [];
  'page-change': [page: number, pageSize: number];
}>();

const searchPanelRef = ref<MfwSearchPanelInstance>();
const layoutStore = useLayoutStore();
const slots = useSlots();
const resolvedSearchTrigger = computed(() => props.searchTrigger ?? layoutStore.styleConfig.searchTrigger);

// 筛选出 search-item-* 和自定义 slot 名称的插槽，转发给 MfwSearchPanel
const searchItemSlots = computed(() => {
  const result: Record<string, any> = {};
  const slotNames = Object.keys(slots);
  for (const name of slotNames) {
    if (name.startsWith('search-item-')) {
      result[name] = slots[name];
    }
  }
  // 同时转发 searchTemplate 中指定的自定义 slot 名称
  for (const item of props.searchTemplate) {
    if (item.slot && slots[item.slot]) {
      result[item.slot] = slots[item.slot];
    }
  }
  return result;
});

// 分页配置
const pagination = ref({
  currentPage: 1,
  pageSize: props.pageSize,
  total: 0,
  pageSizeOptions: props.pageSizeOptions
});

// 加载状态
const loading = ref(false);

// 表格数据
const tableData = ref<any[]>([]);

/**
 * 加载数据
 */
const loadDataAsync = async () => {
  if (!props.loadData) return;

  loading.value = true;
  try {
    const searchParams = searchPanelRef.value?.getFormValues() || {};
    const params: LoadParams = {
      ...searchParams,
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize
    };

    const result = await props.loadData(params);
    tableData.value = result.list || [];
    pagination.value.total = Number(result.total) || 0;
  } catch (error) {
    console.error('加载数据失败:', error);
    tableData.value = [];
    pagination.value.total = 0;
  } finally {
    loading.value = false;
  }
};

/**
 * 处理搜索
 */
const handleSearch = (formData: Record<string, any>) => {
  pagination.value.currentPage = 1;
  emit('search', formData);
  loadDataAsync();
};

/**
 * 处理重置
 */
const handleReset = () => {
  pagination.value.currentPage = 1;
  emit('reset');
  loadDataAsync();
};

/**
 * 处理分页变化
 */
const handlePageChange = () => {
  emit('page-change', pagination.value.currentPage, pagination.value.pageSize);
  loadDataAsync();
};

/**
 * 刷新数据
 */
const refresh = async () => {
  await loadDataAsync();
};

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  handleReset();
};

/**
 * 设置加载状态
 */
const setLoading = (isLoading: boolean) => {
  loading.value = isLoading;
};

/**
 * 获取当前搜索条件
 */
const getSearchParams = () => {
  return searchPanelRef.value?.getFormValues() || {};
};

/**
 * 获取表格数据
 */
const getData = () => {
  return tableData.value;
};

/**
 * 获取分页信息
 */
const getPagination = () => {
  return {
    currentPage: pagination.value.currentPage,
    pageSize: pagination.value.pageSize,
    total: pagination.value.total
  };
};

// 暴露实例方法
defineExpose<MfwBaseListPageInstance>({
  refresh,
  resetSearch,
  setLoading,
  getSearchParams,
  getData,
  getPagination
});

// 初始化
onMounted(() => {
  if (props.loadData) {
    loadDataAsync();
  }
});

// 监听 pageSize 变化
watch(
  () => props.pageSize,
  (newVal) => {
    pagination.value.pageSize = newVal;
  }
);

// 监听 pageSizeOptions 变化
watch(
  () => props.pageSizeOptions,
  (newVal) => {
    pagination.value.pageSizeOptions = newVal;
  }
);
</script>

<style lang="scss" scoped>
@import './style.scss';
</style>
