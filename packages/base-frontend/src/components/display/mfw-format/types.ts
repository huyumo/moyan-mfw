/**
 * @fileoverview MfwFormat 格式化组件类型定义
 * @description 提供日期、图片、字典、标签等数据格式化展示组件
 */

import type { Component } from 'vue';

// ========== 基础类型 ==========

/** 格式化组件通用 Props */
export interface BaseFormatProps {
  /** 空值显示文本 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
}

/** 格式化组件通用实例 */
export interface BaseFormatInstance {
  /** 组件引用 */
  componentRef: Component | null;
}

// ========== 日期格式化 ==========

/** 日期格式化 Props */
export interface DateFormatProps extends BaseFormatProps {
  /** 日期值 */
  value?: Date | string | number | null;
  /** 格式化模板 */
  fmt?: string;
}

/** 日期格式化 Emits */
export interface DateFormatEmits {
  (e: 'click'): void;
}

/** 日期格式化实例 */
export interface DateFormatInstance {
  /** 格式化后的文本 */
  formattedText: string;
}

// ========== 图片格式化 ==========

/** 图片格式化 Props */
export interface ImageFormatProps extends BaseFormatProps {
  /** 图片 URL */
  value?: string | string[] | null;
  /** 图片宽度 */
  width?: number | string;
  /** 图片高度 */
  height?: number | string;
  /** 是否支持预览 */
  preview?: boolean;
  /** -fit 模式 */
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
}

/** 图片格式化 Emits */
export interface ImageFormatEmits {
  (e: 'click', url: string): void;
}

// ========== 字典格式化 ==========

/** 字典项 */
export interface DictItem {
  /** 字典值 */
  value: string | number;
  /** 字典标签 */
  label: string;
  /** 字典类型（可选） */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

/** 字典格式化 Props */
export interface DictFormatProps extends BaseFormatProps {
  /** 字典值 */
  value?: string | number | null;
  /** 字典数据 */
  dict?: DictItem[];
  /** 是否显示为标签 */
  asTag?: boolean;
}

/** 字典格式化 Emits */
export interface DictFormatEmits {
  (e: 'click', item: DictItem | null): void;
}

// ========== 标签格式化 ==========

/** 标签格式化 Props */
export interface TagFormatProps extends BaseFormatProps {
  /** 标签文本 */
  value?: string | null;
  /** 标签类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** 是否自动根据文本生成颜色 */
  autoColor?: boolean;
  /** 是否为圆角 */
  round?: boolean;
  /** 是否为空心 */
  effect?: 'light' | 'dark' | 'plain';
}

/** 标签格式化 Emits */
export interface TagFormatEmits {
  (e: 'click'): void;
}
