/**
 * @fileoverview MfwUpload 上传组件
 * @description 提供文件上传功能，支持单图、多图、文件等多种上传场景
 * @example
 * ```vue
 * <!-- 单图上传 -->
 * <mfw-upload v-model="imageUrl" />
 *
 * <!-- 多图上传 -->
 * <mfw-upload v-model="imageUrls" :multiple="true" :limit="9" />
 *
 * <!-- 自定义上传按钮 -->
 * <mfw-upload v-model="imageUrl">
 *   <el-button type="primary">选择文件</el-button>
 * </mfw-upload>
 *
 * <!-- 图片列表 -->
 * <mfw-upload v-model="imageUrls" list-type="picture-card" />
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
import type { MfwUploadProps, UploadResult } from './types';

export default defineComponent({
  name: 'MfwUpload',

  props: {
    /** 绑定值 */
    modelValue: {
      type: [String, Array] as PropType<MfwUploadProps['modelValue']>,
      default: undefined
    },
    /** 上传类型 */
    uploadType: {
      type: String as PropType<MfwUploadProps['uploadType']>,
      default: 'form'
    },
    /** 是否多选 */
    multiple: {
      type: Boolean as PropType<MfwUploadProps['multiple']>,
      default: false
    },
    /** 最大上传数量 */
    limit: {
      type: Number as PropType<MfwUploadProps['limit']>,
      default: 1
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean as PropType<MfwUploadProps['disabled']>,
      default: false
    },
    /** 文件大小限制（MB） */
    maxSize: {
      type: Number as PropType<MfwUploadProps['maxSize']>,
      default: 10
    },
    /** 允许的文件类型 */
    accept: {
      type: String as PropType<MfwUploadProps['accept']>,
      default: ''
    },
    /** 允许的文件扩展名 */
    fileTypes: {
      type: Array as PropType<MfwUploadProps['fileTypes']>,
      default: () => ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    /** 自定义上传方法 */
    httpRequest: {
      type: Function as PropType<MfwUploadProps['httpRequest']>
    },
    /** 上传前回调 */
    beforeUpload: {
      type: Function as PropType<MfwUploadProps['beforeUpload']>
    },
    /** Element Plus Upload Props */
    elProps: {
      type: Object as PropType<Partial<MfwUploadProps['elProps']>>
    },
    /** 列表类型 */
    listType: {
      type: String as PropType<MfwUploadProps['listType']>,
      default: 'picture-card'
    },
    /** 是否显示删除按钮 */
    showDelete: {
      type: Boolean as PropType<MfwUploadProps['showDelete']>,
      default: true
    },
    /** 空值提示文本 */
    emptyText: {
      type: String as PropType<MfwUploadProps['emptyText']>,
      default: '点击上传'
    }
  },

  emits: {
    'update:modelValue': (value: any) => true,
    change: (value: any) => true,
    success: (response: any) => true,
    error: (error: Error) => true,
    remove: (file: any) => true
  },

  setup(props, { emit, expose, slots }) {
    const fileList = ref<UploadUserFile[]>([]);

    // 初始化文件列表
    const initFileList = () => {
      if (props.modelValue) {
        if (Array.isArray(props.modelValue)) {
          fileList.value = props.modelValue.map((url) => ({
            url,
            name: url.split('/').pop() || 'file'
          }));
        } else if (props.modelValue) {
          fileList.value = [{
            url: props.modelValue,
            name: props.modelValue.split('/').pop() || 'file'
          }];
        }
      } else {
        fileList.value = [];
      }
    };

    initFileList();

    watch(() => props.modelValue, () => {
      initFileList();
    }, { deep: true });

    /**
     * 文件变化
     */
    const handleChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]) => {
      emit('change', uploadFile, uploadFiles);
    };

    /**
     * 上传成功
     */
    const handleSuccess = (response: any, uploadFile: UploadFile) => {
      const result: UploadResult = {
        url: response.url || response.data?.url,
        name: response.name || uploadFile.name,
        size: response.size || uploadFile.size,
        ...response
      };

      // 更新 modelValue
      if (props.multiple) {
        const urls = fileList.value.map((f) => f.url).filter(Boolean) as string[];
        if (result.url && !urls.includes(result.url)) {
          urls.push(result.url);
        }
        emit('update:modelValue', urls);
      } else {
        if (result.url) {
          emit('update:modelValue', result.url);
        }
      }

      emit('success', result, uploadFile);
    };

    /**
     * 上传失败
     */
    const handleError = (error: any, uploadFile: UploadFile) => {
      ElMessage.error(`上传失败：${error.message || '未知错误'}`);
      emit('error', error, uploadFile);
    };

    /**
     * 文件移除
     */
    const handleRemove = (uploadFile: UploadFile) => {
      emit('remove', uploadFile);

      // 更新 modelValue
      if (props.multiple) {
        const urls = fileList.value
          .filter((f) => f.uid !== uploadFile.uid)
          .map((f) => f.url)
          .filter(Boolean) as string[];
        emit('update:modelValue', urls);
      } else {
        emit('update:modelValue', '');
      }
    };

    /**
     * 上传前验证
     */
    const beforeUpload = (file: File): boolean | Promise<File> => {
      // 检查文件类型
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

      // 检查文件大小
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

    /**
     * 自定义上传请求
     */
    const handleHttpRequest = (options: UploadRequestOptions) => {
      if (props.httpRequest) {
        return props.httpRequest(options);
      }

      // 默认上传逻辑（需要业务项目提供实际实现）
      return Promise.reject(new Error('MfwUpload: 请通过 httpRequest prop 提供自定义上传方法'));
    };

    /**
     * 清除上传列表
     */
    const clear = () => {
      fileList.value = [];
      emit('update:modelValue', props.multiple ? [] : '');
    };

    /**
     * 获取上传文件列表
     */
    const uploadFiles = computed(() => fileList.value);

    expose({
      clear,
      uploadFiles
    });

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
          autoUpload={false}
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
