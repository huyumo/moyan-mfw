import { BaseUploader } from './base'
import type { UploadRequestOptions } from 'element-plus/es/components/upload'
import OSS from 'ali-oss'
import SparkMD5 from 'spark-md5'
import { ApiOssGetAuthorization } from '@/apis/micro-system'


async function refreshSTSToken() {
  return await new ApiOssGetAuthorization()
}

export class OssUploader extends BaseUploader {
  optionLoaded = false

  options: OSS.Options = {
    accessKeyId: '',
    accessKeySecret: '',
    region: '',
    bucket: '',
    refreshSTSToken: refreshSTSToken
  }

  result: { url: string } = { url: '' }

  client!: OSS


  async getAuthorization() {
    const result = await new ApiOssGetAuthorization()
    this.options = Object.assign(this.options, result)
    console.log('********************>>>>', result);

    this.optionLoaded = true
  }

  async createClient() {
    !this.optionLoaded && (await this.getAuthorization())
    this.client = new OSS(this.options)
  }

  get runMode() {
    return process.env.RUN_MODE || 'prod'
  }

  get appName() {
    return process.env.VUE_APP_NAME
  }

  getUrl(fileName: string) {
    const client: any = this.client
    return `${client.options.endpoint.protocol}//${client.options.bucket}.${client.options.endpoint.host}/${this.appName}/${this.runMode}/${fileName}`
  }

  async upload(options: UploadRequestOptions) {
    return this.multipartUpload(options)
  }

  // 切片上传
  async multipartUpload(uploadObj: any) {

    const { file } = uploadObj
    const suffix = file.name.split('.').pop()
    // file.name = MoUitls.$mo.strToHash(file.name)+'.'+suffix

    const name = await this.computeMd5(file) + '.' + suffix


    await this.createClient()
    this.uploadingFiles.add(file['uid'])
    file.percentage = 0
    const emitProgress = (p: number) => {
      const event = {
        percent: Number((p * 100).toFixed(0))
      }
      uploadObj.onProgress(event, file)
    }

    try {
      //object-name可以自定义为文件名（例如file.txt）或目录（例如abc/test/file.txt）的形式，实现将文件上传至当前Bucket或Bucket下的指定目录。
      const result: any = await this.client.multipartUpload(
        `${this.appName}/${this.runMode}/${name}`,
        file,
        {
          headers: {
            'Content-Disposition': 'inline',
            'Content-Type': file.type //注意：根据图片或者文件的后缀来设置，我试验用的‘.png'的图片，具体为什么下文解释
          },
          progress: (p: any, checkpoint: any) => {
            if (!checkpoint) {
              file.percentage = 100
              emitProgress(p)
              return
            }
            file.tempCheckpoint = checkpoint
            file.upload = checkpoint.uploadId
            file.uploadName = checkpoint.name
            file.percentage = Number((p * 100).toFixed(0))
            emitProgress(p)
            // console.log(p, checkpoint, this.percentage, '---------uploadId-----------')
            // 断点记录点。浏览器重启后无法直接继续上传，您需要手动触发上传操作。
          },
          meta: { uid: file.uid, pid: 1 },
          mime: file.type
        }
      )
      file.upload = true
      file.url = this.getUrl(name)
      uploadObj.onSuccess(result.res, file,)
      this.uploadingFiles.delete(file.uid)
      this.result = {
        url: file.url
      }
      return this.result
    } catch (e) {
      uploadObj.onError(e, file)
      this.uploadingFiles.delete(file.uid)
    }
  }

  computeMd5(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const blobSlice = File.prototype.slice

      const chunkSize = 2097152 // Read in chunks of 2MB
      const chunks = Math.ceil(file.size / chunkSize)
      let currentChunk = 0
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()

      function loadNext() {
        const start = currentChunk * chunkSize
        const end =
          start + chunkSize >= file.size ? file.size : start + chunkSize
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
      }

      fileReader.onload = (e: any) => {
        spark.append(e.target.result) // Append array buffer
        currentChunk++
        if (currentChunk < chunks) {
          loadNext()
        } else {
          const md5 = spark.end()
          resolve(md5)
        }
      }

      fileReader.onerror = function (error) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject('md5 computer error')
      }
      loadNext()
    })
  }
}