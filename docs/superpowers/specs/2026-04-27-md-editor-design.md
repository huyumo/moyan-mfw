# MfwMdEditor - Markdown 编辑器组件设计文档

## 1. 概述

基于 `md-editor-v3` 开源库深度封装的 Markdown 编辑器组件，适配 Moyan MFW 后台管理系统。提供完整的编辑、预览功能，并内置移动端预览能力。

### 1.1 设计目标

- 为后台管理提供开箱即用的 Markdown 编辑能力
- 深度封装，统一图片上传、主题风格、工具栏配置
- 支持桌面端和移动端双模式预览
- 与项目现有组件体系（Element Plus、moyan-api）无缝集成

### 1.2 技术选型

| 维度 | 选择 | 理由 |
|:---|:---|:---|
| 核心库 | `md-editor-v3` v6.x | 包体积小（28KB），JSX+TS 开发，活跃维护 |
| 组件格式 | Vue 3 SFC (.vue) | 与 rolo-form 等业务组件保持一致 |
| API 风格 | Composition API + TypeScript | 类型安全，现代 Vue 3 最佳实践 |

## 2. 组件 API

### 2.1 Props

```typescript
interface MfwMdEditorProps {
  // 基础属性
  modelValue?: string;              // v-model 双向绑定，默认 ''
  height?: number | string;         // 编辑器高度，默认 400
  placeholder?: string;             // 占位文本，默认 '请输入内容'
  readonly?: boolean;               // 只读模式，默认 false
  
  // 功能控制
  showToolbar?: boolean;            // 显示工具栏，默认 true
  showCodeRowNumber?: boolean;      // 代码块行号，默认 true
  
  // 移动端预览
  showMobileToggle?: boolean;       // 显示移动端切换按钮，默认 true
  previewMode?: 'desktop' | 'mobile'; // 预览模式，默认 'desktop'
  mobileWidth?: string;             // 移动端视口宽度，默认 '375px'
  
  // 上传配置
  uploadApi?: string;               // 图片上传接口，默认使用 moyan-api
  uploadHeaders?: Record<string, string>; // 上传请求头
}
```

### 2.2 Emits

```typescript
interface MfwMdEditorEmits {
  'update:modelValue': [value: string];  // 内容变化
  'change': [value: string];             // 内容变化（别名）
  'save': [value: string];               // 保存事件 (Ctrl+S)
  'upload': [file: File];                // 图片上传
}
```

### 2.3 使用示例

```vue
<template>
  <MfwMdEditor
    v-model="content"
    :height="500"
    :showMobileToggle="true"
    :placeholder="'请输入文章内容'"
    @save="handleSave"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MfwMdEditor } from '@/components';

const content = ref('');

const handleSave = (value: string) => {
  console.log('保存内容:', value);
};
</script>
```

## 3. 文件结构

```
src/components/editor/md-editor/
  ├── Index.vue              # 主组件
  ├── MdPreview.vue          # 移动端预览封装组件
  ├── index.ts               # 默认导出
  ├── mod.ts                 # 命名导出
  ├── style.scss             # 样式定制
  └── types.ts               # TypeScript 类型定义
```

## 4. 核心实现

### 4.1 深度封装内容

1. **统一主题**: 使用 Element Plus 的设计 Token（颜色、圆角、阴影）
2. **统一上传**: 集成项目 `moyan-api` 图片上传接口
3. **预设工具栏**: 针对后台管理预设常用工具项
   - 标题、粗体、斜体、删除线
   - 列表、表格、代码块、引用
   - 链接、图片、分割线
4. **快捷键**: Ctrl/Command + S 触发保存事件

### 4.2 移动端预览

- 默认显示桌面端预览
- 提供切换按钮切换移动端模式
- 移动端模式使用 375px 视口宽度（iPhone 13 标准）
- 可通过 `mobileWidth` prop 自定义模拟宽度

### 4.3 图片上传

```typescript
// 默认上传处理
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // 使用项目统一的上传接口
  const response = await api.uploadImage(formData);
  return response.data.url;
};
```

## 5. 样式定制

```scss
// style.scss
.mfw-md-editor {
  // 统一圆角
  --editor-border-radius: 8px;
  
  // Element Plus 主题色
  --editor-primary: var(--el-color-primary);
  
  // 移动端预览容器
  .mobile-preview-container {
    width: 375px;
    margin: 0 auto;
    border-left: 1px solid var(--el-border-color);
    border-right: 1px solid var(--el-border-color);
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
  }
}
```

## 6. 类型定义

```typescript
// types.ts
import type { Component } from 'vue';

export declare const MfwMdEditor: Component;
export declare const MfwMdPreview: Component;

export interface MdEditorProps {
  modelValue?: string;
  height?: number | string;
  placeholder?: string;
  readonly?: boolean;
  showToolbar?: boolean;
  showCodeRowNumber?: boolean;
  showMobileToggle?: boolean;
  previewMode?: 'desktop' | 'mobile';
  mobileWidth?: string;
  uploadApi?: string;
  uploadHeaders?: Record<string, string>;
}
```

## 7. 集成步骤

### 7.1 安装依赖

```bash
pnpm add md-editor-v3
```

### 7.2 组件注册

在 `src/components/editor/index.ts` 中添加导出：

```typescript
export { default as MfwMdEditor } from './md-editor';
```

### 7.3 全局注册（可选）

在 `src/components/index.ts` 中统一注册。

## 8. 测试策略

- 单元测试：使用 Vitest + Vue Test Utils
- 测试点：
  - v-model 双向绑定
  - 移动端模式切换
  - 图片上传功能
  - 只读模式
  - 快捷键支持

## 9. 后续扩展

- 支持自定义 Markdown 扩展语法（如 Mermaid、KaTeX）
- 支持导出为 HTML/PDF
- 支持协作编辑（如需要）
