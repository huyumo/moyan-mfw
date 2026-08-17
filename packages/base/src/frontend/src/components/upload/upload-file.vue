/**
 * @fileoverview MfwUploadFile 按钮式单文件上传组件
 * @description 通过按钮触发文件选择，上传后以 FileResource 结构回填 v-model
 * @example
 * ```vue
 * <MfwUploadFile v-model="file" />
 * <MfwUploadFile v-model="file" upload-type="Oss" :max-size="20" :file-type="['pdf','docx']" />
 * ```
 */
<template>
  <el-upload
    class="mfw-upload-file"
    action="#"
    :auto-upload="true"
    v-model:file-list="fileList"
    :http-request="httpRequest"
    :before-upload="beforeUpload"
    :on-change="onChange"
    :on-success="onSuccess"
    :on-error="onError"
    :on-remove="onRemove"
    :disabled="disabled"
    :limit="limit"
    :accept="accept"
    v-bind="elProps"
  >
    <el-button type="primary" :disabled="disabled">选择文件</el-button>
  </el-upload>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage, type UploadFile, type UploadRequestOptions } from 'element-plus';
import { getUploader } from '../../config/upload-config';
import type {
  FileResource,
  UploadMethodType,
  UploadResult,
  MfwUploadFileProps
} from './types';

const props = withDefaults(defineProps<MfwUploadFileProps>(), {
  uploadType: undefined,
  disabled: false,
  maxSize: 100,
  fileType: () => [],
  accept: '',
  businessType: undefined,
  elProps: () => ({}),
  limit: 1
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: FileResource | string): void;
  (e: 'change', value: FileResource | string): void;
  (e: 'success', result: UploadResult, file: UploadFile): void;
  (e: 'error', error: Error, file: UploadFile): void;
  (e: 'remove', file: UploadFile): void;
}>();

const toFileResource = (value: FileResource | string | undefined): FileResource | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    return { url: value, name: value.split('/').pop() || 'file', type: '' };
  }
  return value;
};

const fileList = ref<Array<{ url: string; name: string; uid: number }>>([]);

const syncFileList = (value: FileResource | string | undefined) => {
  const resource = toFileResource(value);
  fileList.value = resource
    ? [{ url: resource.url, name: resource.name, uid: 1 }]
    : [];
};

syncFileList(props.modelValue);

watch(
  () => props.modelValue,
  (value) => syncFileList(value),
  { deep: true, immediate: true }
);

const beforeUpload = (rawFile: File): boolean => {
  if (props.fileType && props.fileType.length > 0) {
    const ext = rawFile.name.split('.').pop()?.toLowerCase() || '';
    const matched = props.fileType.some((item) => {
      const t = item.toLowerCase().replace(/^\./, '');
      return ext === t || rawFile.type.indexOf(t) > -1;
    });
    if (!matched) {
      ElMessage.error(`允许上传的文件格式为 ${props.fileType.join('、')}`);
      return false;
    }
  }

  const maxBytes = props.maxSize * 1024 * 1024;
  if (rawFile.size > maxBytes) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
    return false;
  }

  return true;
};

const httpRequest = async (options: UploadRequestOptions): Promise<UploadResult> => {
  const uploader = getUploader(props.uploadType as UploadMethodType | undefined, props.businessType);
  return uploader.upload({
    file: options.file,
    filename: options.filename || 'file',
    onProgress: options.onProgress as any,
    onSuccess: options.onSuccess as any,
    onError: options.onError as any
  });
};

const buildResource = (result: UploadResult, raw: File): FileResource => ({
  url: result.url,
  name: result.originalName || raw.name,
  type: result.mimeType || raw.type,
  size: result.fileSize || raw.size
});

const onChange = (file: UploadFile) => {
  // 仅用于驱动 UI，不直接回填 modelValue，等成功回调处理
  if (file.status === 'ready' && !file.response && !file.url) {
    return;
  }
};

const onSuccess = (response: any, file: UploadFile) => {
  const result: UploadResult = response?.url
    ? response
    : {
        url: response?.data?.url || response?.url,
        originalName: response?.data?.originalName || file.name,
        fileName: response?.data?.fileName || file.name,
        fileSize: response?.data?.fileSize || file.size,
        mimeType: response?.data?.mimeType || file.raw?.type || ''
      };

  const resource = buildResource(result, file.raw as File);
  emit('update:modelValue', resource);
  emit('change', resource);
  emit('success', result, file);
};

const onError = (error: any, file: UploadFile) => {
  const message = error?.message || '上传失败';
  ElMessage.error(message);
  emit('error', error instanceof Error ? error : new Error(message), file);
};

const onRemove = (file: UploadFile) => {
  fileList.value = [];
  emit('update:modelValue', '');
  emit('change', '');
  emit('remove', file);
};
</script>

<style lang="scss">
.mfw-upload-file {
  width: 100%;
}
</style>
