import { defineComponent, ref, computed, Teleport } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';

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
    const cropperRef = ref<any>(null);

    const imageSrc = computed(() => {
      if (typeof props.image === 'string') return props.image;
      if (props.image instanceof File || props.image instanceof Blob) {
        return URL.createObjectURL(props.image);
      }
      return '';
    });

    const fixedRatio = computed(() => {
      if (props.ratio === 1) return [1, 1] as [number, number];
      if (props.ratio > 1) return [props.ratio, 1] as [number, number];
      return [1, 1 / props.ratio] as [number, number];
    });

    const cropBoxSize = computed(() => {
      const base = 320;
      if (props.ratio >= 1) {
        return { width: base, height: Math.round(base / props.ratio) };
      }
      return { width: Math.round(base * props.ratio), height: base };
    });

    const handleConfirm = () => {
      if (cropperRef.value) {
        cropperRef.value.getCropBlob((blob: Blob) => {
          emit('confirm', blob);
          emit('update:visible', false);
        });
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
          width="600px"
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
            <VueCropper
              ref={cropperRef}
              img={imageSrc.value}
              fixed={true}
              fixedNumber={fixedRatio.value}
              autoCrop={true}
              autoCropWidth={cropBoxSize.value.width}
              autoCropHeight={cropBoxSize.value.height}
              centerBox={true}
              canScale={true}
              canMove={true}
              mode="contain"
              outputType="jpeg"
              full={false}
            />
          </div>
        </ElDialog>
      </Teleport>
    );
  },
});
