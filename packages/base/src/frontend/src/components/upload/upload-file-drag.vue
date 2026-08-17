/**
 * @fileoverview MfwUploadFileDrag 拖拽式多文件上传组件
 * @description 提供拖拽区域 + 文件列表，上传后以 FileResource[] 结构回填 v-model
 * @example
 * ```vue
 * <MfwUploadFileDrag v-model="files" :multiple="true" :limit="10" />
 * ```
 */
<template>
  <el-upload
    ref="uploadRef"
    class="mfw-upload-file-drag"
    action="#"
    drag
    :auto-upload="true"
    v-model:file-list="fileList"
    :http-request="httpRequest"
    :before-upload="beforeUpload"
    :on-change="onChange"
    :on-success="onSuccess"
    :on-error="onError"
    :on-remove="onRemove"
    :on-preview="handleDownload"
    :multiple="multiple"
    :limit="limit"
    :disabled="disabled"
    :accept="accept"
    v-bind="elProps"
  >
    <el-icon class="el-icon--upload">
      <UploadFilled />
    </el-icon>
    <div class="el-upload__text">
      <div>点击或将文件拖拽到这里上传</div>
      <div v-if="fileType.length" class="mfw-upload-file-drag__tip">
        支持扩展名：{{ fileType.join('、') }}
      </div>
      <div v-else class="mfw-upload-file-drag__tip">
        最大 {{ maxSize }}MB
      </div>
    </div>
  </el-upload>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  ElMessage,
  type UploadFile,
  type UploadRequestOptions,
  type UploadUserFile
} from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getUploader } from '../../config/upload-config';
import type {
  FileResource,
  UploadMethodType,
  UploadResult,
  MfwUploadFileDragProps
} from './types';

const props = withDefaults(defineProps<MfwUploadFileDragProps>(), {
  uploadType: undefined,
  multiple: false,
  disabled: false,
  limit: 10,
  maxSize: 100,
  fileType: () => ['.rar', '.zip', '.doc', '.docx', '.pdf', '.jpg', '.png'],
  accept: '',
  businessType: undefined,
  elProps: () => ({})
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: FileResource[]): void;
  (e: 'change', value: FileResource[]): void;
  (e: 'success', result: UploadResult, file: UploadFile): void;
  (e: 'error', error: Error, file: UploadFile): void;
  (e: 'remove', file: UploadFile): void;
}>();

const uploadRef = ref<any>(null);
const fileList = ref<UploadUserFile[]>([]);

/**
 * 标记是否处于组件内部主动同步状态。
 * el-upload 的 file-list 是 passive 单向 prop，内部会直接 mutate 该数组引用。
 * 当父组件通过 v-model 回写时，若我们再 reassign fileList，会让 el-upload
 * 丢失它正在 mutate 的文件对象引用，导致 handleSuccess 找不到文件、无法渲染成功态。
 * 因此仅在"外部初始化/外部覆盖"场景下才同步 fileList，内部上传流程不触发回写。
 */
let isInternalUpdate = false;

const syncFileList = (value: FileResource[] | undefined) => {
  const list = value || [];
  fileList.value = list.map((item, index) => ({
    url: item.url,
    name: item.name,
    status: 'success' as const,
    uid: Date.now() + index
  }));
};

syncFileList(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    // 内部上传流程触发的回写，不要回灌 fileList，避免打断 el-upload 内部状态
    if (isInternalUpdate) {
      isInternalUpdate = false;
      return;
    }
    syncFileList(value);
  },
  { deep: true }
);

const beforeUpload = (rawFile: File): boolean => {
  if (props.fileType && props.fileType.length > 0) {
    const ext = rawFile.name.split('.').pop()?.toLowerCase() || '';
    const matched = props.fileType.some((item) => {
      const t = item.toLowerCase().replace(/^\./, '');
      return ext === t || rawFile.type.indexOf(t) > -1;
    });
    if (!matched) {
      ElMessage.error(`不允许上传的文件格式，支持 ${props.fileType.join('、')}`);
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
  // 不把 el-upload 的 onSuccess/onError 透传给 uploader，避免 FormUploader 内部
  // 先调 onSuccess 再 resolve Promise，导致 el-upload 的 handleSuccess 被触发两次
  // （一次来自 XHR.onload 手动调用，一次来自 Promise.then），造成状态机混乱。
  // 只通过 Promise 的 resolve/reject 返回结果，由 el-upload 自身的 then 链统一驱动 handleSuccess。
  return uploader.upload({
    file: options.file,
    filename: options.filename || 'file',
    onProgress: options.onProgress as any
  });
};

const buildResource = (result: UploadResult, raw: File): FileResource => ({
  url: result.url,
  name: result.originalName || raw.name,
  type: result.mimeType || raw.type,
  size: result.fileSize || raw.size
});

/**
 * 从当前 fileList 中收集已上传完成的资源（仅含 url 的文件）。
 * el-upload 在 success 时已经把 status='success' 写到文件对象上，
 * 因此通过 status 判定可以排除正在上传的文件，避免把无 url 的项回写给父组件。
 */
const collectResources = (): FileResource[] => {
  return fileList.value
    .filter((file) => file.status === 'success' && file.url)
    .map((file) => ({
      url: file.url as string,
      name: file.name,
      type: (file.raw as File | undefined)?.type || '',
      size: file.size
    }));
};

const emitModelValue = () => {
  isInternalUpdate = true;
  const resources = collectResources();
  emit('update:modelValue', resources);
  emit('change', resources);
};

const onChange = (_file: UploadFile, _files: UploadFile[]) => {
  // el-upload 内部已经管理 fileList 的增删与状态变更，
  // 这里仅在外部可见的成功文件发生变化时回写，避免上传中回写空数组。
  // 不在 ready/uploading 状态发射，防止打断 el-upload 内部状态机。
};

const onSuccess = (response: any, file: UploadFile) => {
  // 此时 el-upload 的 handleSuccess 已把 file.status 置为 'success' 并写入 file.response。
  // FormUploader 解析后端 ApiResponseUtil 包裹的结构，返回 { data: { url, ... } }，
  // 这里统一从 data 兜底取 url，并回写 file.url（el-upload 对 listType:text 不会自动推导）。
  const data = response?.data || response;
  const result: UploadResult = response?.url
    ? response
    : {
        url: data?.url,
        originalName: data?.originalName || file.name,
        fileName: data?.fileName || file.name,
        fileSize: data?.fileSize || file.size,
        mimeType: data?.mimeType || file.raw?.type || ''
      };

  file.url = result.url;

  emitModelValue();
  emit('success', result, file);
};

const onError = (error: any, file: UploadFile) => {
  const message = error?.message || '上传失败';
  ElMessage.error(message);
  emit('error', error instanceof Error ? error : new Error(message), file);
};

const onRemove = (file: UploadFile) => {
  emitModelValue();
  emit('remove', file);
};

const handleDownload = (file: UploadFile) => {
  if (!file.url) return;
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name || '';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style lang="scss">
.mfw-upload-file-drag {
  width: 100%;

  .el-upload,
  .el-upload-dragger {
    width: 100%;
  }

  .el-icon--upload {
    margin-top: 20px;
  }

  &__tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
}
</style>
