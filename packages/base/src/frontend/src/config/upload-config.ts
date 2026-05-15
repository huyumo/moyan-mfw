import { FormUploader, OssUploader } from '../../components/upload/uploader';
import type { UploadResult } from '../../components/upload/types';

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
      return new OssUploader(
        () => Promise.resolve(''),
        uploadConfig.oss.endpoint,
        uploadConfig.oss.bucket,
        uploadConfig.oss.dir
      );
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