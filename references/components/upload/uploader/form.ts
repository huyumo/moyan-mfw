import { ApiUploadUploadFile } from '@/apis/micro-system'
import axios from 'axios'
import type { UploadRequestOptions, UploadFile, } from 'element-plus/es/components/upload'
import { getConfig } from '@/config'
const config  =  getConfig()

import { BaseUploader } from './base'
import { request } from 'http'
export class FormUploader extends BaseUploader {
  result:{url:string}={url:''}
  async upload(options: UploadRequestOptions) {

    const file :any= options.file

    console.log(file);
    
    /* eslint-disable no-undef */
    const param = new FormData()  // 创建form对象
    this.uploadingFiles.add(file.uid)
    param.append('file', file)  // 通过append向form对象添加数据
    param.append('chunk', '0') // 添加form表单中其他数据
   // 添加请求头

  return axios.request({
    url:config.upload.url||'/file/upload/item',
    data:param,
    method:'POST',
    headers:{'Content-Type': 'multipart/form-data'},
    onUploadProgress:(progressEvent)=>{
      progressEvent.percent =Number((progressEvent.loaded /  progressEvent.total)*100).toFixed(0)
      options.onProgress(progressEvent)
    }
  }).then(res => {
    this.result = res.data
    this.uploadingFiles.delete(file.uid)
    return res.data
  }).catch((e)=>{
    this.uploadingFiles.delete(file.uid)
    options.onError(e)
  })


  // return axios.post(config.upload.url||'/file/upload/item', param, {headers:{'Content-Type': 'multipart/form-data'},onUploadProgress:(progressEvent)=>{
  //   options.onProgress(progressEvent)
  // }})
  //     .then(res => {
  //       this.result = res.data
  //       this.uploadingFiles.delete(file.uid)
  //       return res.data
  //     }).catch((e)=>{
  //       this.uploadingFiles.delete(file.uid)
  //       options.onError(e)
  //     })
   
  }
}
