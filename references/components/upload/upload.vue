<template>
  <el-upload
    class="uploader-file"
    action="#"
    :auto-upload="true"
    :show-file-list="false"
    :on-change="onChange"
    :on-error="onError"
    :on-success="onSuccess"
    :on-remove="onRemove"
    :httpRequest="httpRequest"
    :before-upload="beforeAvatarUpload"
    :disabled="disabled"
    :limit="limit"
    v-on="on"
    v-bind="elProps"
  >
    <slot name="default"></slot>
  </el-upload>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref, toRef, watch } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus/es/components/upload/src/upload'
import { getUploader, UploadType } from './uploader'
import { ElMessage, UploadProps } from 'element-plus'
import { getFileFilter } from './uploader/providers'
import { config } from '@/config'


export default defineComponent({
  components: {
    Plus, Delete
  },
  props: {
    modelValue: String,
    uploadType: String as PropType<UploadType>,
    multiple: Boolean,
    elProps: Object,
    on: Object,
    disabled: Boolean,
    maxSize: Number,
    fileType: Array as PropType<Array<string>>,
    limit: { type: Number, default: 1 }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, ctx) {
    const disabled = toRef(props, 'disabled', false)
    const modelValue = toRef(props, 'modelValue', '')
    const elProps = toRef(props, 'elProps', {})
    const on = toRef(props, 'on', {})
    const fileUrl = ref(modelValue.value)
    const uploadType = toRef(props, 'uploadType', config.upload.uploadType)

    const fileList = ref<Array<any>>([{
      url: modelValue.value,
      name: modelValue.value?.split('/').pop()
    }].filter((i) => !!i.url))

    const { beforeAvatarUpload } = getFileFilter(props, 100 * 1024 * 1024, [])

    const httpRequest = async (options: any) => {
      const uploader = getUploader(uploadType.value)
      const result = await uploader.upload(options)
      fileUrl.value = result.url
      return result
    }

    const onChange = (file: UploadFile) => {
      handleFile(file)
    }

    watch(modelValue, (value) => {
      fileUrl.value = value
    }, { deep: true, immediate: true })


    const handleFile = (file: UploadFile) => {
      let url = ''
      if (typeof file === 'string') {
        url = file
      } else if (file.response) {
        const response: any = file.response
        url = response.url
      }
      ctx.emit('update:modelValue', url)
      ctx.emit('change', url)
    }

    const onError = (error: any, file: UploadFile) => {
      handleFile(file)
    }

    const onSuccess = (response: any, file: UploadFile,) => {
      handleFile(file)
    }

    const onRemove = (file: UploadFile) => {
      fileUrl.value = ''
      fileList.value = []
      ctx.emit('update:modelValue', '')
      ctx.emit('change', '')
    }

    return {
      disabled,
      onChange,
      onError,
      onSuccess,
      onRemove,
      httpRequest,
      beforeAvatarUpload,
      fileUrl,
      fileList,
      elProps,
      on,
    }
  }
})
</script>

<style lang="scss">
.uploader-file {
  width: 100%;
}
</style>
