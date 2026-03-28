<template>
  <el-upload
    class="uploader-drag"
    action="#"
    ref="moElUpload"
    drag
    :auto-upload="true"
    :on-change="onChange"
    :on-error="handleFileList"
    :on-success="handleFileList"
    :on-remove="handleFileList"
    :file-list="fileList"
    :httpRequest="httpRequest"
    :multiple="multiple"
    :before-upload="beforeAvatarUpload"
    :limit="limit"
    :disabled="disabled"
    :on-preview="handleDownload"
    v-on="on"
    v-bind="elProps"
  >
    <el-icon class="el-icon--upload">
      <UploadFilled />
    </el-icon>
    <div class="el-upload__text">
      <div>
        点击或将文件拖拽到这里上传
      </div>
      <div>支持扩展名：{{ fileType.join('、') }}</div>
    </div>
  </el-upload>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref, toRef } from 'vue'
import { Plus, Delete, UploadFilled } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus/es/components/upload/src/upload'
import { getUploader, UploadType } from './uploader'
import { ElMessage } from 'element-plus'
import { BaseUploader } from './uploader/base'
import FileSaver from 'file-saver'
import axios from 'axios'

export default defineComponent({
  components: {
    Plus, Delete, UploadFilled
  },
  props: {
    modelValue: Array,
    uploadType: String as PropType<UploadType>,
    multiple: Boolean,
    elProps: Object,
    on: Object,
    limit: Number,
    disabled: Boolean,
    fileType: { type: Array, default: () => ['.rar', '.zip', '.doc', '.docx', '.pdf', '.jpg'] },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, ctx) {

    const disabled = toRef(props, 'disabled', false)
    const modelValue = toRef(props, 'modelValue', [])
    const fileList = ref<Array<any>>(modelValue.value)
    const elProps = toRef(props, 'elProps', {})
    const on = toRef(props, 'on', {})
    const multiple = toRef(props, 'multiple', false)
    const limit = toRef(props, 'limit')
    const moElUpload = ref<any>(null)

    const uploadType = toRef(props, 'uploadType', 'Form')
    const httpRequest = async (options: any) => {
      BaseUploader.uploading = true
      const uploader = getUploader(uploadType.value)
      const result = await uploader.upload(options)
      return result
    }

    const onChange = (file: UploadFile, fileList: UploadFile[]) => {
      handleFileList(null, file, fileList)
    }



    const handleFileList = (e: any, file: UploadFile, fileList1: UploadFile[]) => {
      const flies = (fileList1 || fileList.value).map((file) => {
        if (typeof file === 'string') return file
        const response: any = file.response
        if (response) {
          file.url = response.url
        }
        return { name: file.name, url: file.url || '' }
      }).filter((file) => !!file)
      ctx.emit('update:modelValue', flies)
      ctx.emit('change', flies)
      BaseUploader.uploading = false
    }

    const beforeAvatarUpload = (rawFile: any) => {
      if (!props.fileType.some((item) => {
        const arr: Array<string> = rawFile.name.split('.')
        const a = arr.pop()
        return item === a || item === `.${a}`
      })) {
        ElMessage.error('不允许上传的文件格式')
        return false
      }
      return true
    }

    const handleDownload = (e: any) => {
      axios.get(e.url, { responseType: "blob" }).then(res => { FileSaver.saveAs(res.data, e.name) })
    }

    return {
      disabled,
      onChange,
      httpRequest,
      modelValue,
      multiple,
      elProps,
      on,
      fileList,
      limit,
      moElUpload,
      handleFileList,
      beforeAvatarUpload,
      handleDownload
    }
  }
})
</script>

<style lang="scss">
.uploader-drag {
  width: 100%;
  .el-upload,
  .el-upload-dragger {
    width: 100%;
  }

  .el-icon--upload {
    margin-top: 20px;
  }
}
</style>
