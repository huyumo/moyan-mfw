/**
 * @fileoverview MfwTableList 类型定义
 */

import type { VNode } from 'vue';

/** 列格式化函数：(单元格值, 行数据) => 渲染内容 */
export type ColumnFormatter = (value: any, row: any) => any;

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
  /**
   * 格式化配置（与 render 同时存在时 render 优先）：
   * - 字符串：格式化方法名，在 MfwListPage/MfwTableList 的 formatters 中按名查找（页面注入优先），
   *   内置可用名：`copyable`（点击复制文本，等价于 cp: true）、`dateTime`（MfwDateFormat，空值显示 '--'）
   * - 函数：直接调用 (value, row)
   */
  formatter?: string | ColumnFormatter;
  /** 是否渲染为可点击复制文本（点击复制单元格内容，空值显示 '-'；等价于 formatter: 'copyable'） */
  cp?: boolean;
  /** 内容超长时是否显示 Tooltip */
  showOverflowTooltip?: boolean;
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
  /**
   * 命名格式化方法表：列配置 formatter 为字符串时按名在此查找（内置 copyable/dateTime 之外的扩展）
   * 方法签名 (value, row) => 渲染内容
   */
  formatters?: Record<string, ColumnFormatter>;
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
