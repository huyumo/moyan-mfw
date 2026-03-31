/**
 * @fileoverview MfwJsonEditor JSON 编辑器组件
 * @description 提供 JSON 数据编辑和展示功能
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
  ElInput,
  ElMessage
} from 'element-plus';
import type { MfwJsonEditorProps, MfwJsonEditorEmits, MfwJsonEditorInstance } from './types';

export default defineComponent({
  name: 'MfwJsonEditor',

  props: {
    /** 绑定值 */
    modelValue: {
      type: [Object, Array, String] as PropType<MfwJsonEditorProps['modelValue']>,
      default: null
    },
    /** 是否只读 */
    readonly: {
      type: Boolean as PropType<MfwJsonEditorProps['readonly']>,
      default: false
    },
    /** 是否显示行号 */
    lineNumbers: {
      type: Boolean as PropType<MfwJsonEditorProps['lineNumbers']>,
      default: true
    },
    /** 缩进空格数 */
    indent: {
      type: Number as PropType<MfwJsonEditorProps['indent']>,
      default: 2
    },
    /** 占位符文本 */
    placeholder: {
      type: String as PropType<MfwJsonEditorProps['placeholder']>,
      default: '请输入 JSON'
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean as PropType<MfwJsonEditorProps['disabled']>,
      default: false
    },
    /** 最小高度 */
    minHeight: {
      type: String as PropType<MfwJsonEditorProps['minHeight']>,
      default: '200px'
    },
    /** 最大高度 */
    maxHeight: {
      type: String as PropType<MfwJsonEditorProps['maxHeight']>,
      default: '500px'
    }
  },

  emits: {
    'update:modelValue': (value: any) => true,
    change: (value: any) => true,
    error: (error: Error) => true
  },

  setup(props, { emit, expose }) {
    const editorRef = ref<any>();
    const inputValue = ref('');
    const error = ref<string | null>(null);

    // 初始化值
    const initValue = () => {
      if (props.modelValue) {
        if (typeof props.modelValue === 'string') {
          inputValue.value = props.modelValue;
        } else {
          inputValue.value = JSON.stringify(props.modelValue, null, props.indent);
        }
      } else {
        inputValue.value = '';
      }
    };

    initValue();

    watch(() => props.modelValue, (newVal) => {
      if (newVal !== undefined && newVal !== null) {
        if (typeof newVal === 'string') {
          inputValue.value = newVal;
        } else {
          try {
            inputValue.value = JSON.stringify(newVal, null, props.indent);
          } catch (e) {
            // ignore
          }
        }
      }
    }, { deep: true });

    const parsedValue = computed(() => {
      if (!inputValue.value) {
        return null;
      }
      try {
        return JSON.parse(inputValue.value);
      } catch (e) {
        return null;
      }
    });

    const handleInput = (value: string) => {
      error.value = null;

      try {
        const parsed = JSON.parse(value);
        emit('update:modelValue', parsed);
        emit('change', parsed);
      } catch (e: any) {
        // JSON 格式错误，不更新 modelValue
        error.value = e.message;
        emit('error', e);
      }
    };

    const format = () => {
      try {
        const parsed = JSON.parse(inputValue.value);
        inputValue.value = JSON.stringify(parsed, null, props.indent);
        ElMessage.success('格式化成功');
      } catch (e: any) {
        ElMessage.error(`格式错误：${e.message}`);
      }
    };

    const clear = () => {
      inputValue.value = '';
      emit('update:modelValue', null);
      emit('change', null);
    };

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(inputValue.value);
        ElMessage.success('复制成功');
      } catch (e) {
        ElMessage.error('复制失败');
      }
    };

    const getJsonString = () => {
      return inputValue.value;
    };

    expose<MfwJsonEditorInstance>({
      format,
      clear,
      copy,
      getJsonString
    });

    return () => (
      <div class="mfw-json-editor">
        <div class="mfw-json-editor-toolbar">
          {!props.readonly && !props.disabled && (
            <>
              <el-button size="small" onClick={format}>格式化</el-button>
              <el-button size="small" onClick={copy}>复制</el-button>
              <el-button size="small" onClick={clear}>清空</el-button>
            </>
          )}
        </div>
        <ElInput
          ref={editorRef}
          v-model={inputValue.value}
          type="textarea"
          readonly={props.readonly}
          disabled={props.disabled}
          placeholder={props.placeholder}
          autosize={{ minRows: 5, maxRows: 20 }}
          class={['mfw-json-editor-input', error.value ? 'is-error' : '']}
          onChange={handleInput}
        />
        {error.value && (
          <div class="mfw-json-editor-error">{error.value}</div>
        )}
      </div>
    );
  }
});
