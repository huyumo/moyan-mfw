/**
 * @fileoverview MfwUpload 上传器基类
 * @description 提供上传器的基础实现
 */

import type { IUploader, UploadRequestOptions, UploadResult } from './types';

const uploadingFiles = new Set<any>();

/**
 * 基础上传器类
 */
export abstract class BaseUploader implements IUploader {
  static uploading = false;

  get uploadingFiles() {
    return uploadingFiles;
  }

  /**
   * 上传文件
   * @param options 上传选项
   */
  abstract upload(options: UploadRequestOptions): Promise<UploadResult>;

  /**
   * 删除文件（可选实现）
   * @param url 文件 URL
   */
  delete?(url: string): Promise<void>;

  /**
   * 验证上传（用于表单验证）
   */
  static verifyUpload(rule: any, value: any, cb: (error?: string) => void) {
    if (uploadingFiles.size > 0) {
      return cb('有未上传完的文件');
    }
    return cb();
  }
}

/**
 * 表单上传器（直接上传到服务器）
 */
export class FormUploader extends BaseUploader {
  private uploadUrl: string;

  constructor(uploadUrl: string) {
    super();
    this.uploadUrl = uploadUrl;
  }

  async upload(options: UploadRequestOptions): Promise<UploadResult> {
    const { file, filename, onProgress, onSuccess, onError } = options;

    const formData = new FormData();
    formData.append(filename || 'file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          onProgress(percentage);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            const result: UploadResult = {
              url: response.url || response.data?.url,
              name: response.name || file.name,
              size: response.size || file.size,
              ...response
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

      xhr.open('POST', this.uploadUrl, true);
      xhr.send(formData);
    });
  }
}

/**
 * OSS 上传器（阿里云 OSS 等）
 */
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
      // 获取上传凭证
      const token = await this.getUploadToken();

      // 生成文件路径
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
              name: file.name,
              size: file.size
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
    // 从 token 中解析 OSSAccessKeyId，具体实现根据实际凭证格式
    return token;
  }

  private getPolicy(token: string): string {
    // 从 token 中解析 policy，具体实现根据实际凭证格式
    return token;
  }

  private getSignature(token: string): string {
    // 从 token 中解析 Signature，具体实现根据实际凭证格式
    return token;
  }
}
