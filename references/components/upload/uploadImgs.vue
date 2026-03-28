<template>
  <el-upload
    action="#"
    ref="moElUpload"
    list-type="picture-card"
    :auto-upload="true"
    :on-change="onChange"
    :on-error="handleFileList"
    :on-success="handleFileList"
    :on-remove="onChange"
    :file-list="fileList"
    :httpRequest="httpRequest"
    :before-upload="beforeAvatarUpload"
    multiple
    :limit="limit"
    :disabled="disabled"
    :on-exceed="onExceed"
    v-bind="elProps"
    accept="image/*"
  >
    <template #default>
      <el-icon v-if="fileList.length < limit">
        <Plus />
      </el-icon>
    </template>
    <template #file="{ file }">
      <div>
        <el-image
          class="el-upload-list__item-thumbnail"
          :style="`height: ${height}px;width:${width}px;`"
          :src="file.url"
          fit="cover"
        >
        </el-image>
        <span class="el-upload-list__item-actions">
          <span v-if="!disabled" class="el-upload-list__item-delete" @click="moElUpload.handleRemove(file)">
            <el-icon>
              <Delete />
            </el-icon>
          </span>
        </span>
      </div>
    </template>
  </el-upload>
</template>
<script lang="ts">
import { defineComponent, nextTick, PropType, ref, toRef, watch } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { UploadFile, UploadRequestOptions } from 'element-plus/es/components/upload/src/upload'
import { getUploader, UploadType } from './uploader'
import { getFileFilter } from './uploader/providers'
import { config } from '@/config'
import { UploadUserFile } from 'element-plus'
import { ElMessage } from 'element-plus'

export default defineComponent({
  components: {
    Plus,
    Delete,
  },
  props: {
    modelValue: Array,
    uploadType: String as PropType<UploadType>,
    elProps: Object,
    width: Number,
    height: Number,
    limit: Number,
    disabled: Boolean,
    maxSize: Number,
    fileType: Array as PropType<Array<string>>
  },
  emits: ['update:modelValue', 'change'],
  setup(props, ctx) {
    const disabled = toRef(props, 'disabled', false)
    const modelValue = toRef(props, 'modelValue', [])
    const fileList = ref<Array<any>>(
      modelValue.value.map((url) => {
        return { url }
      })
    )
    const elProps = toRef(props, 'elProps', {})
    const limit = toRef(props, 'limit', 10)
    const moElUpload = ref<any>(null)
    const width = toRef(props, 'width', 80)
    const height = toRef(props, 'height', 80)
    const uploadType = toRef(props, 'uploadType', config.upload.uploadType)
    const httpRequest = async (options: any) => {
      const uploader = getUploader(uploadType.value)
      const result = await uploader.upload(options)
      return result
    }

    const { beforeAvatarUpload } = getFileFilter(props, 10 * 1024 * 1024, ['png', 'jpeg', 'gif'])

    const onChange = (file: UploadFile, fileList: UploadFile[]) => {
      handleFileList(null, file, fileList)
    }

    // watch(
    //   modelValue,
    //   (value) => {
    //     fileList.value = value.map((url) => {
    //       return { url }
    //     })
    //   },
    //   { deep: true, immediate: true }
    // )


    const handleFileList = (e: any, file: UploadFile, fileList1: UploadFile[]) => {
      const flies = (fileList1 || fileList.value)
        .map((file) => {
          if (typeof file === 'string') return file
          const response: any = file.response
          if (response) {
            file.url = response.url
          }
          return file.url || ''
        })
        .filter((file) => !!file)

      ctx.emit('update:modelValue', flies)
      ctx.emit('change', flies)
    }

    const onExceed = (files: File[], uploadFiles: UploadUserFile[]) => {
      const message = `当前限制选择 ${limit.value} 个文件，本次选择了 ${files.length} 个文件`
      ElMessage.warning(message)
    }

    return {
      disabled,
      onChange,
      httpRequest,
      modelValue,
      elProps,
      fileList,
      limit,
      moElUpload,
      handleFileList,
      width,
      height,
      beforeAvatarUpload,
      onExceed
    }
  },
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
