/**
 * @fileoverview MfwRadioGroup 单选组组件类型定义
 */

export interface RadioOption {
  label: string;
  value: string | number | boolean;
}

export interface MfwRadioGroupProps {
  modelValue?: string | number | boolean;
  options?: RadioOption[];
  disabled?: boolean;
  buttonMode?: boolean;
}

export interface MfwRadioGroupEmits {
  (e: 'update:modelValue', value: string | number | boolean): void;
  (e: 'change', value: string | number | boolean): void;
}
