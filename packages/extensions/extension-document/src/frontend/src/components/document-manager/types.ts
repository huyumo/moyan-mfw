/**
 * @fileoverview MfwDocumentManager 类型定义
 * @description 单一可配置文档管理页面组件的类型
 */

import type { Component } from 'vue';
import type {
  TableColumnConfig,
  SearchTemplateItem,
} from 'moyan-mfw-base/frontend';
import { ExtValueType } from 'moyan-mfw-extension-document/shared';

/** 文档主表内置字段键 */
export type DocumentBuiltinFieldKey =
  | 'title'
  | 'type'
  | 'content'
  | 'summary'
  | 'images'
  | 'video'
  | 'tags'
  | 'docGroup'
  | 'status'
  | 'announcementStartTime'
  | 'announcementEndTime'
  | 'sortOrder'
  | 'virtualPageviews'
  | 'pageviews'
  | 'counter1'
  | 'counter2'
  | 'counter3';

/**
 * 文档字段配置
 * @description 驱动表单渲染。component 不传则按 key 使用默认控件。
 * 传 formFields 后只显示配置的字段；不传则显示全部内置字段。
 */
export interface DocumentFieldConfig {
  /** 字段键（内置字段名或自定义字段名） */
  key: DocumentBuiltinFieldKey | string;
  /** 字段标签，不传则使用默认 */
  label?: string;
  /** 自定义组件（字符串标签或组件对象），不传则使用字段默认控件 */
  component?: string | Component;
  /** 组件属性 */
  elProps?: Record<string, any>;
  /** 表单项属性 */
  itemProps?: Record<string, any>;
  /** 验证规则 */
  rules?: any;
  /** 是否显示（可基于表单数据动态判断） */
  show?: boolean | ((formData: any) => boolean);
  /** 是否禁用 */
  disabled?: boolean | ((formData: any) => boolean);
  /** 栅格跨度 */
  span?: number;
  /** 默认值 */
  value?: any;
  /** 占位符 */
  placeholder?: string;
  /** 值变化回调 */
  change?: (scope: { value: any; key: string; formData: any }) => void;
  /** 事件监听 */
  on?: Record<string, (...args: any[]) => void>;
}

/**
 * EAV 扩展字段配置
 * @description 为文档挂载自定义扩展字段，存储到 mfw_document_ext 表
 */
export interface DocumentExtFieldConfig {
  /** EAV 属性键 */
  extKey: string;
  /** 字段标签 */
  label?: string;
  /** 自定义组件，不传则按 valueType 使用默认控件 */
  component?: string | Component;
  /** 值类型（决定默认控件与反序列化方式） */
  valueType?: ExtValueType;
  /** 组件属性 */
  elProps?: Record<string, any>;
  /** 表单项属性 */
  itemProps?: Record<string, any>;
  /** 验证规则 */
  rules?: any;
  /** 是否显示 */
  show?: boolean | ((formData: any) => boolean);
  /** 是否禁用 */
  disabled?: boolean | ((formData: any) => boolean);
  /** 栅格跨度 */
  span?: number;
  /** 默认值 */
  value?: any;
  /** 占位符 */
  placeholder?: string;
  /** 字段描述 */
  description?: string;
  /** 值变化回调 */
  change?: (scope: { value: any; key: string; formData: any }) => void;
}

/** 列配置（复用 base TableColumnConfig） */
export type DocumentColumnConfig = TableColumnConfig;

/** 搜索项配置（复用 base SearchTemplateItem） */
export type DocumentSearchField = SearchTemplateItem;

/** Props 接口 */
export interface MfwDocumentManagerProps {
  /** 文档类型标识（必填） */
  docKey: string;
  /** 应用 ID（null=全局） */
  appId?: number | null;
  /**
   * 表单字段配置
   * 不传=显示全部内置字段；传则只显示配置的字段
   * 适用于协议/公共文档等只需标题+正文的场景
   */
  formFields?: DocumentFieldConfig[];
  /** EAV 扩展字段配置 */
  extFields?: DocumentExtFieldConfig[];
  /** 列配置，不传使用默认列 */
  columns?: DocumentColumnConfig[];
  /** 搜索项配置，不传使用默认搜索 */
  searchFields?: DocumentSearchField[];
  /** 是否显示新增按钮，默认 true */
  showAdd?: boolean;
  /** 是否显示编辑按钮，默认 true */
  showEdit?: boolean;
  /** 是否显示删除按钮，默认 true */
  showDelete?: boolean;
  /** 是否显示查看按钮，默认 true */
  showView?: boolean;
  /** 表单弹窗类型，默认 dialog */
  formPopupType?: 'dialog' | 'drawer';
  /** 表单弹窗宽度/尺寸，默认 720 */
  formPopupWidth?: number | string;
  /** 详情弹窗类型，默认 drawer */
  detailPopupType?: 'dialog' | 'drawer';
  /** 详情弹窗宽度/尺寸，默认 600 */
  detailPopupSize?: number | string;
  /** 页面标题（不传则取路由 meta.title） */
  title?: string;
  /** 每页数量，默认 20 */
  pageSize?: number;
  /** 请求基础路径，默认 /api/ext/document */
  baseUrl?: string;
  /** 新增按钮文字，默认"新建文档" */
  addText?: string;
  /** 是否显示搜索栏，默认 true */
  showSearch?: boolean;
  /** 新增时的默认值 */
  defaultValues?: Record<string, any>;
  /** 列表请求附加参数 */
  extraParams?: Record<string, any>;
}

/** 暴露实例接口 */
export interface MfwDocumentManagerExpose {
  /** 刷新列表 */
  refresh: () => Promise<void>;
}

/** 文档数据（与后端响应对齐） */
export interface DocumentData {
  id?: number;
  appId?: number | null;
  docKey?: string;
  onlyKey?: string;
  docGroup?: string;
  title?: string;
  content?: string;
  summary?: string;
  type?: string;
  images?: string[];
  video?: string;
  tags?: string;
  status?: number;
  virtualPageviews?: number;
  pageviews?: number;
  viewPageviews?: number;
  counter1?: number;
  counter2?: number;
  counter3?: number;
  announcementStartTime?: string;
  announcementEndTime?: string;
  sortOrder?: number;
  createdAt?: string;
  updateAt?: string;
  extFields?: Array<{
    extKey: string;
    extValue: { data: any };
    valueType?: string;
    description?: string;
  }>;
}
