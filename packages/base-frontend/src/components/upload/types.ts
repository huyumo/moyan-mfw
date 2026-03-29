/**
 * @fileoverview MfwUpload 上传组件类型定义
 * @description 提供文件上传组件的类型定义
 */

import type { UploadProps, UploadFile, UploadUserFile } from 'element-plus';

/** 上传类型 */
export type UploadType = 'form' | 'oss' | 'custom';

/** 上传结果 */
export interface UploadResult {
  /** 文件 URL */
  url: string;
  /** 文件 ID（可选） */
  id?: string;
  /** 文件名 */
  name?: string;
  /** 文件大小 */
  size?: number;
  /** 额外数据 */
  [key: string]: any;
}

/** 上传器接口 */
export interface IUploader {
  /** 上传文件 */
  upload: (options: any) => Promise<UploadResult>;
  /** 删除文件 */
  delete?: (url: string) => Promise<void>;
}

/** 上传请求选项 */
export interface UploadRequestOptions {
  /** 文件对象 */
  file: File;
  /** 文件名 */
  filename: string;
  /** 上传进度回调 */
  onProgress?: (percentage: number) => void;
  /** 上传成功回调 */
  onSuccess?: (result: UploadResult) => void;
  /** 上传失败回调 */
  onError?: (error: Error) => void;
}

/** 上传文件 */
export interface UploadFileInfo extends Omit<UploadUserFile, 'status'> {
  /** 文件 URL */
  url?: string;
  /** 文件 ID */
  id?: string;
  /** 上传进度 */
  progress?: number;
  /** 上传状态 */
  status?: 'ready' | 'uploading' | 'success' | 'error';
}

/** MfwUpload 组件 Props */
export interface MfwUploadProps {
  /** 绑定值 */
  modelValue?: string | string[];
  /** 上传类型 */
  uploadType?: UploadType;
  /** 是否多选 */
  multiple?: boolean;
  /** 最大上传数量 */
  limit?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 文件大小限制（MB） */
  maxSize?: number;
  /** 允许的文件类型 */
  accept?: string;
  /** 允许的文件扩展名 */
  fileTypes?: string[];
  /** 上传前回调 */
  beforeUpload?: (file: File) => boolean | Promise<File>;
  /** 自定义上传方法 */
  httpRequest?: (options: any) => Promise<UploadResult>;
  /** Element Plus Upload Props */
  elProps?: Partial<UploadProps>;
  /** 列表类型 */
  listType?: 'text' | 'picture' | 'picture-card';
  /** 是否显示删除按钮 */
  showDelete?: boolean;
  /** 空值提示文本 */
  emptyText?: string;
}

/** MfwUpload 组件事件 */
export interface MfwUploadEmits {
  /** 更新绑定值 */
  (e: 'update:modelValue', value: string | string[]): void;
  /** 文件变化事件 */
  (e: 'change', file: UploadFileInfo | UploadFileInfo[]): void;
  /** 上传成功事件 */
  (e: 'success', result: UploadResult, file: UploadFileInfo): void;
  /** 上传失败事件 */
  (e: 'error', error: Error, file: UploadFileInfo): void;
  /** 文件移除事件 */
  (e: 'remove', file: UploadFileInfo): void;
}

/** MfwUpload 组件实例 */
export interface MfwUploadInstance {
  /** 清除上传列表 */
  clear: () => void;
  /** 手动上传 */
  submit: () => void;
  /** 上传文件列表 */
  uploadFiles: UploadFileInfo[];
}
