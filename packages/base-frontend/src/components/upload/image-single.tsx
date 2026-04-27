import './style.scss';
import { defineComponent, ref, computed, type PropType } from 'vue';
import { ElUpload, ElMessage, ElImageViewer, type UploadRequestOptions } from 'element-plus';
import { Plus, Delete, ZoomIn } from '@element-plus/icons-vue';
import ImageCropper from './image-cropper';
import { uploadImage } from '../../config/upload-config';
import type { ImageResource, UploadMethodType } from './types';

const getImageDimensions = (file: File | Blob): Promise<{ width: number; height: number }> => {
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
  name: 'MfwImageSingle',
  props: {
    modelValue: { type: Object as PropType<ImageResource>, default: undefined },
    uploadType: { type: String as PropType<UploadMethodType>, default: undefined },
    crop: { type: Boolean, default: true },
    cropRatio: { type: Number, default: 1 },
    cropWidth: { type: Number, default: 200 },
    cropHeight: { type: Number, default: 200 },
    maxSize: { type: Number, default: 10 },
    accept: { type: String, default: 'image/*' },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '点击上传' },
    businessType: { type: String, default: undefined },
  },
  emits: ['update:modelValue', 'change', 'success', 'error'],
  setup(props, { emit }) {
    const cropperVisible = ref(false);
    const pendingFile = ref<File | null>(null);
    const previewVisible = ref(false);
    const uploading = ref(false);

    const imageUrl = computed(() => {
      if (!props.modelValue) return '';
      return props.modelValue.src;
    });

    const beforeUpload = (file: File): boolean => {
      const maxSize = props.maxSize * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
        return false;
      }

      if (!file.type.startsWith('image/')) {
        ElMessage.error('请上传图片文件');
        return false;
      }

      if (props.crop) {
        pendingFile.value = file;
        cropperVisible.value = true;
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
        
        emit('update:modelValue', imageResource);
        emit('change', imageResource);
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

    const handleCropConfirm = async (blob: Blob) => {
      uploading.value = true;
      try {
        const result = await uploadImage(blob, {
          uploadType: props.uploadType,
          businessType: props.businessType,
        });
        
        const imageResource: ImageResource = {
          src: result.url,
          width: props.cropWidth,
          height: props.cropHeight,
        };
        
        emit('update:modelValue', imageResource);
        emit('change', imageResource);
        emit('success', result);
      } catch (error) {
        ElMessage.error('上传失败');
        emit('error', error);
      } finally {
        uploading.value = false;
        cropperVisible.value = false;
        pendingFile.value = null;
      }
    };

    const handleRemove = () => {
      emit('update:modelValue', undefined);
      emit('change', undefined);
    };

    const handlePreview = () => {
      previewVisible.value = true;
    };

    const handleCropCancel = () => {
      cropperVisible.value = false;
      pendingFile.value = null;
    };

    return () => (
      <div class="mfw-image-single">
        <ElUpload
          class="avatar-uploader"
          action="#"
          showFileList={false}
          autoUpload={!props.crop}
          beforeUpload={beforeUpload}
          httpRequest={props.crop ? undefined : handleHttpRequest}
          disabled={props.disabled || uploading.value}
          accept={props.accept}
        >
          {imageUrl.value ? (
            <div class="avatar-uploader-image-box">
              <img
                class="avatar-image"
                src={imageUrl.value}
                style={{ objectFit: 'cover' }}
              />
              <span class="avatar-actions" onClick={(e: Event) => e.stopPropagation()}>
                <i class="action-icon" onClick={handlePreview}>
                  <ZoomIn />
                </i>
                {!props.disabled && (
                  <i class="action-icon" onClick={handleRemove}>
                    <Delete />
                  </i>
                )}
              </span>
            </div>
          ) : (
            <div class="avatar-uploader-placeholder">
              <Plus class="placeholder-icon" />
              <span class="placeholder-text">{props.placeholder}</span>
            </div>
          )}
        </ElUpload>

        {previewVisible.value && imageUrl.value && (
          <ElImageViewer
            urlList={[imageUrl.value]}
            onClose={() => previewVisible.value = false}
          />
        )}

        {props.crop && pendingFile.value && (
          <ImageCropper
            visible={cropperVisible.value}
            image={pendingFile.value}
            ratio={props.cropRatio}
            outputWidth={props.cropWidth}
            outputHeight={props.cropHeight}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
          />
        )}
      </div>
    );
  },
});