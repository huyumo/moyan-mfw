/**
 * @fileoverview MfwPageWrapper 类型定义
 */

import type { VNode } from 'vue';

/** 面包屑项 */
export interface BreadcrumbItem {
  /** 路径 */
  path?: string;
  /** 标题 */
  title: string;
  /** 是否可点击 */
  clickable?: boolean;
}

/** MfwPageWrapper Props 接口 */
export interface MfwPageWrapperProps {
  /** 是否显示面包屑 */
  showBreadcrumb?: boolean;
  /** 是否显示页面标题 */
  showTitle?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 自定义页面标题（覆盖自动生成） */
  title?: string;
  /** 自定义面包屑（覆盖自动生成） */
  breadcrumb?: BreadcrumbItem[];
  /** 内容区 padding */
  padding?: string | number;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 背景色 */
  background?: string;
}

/** MfwPageWrapper Emits 接口 */
export interface MfwPageWrapperEmits {
  /** 刷新事件 */
  (e: 'refresh'): void;
}

/** MfwPageWrapper Slots 接口 */
export interface MfwPageWrapperSlots {
  /** 页面主要内容 */
  default?: () => VNode[];
  /** 自定义整个头部区域 */
  header?: () => VNode[];
  /** 标题右侧额外内容 */
  'header-extra'?: () => VNode[];
  /** 自定义面包屑 */
  breadcrumb?: () => VNode[];
  /** 面包屑右侧额外内容 */
  'breadcrumb-extra'?: () => VNode[];
  /** 工具栏区域 */
  toolbar?: () => VNode[];
  /** 页面底部区域 */
  footer?: () => VNode[];
}

/** MfwPageWrapper 暴露实例接口 */
export interface MfwPageWrapperInstance {
  /** 刷新页面 */
  refresh: () => void;
  /** 获取当前页面标题 */
  getTitle: () => string;
  /** 获取面包屑数据 */
  getBreadcrumb: () => BreadcrumbItem[];
}