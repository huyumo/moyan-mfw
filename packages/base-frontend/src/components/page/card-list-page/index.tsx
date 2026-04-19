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
  type PropType,
  type VNode
} from 'vue';
import { ElPagination, ElEmpty } from 'element-plus';
import MfwSearchPanel from '../search-panel';
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
            v-slots={{
              'search-actions': slots['search-actions']
            }}
          />
        )}

        {props.renderMode === 'table' ? (
          <MfwTableList
            ref={tableRef}
            data={tableData.value || []}
            loading={loading.value}
            v-slots={{
              default: slots.empty
            }}
          />
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