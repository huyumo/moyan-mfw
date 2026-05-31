/**
 * @fileoverview MfwUpload 上传器基类
 * @description 提供上传器的基础实现
 */

import type { IUploader, UploadRequestOptions, UploadResult, OssAuthorization } from './types';
import { TOKEN_KEY } from '../../constants/storage-keys';

const getAuthToken = (): string => {
  return localStorage.getItem(TOKEN_KEY) || '';
};

const uploadingFiles = new Set<any>();

export abstract class BaseUploader implements IUploader {
  static uploading = false;

  get uploadingFiles() {
    return uploadingFiles;
  }

  abstract upload(options: UploadRequestOptions): Promise<UploadResult>;

  delete?(url: string): Promise<void>;

  static verifyUpload(rule: any, value: any, cb: (error?: string) => void) {
    if (uploadingFiles.size > 0) {
      return cb('有未上传完的文件');
    }
    return cb();
  }
}

export class FormUploader extends BaseUploader {
  private uploadUrl: string;
  private businessType?: string;

  constructor(uploadUrl: string, businessType?: string) {
    super();
    this.uploadUrl = uploadUrl;
    this.businessType = businessType;
  }

  async upload(options: UploadRequestOptions): Promise<UploadResult> {
    const { file, filename, onProgress, onSuccess, onError } = options;

    const formData = new FormData();
    formData.append(filename || 'file', file);

    const url = this.businessType 
      ? `${this.uploadUrl}?businessType=${this.businessType}` 
      : this.uploadUrl;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          onProgress(percentage);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            const data = response.data || response;
            const result: UploadResult = {
              url: data.url,
              originalName: data.originalName || file.name,
              fileName: data.fileName,
              fileSize: data.fileSize || file.size,
              mimeType: data.mimeType || file.type,
            };
            onSuccess?.(result);
            resolve(result);
          } catch (error) {
            onError?.(new Error('解析响应失败'));
            reject(error);
          }
        } else {
          let errorMessage = `上传失败：${xhr.statusText}`;
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.message) {
              errorMessage = response.message;
            }
            if (xhr.status === 401) {
              errorMessage = '请先登录后再上传文件';
            }
          } catch {
            if (xhr.status === 401) {
              errorMessage = '请先登录后再上传文件';
            }
          }
          const error = new Error(errorMessage);
          onError?.(error);
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('网络错误');
        onError?.(error);
        reject(error);
      };

      xhr.open('POST', url, true);

      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }
}

const OSS_SDK_URL = 'https://gosspublic.alicdn.com/aliyun-oss-sdk-6.18.1.min.js';

let ossSdkReady = false;
let ossSdkLoadPromise: Promise<void> | null = null;

function loadOssSdk(): Promise<void> {
  if (ossSdkReady) return Promise.resolve();
  if (ossSdkLoadPromise) return ossSdkLoadPromise;

  ossSdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = OSS_SDK_URL;
    script.onload = () => {
      ossSdkReady = true;
      resolve();
    };
    script.onerror = () => {
      ossSdkLoadPromise = null;
      reject(new Error('OSS SDK 加载失败'));
    };
    document.head.appendChild(script);
  });

  return ossSdkLoadPromise;
}

export class OssUploader extends BaseUploader {
  private getAuthorization: () => Promise<OssAuthorization>;

  constructor(getAuthorization: () => Promise<OssAuthorization>) {
    super();
    this.getAuthorization = getAuthorization;
  }

  async upload(options: UploadRequestOptions): Promise<UploadResult> {
    const { file, onProgress, onSuccess, onError } = options;

    try {
      const auth = await this.getAuthorization();

      await loadOssSdk();

      const OSS = (window as any).OSS;
      if (!OSS) {
        throw new Error('OSS SDK 未初始化');
      }

      const client = new OSS({
        region: auth.endpoint.replace(/\.aliyuncs\.com$/, ''),
        accessKeyId: auth.accessKeyId,
        accessKeySecret: auth.accessKeySecret,
        stsToken: auth.securityToken,
        bucket: auth.bucket,
      });

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 8);
      const ext = file.name.split('.').pop() || 'bin';
      const key = `uploads/${timestamp}_${randomStr}.${ext}`;

      const result = await client.put(key, file, {
        progress: (p: number) => {
          if (onProgress) {
            onProgress(Math.round(p * 100));
          }
        },
      });

      const url = result.url || `https://${auth.bucket}.${auth.endpoint}/${key}`;
      const uploadResult: UploadResult = {
        url,
        originalName: file.name,
        fileName: key,
        fileSize: file.size,
        mimeType: file.type,
      };

      onSuccess?.(uploadResult);
      return uploadResult;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('OSS 上传失败');
      onError?.(err);
      throw err;
    }
  }
}