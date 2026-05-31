import { FormUploader, OssUploader } from '../components/upload/uploader';
import type { UploadResult, OssAuthorization } from '../components/upload/types';
import { TOKEN_KEY } from '../constants/storage-keys';

export type UploadType = 'Form' | 'Oss';

export interface UploadConfig {
  uploadType: UploadType;
  formUrl: string;
  oss: {
    endpoint: string;
    bucket: string;
    dir: string;
  };
}

export const uploadConfig: UploadConfig = {
  uploadType: (import.meta.env.VITE_UPLOAD_TYPE as UploadType) || 'Form',
  formUrl: import.meta.env.VITE_UPLOAD_FORM_URL || '/api/upload-files',
  oss: {
    endpoint: import.meta.env.VITE_OSS_ENDPOINT || '',
    bucket: import.meta.env.VITE_OSS_BUCKET || '',
    dir: import.meta.env.VITE_OSS_DIR || 'uploads/',
  },
};

export const getUploader = (uploadType?: UploadType, businessType?: string) => {
  const type = uploadType || uploadConfig.uploadType;
  switch (type) {
    case 'Form':
      return new FormUploader(uploadConfig.formUrl, businessType);
    case 'Oss':
      return new OssUploader(async () => {
        const token = localStorage.getItem(TOKEN_KEY) || '';
        const resp = await fetch(`${uploadConfig.formUrl}/oss-authorization`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await resp.json();
        if (!resp.ok || !json.data) {
          throw new Error(json.message || '获取 OSS 授权失败');
        }
        return json.data as OssAuthorization;
      });
    default:
      return new FormUploader(uploadConfig.formUrl, businessType);
  }
};

export const uploadImage = async (
  file: File | Blob,
  options?: {
    uploadType?: UploadType;
    businessType?: string;
    onProgress?: (percentage: number) => void;
  }
): Promise<UploadResult> => {
  const uploader = getUploader(options?.uploadType, options?.businessType);
  return uploader.upload({
    file: file as File,
    filename: 'file',
    onProgress: options?.onProgress,
  });
};