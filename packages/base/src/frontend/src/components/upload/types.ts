/**
 * @fileoverview 上传组件类型定义
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

/** MfwUploadFile 组件 Props（按钮式单文件上传） */
export interface MfwUploadFileProps {
  modelValue?: FileResource | string;
  uploadType?: UploadMethodType;
  disabled?: boolean;
  maxSize?: number;
  fileType?: string[];
  accept?: string;
  businessType?: string;
  elProps?: Partial<UploadProps>;
  limit?: number;
}

/** MfwUploadFile 组件事件 */
export interface MfwUploadFileEmits {
  (e: 'update:modelValue', value: FileResource | string): void;
  (e: 'change', value: FileResource | string): void;
  (e: 'success', result: UploadResult, file: UploadFile): void;
  (e: 'error', error: Error, file: UploadFile): void;
  (e: 'remove', file: UploadFile): void;
}

/** MfwUploadFileDrag 组件 Props（拖拽式多文件上传） */
export interface MfwUploadFileDragProps {
  modelValue?: FileResource[];
  uploadType?: UploadMethodType;
  multiple?: boolean;
  disabled?: boolean;
  limit?: number;
  maxSize?: number;
  fileType?: string[];
  accept?: string;
  businessType?: string;
  elProps?: Partial<UploadProps>;
}

/** MfwUploadFileDrag 组件事件 */
export interface MfwUploadFileDragEmits {
  (e: 'update:modelValue', value: FileResource[]): void;
  (e: 'change', value: FileResource[]): void;
  (e: 'success', result: UploadResult, file: UploadFile): void;
  (e: 'error', error: Error, file: UploadFile): void;
  (e: 'remove', file: UploadFile): void;
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
  outputType?: string;
}