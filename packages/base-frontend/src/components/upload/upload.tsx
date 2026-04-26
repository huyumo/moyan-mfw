/**
 * @fileoverview MfwUpload 上传组件
 * @description 提供文件上传功能，支持图片和文件两种资源格式
 * @example
 * ```vue
 * <!-- 图片上传（返回 {src, width, height}） -->
 * <MfwUpload v-model="imageData" resource-type="image" />
 *
 * <!-- 文件上传（返回 {url, name, type}） -->
 * <MfwUpload v-model="fileData" resource-type="file" />
 *
 * <!-- 多图上传 -->
 * <MfwUpload v-model="images" resource-type="image" :multiple="true" :limit="9" />
 * ```
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  watch,
  type PropType
} from 'vue';
import {
  ElUpload,
  ElMessage,
  type UploadProps,
  type UploadFile,
  type UploadUserFile,
  type UploadRequestOptions
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { 
  MfwUploadProps, 
  UploadResult, 
  ImageResource, 
  MediaResource,
  FileResource, 
  ResourceValue,
  ResourceType 
} from './types';
import { FormUploader } from './uploader';

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法获取图片尺寸'));
    };
    img.src = url;
  });
}

function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const media = document.createElement(
      file.type.startsWith('video') ? 'video' : 'audio'
    );
    const url = URL.createObjectURL(file);
    media.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(media.duration));
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    media.src = url;
  });
}

function getDisplayUrl(value: ResourceValue | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if ('src' in value) return value.src;
  if ('url' in value) return value.url;
  return '';
}

export default defineComponent({
  name: 'MfwUpload',

  props: {
    modelValue: {
      type: [Object, Array, String] as PropType<MfwUploadProps['modelValue']>,
      default: undefined
    },
    resourceType: {
      type: String as PropType<ResourceType>,
      default: 'image'
    },
    uploadType: {
      type: String as PropType<MfwUploadProps['uploadType']>,
      default: 'form'
    },
    multiple: {
      type: Boolean as PropType<MfwUploadProps['multiple']>,
      default: false
    },
    limit: {
      type: Number as PropType<MfwUploadProps['limit']>,
      default: 1
    },
    disabled: {
      type: Boolean as PropType<MfwUploadProps['disabled']>,
      default: false
    },
    maxSize: {
      type: Number as PropType<MfwUploadProps['maxSize']>,
      default: 10
    },
    accept: {
      type: String as PropType<MfwUploadProps['accept']>,
      default: ''
    },
    fileTypes: {
      type: Array as PropType<MfwUploadProps['fileTypes']>,
      default: () => ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    httpRequest: {
      type: Function as PropType<MfwUploadProps['httpRequest']>
    },
    beforeUpload: {
      type: Function as PropType<MfwUploadProps['beforeUpload']>
    },
    elProps: {
      type: Object as PropType<Partial<MfwUploadProps['elProps']>>
    },
    listType: {
      type: String as PropType<MfwUploadProps['listType']>,
      default: 'picture-card'
    },
    showDelete: {
      type: Boolean as PropType<MfwUploadProps['showDelete']>,
      default: true
    },
    emptyText: {
      type: String as PropType<MfwUploadProps['emptyText']>,
      default: '点击上传'
    },
    uploadUrl: {
      type: String as PropType<MfwUploadProps['uploadUrl']>,
      default: '/api/upload-files'
    },
    businessType: {
      type: String as PropType<MfwUploadProps['businessType']>,
      default: undefined
    }
  },

  emits: {
    'update:modelValue': (value: any) => true,
    change: (uploadFile: any, uploadFiles: any) => true,
    success: (response: any, uploadFile: any) => true,
    error: (error: any, uploadFile: any) => true,
    remove: (file: any) => true
  },

  setup(props, { emit, expose, slots }) {
    const fileList = ref<UploadUserFile[]>([]);

    const initFileList = () => {
      if (!props.modelValue) {
        fileList.value = [];
        return;
      }

      const values = props.multiple 
        ? (props.modelValue as ResourceValue[]) 
        : [props.modelValue as ResourceValue];

      fileList.value = values.filter(Boolean).map((v, index) => ({
        url: getDisplayUrl(v),
        name: typeof v === 'object' && 'name' in v ? v.name : getDisplayUrl(v).split('/').pop() || 'file',
        uid: index
      }));
    };

    initFileList();

    watch(() => props.modelValue, initFileList, { deep: true });

    const handleChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]) => {
      emit('change', uploadFile, uploadFiles);
    };

    const handleSuccess = async (response: any, uploadFile: UploadFile) => {
      const result: UploadResult = {
        url: response.url,
        originalName: response.originalName,
        fileName: response.fileName,
        fileSize: response.fileSize,
        mimeType: response.mimeType,
      };

      let resourceValue: ResourceValue;

      if (props.resourceType === 'image') {
        try {
          const dimensions = await getImageDimensions(uploadFile.raw as File);
          resourceValue = {
            src: result.url,
            width: dimensions.width,
            height: dimensions.height,
          } as ImageResource;
        } catch {
          resourceValue = {
            src: result.url,
            width: 0,
            height: 0,
          } as ImageResource;
        }
      } else if (props.resourceType === 'media') {
        try {
          const duration = await getMediaDuration(uploadFile.raw as File);
          resourceValue = {
            url: result.url,
            name: result.originalName,
            type: result.mimeType,
            size: result.fileSize,
            duration,
          } as MediaResource;
        } catch {
          resourceValue = {
            url: result.url,
            name: result.originalName,
            type: result.mimeType,
            size: result.fileSize,
            duration: 0,
          } as MediaResource;
        }
      } else {
        resourceValue = {
          url: result.url,
          name: result.originalName,
          type: result.mimeType,
          size: result.fileSize,
        } as FileResource;
      }

      if (props.multiple) {
        const currentValues = (props.modelValue as ResourceValue[]) || [];
        emit('update:modelValue', [...currentValues, resourceValue]);
      } else {
        emit('update:modelValue', resourceValue);
      }

      emit('success', result, uploadFile);
    };

    const handleError = (error: any, uploadFile: UploadFile) => {
      ElMessage.error(`上传失败：${error.message || '未知错误'}`);
      emit('error', error, uploadFile);
    };

    const handleRemove = (uploadFile: UploadFile) => {
      emit('remove', uploadFile);

      if (props.multiple) {
        const values = (props.modelValue as ResourceValue[]) || [];
        const remaining = values.filter((_, index) => index !== uploadFile.uid);
        emit('update:modelValue', remaining);
      } else {
        emit('update:modelValue', null);
      }
    };

    const beforeUpload = (file: File): boolean | Promise<File> => {
      if (props.fileTypes && props.fileTypes.length > 0) {
        const isAllowed = props.fileTypes.some((type) => {
          if (type.includes('/')) {
            return file.type === type;
          }
          return file.name.toLowerCase().endsWith(`.${type}`);
        });

        if (!isAllowed) {
          ElMessage.error(`不支持的文件类型：${file.name}`);
          return false;
        }
      }

      const maxSize = props.maxSize * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
        return false;
      }

      if (props.beforeUpload) {
        return props.beforeUpload(file);
      }

      return true;
    };

    const handleHttpRequest = async (options: UploadRequestOptions) => {
      if (props.httpRequest) {
        return props.httpRequest(options);
      }

      const uploader = new FormUploader(props.uploadUrl, props.businessType);
      return uploader.upload({
        file: options.file,
        filename: options.filename,
        onProgress: options.onProgress as any,
        onSuccess: options.onSuccess as any,
        onError: options.onError as any,
      });
    };

    const clear = () => {
      fileList.value = [];
      emit('update:modelValue', props.multiple ? [] : null);
    };

    const uploadFiles = computed(() => fileList.value);

    expose({ clear, uploadFiles });

    return () => (
      <div class="mfw-upload">
        <ElUpload
          {...props.elProps}
          {...(props.multiple ? { multiple: true } : {})}
          file-list={fileList.value}
          limit={props.limit}
          disabled={props.disabled}
          accept={props.accept}
          listType={props.listType}
          autoUpload={true}
          beforeUpload={beforeUpload}
          httpRequest={handleHttpRequest}
          on-change={handleChange}
          on-success={handleSuccess}
          on-error={handleError}
          on-remove={handleRemove}
        >
          {slots.default?.() ?? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Plus style={{ fontSize: '28px', color: 'var(--el-text-color-secondary)', marginBottom: '8px' }} />
              <div class="el-upload__text" style={{ fontSize: '12px' }}>{props.emptyText}</div>
            </div>
          )}
        </ElUpload>
      </div>
    );
  }
});