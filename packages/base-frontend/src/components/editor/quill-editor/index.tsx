/**
 * @fileoverview MfwQuillEditor 富文本编辑器组件
 * @description 基于 Quill 2.x 的富文本编辑器，支持 v-model 双向绑定
 */

import './style.scss';
import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

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

    const initEditor = () => {
      if (!editorRef.value) return;

      quillInstance = new Quill(editorRef.value, {
        theme: 'snow',
        placeholder: props.placeholder,
        readOnly: props.readonly,
        modules: {
          toolbar: props.toolbar,
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
