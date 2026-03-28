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
    :httpRequest="httpRequest"
    :before-upload="beforeAvatarUpload"
    :disabled="disabled"
    v-on="on"
    v-bind="elProps"
    accept="image/*"
  >
    <div class="avatar-uploader-image-box" :style="`height: ${height}px;width:${width}px;`" v-if="fileUrl">
      <el-image
        class="el-upload-list__item-thumbnail"
        :style="`height: ${height}px;width:${width}px;`"
        :src="fileUrl"
        fit="cover"
      >
      </el-image>
      <span class="el-upload-img-actions" @click.stop>
        <el-icon v-if="!disabled" class="el-upload-delete-btn" @click.stop="onRemove">
          <Delete />
        </el-icon>
      </span>
    </div>
    <el-icon v-else class="avatar-uploader-icon">
      <plus />
    </el-icon>
  </el-upload>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref, toRef, watch } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getUploader, UploadType } from './uploader'
import type { UploadFile, UploadProps } from 'element-plus/es/components/upload/src/upload'
import { emit } from 'process'
import { number } from '@/lib/async-validator'
import { getFileFilter } from './uploader/providers'
import { config } from '@/config'

export default defineComponent({
  components: {
    Plus,
    Delete
  },
  props: {
    modelValue: String,
    uploadType: String as PropType<UploadType>,
    multiple: Boolean,
    elProps: Object as PropType<{ [K in keyof UploadProps]?: UploadProps[K] }>,
    width: Number,
    height: Number,
    on: Object,
    limit: Number,
    disabled: Boolean,
    maxSize: Number,
    fileType: Array as PropType<Array<string>>
  },
  emits: ['update:modelValue', 'change'],
  setup(props, ctx) {
    const disabled = toRef(props, 'disabled', false)
    const modelValue = toRef(props, 'modelValue', '')
    const elProps = toRef(props, 'elProps', {})
    const on = toRef(props, 'on', {})
    const fileUrl = ref(modelValue.value)
    const width = toRef(props, 'width', 80)
    const height = toRef(props, 'height', 80)

    const uploadType = toRef(props, 'uploadType', config.upload.uploadType)
    const httpRequest = async (options: any) => {
      const uploader = getUploader(uploadType.value)
      const result = await uploader.upload(options)
      fileUrl.value = result.url
      return result
    }

    const { beforeAvatarUpload } = getFileFilter(props, 10 * 1024 * 1024, ['png', 'jpeg', 'gif'])

    watch(modelValue, (value) => {
      fileUrl.value = value
    }, { deep: true, immediate: true })

    const onChange = (file: any) => {
      handleFile(file)
    }

    const handleFile = (file: any) => {
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

    const onError = (error: any, file: any) => {
      handleFile(file)
    }

    const onSuccess = (response: any, file: UploadFile) => {
      handleFile(file)
    }

    const onRemove = (file: UploadFile) => {
      fileUrl.value = ''
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
      fileUrl,
      elProps,
      on,
      width,
      height,
      beforeAvatarUpload
    }
  }
})
</script>

<style lang="scss">
.avatar-uploader {
  width: 80px;
  height: 80px;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.avatar-uploader .el-upload:hover {
  border-color: #e6e7e9;
}

.el-icon.avatar-uploader-icon {
  font-size: 20px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader-image-box {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  .el-image {
    position: absolute;
    left: 0;
    top: 0;
  }

  .el-upload-img-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: +1;
    width: 100%;
    height: 100%;

    .el-upload-delete-btn {
      color: #fff;
      font-size: 20px;
      display: none;
    }

    &:hover {
      background: #1213139f;

      .el-upload-delete-btn {
        display: inline-block;
      }
    }
  }
}
</style>
