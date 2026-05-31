/**
 * @fileoverview MfwUpload 上传组件类型定义
 * @description 提供文件上传组件的类型定义
 */

import type { UploadProps, UploadFile, UploadUserFile } from 'element-plus';

/** 资源类型 */
export type ResourceType = 'image' | 'media' | 'file';

/** 图片资源格式 */
export interface ImageResource {
  src: string;
  width: number;
  height: number;
}

/** 媒体资源格式（视频、音频） */
export interface MediaResource {
  url: string;
  name: string;
  type: string;
  size?: number;
  duration?: number;
}

/** 文件资源格式 */
export interface FileResource {
  url: string;
  name: string;
  type: string;
  size?: number;
}

/** 资源值类型 */
export type ResourceValue = ImageResource | MediaResource | FileResource | string;

/** 上传类型 */
export type UploadType = 'form' | 'oss' | 'custom';

/** 上传结果 */
export interface UploadResult {
  url: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/** 上传器接口 */
export interface IUploader {
  upload: (options: any) => Promise<UploadResult>;
  delete?: (url: string) => Promise<void>;
}

/** 上传请求选项 */
export interface UploadRequestOptions {
  file: File;
  filename: string;
  onProgress?: (percentage: number) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

/** 上传文件信息 */
export interface UploadFileInfo extends Omit<UploadUserFile, 'status'> {
  url?: string;
  id?: string;
  progress?: number;
  status?: 'ready' | 'uploading' | 'success' | 'error';
}

/** MfwUpload 组件 Props */
export interface MfwUploadProps {
  modelValue?: ResourceValue | ResourceValue[];
  resourceType?: ResourceType;
  uploadType?: UploadType;
  multiple?: boolean;
  limit?: number;
  disabled?: boolean;
  maxSize?: number;
  accept?: string;
  fileTypes?: string[];
  beforeUpload?: (file: File) => boolean | Promise<File>;
  httpRequest?: (options: any) => Promise<UploadResult>;
  elProps?: Partial<UploadProps>;
  listType?: 'text' | 'picture' | 'picture-card';
  showDelete?: boolean;
  emptyText?: string;
  uploadUrl?: string;
  businessType?: string;
}

/** MfwUpload 组件事件 */
export interface MfwUploadEmits {
  (e: 'update:modelValue', value: ResourceValue | ResourceValue[]): void;
  (e: 'change', file: UploadFileInfo | UploadFileInfo[]): void;
  (e: 'success', result: UploadResult, file: UploadFileInfo): void;
  (e: 'error', error: Error, file: UploadFileInfo): void;
  (e: 'remove', file: UploadFileInfo): void;
}

/** MfwUpload 组件实例 */
export interface MfwUploadInstance {
  clear: () => void;
  submit: () => void;
  uploadFiles: UploadFileInfo[];
}

/** 上传方式类型（从环境变量配置） */
export type UploadMethodType = 'Form' | 'Oss';

/** OSS STS 授权响应 */
export interface OssAuthorization {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  stsToken: string;
  expiration: string;
  bucket: string;
  endpoint: string;
  timeout: number;
}

/** 裁剪选项 */
export interface CropOptions {
  enabled?: boolean;
  ratio?: number;
  outputWidth?: number;
  outputHeight?: number;
}

/** MfwImageSingle 组件 Props */
export interface MfwImageSingleProps {
  modelValue?: ImageResource;
  uploadType?: UploadMethodType;
  crop?: boolean;
  cropRatio?: number;
  cropWidth?: number;
  cropHeight?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  businessType?: string;
}

/** MfwImageGallery 组件 Props */
export interface MfwImageGalleryProps {
  modelValue?: ImageResource[];
  uploadType?: UploadMethodType;
  limit?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
  draggable?: boolean;
  businessType?: string;
}

/** ImageCropper 组件 Props */
export interface ImageCropperProps {
  visible: boolean;
  image: string | Blob;
  ratio?: number;
  outputWidth?: number;
  outputHeight?: number;
}