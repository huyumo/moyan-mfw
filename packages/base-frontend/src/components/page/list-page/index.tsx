/**
 * @fileoverview MfwListPage 列表页面组件
 * @description 集成搜索面板、表格、分页的列表页面组件
 * @example
 * ```vue
 * <MfwListPage
 *   :search-template="searchTemplate"
 *   :columns="columns"
 *   :load-data="loadData"
 *   @search="handleSearch"
 * />
 * ```
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  h,
  type PropType
} from 'vue';
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
  ElPagination,
  ElEmpty,
  type FormInstance
} from 'element-plus';
import {
  Search,
  RefreshLeft
} from '@element-plus/icons-vue';
import MfwTableList from '../../table/table-list/index';
import type {
  MfwListPageProps,
  MfwListPageEmits,
  MfwListPageInstance,
  MfwListPageSlots,
  SearchTemplateItem,
  TableData,
  PaginationConfig,
  TableState
} from './types';

export default defineComponent({
  name: 'MfwListPage',

  props: {
    /** 搜索表单模板 */
    searchTemplate: {
      type: Array as PropType<MfwListPageProps['searchTemplate']>,
      default: () => []
    },
    /** 表格列配置 */
    columns: {
      type: Array as PropType<MfwListPageProps['columns']>,
      default: () => []
    },
    /** 操作列配置 */
    actionColumn: {
      type: Object as PropType<MfwListPageProps['actionColumn']>
    },
    /** 数据加载函数 */
    loadData: {
      type: Function as PropType<MfwListPageProps['loadData']>
    },
    /** 筛选触发模式 */
    searchTrigger: {
      type: String as PropType<MfwListPageProps['searchTrigger']>,
      default: 'submit'
    },
    /** 是否显示筛选面板 */
    showSearch: {
      type: Boolean as PropType<MfwListPageProps['showSearch']>,
      default: true
    },
    /** 是否显示分页 */
    showPagination: {
      type: Boolean as PropType<MfwListPageProps['showPagination']>,
      default: true
    },
    /** 每页条数 */
    pageSize: {
      type: Number as PropType<MfwListPageProps['pageSize']>,
      default: 20
    },
    /** 每页条数选项 */
    pageSizeOptions: {
      type: Array as PropType<MfwListPageProps['pageSizeOptions']>,
      default: () => [10, 20, 50, 100]
    },
    /** 是否显示边框 */
    border: {
      type: Boolean as PropType<MfwListPageProps['border']>,
      default: true
    },
    /** 是否斑马纹 */
    stripe: {
      type: Boolean as PropType<MfwListPageProps['stripe']>,
      default: false
    },
    /** 是否支持行选择 */
    rowSelection: {
      type: Boolean as PropType<MfwListPageProps['rowSelection']>,
      default: false
    },
    /** 是否显示序号列 */
    showIndex: {
      type: Boolean as PropType<MfwListPageProps['showIndex']>,
      default: false
    },
    /** 行键名 */
    rowKey: {
      type: String as PropType<MfwListPageProps['rowKey']>,
      default: 'id'
    },
    /** 空数据提示文本 */
    emptyText: {
      type: String as PropType<MfwListPageProps['emptyText']>,
      default: '暂无数据'
    },
    /** 表格高度 */
    tableHeight: {
      type: [String, Number] as PropType<MfwListPageProps['tableHeight']>,
      default: 'auto'
    },
    /** Element Plus Table Props */
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
    const searchFormRef = ref<FormInstance>();
    const tableRef = ref<any>();

    // 搜索表单数据
    const searchForm = ref<Record<string, any>>({});

    // 分页配置
    const pagination = ref<PaginationConfig>({
      currentPage: 1,
      pageSize: props.pageSize,
      total: 0,
      pageSizeOptions: props.pageSizeOptions
    });

    // 表格状态
    const tableState = ref<TableState>({
      loading: false,
      data: [],
      sortProp: null,
      sortOrder: null,
      selection: []
    });

    // 加载状态
    const loading = computed(() => tableState.value.loading);

    // 表格数据
    const tableData = computed(() => tableState.value.data);

    /**
     * 初始化搜索表单默认值
     */
    const initSearchForm = () => {
      searchForm.value = {};
      props.searchTemplate.forEach((item: SearchTemplateItem) => {
        if (item.defaultValue !== undefined) {
          searchForm.value[item.key] = item.defaultValue;
        } else if (item.type === 'checkbox-group') {
          searchForm.value[item.key] = [];
        } else {
          searchForm.value[item.key] = undefined;
        }
      });
    };

    /**
     * 加载表格数据
     */
    const loadTableData = async () => {
      if (!props.loadData) return;

      tableState.value.loading = true;
      try {
        const params = {
          ...searchForm.value,
          page: pagination.value.currentPage,
          pageSize: pagination.value.pageSize,
          sortProp: tableState.value.sortProp,
          sortOrder: tableState.value.sortOrder
        };

        const result = await props.loadData(params);
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

    /**
     * 刷新表格
     */
    const refresh = async () => {
      await loadTableData();
    };

    /**
     * 重置搜索条件
     */
    const resetSearch = () => {
      searchFormRef.value?.resetFields();
      initSearchForm();
      pagination.value.currentPage = 1;
      emit('reset');
      loadTableData();
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
      tableState.value.loading = isLoading;
    };

    /**
     * 获取当前搜索条件
     */
    const getSearchParams = () => {
      return { ...searchForm.value };
    };

    /**
     * 处理搜索
     */
    const handleSearch = () => {
      searchFormRef.value?.validate((valid: boolean) => {
        if (valid) {
          pagination.value.currentPage = 1;
          emit('search', searchForm.value);
          loadTableData();
        }
      });
    };

    /**
     * 处理重置
     */
    const handleReset = () => {
      resetSearch();
    };

    /**
     * 处理分页变化
     */
    const handlePageChange = () => {
      emit('page-change', pagination.value.currentPage, pagination.value.pageSize);
      loadTableData();
    };

    /**
     * 处理排序变化
     */
    const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
      tableState.value.sortProp = prop;
      tableState.value.sortOrder = order as 'ascending' | 'descending' | null;
      emit('sort-change', { prop, order: order as 'ascending' | 'descending' | null });
      loadTableData();
    };

    /**
     * 处理选择变化
     */
    const handleSelectionChange = (selection: any[]) => {
      tableState.value.selection = selection;
      emit('selection-change', selection);
    };

    /**
     * 处理表单项值变化（change 模式下立即触发搜索）
     */
    const handleFormItemChange = (key: string, value: any, immediate?: boolean) => {
      searchForm.value[key] = value;
      if (props.searchTrigger === 'change' && immediate) {
        handleSearch();
      }
    };

    /**
     * 渲染搜索表单项
     */
    const renderSearchItem = (item: SearchTemplateItem) => {
      const placeholder = item.placeholder || `请输入${item.label}`;
      const disabled = loading.value;

      switch (item.type) {
        case 'input':
          return h(ElInput, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            placeholder,
            disabled,
            clearable: true,
            onKeyup: (e: KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); }
          });

        case 'select':
          return h(ElSelect, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            placeholder: item.placeholder || `请选择${item.label}`,
            disabled,
            clearable: true,
            ...item.elProps
          }, {
            default: () => (item.elProps?.options || []).map((opt: any) =>
              h(ElOption, { key: opt.value, label: opt.label, value: opt.value })
            )
          });

        case 'date-picker':
          return h(ElDatePicker, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            type: 'date',
            placeholder: item.placeholder || '选择日期',
            disabled,
            valueFormat: 'YYYY-MM-DD',
            ...item.elProps
          });

        case 'date-range':
          return h(ElDatePicker, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            type: 'daterange',
            startPlaceholder: (item.placeholder || '开始日期/结束日期').split('/')[0],
            endPlaceholder: (item.placeholder || '开始日期/结束日期').split('/')[1] || '结束日期',
            disabled,
            valueFormat: 'YYYY-MM-DD',
            ...item.elProps
          });

        case 'tree-select':
          return h(ElTreeSelect, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            placeholder: item.placeholder || `请选择${item.label}`,
            disabled,
            clearable: true,
            ...item.elProps
          });

        case 'radio-group':
          return h(ElRadioGroup, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            disabled,
            ...item.elProps
          }, {
            default: () => (item.elProps?.options || []).map((opt: any) =>
              h(ElRadio, { key: opt.value, label: opt.value }, { default: () => opt.label })
            )
          });

        case 'checkbox-group':
          return h(ElCheckboxGroup, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            disabled,
            ...item.elProps
          }, {
            default: () => (item.elProps?.options || []).map((opt: any) =>
              h(ElCheckbox, { key: opt.value, label: opt.value }, { default: () => opt.label })
            )
          });

        default:
          return h(ElInput, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => handleFormItemChange(item.key, val, item.immediate),
            placeholder,
            disabled
          });
      }
    };

    // 暴露实例方法
    expose<MfwListPageInstance>({
      refresh,
      resetSearch,
      getSelection,
      clearSelection,
      setLoading,
      getSearchParams
    });

    // 初始化
    onMounted(() => {
      initSearchForm();
      if (props.loadData) {
        loadTableData();
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

    // 渲染函数
    return () => {
      // 搜索面板
      const renderSearchPanel = () => {
        if (!props.showSearch || props.searchTemplate.length === 0) {
          return null;
        }

        return h('div', { class: 'mfw-list-page__search' }, [
          h(ElForm, {
            ref: searchFormRef,
            model: searchForm.value,
            inline: true,
            class: 'mfw-list-page__search-form'
          }, {
            default: () => [
              // 搜索表单项
              ...props.searchTemplate.map((item: SearchTemplateItem) =>
                h(ElFormItem, {
                  key: item.key,
                  label: item.label,
                  prop: item.key,
                  rules: item.required ? [{ required: true, message: `请输入${item.label}`, trigger: 'blur' as const }] : []
                }, {
                  default: () => renderSearchItem(item)
                })
              ),

              // 搜索操作按钮
              h(ElFormItem, {}, {
                default: () => h('div', { class: 'mfw-list-page__search-actions' }, [
                  h(ElButton, {
                    type: 'primary',
                    loading: loading.value,
                    onClick: handleSearch
                  }, {
                    default: () => [
                      h(ElIcon, {}, { default: () => h(Search) }),
                      ' 搜索'
                    ]
                  }),

                  h(ElButton, {
                    onClick: handleReset
                  }, {
                    default: () => [
                      h(ElIcon, {}, { default: () => h(RefreshLeft) }),
                      ' 重置'
                    ]
                  }),

                  // 自定义搜索操作插槽
                  slots['search-actions']?.({ loading: loading.value })
                ])
              }),

              // 筛选面板底部插槽
              slots['search-extra']?.()
            ]
          })
        ]);
      };

      // 表格区域
      const renderTableArea = () => {
        return h('div', { class: 'mfw-list-page__table' }, [
          // 表格头部插槽
          slots['table-header']?.(),

          // 表格
          h(MfwTableList, {
            ref: tableRef,
            data: tableData.value ?? [],
            columns: props.columns ?? [],
            actionColumn: props.actionColumn,
            loading: loading.value,
            border: props.border,
            stripe: props.stripe,
            selection: props.rowSelection,
            index: props.showIndex,
            elProps: {
              rowKey: props.rowKey,
              height: props.tableHeight !== 'auto' ? props.tableHeight : undefined,
              emptyText: props.emptyText,
              onSelectionChange: handleSelectionChange,
              onSortChange: handleSortChange,
              ...props.elProps
            },
            onSelectionChange: handleSelectionChange,
            onSortChange: handleSortChange
          }, {
            default: () => slots.default?.(),
            empty: () => slots.empty?.() || h(ElEmpty, { description: props.emptyText })
          }),

          // 表格底部插槽
          slots['table-footer']?.()
        ]);
      };

      // 分页区域
      const renderPagination = () => {
        if (!props.showPagination) {
          return null;
        }

        return h('div', { class: 'mfw-list-page__pagination' }, [
          h(ElPagination, {
            currentPage: pagination.value.currentPage,
            'onUpdate:currentPage': (val: number) => { pagination.value.currentPage = val; },
            pageSize: pagination.value.pageSize,
            'onUpdate:pageSize': (val: number) => { pagination.value.pageSize = val; },
            pageSizes: pagination.value.pageSizeOptions,
            total: pagination.value.total,
            layout: 'total, sizes, prev, pager, next, jumper',
            onSizeChange: handlePageChange,
            onCurrentChange: handlePageChange
          })
        ]);
      };

      return h('div', { class: 'mfw-list-page' }, [
        renderSearchPanel(),
        renderTableArea(),
        renderPagination()
      ]);
    };
  }
});