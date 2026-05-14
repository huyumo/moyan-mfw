/**
 * @fileoverview MfwUpload 上传器基类
 * @description 提供上传器的基础实现
 */

import type { IUploader, UploadRequestOptions, UploadResult } from './types';
import { TOKEN_KEY, LEGACY_ACCESS_TOKEN_KEY } from '../../constants/storage-keys';

const getAuthToken = (): string => {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ||
    ''
  );
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
          const error = new Error(`上传失败：${xhr.statusText}`);
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

export class OssUploader extends BaseUploader {
  private getUploadToken: () => Promise<string>;
  private ossEndpoint: string;
  private ossBucket: string;
  private dir?: string;

  constructor(
    getUploadToken: () => Promise<string>,
    ossEndpoint: string,
    ossBucket: string,
    dir?: string
  ) {
    super();
    this.getUploadToken = getUploadToken;
    this.ossEndpoint = ossEndpoint;
    this.ossBucket = ossBucket;
    this.dir = dir || '';
  }

  async upload(options: UploadRequestOptions): Promise<UploadResult> {
    const { file, filename, onProgress, onSuccess, onError } = options;

    try {
      const token = await this.getUploadToken();

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 8);
      const ext = file.name.split('.').pop();
      const key = `${this.dir}${this.dir && !this.dir.endsWith('/') ? '/' : ''}${timestamp}_${randomStr}.${ext}`;

      const formData = new FormData();
      formData.append('key', key);
      formData.append('OSSAccessKeyId', this.getOssAccessKeyId(token));
      formData.append('policy', this.getPolicy(token));
      formData.append('Signature', this.getSignature(token));
      formData.append(filename || 'file', file);

      const uploadUrl = `https://${this.ossBucket}.${this.ossEndpoint}`;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentage = Math.round((e.loaded * 100) / e.total);
            onProgress(percentage);
          }
        });

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            const url = `https://${this.ossBucket}.${this.ossEndpoint}/${key}`;
            const result: UploadResult = {
              url,
              originalName: file.name,
              fileName: key,
              fileSize: file.size,
              mimeType: file.type,
            };
            onSuccess?.(result);
            resolve(result);
          } else {
            const error = new Error(`OSS 上传失败：${xhr.statusText}`);
            onError?.(error);
            reject(error);
          }
        };

        xhr.onerror = () => {
          const error = new Error('OSS 网络错误');
          onError?.(error);
          reject(error);
        };

        xhr.open('POST', uploadUrl, true);
        xhr.send(formData);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('获取上传凭证失败');
      onError?.(err);
      throw err;
    }
  }

  private getOssAccessKeyId(token: string): string {
    return token;
  }

  private getPolicy(token: string): string {
    return token;
  }

  private getSignature(token: string): string {
    return token;
  }
}