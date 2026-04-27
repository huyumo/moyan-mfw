import { defineComponent, ref } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { ImageCropperProps } from './types';

export default defineComponent({
  name: 'ImageCropper',
  props: {
    visible: { type: Boolean, default: false },
    image: { type: [String, Blob], default: '' },
    ratio: { type: Number, default: 1 },
    outputWidth: { type: Number, default: 200 },
    outputHeight: { type: Number, default: 200 },
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

    const handleConfirm = () => {
      const result = cropperRef.value?.getResult();
      const canvas = result?.canvas;
      if (canvas) {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            emit('confirm', blob);
            emit('update:visible', false);
          }
        }, 'image/jpeg', 0.9);
      }
    };

    const handleCancel = () => {
      emit('cancel');
      emit('update:visible', false);
    };

    return () => (
      <ElDialog
        modelValue={props.visible}
        title="裁剪图片"
        width="500px"
        onClose={handleCancel}
        destroyOnClose
      >
        <div class="image-cropper-container">
          <Cropper
            ref={cropperRef}
            src={props.image}
            stencilProps={{
              aspectRatio: props.ratio,
            }}
            class="image-cropper"
          />
        </div>
        <template #footer>
          <ElButton onClick={handleCancel}>取消</ElButton>
          <ElButton type="primary" onClick={handleConfirm}>确认</ElButton>
        </template>
      </ElDialog>
    );
  },
});