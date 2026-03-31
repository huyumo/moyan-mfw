/**
 * @fileoverview MfwTableList 表格列表组件
 * @description 配置驱动的表格组件，支持动态列、自定义渲染等
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  type PropType
} from 'vue';
import {
  ElTable,
  ElTableColumn,
  ElSkeleton
} from 'element-plus';
import type { MfwTableListProps, MfwTableListEmits, MfwTableListInstance, TableColumnConfig } from './types';

export default defineComponent({
  name: 'MfwTableList',

  props: {
    /** 表格数据 */
    data: {
      type: Array as PropType<MfwTableListProps['data']>,
      default: () => []
    },
    /** 列配置 */
    columns: {
      type: Array as PropType<MfwTableListProps['columns']>,
      default: () => []
    },
    /** 是否加载中 */
    loading: {
      type: Boolean,
      default: false
    },
    /** 是否显示边框 */
    border: {
      type: Boolean,
      default: true
    },
    /** 是否斑马纹 */
    stripe: {
      type: Boolean,
      default: false
    },
    /** 是否多选 */
    selection: {
      type: Boolean,
      default: false
    },
    /** 是否显示序号 */
    index: {
      type: Boolean,
      default: false
    },
    /** 操作列配置 */
    actionColumn: {
      type: Object as PropType<MfwTableListProps['actionColumn']>
    },
    /** Element Plus Table Props */
    elProps: {
      type: Object as PropType<Partial<MfwTableListProps>>,
      default: () => ({})
    }
  },

  emits: {
    'selection-change': (selection: any[]) => true,
    'sort-change': (info: { column: any; prop: string; order: string | null }) => true
  },

  setup(props, { emit, expose, slots }) {
    const tableRef = ref<any>();

    const handleSelectionChange = (selection: any[]) => {
      emit('selection-change', selection);
    };

    const handleSortChange = ({ column, prop, order }: any) => {
      emit('sort-change', { column, prop, order });
    };

    const clearSelection = () => {
      tableRef.value?.clearSelection();
    };

    const toggleAllSelection = () => {
      tableRef.value?.toggleAllSelection();
    };

    const setCurrentRow = (row: any) => {
      tableRef.value?.setCurrentRow(row);
    };

    const tableData = computed(() => props.data || []);

    expose<MfwTableListInstance>({
      clearSelection,
      toggleAllSelection,
      setCurrentRow,
      tableData: tableData.value
    } as any);

    const renderColumns = (columns: TableColumnConfig[] = []) => {
      return columns.map((column) => {
        const prop = column.prop || '';

        if (column.children && column.children.length > 0) {
          return (
            <ElTableColumn
              key={prop}
              {...column}
            >
              {() => renderColumns(column.children)}
            </ElTableColumn>
          );
        }

        return (
          <ElTableColumn
            key={prop}
            prop={prop}
            {...column}
          >
            {(scope: any) => column.render ? column.render(scope) : scope.row[prop]}
          </ElTableColumn>
        );
      });
    };

    return () => (
      <div class="mfw-table-list">
        {props.loading ? (
          <ElSkeleton animated rows={10} />
        ) : (
          <ElTable
            ref={tableRef}
            {...props.elProps}
            data={tableData.value}
            border={props.border}
            stripe={props.stripe}
            on-selection-change={handleSelectionChange}
            on-sort-change={handleSortChange}
          >
            {props.selection && (
              <ElTableColumn type="selection" width={55} />
            )}
            {props.index && (
              <ElTableColumn type="index" label="序号" width={60} />
            )}
            {renderColumns(props.columns || [])}
            {props.actionColumn && (
              <ElTableColumn
                label={props.actionColumn.label || '操作'}
                width={props.actionColumn.width}
                fixed={props.actionColumn.fixed}
                align="center"
              >
                {(scope: any) => props.actionColumn?.render(scope)}
              </ElTableColumn>
            )}
            {slots.default?.()}
          </ElTable>
        )}
      </div>
    );
  }
});
