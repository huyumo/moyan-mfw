import './style.scss';
import { defineComponent, ref, computed, type PropType, defineExpose } from 'vue';
import { ElUpload, ElMessage, type UploadRequestOptions } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { uploadImage } from '../../config/upload-config';
import type { ImageResource, UploadMethodType } from './types';

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
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
};

export default defineComponent({
  name: 'MfwImageGallery',
  props: {
    modelValue: { type: Array as PropType<ImageResource[]>, default: () => [] },
    uploadType: { type: String as PropType<UploadMethodType>, default: undefined },
    limit: { type: Number, default: 9 },
    maxSize: { type: Number, default: 10 },
    accept: { type: String, default: 'image/*' },
    disabled: { type: Boolean, default: false },
    draggable: { type: Boolean, default: true },
    businessType: { type: String, default: undefined },
  },
  emits: ['update:modelValue', 'change', 'success', 'error', 'remove'],
  setup(props, { emit }) {
    const uploading = ref(false);

    const fileList = computed(() => {
      return (props.modelValue || []).map((item: ImageResource, index) => ({
        url: item.src,
        name: `image-${index}`,
        uid: index,
      }));
    });

    const beforeUpload = (file: File): boolean => {
      if (fileList.value.length >= props.limit) {
        ElMessage.error(`最多上传 ${props.limit} 张图片`);
        return false;
      }

      const maxSize = props.maxSize * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
        return false;
      }

      if (!file.type.startsWith('image/')) {
        ElMessage.error('请上传图片文件');
        return false;
      }

      return true;
    };

    const handleHttpRequest = async (options: UploadRequestOptions) => {
      uploading.value = true;
      try {
        const result = await uploadImage(options.file, {
          uploadType: props.uploadType,
          businessType: props.businessType,
        });
        
        const dimensions = await getImageDimensions(options.file);
        const imageResource: ImageResource = {
          src: result.url,
          width: dimensions.width,
          height: dimensions.height,
        };
        
        const newValue = [...(props.modelValue || []), imageResource];
        emit('update:modelValue', newValue);
        emit('change', newValue);
        emit('success', result);
        
        return result;
      } catch (error) {
        ElMessage.error('上传失败');
        emit('error', error);
        throw error;
      } finally {
        uploading.value = false;
      }
    };

    const handleRemove = (file: { uid: number }) => {
      const index = file.uid;
      const newValue = (props.modelValue || []).filter((_, i) => i !== index);
      emit('update:modelValue', newValue);
      emit('change', newValue);
      emit('remove', file);
    };

    defineExpose({ isUploading: uploading });

    return () => (
      <div class="mfw-image-gallery">
        <ElUpload
          action="#"
          fileList={fileList.value}
          listType="picture-card"
          limit={props.limit}
          beforeUpload={beforeUpload}
          httpRequest={handleHttpRequest}
          onRemove={handleRemove}
          disabled={props.disabled || uploading.value}
          accept={props.accept}
        >
          {fileList.value.length < props.limit && (
            <div class="upload-placeholder">
              <span class="placeholder-icon">
                <Plus />
              </span>
            </div>
          )}
        </ElUpload>
      </div>
    );
  },
});