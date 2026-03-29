/**
 * @fileoverview MfwIconPicker 图标选择器组件类型定义
 */

/** 图标数据项 */
export interface IconItem {
  /** 图标名称 */
  name: string;
  /** 图标分类 */
  category?: string;
  /** 标签/关键字 */
  tags?: string[];
}

/** MfwIconPicker Props */
export interface MfwIconPickerProps {
  /** 绑定值 */
  modelValue?: string;
  /** 图标列表 */
  icons?: IconItem[];
  /** 是否显示搜索 */
  showSearch?: boolean;
  /** 搜索占位符 */
  searchPlaceholder?: string;
  /** 图标尺寸 */
  iconSize?: number | string;
  /** 每行图标数量 */
  columns?: number;
  /** 弹窗宽度 */
  popupWidth?: number | string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 清空提示文本 */
  clearText?: string;
}

/** MfwIconPicker Emits */
export interface MfwIconPickerEmits {
  /** 更新绑定值 */
  (e: 'update:modelValue', value: string): void;
  /** 选择变化 */
  (e: 'change', value: string): void;
}

/** MfwIconPicker Instance */
export interface MfwIconPickerInstance {
  /** 打开选择器 */
  open: () => void;
  /** 关闭选择器 */
  close: () => void;
  /** 清空选择 */
  clear: () => void;
}
