/**
 * @fileoverview MfwBaseListPage 类型定义
 */

import type { VNode } from 'vue';
import type { SearchTemplateItem, LoadParams, TableData } from '../list-page/types';

export type { LoadParams, TableData };

/** MfwBaseListPage Props 接口 */
export interface MfwBaseListPageProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 数据加载函数 */
  loadData?: (params: LoadParams) => Promise<TableData>;
  /** 筛选触发模式 */
  searchTrigger?: 'change' | 'submit';
  /** 是否显示搜索面板 */
  showSearch?: boolean;
  /** 搜索标签宽度 */
  searchLabelWidth?: string;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 每页条数 */
  pageSize?: number;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 空数据提示文本 */
  emptyText?: string;
}

/** MfwBaseListPage 暴露实例接口 */
export interface MfwBaseListPageInstance {
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 重置搜索条件 */
  resetSearch: () => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 获取当前搜索条件 */
  getSearchParams: () => Record<string, any>;
  /** 获取表格数据 */
  getData: () => any[];
  /** 获取分页信息 */
  getPagination: () => {
    currentPage: number;
    pageSize: number;
    total: number;
  };
}
