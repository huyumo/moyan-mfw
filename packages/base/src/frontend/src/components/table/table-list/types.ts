/**
 * @fileoverview MfwTableList 类型定义
 */

import type { VNode } from 'vue';

/** 表格列配置 */
export interface TableColumnConfig {
  /** 列名 */
  prop?: string;
  /** 列标签 */
  label?: string;
  /** 列宽 */
  width?: string | number;
  /** 最小列宽 */
  minWidth?: string | number;
  /** 是否固定 */
  fixed?: boolean | 'left' | 'right';
  /** 是否可排序 */
  sortable?: boolean | 'custom';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 渲染函数 */
  render?: (scope: any) => VNode | string;
  /** 格式化函数 */
  formatter?: (row: any) => any;
  /** 子列 */
  children?: TableColumnConfig[];
}

/** 操作列配置 */
export interface ActionColumnConfig {
  /** 列标签 */
  label?: string;
  /** 列宽 */
  width?: string | number;
  /** 是否固定 */
  fixed?: boolean | 'left' | 'right';
  /** 渲染函数 */
  render: (scope: any) => VNode | string;
}

/** Props 接口 */
export interface MfwTableListProps {
  /** 表格数据 */
  data?: any[];
  /** 列配置 */
  columns?: TableColumnConfig[];
  /** 是否加载中 */
  loading?: boolean;
  /** 是否显示边框 */
  border?: boolean;
  /** 是否斑马纹 */
  stripe?: boolean;
  /** 是否多选 */
  selection?: boolean;
  /** 是否显示序号 */
  index?: boolean;
  /** 操作列配置 */
  actionColumn?: ActionColumnConfig;
  /** Element Plus Table Props */
  elProps?: Record<string, any>;
}

/** Emits 接口 */
export interface MfwTableListEmits {
  (e: 'selection-change', selection: any[]): void;
  (e: 'sort-change', info: { column: any; prop: string; order: string | null }): void;
}

/** 暴露实例接口 */
export interface MfwTableListInstance {
  /** 清空选择 */
  clearSelection: () => void;
  /** 全选/取消全选 */
  toggleAllSelection: () => void;
  /** 设置当前行 */
  setCurrentRow: (row: any) => void;
  /** 表格数据 */
  tableData: any[];
}
