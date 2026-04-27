<template>
  <div class="mfw-md-editor" :style="{ height: normalizedHeight }">
    <md-editor
      v-model="internalValue"
      :theme="theme"
      :previewTheme="previewTheme"
      :codeTheme="codeTheme"
      :showCodeRowNumber="showCodeRowNumber"
      :toolbars="computedToolbars"
      :placeholder="placeholder"
      :readOnly="readonly"
      :noImgZoomIn="true"
      :codeFoldable="false"
      :noPrettier="false"
      @onSave="handleSave"
      @onChange="handleChange"
    >
      <template #defToolbars>
        <button
          v-if="showMobileToggle"
          class="md-editor-toolbar-item"
          type="button"
          title="切换预览模式"
          @click="togglePreviewMode"
        >
          <el-icon>
            <Cellphone v-if="previewMode === 'mobile'" />
            <Monitor v-else />
          </el-icon>
        </button>
      </template>
      <template #preview="{ html }">
        <div
          v-if="previewMode === 'mobile'"
          class="mobile-preview-container"
          :style="{ maxWidth: mobileWidth }"
        >
          <div class="mobile-preview-content" v-html="html" />
        </div>
      </template>
    </md-editor>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { MdEditor } from 'md-editor-v3';
import type { ToolbarNames, Themes } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { Cellphone, Monitor } from '@element-plus/icons-vue';
import type { MfwMdEditorProps, MfwMdEditorEmits, MfwMdEditorInstance } from './types';

defineOptions({ name: 'MfwMdEditor' });

const props = withDefaults(defineProps<MfwMdEditorProps>(), {
  modelValue: '',
  height: 400,
  placeholder: '请输入内容',
  readonly: false,
  showToolbar: true,
  showCodeRowNumber: true,
  showMobileToggle: true,
  previewMode: 'desktop',
  mobileWidth: '375px',
  uploadApi: '',
  uploadHeaders: () => ({}),
});

const emit = defineEmits<MfwMdEditorEmits>();

const internalValue = ref(props.modelValue || '');
const previewMode = ref<'desktop' | 'mobile'>(props.previewMode);

const normalizedHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height;
});

const theme = computed<Themes>(() => 'light');
const previewTheme = computed(() => 'vuepress');
const codeTheme = computed(() => 'atom');

const computedToolbars = computed<ToolbarNames[]>(() => {
  if (!props.showToolbar) return [];
  return [
    'bold', 'underline', 'italic', 'strikeThrough', 'sub', 'sup',
    'quote', 'unorderedList', 'orderedList', 'code', 'link',
    'image', 'table', 'divider', 'revoke', 'next', 'save',
    'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview',
    'github',
  ] as ToolbarNames[];
});

watch(() => props.modelValue, (val) => {
  if (val !== internalValue.value) {
    internalValue.value = val || '';
  }
});

watch(internalValue, (val) => {
  emit('update:modelValue', val);
});

const handleChange = (value: string) => {
  emit('change', value);
};

const handleSave = (value: string) => {
  emit('save', value);
};

const togglePreviewMode = () => {
  previewMode.value = previewMode.value === 'desktop' ? 'mobile' : 'desktop';
};

defineExpose<MfwMdEditorInstance>({
  getContent: () => internalValue.value,
  clear: () => { internalValue.value = ''; },
});
</script>

<style scoped lang="scss">
@import './style.scss';
</style>
