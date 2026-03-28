<template>
  <el-upload
    class="avatar-uploader"
    action="#"
    :show-file-list="false"
    :auto-upload="true"
    :on-change="onChange"
    :on-error="onError"
    :on-success="onSuccess"
    :on-remove="onRemove"
    :on-progress="onProgress"
    :httpRequest="httpRequest"
    :disabled="disabled"
    :before-upload="beforeAvatarUpload"
    v-on="on"
    v-bind="elProps"
    accept="video/*"
  >
    <template v-if="!uploading">
      <div class="avatar-uploader-image-box" v-if="fileUrl">
        <div class="el-upload-list__item-thumbnail-video" style="width: 80px; height: 80px">
          <video class="avatar-uploader-image-box_video" :src="fileUrl"></video>
        </div>
        <span class="el-upload-img-actions" @click.stop>
          <el-icon v-if="!disabled" class="el-upload-delete-btn" @click.stop="onRemove(fileUrl)"><Delete /></el-icon>
          <el-icon v-if="!disabled" class="el-upload-delete-btn" @click.stop="handlePictureCardPreview"
            ><View
          /></el-icon>
        </span>
      </div>
      <el-icon v-else class="avatar-uploader-icon"><plus /></el-icon>
    </template>
    <template v-else>
      <div class="avatar-uploader-image-box">
        <div class="el-upload-list__item-thumbnail-video" style="width: 80px; height: 80px">
          {{ file?.percentage }}%
        </div>
      </div>
    </template>
  </el-upload>
  <el-dialog v-model="dialogVisible">
    <div class="video-card-preview" v-if="dialogVisible">
      <video class="video-card-preview_video" controls>
        <source :src="fileUrl" type="video/mp4" />
        <source :src="fileUrl" type="video/ogg" />
        您的浏览器不支持 HTML5 video 标签。
      </video>
    </div>
  </el-dialog>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref, toRef,watch} from 'vue'
import { Plus, Delete,View } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus/es/components/upload/src/upload'
import {getUploader,UploadType} from './uploader'
import { getFileFilter} from './uploader/providers'
import { config } from '@/config'

export default defineComponent({
  components:{
    Plus, Delete,View
  },
  props:{
    modelValue:String,
    uploadType:String as PropType<UploadType>,
    multiple:Boolean,
    elProps:Object,
    on:Object,
    limit:Number,
    disabled:Boolean,
    maxSize:Number,
    fileType:Array as PropType<Array<string>>
  },
  emits:['update:modelValue', 'change'],
  setup(props,ctx){
    const disabled = toRef(props,'disabled',false)
    const modelValue = toRef(props,'modelValue','')
    const elProps = toRef(props,'elProps',{})
    const on = toRef(props,'on',{})
    const fileUrl = ref(modelValue.value)
    const file = ref<UploadFile>()
    const uploading = ref(false)

    const dialogVisible = ref(false)

    const uploadType = toRef(props,'uploadType',config.upload.uploadType)
    const httpRequest  = async  (options: any)=>{
      file.value = options.file
      uploading.value = true
      const uploader = getUploader(uploadType.value)
      const result= await uploader.upload(options)
      fileUrl.value = result.url
      return result
    }

    const {beforeAvatarUpload} = getFileFilter(props,500 * 1024 * 1024, ['mp4','avi'])
    const handlePictureCardPreview = () => {
      dialogVisible.value = true
    }

    watch(modelValue,(value)=>{
      fileUrl.value = value
    },{deep:true,immediate:true})


    const onChange = (file: UploadFile)=>{
      handleFile(file)
    }

    const onProgress = (e:any,ee:any,eee:any)=>{
      uploading.value = ee.percentage<100
      file.value = ee
    }

    const handleFile = (file:UploadFile)=>{
      let url = ''
      if(typeof file ==='string') {
        url =file
      }else if (file.response ){
        const response :any = file.response
        url = response.url
      }
      onProgress(null,file,[file])
      ctx.emit('update:modelValue',url)
      ctx.emit('change',url)
    }

    const onError = (error:any, file: UploadFile)=>{
       handleFile(file)
    }

    const onSuccess = (response: any, file: UploadFile,)=>{
      handleFile(file)
    }

    const onRemove = (file: UploadFile|any)=>{
      fileUrl.value =''
      ctx.emit('update:modelValue','')
      ctx.emit('change','')
    }

    return {
      disabled,
      dialogVisible,
      onChange,
      onError,
      onSuccess,
      onRemove,
      onProgress,
      httpRequest,
      handlePictureCardPreview,
      uploading,
      fileUrl,
      file,
      elProps,
      on,
      beforeAvatarUpload
    }
  }
})
</script>

<style lang="scss" scoped>
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #e6e7e9;
}
.el-icon.avatar-uploader-icon {
  font-size: 20px;
  color: #8c939d;
  width: 80px;
  height: 80px;
  text-align: center;
  line-height: 80px;
}

.avatar-uploader-image-box {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  .el-image {
    position: absolute;
    left: 0;
    top: 0;
    width: 80px;
    height: 80px;
  }
  .el-upload-img-actions {
    width: 80px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: +1;

    .el-upload-delete-btn {
      color: #fff;
      font-size: 20px;
      display: none;
      margin: 4px;
    }
    &:hover {
      background: #1213139f;
      .el-upload-delete-btn {
        display: inline-block;
      }
    }
  }
  .el-upload-list__item-thumbnail-video {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .avatar-uploader-image-box_video {
      position: relative;
      width: 100%;
      height: auto;
    }
  }
}
.video-card-preview {
  width: 100%;

  position: relative;
  .video-card-preview_video {
    position: relative;
    width: 100%;
    max-height: 400px;
  }
}
</style>
