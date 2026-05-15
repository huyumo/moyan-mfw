/**
 * @fileoverview MfwJsonEditor JSON 编辑器组件类型定义
 */

/** MfwJsonEditor Props */
export interface MfwJsonEditorProps {
  /** 绑定值 */
  modelValue?: any;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否显示行号 */
  lineNumbers?: boolean;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 最大深度 */
  maxDepth?: number;
  /** 是否排序键 */
  sortKeys?: boolean;
  /** 缩进空格数 */
  indent?: number;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最小高度 */
  minHeight?: string;
  /** 最大高度 */
  maxHeight?: string;
}

/** MfwJsonEditor Emits */
export interface MfwJsonEditorEmits {
  /** 更新绑定值 */
  (e: 'update:modelValue', value: any): void;
  /** 变化事件 */
  (e: 'change', value: any): void;
  /** 错误事件 */
  (e: 'error', error: Error): void;
}

/** MfwJsonEditor Instance */
export interface MfwJsonEditorInstance {
  /** 格式化 JSON */
  format: () => void;
  /** 清空内容 */
  clear: () => void;
  /** 复制 JSON */
  copy: () => Promise<void>;
  /** 获取 JSON 字符串 */
  getJsonString: () => string;
}
