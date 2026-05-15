/**
 * @fileoverview MfwQuillEditor 富文本编辑器组件
 * @description 基于 Quill 2.x 的富文本编辑器，支持 v-model 双向绑定、图片上传
 */

import './style.scss';
import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { uploadImage } from '../../../config/upload-config';

export default defineComponent({
  name: 'MfwQuillEditor',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '请输入内容' },
    height: { type: [String, Number], default: '200px' },
    readonly: { type: Boolean, default: false },
    toolbar: {
      type: Array as () => Array<any>,
      default: () => [
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const editorRef = ref<HTMLElement | null>(null);
    let quillInstance: InstanceType<typeof Quill> | null = null;
    let updatingFromQuill = false;
    let fileInput: HTMLInputElement | null = null;
    const uploading = ref(false);

    const handleImageUpload = () => {
      if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        fileInput.addEventListener('change', async () => {
          const files = fileInput?.files;
          if (!files || !quillInstance) return;

          uploading.value = true;
          const range = quillInstance.getSelection(true);
          for (const file of Array.from(files)) {
            try {
              const result = await uploadImage(file);
              quillInstance!.insertEmbed(range.index, 'image', result.url);
              range.index += 1;
            } catch (e: any) {
              ElMessage.error(`图片上传失败：${e?.message || '未知错误'}`);
            }
          }
          uploading.value = false;
          if (fileInput) fileInput.value = '';
        });
      }
      if (!uploading.value) {
        fileInput.click();
      }
    };

    const initEditor = () => {
      if (!editorRef.value) return;

      quillInstance = new Quill(editorRef.value, {
        theme: 'snow',
        placeholder: props.placeholder,
        readOnly: props.readonly,
        modules: {
          toolbar: {
            container: props.toolbar,
            handlers: {
              image: handleImageUpload,
            },
          },
        },
      });

      if (props.modelValue) {
        quillInstance.root.innerHTML = props.modelValue;
      }

      quillInstance.on('text-change', () => {
        if (updatingFromQuill) return;
        const html = quillInstance?.root.innerHTML || '';
        emit('update:modelValue', html);
        emit('change', html);
      });
    };

    watch(
      () => props.modelValue,
      (val) => {
        if (quillInstance && quillInstance.root.innerHTML !== val) {
          updatingFromQuill = true;
          quillInstance.root.innerHTML = val;
          updatingFromQuill = false;
        }
      }
    );

    watch(
      () => props.readonly,
      (val) => {
        if (quillInstance) {
          quillInstance.enable(!val);
        }
      }
    );

    onMounted(() => {
      initEditor();
    });

    onBeforeUnmount(() => {
      quillInstance = null;
      if (fileInput) fileInput.remove();
    });

    return () => (
      <div
        class="mfw-quill-editor"
        style={{ height: typeof props.height === 'number' ? `${props.height}px` : props.height }}
      >
        <div ref={editorRef} class="mfw-quill-editor-container" />
      </div>
    );
  },
});
