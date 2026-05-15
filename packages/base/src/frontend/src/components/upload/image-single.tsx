import './style.scss';
import { defineComponent, ref, computed, type PropType, defineExpose } from 'vue';
import { ElUpload, ElMessage, ElImageViewer, type UploadRequestOptions } from 'element-plus';
import { Plus, Delete, ZoomIn } from '@element-plus/icons-vue';
import ImageCropper from './image-cropper';
import { uploadImage } from '../../../config/upload-config';
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
    const pendingImageUrl = ref('');
    const previewVisible = ref(false);
    const uploading = ref(false);
    const inputRef = ref<HTMLInputElement | null>(null);

    const imageUrl = computed(() => {
      if (!props.modelValue) return '';
      return props.modelValue.src;
    });

    const triggerFileInput = () => {
      inputRef.value?.click();
    };

    const handleFileChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const maxSize = props.maxSize * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
        target.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        ElMessage.error('请上传图片文件');
        target.value = '';
        return;
      }

      if (props.crop) {
        pendingFile.value = file;
        pendingImageUrl.value = URL.createObjectURL(file);
        cropperVisible.value = true;
      } else {
        handleUpload(file);
      }

      target.value = '';
    };

    const handleUpload = async (file: File | Blob) => {
      uploading.value = true;
      try {
        const result = await uploadImage(file, {
          uploadType: props.uploadType,
          businessType: props.businessType,
        });

        const dimensions = await getImageDimensions(file);
        const imageResource: ImageResource = {
          src: result.url,
          width: dimensions.width,
          height: dimensions.height,
        };

        emit('update:modelValue', imageResource);
        emit('change', imageResource);
        emit('success', result);
      } catch (error: any) {
        ElMessage.error(error?.message || '上传失败');
        emit('error', error);
      } finally {
        uploading.value = false;
      }
    };

    const handleCropConfirm = async (blob: Blob) => {
      cropperVisible.value = false;
      if (pendingImageUrl.value) {
        URL.revokeObjectURL(pendingImageUrl.value);
        pendingImageUrl.value = '';
      }
      const file = pendingFile.value;
      pendingFile.value = null;
      await handleUpload(blob);
    };

    const handleRemove = (e: Event) => {
      e.stopPropagation();
      emit('update:modelValue', undefined);
      emit('change', undefined);
    };

    const handlePreview = () => {
      previewVisible.value = true;
    };

    const handleCropCancel = () => {
      cropperVisible.value = false;
      if (pendingImageUrl.value) {
        URL.revokeObjectURL(pendingImageUrl.value);
        pendingImageUrl.value = '';
      }
      pendingFile.value = null;
    };

    defineExpose({ isUploading: uploading });

    return () => (
      <div class="mfw-image-single">
        <input
          ref={inputRef}
          type="file"
          accept={props.accept}
          style="display: none;"
          onChange={handleFileChange}
        />

        <div
          class="avatar-uploader"
          onClick={triggerFileInput}
        >
          {imageUrl.value ? (
            <div class="avatar-uploader-image-box">
              <img
                class="avatar-image"
                src={imageUrl.value}
                style={{ objectFit: 'cover', cursor: 'pointer' }}
                onClick={(e: Event) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
              />
              <span class="avatar-actions" onClick={(e: Event) => e.stopPropagation()}>
                <span class="action-icon action-icon-preview" onClick={handlePreview}>
                  <ZoomIn />
                </span>
                {!props.disabled && (
                  <span class="action-icon action-icon-delete" onClick={handleRemove}>
                    <Delete />
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div class="avatar-uploader-placeholder">
              <span class="placeholder-icon">
                <Plus />
              </span>
            </div>
          )}
        </div>

        {previewVisible.value && imageUrl.value && (
          <ElImageViewer
            url-list={[imageUrl.value]}
            onClose={() => previewVisible.value = false}
            initial-index={0}
          />
        )}

        <ImageCropper
          visible={cropperVisible.value}
          image={pendingFile.value || ''}
          ratio={props.cropRatio}
          outputWidth={props.cropWidth}
          outputHeight={props.cropHeight}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      </div>
    );
  },
});
