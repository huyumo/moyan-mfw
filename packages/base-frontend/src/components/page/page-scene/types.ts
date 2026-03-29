/**
 * @fileoverview MfwPageScene 类型定义
 */

import type { VNode } from 'vue';

// ========== 搜索表单项类型 ==========

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
  /** Element Plus 组件（可选，用于自定义） */
  component?: any;
  /** Element Plus 组件属性 */
  elProps?: Record<string, any>;
  /** 默认值 */
  defaultValue?: any;
  /** 占位文本 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 表单项跨度（1-24） */
  span?: number;
}

// ========== 表格列配置类型 ==========

/** 表格列配置 */
export interface TableColumn {
  /** 列字段名 */
  prop: string;
  /** 列标题 */
  label: string;
  /** 列宽度 */
  width?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 是否固定 */
  fixed?: 'left' | 'right' | false;
  /** 是否可排序 */
  sortable?: boolean | 'custom';
  /** 排序方式 */
  order?: 'ascending' | 'descending' | null;
  /** 自定义渲染函数 */
  render?: (scope: { row: any; column: any; $index: number }) => VNode | string;
  /** 格式化函数 */
  formatter?: (row: any) => string;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
}

/** 操作列配置 */
export interface ActionColumn extends TableColumn {
  /** 自定义渲染函数（必需） */
  render: (scope: { row: any; column: any; $index: number }) => VNode;
}

// ========== Props 接口 ==========

/** MfwPageScene Props 接口 */
export interface MfwPageSceneProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 表格列配置 */
  columns?: TableColumn[];
  /** 操作列配置 */
  actionColumn?: ActionColumn;
  /** 数据加载函数 */
  loadData?: (params: Record<string, any>) => Promise<TableData>;
  /** 是否显示搜索面板 */
  showSearch?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 行键名 */
  rowKey?: string;
  /** 是否支持行选择 */
  rowSelection?: boolean;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 每页条数 */
  pageSize?: number;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 表格高度（固定或 auto） */
  tableHeight?: string | number;
  /** 空数据提示文本 */
  emptyText?: string;
  /** 是否显示边框 */
  border?: boolean;
  /** 是否斑马纹 */
  stripe?: boolean;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
}

// ========== Emits 接口 ==========

/** MfwPageScene Emits 接口 */
export interface MfwPageSceneEmits {
  /** 搜索事件 */
  (e: 'search', formData: Record<string, any>): void;
  /** 重置事件 */
  (e: 'reset'): void;
  /** 刷新事件 */
  (e: 'refresh'): void;
  /** 选择变化事件 */
  (e: 'selection-change', selection: any[]): void;
  /** 分页变化事件 */
  (e: 'page-change', page: number, pageSize: number): void;
  /** 排序变化事件 */
  (e: 'sort-change', { prop, order }: { prop: string; order: 'ascending' | 'descending' | null }): void;
}

// ========== 表格数据类型 ==========

/** 表格数据响应 */
export interface TableData {
  /** 数据列表 */
  list: any[];
  /** 总数 */
  total: number;
}

// ========== Slots 接口 ==========

/** MfwPageScene Slots 接口 */
export interface MfwPageSceneSlots {
  /** 搜索面板操作区域 */
  'search-actions'?: (props: { loading: boolean }) => VNode[];
  /** 表格操作列 */
  'action-column'?: (props: { row: any; $index: number }) => VNode[];
  /** 空数据自定义 */
  'empty'?: () => VNode[];
  /** 表格头部自定义 */
  'table-header'?: (props: { columns: TableColumn[] }) => VNode[];
}

// ========== 暴露实例接口 ==========

/** MfwPageScene 暴露实例接口 */
export interface MfwPageSceneInstance {
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

// ========== 内部状态类型 ==========

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
