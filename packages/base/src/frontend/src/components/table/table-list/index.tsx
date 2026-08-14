/**
 * @fileoverview MfwTableList 表格列表组件
 * @description 配置驱动的表格组件，支持动态列、自定义渲染等
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  withDirectives,
  h,
  type PropType
} from 'vue';
import {
  ElTable,
  ElTableColumn,
  ElLoading
} from 'element-plus';
import { renderCopyableText } from '../../../utils/clipboard';
import MfwDateFormat from '../../display/mfw-format/date-format';
import type { MfwTableListInstance, TableColumnConfig, ActionColumnConfig, ColumnFormatter } from './types';

/** 内置命名格式化器（页面注入的 formatters 同名时优先） */
const BUILTIN_FORMATTERS: Record<string, ColumnFormatter> = {
  /** 可点击复制文本（等价于列配置 cp: true） */
  copyable: (value) => renderCopyableText(value),
  /** 日期时间格式化（MfwDateFormat，空值显示 '--'） */
  dateTime: (value) => h(MfwDateFormat, { value }),
};

export default defineComponent({
  name: 'MfwTableList',

  props: {
    /** 表格数据 */
    data: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    /** 列配置 */
    columns: {
      type: Array as PropType<TableColumnConfig[]>,
      default: () => []
    },
    /** 命名格式化方法表（列配置 formatter 为字符串时按名查找，内置 copyable/dateTime 之外的自定义方法） */
    formatters: {
      type: Object as PropType<Record<string, ColumnFormatter>>,
      default: () => ({})
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
      type: Object as PropType<ActionColumnConfig>
    },
    /** Element Plus Table Props */
    elProps: {
      type: Object as PropType<Record<string, any>>,
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
          const { render, formatter, cp, ...columnProps } = column;
          return (
            <ElTableColumn
              key={prop}
              {...columnProps}
            >
              {() => renderColumns(column.children)}
            </ElTableColumn>
          );
        }

        const { render, formatter, cp, ...columnProps } = column;
        return (
          <ElTableColumn
            key={prop}
            prop={prop}
            {...columnProps}
          >
            {(scope: any) => {
              if (column.render) return column.render(scope);
              if (typeof column.formatter === 'function') {
                return column.formatter(scope.row[prop], scope.row);
              }
              const name = typeof column.formatter === 'string'
                ? column.formatter
                : column.cp ? 'copyable' : null;
              if (name) {
                const fn = (props.formatters ?? {})[name] ?? BUILTIN_FORMATTERS[name];
                if (fn) return fn(scope.row[prop], scope.row);
              }
              return scope.row[prop];
            }}
          </ElTableColumn>
        );
      });
    };

    return () => withDirectives(
      <div class="mfw-table-list">
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
      </div>,
      [[ElLoading.directive, props.loading, { text: '加载中...' }]]
    );
  }
});
