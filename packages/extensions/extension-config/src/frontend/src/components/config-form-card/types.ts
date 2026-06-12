/**
 * @fileoverview MfwConfigFormCard 类型定义
 */

import type { FormItemConfig as BaseFormItemConfig } from 'moyan-mfw-base/frontend';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

/** 配置表单项配置 */
export interface ConfigFormItemConfig extends Omit<BaseFormItemConfig, 'component'> {
  /** 组件（可选，默认 el-input） */
  component?: string | any;
  /** 配置类型 */
  configType?: ConfigType;
  /** 配置描述 */
  description?: string;
}

/** 配置分组配置 */
export interface ConfigFormGroupConfig {
  /** 分组类型 */
  type?: 'el-collapse' | 'el-tabs';
  /** 分组列表 */
  groups?: Array<{
    key: string;
    title: string;
    template?: ConfigFormItemConfig[];
  }>;
  /** 激活的名称（collapse） */
  activeNames?: any;
  /** 激活的名称（tabs） */
  activeName?: any;
}

/** Props 接口 */
export interface MfwConfigFormCardProps {
  /** 应用 ID（null=全局，非null=租户配置） */
  appId: number | null;
  /** 配置分组标识 */
  groupKey: string;
  /** 表单项配置（与 formGroup 二选一，优先使用 formGroup） */
  items?: ConfigFormItemConfig[];
  /** 分组 UI 配置 */
  formGroup?: ConfigFormGroupConfig;
  /** 表单属性 */
  formProps?: Record<string, any>;
  /** 是否禁用 */
  disabled?: boolean;
}

/** 暴露实例接口 */
export interface MfwConfigFormCardExpose {
  /** 确认提交（内部调用 validate + API 批量更新） */
  onConfirm: () => Promise<void>;
  /** 重置表单（重新拉取后端数据） */
  reset: () => Promise<void>;
}
