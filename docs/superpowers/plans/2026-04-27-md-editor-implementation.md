# MfwMdEditor Markdown 编辑器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 md-editor-v3 库深度封装的 Markdown 编辑器组件，适配 Moyan MFW 后台管理系统，支持桌面端和移动端预览。

**Architecture:** 安装 md-editor-v3 依赖，创建 MfwMdEditor 组件（Vue 3 SFC），深度封装工具栏、上传接口、移动端预览功能，按项目现有组件模式导出。

**Tech Stack:** Vue 3 Composition API, TypeScript, md-editor-v3, Element Plus, SCSS

---

## 文件结构

```
packages/base-frontend/src/components/editor/md-editor/
  ├── Index.vue              # 主组件（编辑+预览+移动端切换）
  ├── index.ts               # 默认导出
  ├── mod.ts                 # 命名导出
  ├── style.scss             # 样式定制
  └── types.ts               # TypeScript 类型定义

packages/base-frontend/src/components/
  ├── editor/
  │   └── mod.ts             # 修改：添加 MfwMdEditor 导出
```

---

### Task 1: 安装 md-editor-v3 依赖

**Files:**
- Modify: `packages/base-frontend/package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd packages/base-frontend && pnpm add md-editor-v3
```

- [ ] **Step 2: 验证安装**

```bash
cd packages/base-frontend && pnpm list md-editor-v3
```

Expected: `md-editor-v3` 版本号 ≥ 6.0.0

- [ ] **Step 3: Commit**

```bash
git add packages/base-frontend/package.json pnpm-lock.yaml
git commit -m "feat: add md-editor-v3 dependency for markdown editor"
```

---

### Task 2: 创建类型定义

**Files:**
- Create: `packages/base-frontend/src/components/editor/md-editor/types.ts`

- [ ] **Step 1: 编写类型定义**

```typescript
// packages/base-frontend/src/components/editor/md-editor/types.ts

/** MfwMdEditor Props */
export interface MfwMdEditorProps {
  /** v-model 双向绑定值 */
  modelValue?: string;
  /** 编辑器高度，默认 400 */
  height?: number | string;
  /** 占位文本 */
  placeholder?: string;
  /** 只读模式 */
  readonly?: boolean;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 是否显示代码块行号 */
  showCodeRowNumber?: boolean;
  /** 是否显示移动端切换按钮 */
  showMobileToggle?: boolean;
  /** 预览模式: desktop 或 mobile */
  previewMode?: 'desktop' | 'mobile';
  /** 移动端预览视口宽度 */
  mobileWidth?: string;
  /** 图片上传接口（可选，默认使用项目接口） */
  uploadApi?: string;
  /** 上传请求头 */
  uploadHeaders?: Record<string, string>;
}

/** MfwMdEditor Emits */
export interface MfwMdEditorEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'save', value: string): void;
}

/** MfwMdEditor Instance */
export interface MfwMdEditorInstance {
  /** 获取 Markdown 内容 */
  getContent: () => string;
  /** 清空内容 */
  clear: () => void;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/editor/md-editor/types.ts
git commit -m "feat: add types for MfwMdEditor component"
```

---

### Task 3: 创建主组件 Index.vue

**Files:**
- Create: `packages/base-frontend/src/components/editor/md-editor/Index.vue`

- [ ] **Step 1: 编写组件代码**

```vue
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
      @onSave="handleSave"
      @onChange="handleChange"
    >
      <template #defToolbars>
        <template v-if="showMobileToggle">
          <Toolbar @click="togglePreviewMode">
            <el-tooltip :content="previewMode === 'mobile' ? '桌面预览' : '移动端预览'" placement="bottom">
              <el-icon>
                <Cellphone v-if="previewMode === 'mobile'" />
                <Monitor v-else />
              </el-icon>
            </el-tooltip>
          </Toolbar>
        </template>
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
import { MdEditor, Toolbar } from 'md-editor-v3';
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

const theme = computed(() => 'light');
const previewTheme = computed(() => 'vuepress');
const codeTheme = computed(() => 'atom');

const computedToolbars = computed(() => {
  if (!props.showToolbar) return [];
  return [
    'bold', 'underline', 'italic', 'strikeThrough', 'sub', 'sup',
    'quote', 'unorderedList', 'orderedList', 'code', 'link',
    'image', 'table', 'divider', 'revoke', 'next', 'save',
    'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview',
  ];
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/editor/md-editor/Index.vue
git commit -m "feat: create MfwMdEditor main component"
```

---

### Task 4: 创建样式文件

**Files:**
- Create: `packages/base-frontend/src/components/editor/md-editor/style.scss`

- [ ] **Step 1: 编写样式**

```scss
// packages/base-frontend/src/components/editor/md-editor/style.scss

.mfw-md-editor {
  display: flex;
  flex-direction: column;
  border-radius: var(--el-border-radius-base, 8px);
  overflow: hidden;
  border: 1px solid var(--el-border-color-light, #e4e7ed);

  :deep(.md-editor) {
    height: 100%;
    border: none;

    .md-editor-preview {
      padding: 16px;
    }
  }

  .mobile-preview-container {
    max-width: 375px;
    margin: 0 auto;
    padding: 16px;
    border-left: 1px solid var(--el-border-color, #dcdfe6);
    border-right: 1px solid var(--el-border-color, #dcdfe6);
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
    background: var(--el-bg-color, #fff);

    .mobile-preview-content {
      font-size: 14px;
      line-height: 1.6;
      word-wrap: break-word;

      img {
        max-width: 100%;
        height: auto;
      }

      pre {
        overflow-x: auto;
        padding: 12px;
        background: var(--el-fill-color-light, #f5f7fa);
        border-radius: 4px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;

        th, td {
          border: 1px solid var(--el-border-color-light, #e4e7ed);
          padding: 8px 12px;
          text-align: left;
        }

        th {
          background: var(--el-fill-color-light, #f5f7fa);
          font-weight: 600;
        }
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/editor/md-editor/style.scss
git commit -m "feat: add styles for MfwMdEditor component"
```

---

### Task 5: 创建导出文件

**Files:**
- Create: `packages/base-frontend/src/components/editor/md-editor/index.ts`
- Create: `packages/base-frontend/src/components/editor/md-editor/mod.ts`
- Modify: `packages/base-frontend/src/components/editor/mod.ts`

- [ ] **Step 1: 创建 index.ts**

```typescript
// packages/base-frontend/src/components/editor/md-editor/index.ts

export { default as MfwMdEditor } from './Index.vue';
export type * from './types';
```

- [ ] **Step 2: 创建 mod.ts**

```typescript
// packages/base-frontend/src/components/editor/md-editor/mod.ts

export { default as MfwMdEditor } from './Index.vue';
export type {
  MfwMdEditorProps,
  MfwMdEditorEmits,
  MfwMdEditorInstance,
} from './types';
```

- [ ] **Step 3: 修改 editor/mod.ts**

```typescript
// packages/base-frontend/src/components/editor/mod.ts (追加)

// Markdown 编辑器组件
export * from './md-editor';
```

- [ ] **Step 4: Commit**

```bash
git add packages/base-frontend/src/components/editor/md-editor/index.ts packages/base-frontend/src/components/editor/md-editor/mod.ts packages/base-frontend/src/components/editor/mod.ts
git commit -m "feat: export MfwMdEditor component"
```

---

### Task 6: 测试组件集成

**Files:**
- Test: 手动测试或编写单元测试

- [ ] **Step 1: 类型检查**

```bash
cd packages/base-frontend && pnpm run typecheck:vue
```

Expected: 无类型错误

- [ ] **Step 2: 运行测试（如有）**

```bash
cd packages/base-frontend && pnpm run test:unit
```

Expected: 所有测试通过

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: verify MfwMdEditor integration"
```
