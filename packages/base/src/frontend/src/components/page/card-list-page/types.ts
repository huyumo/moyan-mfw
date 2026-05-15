/**
 * @fileoverview MfwCardListPage 类型定义
 */

import type { VNode } from 'vue';
import type { SearchTemplateItem, LoadParams, TableData } from '../list-page/types';

// 重新导出共享类型
export type { SearchTemplateItem, LoadParams, TableData };

/** 卡片栅格配置 */
export interface CardGridConfig {
  /** 卡片最小宽度 */
  minWidth?: number;
  /** 卡片间距 */
  gap?: number;
}

/** MfwCardListPage Props 接口 */
export interface MfwCardListPageProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
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
  
  /** 渲染模式 */
  renderMode?: 'table' | 'card';
  
  /** 卡片渲染函数 */
  cardRender?: (item: any, index: number) => VNode;
  
  /** 卡片栅格配置 */
  cardGrid?: CardGridConfig;
  
  /** 空数据提示文本 */
  emptyText?: string;
}

/** MfwCardListPage Emits 接口 */
export interface MfwCardListPageEmits {
  (e: 'search', formData: Record<string, any>): void;
  (e: 'reset'): void;
  (e: 'page-change', page: number, pageSize: number): void;
}

/** MfwCardListPage Slots 接口 */
export interface MfwCardListPageSlots {
  /** 底部额外内容 */
  default?: () => VNode[];
  /** 筛选按钮区 */
  'search-actions'?: (props: { loading: boolean }) => VNode[];
  /** 卡片渲染 */
  'card-item'?: (props: { item: any; index: number }) => VNode[];
  /** 空数据 */
  empty?: () => VNode[];
}

/** MfwCardListPage 暴露实例接口 */
export interface MfwCardListPageInstance {
  refresh: () => Promise<void>;
  resetSearch: () => void;
  setLoading: (loading: boolean) => void;
  getSearchParams: () => Record<string, any>;
}