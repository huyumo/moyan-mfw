/**
 * @fileoverview MfwSearchPanel 类型定义
 */

import type { VNode } from 'vue';
import type { SearchTemplateItem, SearchItemRenderParams } from '../list-page/types';

/** MfwSearchPanel Props 接口 */
export interface MfwSearchPanelProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 筛选触发模式 */
  searchTrigger?: 'change' | 'submit';
  /** 是否显示筛选面板 */
  showSearch?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 每项占用的栅格数 */
  itemSpan?: number;
  /** 是否显示查询按钮 */
  showSearchButton?: boolean;
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
}

/** MfwSearchPanel Emits 接口 */
export interface MfwSearchPanelEmits {
  /** 搜索事件 */
  (e: 'search', formData: Record<string, any>): void;
  /** 重置事件 */
  (e: 'reset'): void;
  /** 表单变化事件 */
  (e: 'change', key: string, value: any, formData: Record<string, any>): void;
}

/** 自定义筛选项插槽参数（与 render 函数参数一致） */
export type SearchItemSlotProps = SearchItemRenderParams;

/** MfwSearchPanel Slots 接口 */
export interface MfwSearchPanelSlots {
  /** 按钮区左侧 */
  'search-actions'?: (props: { loading: boolean }) => VNode[];
  /** 面板底部 */
  'search-extra'?: () => VNode[];
  /** 自定义筛选项（动态插槽名 search-item-${key} 或由 item.slot 指定） */
  [key: `search-item-${string}`]: (props: SearchItemSlotProps) => VNode[];
}

/** MfwSearchPanel 暴露实例接口 */
export interface MfwSearchPanelInstance {
  /** 重置表单 */
  reset: () => void;
  /** 获取表单值 */
  getFormValues: () => Record<string, any>;
  /** 设置表单值 */
  setFormValues: (values: Record<string, any>) => void;
  /** 触发搜索 */
  doSearch: () => void;
}