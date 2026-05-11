import { defineComponent, ref, computed, Teleport } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { ImageCropperProps } from './types';

export default defineComponent({
  name: 'ImageCropper',
  props: {
    visible: { type: Boolean, default: false },
    image: { type: [String, File, Blob], default: '' },
    ratio: { type: Number, default: 1 },
    outputWidth: { type: Number, default: 200 },
    outputHeight: { type: Number, default: 200 },
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

    const imageSrc = computed(() => {
      if (typeof props.image === 'string') return props.image;
      if (props.image instanceof File || props.image instanceof Blob) {
        return URL.createObjectURL(props.image);
      }
      return '';
    });

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
      <Teleport to="body" disabled={!props.visible}>
        <ElDialog
          modelValue={props.visible}
          title="裁剪图片"
          width="500px"
          onClose={handleCancel}
          destroyOnClose
          zIndex={3000}
          v-slots={{
            footer: () => (
              <>
                <ElButton onClick={handleCancel}>取消</ElButton>
                <ElButton type="primary" onClick={handleConfirm}>确认</ElButton>
              </>
            ),
          }}
        >
          <div class="image-cropper-container">
            <Cropper
              ref={cropperRef}
              src={imageSrc.value}
              stencilProps={{
                aspectRatio: props.ratio,
              }}
              class="image-cropper"
            />
          </div>
        </ElDialog>
      </Teleport>
    );
  },
});