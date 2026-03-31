/**
 * @fileoverview MfwPageScene 标准列表页面组件
 * @description 搜索面板 + 表格一体化组件，支持动态列、自定义渲染、分页等
 * @example
 * ```vue
 * <mfw-page-scene
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
  nextTick,
  onMounted,
  h,
  type PropType,
  type Ref,
  type VNode
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
  ElTable,
  ElTableColumn,
  ElPagination,
  ElEmpty,
  type FormInstance
} from 'element-plus';
import {
  Search,
  RefreshLeft,
  RefreshRight
} from '@element-plus/icons-vue';
import type {
  MfwPageSceneProps,
  MfwPageSceneEmits,
  MfwPageSceneInstance,
  MfwPageSceneSlots,
  SearchTemplateItem,
  TableColumn,
  ActionColumn,
  TableData,
  PaginationConfig,
  TableState
} from './types';

export default defineComponent({
  name: 'MfwPageScene',

  props: {
    /** 搜索表单模板 */
    searchTemplate: {
      type: Array as PropType<SearchTemplateItem[]>,
      default: () => []
    },
    /** 表格列配置 */
    columns: {
      type: Array as PropType<TableColumn[]>,
      default: () => []
    },
    /** 操作列配置 */
    actionColumn: {
      type: Object as PropType<ActionColumn>
    },
    /** 数据加载函数 */
    loadData: {
      type: Function as PropType<MfwPageSceneProps['loadData']>
    },
    /** 是否显示搜索面板 */
    showSearch: {
      type: Boolean as PropType<MfwPageSceneProps['showSearch']>,
      default: true
    },
    /** 是否显示刷新按钮 */
    showRefresh: {
      type: Boolean as PropType<MfwPageSceneProps['showRefresh']>,
      default: true
    },
    /** 行键名 */
    rowKey: {
      type: String as PropType<MfwPageSceneProps['rowKey']>,
      default: 'id'
    },
    /** 是否支持行选择 */
    rowSelection: {
      type: Boolean as PropType<MfwPageSceneProps['rowSelection']>,
      default: false
    },
    /** 是否显示分页 */
    showPagination: {
      type: Boolean as PropType<MfwPageSceneProps['showPagination']>,
      default: true
    },
    /** 每页条数 */
    pageSize: {
      type: Number as PropType<MfwPageSceneProps['pageSize']>,
      default: 20
    },
    /** 每页条数选项 */
    pageSizeOptions: {
      type: Array as PropType<MfwPageSceneProps['pageSizeOptions']>,
      default: () => [10, 20, 50, 100]
    },
    /** 表格高度 */
    tableHeight: {
      type: [String, Number] as PropType<MfwPageSceneProps['tableHeight']>,
      default: 'auto'
    },
    /** 空数据提示文本 */
    emptyText: {
      type: String as PropType<MfwPageSceneProps['emptyText']>,
      default: '暂无数据'
    },
    /** 是否显示边框 */
    border: {
      type: Boolean as PropType<MfwPageSceneProps['border']>,
      default: true
    },
    /** 是否斑马纹 */
    stripe: {
      type: Boolean as PropType<MfwPageSceneProps['stripe']>,
      default: false
    },
    /** 尺寸 */
    size: {
      type: String as PropType<MfwPageSceneProps['size']>,
      default: 'default'
    }
  },

  emits: {
    search: (formData: Record<string, any>) => true,
    reset: () => true,
    refresh: () => true,
    'selection-change': (selection: any[]) => true,
    'page-change': (page: number, pageSize: number) => true,
    'sort-change': ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => true
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
      searchFormRef.value?.resetFields();
      initSearchForm();
      pagination.value.currentPage = 1;
      emit('reset');
      loadTableData();
    };

    /**
     * 处理刷新
     */
    const handleRefresh = () => {
      emit('refresh');
      loadTableData();
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
     * 渲染搜索表单项
     */
    const renderSearchItem = (item: SearchTemplateItem) => {
      const placeholder = item.placeholder || `请输入${item.label}`;
      const disabled = loading.value;

      switch (item.type) {
        case 'input':
          return h(ElInput, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
            placeholder,
            disabled,
            clearable: true,
            onKeyup: (e: KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); }
          });

        case 'select':
          return h(ElSelect, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
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
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
            type: 'date',
            placeholder: item.placeholder || '选择日期',
            disabled,
            valueFormat: 'YYYY-MM-DD',
            ...item.elProps
          });

        case 'date-range':
          return h(ElDatePicker, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
            type: 'daterange',
            startPlaceholder: (item.placeholder || '开始日期').split('/')[0],
            endPlaceholder: (item.placeholder || '结束日期').split('/')[1] || '结束日期',
            disabled,
            valueFormat: 'YYYY-MM-DD',
            ...item.elProps
          });

        case 'tree-select':
          return h(ElTreeSelect, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
            placeholder: item.placeholder || `请选择${item.label}`,
            disabled,
            clearable: true,
            ...item.elProps
          });

        case 'radio-group':
          return h(ElRadioGroup, {
            modelValue: searchForm.value[item.key],
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
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
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
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
            'onUpdate:modelValue': (val: any) => { searchForm.value[item.key] = val; },
            placeholder,
            disabled
          });
      }
    };

    /**
     * 渲染表格列
     */
    const renderTableColumns = () => {
      const cols: VNode[] = [];

      // 选择列
      if (props.rowSelection) {
        cols.push(
          h(ElTableColumn, {
            type: 'selection',
            width: 55,
            reserveSelection: true
          })
        );
      }

      // 动态列
      props.columns.forEach((col: TableColumn) => {
        cols.push(
          h(ElTableColumn, {
            key: col.prop,
            prop: col.prop,
            label: col.label,
            width: col.width,
            minWidth: col.minWidth,
            fixed: col.fixed,
            sortable: col.sortable,
            align: col.align || 'left',
            order: col.order
          }, {
            default: (scope: any) => {
              if (col.render) {
                return col.render(scope);
              }
              if (col.formatter) {
                return col.formatter(scope.row);
              }
              return scope.row[col.prop];
            }
          })
        );
      });

      // 操作列
      if (props.actionColumn) {
        cols.push(
          h(ElTableColumn, {
            label: props.actionColumn.label || '操作',
            width: props.actionColumn.width || 150,
            fixed: props.actionColumn.fixed || 'right',
            align: props.actionColumn.align || 'center'
          }, {
            default: (scope: any) => props.actionColumn?.render(scope)
          })
        );
      }

      return cols;
    };

    // 暴露实例方法
    expose<MfwPageSceneInstance>({
      /** 刷新表格 */
      refresh: async () => {
        await loadTableData();
      },

      /** 重置搜索条件 */
      resetSearch: () => {
        handleReset();
      },

      /** 获取选中行 */
      getSelection: () => {
        return tableState.value.selection;
      },

      /** 清空选中行 */
      clearSelection: () => {
        tableRef.value?.clearSelection();
        tableState.value.selection = [];
      },

      /** 设置表格加载状态 */
      setLoading: (loading: boolean) => {
        tableState.value.loading = loading;
      },

      /** 获取当前搜索条件 */
      getSearchParams: () => {
        return { ...searchForm.value };
      }
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

        return h('div', { class: 'mfw-page-scene__search' }, [
          h(ElForm, {
            ref: searchFormRef,
            model: searchForm.value,
            inline: true,
            class: 'mfw-page-scene__search-form'
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
                default: () => h('div', { class: 'mfw-page-scene__search-actions' }, [
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

                  props.showRefresh && h(ElButton, {
                    loading: loading.value,
                    onClick: handleRefresh
                  }, {
                    default: () => [
                      h(ElIcon, {}, { default: () => h(RefreshRight) }),
                      ' 刷新'
                    ]
                  }),

                  // 自定义搜索操作插槽
                  slots['search-actions']?.({ loading: loading.value })
                ])
              })
            ]
          })
        ]);
      };

      // 表格区域
      const renderTableArea = () => {
        return h('div', { class: 'mfw-page-scene__table' }, [
          // 表格头部插槽
          slots['table-header']?.({ columns: props.columns }),

          // 表格
          h(ElTable, {
            ref: tableRef,
            data: tableData.value,
            rowKey: props.rowKey,
            height: props.tableHeight !== 'auto' ? props.tableHeight : undefined,
            border: props.border,
            stripe: props.stripe,
            size: props.size,
            emptyText: props.emptyText,
            onSelectionChange: handleSelectionChange,
            onSortChange: handleSortChange
          }, {
            default: () => renderTableColumns(),
            empty: () => slots.empty?.() || h(ElEmpty, { description: props.emptyText })
          }),

          // 分页
          props.showPagination && h('div', { class: 'mfw-page-scene__pagination' }, [
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
          ])
        ]);
      };

      return h('div', { class: 'mfw-page-scene' }, [
        renderSearchPanel(),
        renderTableArea()
      ]);
    };
  }
});
