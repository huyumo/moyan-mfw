import { Plugin } from 'vue'
import UploadImgs from './uploadImgs.vue'
import UploadImg from './uploadImg.vue'
import UploadFile from './uploadFile.vue'
import UploadVideo from './uploadVideo.vue'
import UploadFileDrag from './uploadFileDrag.vue'
import { UploadType } from './uploader'
import { UploadProps } from 'element-plus/lib/components'

const plugin: Plugin = (app) => {
  app.component('upload-imgs', UploadImgs)
  app.component('upload-img', UploadImg)
  app.component('upload-file', UploadFile)
  app.component('upload-video', UploadVideo)
  app.component('upload-file-drag', UploadFileDrag)
}

export default plugin
export { UploadImgs, UploadImg, UploadFile, UploadVideo }

export interface UploadImgsProps {
  modelValue?: string[]
  uploadType?: { [K in keyof UploadProps]?: UploadProps[K] }
  elProps?: UploadProps
  width?: number
  height?: number
  limit?: number
  disabled?: boolean
  maxSize?: number
  fileType?: string[]
}

export interface UploadImgProps {
  modelValue?: string
  uploadType?: UploadType
  multiple?: boolean
  elProps?: { [K in keyof UploadProps]?: UploadProps[K] }
  width?: number
  height?: number
  on?: { [key: string]: (ee: any) => void }
  limit?: number
  disabled?: boolean
  maxSize?: number
  fileType?: string[]
}

export interface UploadFileProps {
  modelValue?: string
  uploadType?: UploadType
  multiple?: boolean
  elProps?: { [K in keyof UploadProps]?: UploadProps[K] }
  on?: { [key: string]: (ee: any) => void }
  limit?: number
  disabled?: boolean
  maxSize?: number
  fileType?: string[]
}

export interface UploadVideoProps {
  modelValue?: string
  uploadType?: UploadType
  multiple?: boolean
  elProps?: { [K in keyof UploadProps]?: UploadProps[K] }
  on?: { [key: string]: (ee: any) => void }
  limit?: number
  disabled?: boolean
  maxSize?: number
  fileType?: string[]
}
