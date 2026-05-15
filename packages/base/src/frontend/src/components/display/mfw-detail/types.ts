/**
 * @fileoverview 详情展示组件类型定义
 * @description 提供详情面板、用户信息展示等组件类型
 */

import type { Component, CSSProperties } from 'vue';
import type { DictItem } from '../../mfw-format/types';
import type { ImageResource } from '../../../upload/types';

// ========== 详情面板 ==========

/** 详情项配置 */
export interface DetailItem {
  /** 字段标签 */
  label: string;
  /** 字段键名 */
  key: string;
  /** 格式化类型 */
  format?: 'text' | 'date' | 'image' | 'dict' | 'tag' | 'user' | 'custom';
  /** 格式化参数 */
  formatOptions?: Record<string, unknown>;
  /** 自定义渲染组件 */
  customRender?: Component;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 占位宽度 (1-4) */
  span?: number;
  /** 字典数据 (用于 dict 格式化) */
  dict?: DictItem[];
  /** 日期格式 (用于 date 格式化) */
  dateFormat?: string;
}

/** 详情面板 Props */
export interface DetailPanelProps {
  /** 详情数据 */
  data?: Record<string, unknown>;
  /** 详情项配置列表 */
  items?: DetailItem[];
  /** 标题 */
  title?: string;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 列数 (1-4) */
  columns?: number;
  /** 标签宽度 */
  labelWidth?: string | number;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 空值显示文本 */
  emptyText?: string;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
}

/** 详情面板 Emits */
export interface DetailPanelEmits {
  (e: 'item-click', item: DetailItem, value: unknown): void;
}

// ========== 用户信息展示 ==========

/** 用户信息 */
export interface UserInfo {
  /** 用户 ID */
  id: string | number;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 头像（支持 URL 字符串或 ImageResource 格式） */
  avatar?: string | ImageResource;
  /** 部门 */
  department?: string;
  /** 职位 */
  position?: string;
  /** 集箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 状态 */
  status?: 'active' | 'inactive' | 'disabled';
}

/** 用户信息获取函数类型 */
export type UserFetcher = (userId: string | number) => Promise<UserInfo | null>;

/** 用户信息展示 Props */
export interface UserFormatProps {
  /** 用户 ID */
  userId?: string | number | null;
  /** 用户信息获取函数 */
  fetcher?: UserFetcher;
  /** 显示模式 */
  mode?: 'avatar' | 'name' | 'card' | 'full';
  /** 头像尺寸 */
  avatarSize?: number | 'small' | 'default' | 'large';
  /** 是否显示部门 */
  showDepartment?: boolean;
  /** 是否显示职位 */
  showPosition?: boolean;
  /** 是否显示状态 */
  showStatus?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 空值显示文本 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
}

/** 用户信息展示 Emits */
export interface UserFormatEmits {
  (e: 'click', user: UserInfo | null): void;
  (e: 'loaded', user: UserInfo | null): void;
}

// ========== 描述列表 ==========

/** 描述列表 Props */
export interface DescriptionsProps {
  /** 数据项 */
  data?: Record<string, unknown>;
  /** 列配置 */
  columns?: Array<{ label: string; key: string; span?: number }>;
  /** 边框样式 */
  bordered?: boolean;
  /** 列数 */
  column?: number;
  /** 标签宽度 */
  labelWidth?: string | number;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
}

// ========== 通用格式化 ==========

/** 格式化器函数类型 */
export type FormatterFunction = (value: unknown, options: Record<string, unknown>) => string | Component;

/** 格式化器配置 */
export interface FormatterConfig {
  /** 格式化类型 */
  type: string;
  /** 格式化函数 */
  formatter: FormatterFunction;
  /** 默认选项 */
  defaultOptions?: Record<string, unknown>;
}