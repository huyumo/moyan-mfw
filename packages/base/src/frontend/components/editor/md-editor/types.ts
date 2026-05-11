/**
 * @fileoverview MfwMdEditor Markdown 编辑器组件类型定义
 */

/** MfwMdEditor Props */
export interface MfwMdEditorProps {
  /** v-model 双向绑定值 */
  modelValue?: string;
  /** 编辑器高度，默认 400 */
  height?: number | string;
  /** 占位文本 */
  placeholder?: string;
  /** 只读模式 */
  readonly?: boolean;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 是否显示代码块行号 */
  showCodeRowNumber?: boolean;
  /** 是否显示移动端切换按钮 */
  showMobileToggle?: boolean;
  /** 预览模式: desktop 或 mobile */
  previewMode?: 'desktop' | 'mobile';
  /** 移动端预览视口宽度 */
  mobileWidth?: string;
  /** 图片上传接口（可选，默认使用项目接口） */
  uploadApi?: string;
  /** 上传请求头 */
  uploadHeaders?: Record<string, string>;
}

/** MfwMdEditor Emits */
export interface MfwMdEditorEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'save', value: string): void;
}

/** MfwMdEditor Instance */
export interface MfwMdEditorInstance {
  /** 获取 Markdown 内容 */
  getContent: () => string;
  /** 清空内容 */
  clear: () => void;
}
