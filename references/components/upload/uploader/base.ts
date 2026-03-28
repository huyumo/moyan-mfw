import type { UploadRequestOptions } from 'element-plus/es/components/upload'
import { ElMessage } from 'element-plus'

const uploadingFiles: Set<any> = new Set()

export abstract class BaseUploader {
  static uploading = false
  abstract upload(options: UploadRequestOptions): Promise<any>
  get uploadingFiles() {
    return uploadingFiles
  }

  static async verifyUpload(rule: any, value: any, cb: any) {
    console.log('sssssssss',uploadingFiles.size);
    
    if (uploadingFiles.size > 0) {
      return cb('有未上传完的文件')
    }
    return cb()
  }
}

