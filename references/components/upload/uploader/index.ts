import { FormUploader } from './form'
import { OssUploader } from './oss'

export type UploadType = 'Form' | 'Oss'

export const getUploader = (uploadType: UploadType) => {
  switch (uploadType) {
    case 'Form':
      return new FormUploader()
    case 'Oss':
      return new OssUploader()
    default:
      return new OssUploader()
  }
}
