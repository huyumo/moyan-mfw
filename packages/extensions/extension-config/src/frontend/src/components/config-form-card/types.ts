/**
 * @fileoverview MfwConfigFormCard 类型定义
 */

import type { FormItemConfig, FormGroupConfig } from 'moyan-mfw-base/frontend';
import { ConfigType } from '@internal/config-shared';

/** 配置表单项配置 */
export interface ConfigFormItemConfig extends FormItemConfig {
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
  /** 私有配置标签页标题 */
  privateTabTitle?: string;
  /** 公共配置标签页标题 */
  publicTabTitle?: string;
}

/** 暴露实例接口 */
export interface MfwConfigFormCardExpose {
  /** 确认提交（内部调用 validate + API 批量更新） */
  onConfirm: () => Promise<void>;
  /** 重置表单（重新拉取后端数据） */
  reset: () => Promise<void>;
}
