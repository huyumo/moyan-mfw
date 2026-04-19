/**
 * @fileoverview MfwListPage 类型定义
 */

import type { VNode } from 'vue';
import type { TableColumnConfig, ActionColumnConfig } from '../../table/table-list/types';

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
  /** Element Plus 组件属性 */
  elProps?: Record<string, any>;
  /** 默认值 */
  defaultValue?: any;
  /** 占位文本 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否立即触发搜索（change 模式下） */
  immediate?: boolean;
}

/** 加载参数 */
export interface LoadParams {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 搜索参数 */
  [key: string]: any;
}

/** 表格数据响应 */
export interface TableData {
  /** 数据列表 */
  list: any[];
  /** 总数 */
  total: number;
}

/** 排序信息 */
export interface SortInfo {
  prop: string;
  order: 'ascending' | 'descending' | null;
}

/** MfwListPage Props 接口 */
export interface MfwListPageProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 表格列配置 */
  columns?: TableColumnConfig[];
  /** 操作列配置 */
  actionColumn?: ActionColumnConfig;
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
  /** 是否显示边框 */
  border?: boolean;
  /** 是否斑马纹 */
  stripe?: boolean;
  /** 是否支持行选择 */
  rowSelection?: boolean;
  /** 是否显示序号列 */
  showIndex?: boolean;
  /** 行键名 */
  rowKey?: string;
  /** 空数据提示文本 */
  emptyText?: string;
  /** 表格高度 */
  tableHeight?: string | number;
  /** Element Plus Table Props */
  elProps?: Record<string, any>;
}

/** MfwListPage Emits 接口 */
export interface MfwListPageEmits {
  /** 搜索事件 */
  (e: 'search', formData: Record<string, any>): void;
  /** 重置事件 */
  (e: 'reset'): void;
  /** 选择变化事件 */
  (e: 'selection-change', selection: any[]): void;
  /** 分页变化事件 */
  (e: 'page-change', page: number, pageSize: number): void;
  /** 排序变化事件 */
  (e: 'sort-change', info: SortInfo): void;
}

/** MfwListPage Slots 接口 */
export interface MfwListPageSlots {
  /** 表格底部额外内容 */
  default?: () => VNode[];
  /** 筛选面板按钮区 */
  'search-actions'?: (props: { loading: boolean }) => VNode[];
  /** 筛选面板底部 */
  'search-extra'?: () => VNode[];
  /** 自定义表格头部 */
  'table-header'?: () => VNode[];
  /** 表格底部额外内容 */
  'table-footer'?: () => VNode[];
  /** 自定义空数据展示 */
  empty?: () => VNode[];
  /** 自定义操作列 */
  'action-column'?: (props: { row: any; $index: number }) => VNode[];
}

/** MfwListPage 暴露实例接口 */
export interface MfwListPageInstance {
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