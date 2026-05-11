/**
 * @fileoverview MfwFormCard 类型定义
 */

import type { FormRules } from 'element-plus';

/** 表单项配置 */
export interface FormItemConfig {
  /** 字段名 */
  key: string;
  /** 字段标签 */
  label?: string;
  /** 字段类型 */
  type?: string;
  /** 默认值 */
  value?: any;
  /** 占位符 */
  placeholder?: string;
  /** 组件 */
  component: string | any;
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
  /** 跨度 */
  span?: number;
  /** 变化回调 */
  change?: (scope: { value: any; key: string; formData: any }) => void;
  /** 后置文本 */
  afterText?: string;
  /** 帮助文本 */
  helper?: string | ((formData: any) => string);
  /** 帮助类型 */
  helperType?: string;
  /** ref 名称 */
  ref?: string;
  /** 测试标识 */
  testId?: string;
}

/** 分组配置 */
export interface FormGroupConfig {
  /** 分组类型 */
  type?: 'el-collapse' | 'el-tabs';
  /** 分组列表 */
  groups?: Array<{
    key: string;
    title: string;
    template?: FormItemConfig[];
  }>;
  /** 激活的名称（collapse） */
  activeNames?: any;
  /** 激活的名称（tabs） */
  activeName?: any;
}

/** Props 接口 */
export interface MfwFormCardProps {
  /** 表单数据 */
  formData?: Record<string, any>;
  /** 表单项配置 */
  template?: FormItemConfig[];
  /** 分组配置 */
  formGroup?: FormGroupConfig;
  /** 表单模式 */
  mode?: 'add' | 'edit' | 'view';
  /** 是否禁用 */
  disabled?: boolean;
  /** 验证规则 */
  rules?: FormRules;
  /** 表单属性 */
  formProps?: Record<string, any>;
  /** 外部变化标识 */
  pChange?: boolean;
}

/** Emits 接口 */
export interface MfwFormCardEmits {
  (e: 'change', scope: { value: any; key: string; formData: any }): void;
  (e: 'loads'): void;
  (e: 'loadRefs'): void;
}

/** 暴露实例接口 */
export interface MfwFormCardInstance {
  /** 验证表单 */
  validate: () => Promise<boolean>;
  /** 重置表单 */
  resetForm: () => void;
  /** 表单引用 */
  curdForm: any;
}
