/**
 * @fileoverview MfwConfigFormCard 类型定义
 */

import type { FormGroupConfig } from 'moyan-mfw-base/frontend';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

/** 配置表单项配置 */
export interface ConfigFormItemConfig {
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
  /** 组件（可选，默认 el-input） */
  component?: string | any;
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
  /** 配置类型 */
  configType?: ConfigType;
  /** 配置描述 */
  description?: string;
}

/** Props 接口 */
export interface MfwConfigFormCardProps {
  /** 应用 ID（null=全局，非null=租户配置） */
  appId: number | null;
  /** 配置分组标识 */
  groupKey: string;
  /** 表单项配置 */
  items: ConfigFormItemConfig[];
  /** 分组 UI 配置（直接使用 MfwFormCard 的 FormGroupConfig） */
  formGroup?: FormGroupConfig;
}

/** 暴露实例接口 */
export interface MfwConfigFormCardExpose {
  /** 确认提交（内部调用 validate + API 批量更新） */
  onConfirm: () => Promise<void>;
  /** 重置表单（重新拉取后端数据） */
  reset: () => Promise<void>;
}
