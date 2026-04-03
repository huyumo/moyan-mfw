# MfwUpload 上传组件

> 组件类型: 表单组件 | 模块: upload

---

## 概述

`MfwUpload` 是基于 Element Plus Upload 封装的上传组件，支持单图、多图、文件等多种上传场景。

## 安装与注册

```typescript
// main.ts
import { MfwUpload } from 'moyan-mfw-base-frontend';

app.component('MfwUpload', MfwUpload);
```

---

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| modelValue | `string \| string[]` | 否 | - | 绑定值（图片 URL） |
| uploadType | `'form' \| 'oss' \| 'custom'` | 否 | `'form'` | 上传类型 |
| multiple | `boolean` | 否 | `false` | 是否支持多选 |
| limit | `number` | 否 | `1` | 最大上传数量 |
| disabled | `boolean` | 否 | `false` | 是否禁用 |
| maxSize | `number` | 否 | `10` | 文件大小限制（MB） |
| accept | `string` | 否 | - | 允许的文件类型（MIME） |
| fileTypes | `string[]` | 否 | `['image/jpeg', 'image/png', 'image/gif', 'image/webp']` | 允许的文件扩展名或 MIME |
| beforeUpload | `(file: File) => boolean \| Promise<File>` | 否 | - | 上传前钩子 |
| httpRequest | `(options: any) => Promise<UploadResult>` | 否 | - | 自定义上传方法（必须） |
| elProps | `Partial<UploadProps>` | 否 | - | Element Plus Upload Props |
| listType | `'text' \| 'picture' \| 'picture-card'` | 否 | `'picture-card'` | 列表类型 |
| showDelete | `boolean` | 否 | `true` | 是否显示删除按钮 |
| emptyText | `string` | 否 | `'点击上传'` | 空值提示文本 |

---

## Events

| 事件 | 类型 | 说明 |
|------|------|------|
| update:modelValue | `(value: string \| string[]) => void` | 更新绑定值 |
| change | `(file: UploadFileInfo, fileList: UploadFileInfo[]) => void` | 文件变化 |
| success | `(result: UploadResult, file: UploadFileInfo) => void` | 上传成功 |
| error | `(error: Error, file: UploadFileInfo) => void` | 上传失败 |
| remove | `(file: UploadFileInfo) => void` | 文件移除 |

---

## Slots

| 插槽名 | 说明 |
|--------|------|
| default | 自定义上传触发器 |

---

## 实例方法

| 方法 | 类型 | 说明 |
|------|------|------|
| clear | `() => void` | 清除上传列表 |
| submit | `() => void` | 手动上传（预留） |
| uploadFiles | `UploadFileInfo[]` | 获取上传文件列表 |

---

## 类型定义

```typescript
/** 上传结果 */
interface UploadResult {
  url: string;
  id?: string;
  name?: string;
  size?: number;
  [key: string]: any;
}

/** 上传文件 */
interface UploadFileInfo {
  url?: string;
  id?: string;
  progress?: number;
  status?: 'ready' | 'uploading' | 'success' | 'error';
}

/** 上传请求选项 */
interface UploadRequestOptions {
  file: File;
  filename: string;
  onProgress?: (percentage: number) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}
```

---

## 使用示例

### 单图上传

```vue
<template>
  <MfwUpload v-model="imageUrl" />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const imageUrl = ref('');
</script>
```

### 多图上传

```vue
<template>
  <MfwUpload
    v-model="imageUrls"
    :multiple="true"
    :limit="9"
    :maxSize="5"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const imageUrls = ref<string[]>([]);
</script>
```

### 自定义上传方法

```vue
<template>
  <MfwUpload
    v-model="imageUrl"
    :httpRequest="customUpload"
    :beforeUpload="beforeUpload"
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UploadRequestOptions, UploadResult } from 'moyan-mfw-base-frontend';

const imageUrl = ref('');

// 自定义上传
const customUpload = async (options: UploadRequestOptions): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', options.file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  return {
    url: data.url,
    name: data.name,
    size: data.size
  };
};

// 上传前验证
const beforeUpload = (file: File): boolean => {
  const isJpg = file.type === 'image/jpeg';
  if (!isJpg) {
    console.error('只支持 JPG 格式!');
    return false;
  }
  return true;
};

const handleSuccess = (result: UploadResult) => {
  console.log('上传成功:', result.url);
};

const handleError = (error: Error) => {
  console.error('上传失败:', error);
};
</script>
```

### 文件上传

```vue
<template>
  <MfwUpload
    v-model="fileUrl"
    :httpRequest="uploadFile"
    list-type="text"
    accept=".pdf,.doc,.docx"
    :fileTypes="['pdf', 'doc', 'docx']"
    :maxSize="50"
    emptyText="点击上传文件"
  />
</template>
```

### 图片列表模式

```vue
<template>
  <MfwUpload
    v-model="imageUrls"
    :multiple="true"
    list-type="picture"
    :httpRequest="customUpload"
  />
</template>
```

### 自定义上传按钮

```vue
<template>
  <MfwUpload v-model="imageUrl" :httpRequest="customUpload">
    <el-button type="primary">
      <el-icon><Upload /></el-icon>
      选择文件
    </el-button>
  </MfwUpload>
</template>
```

### 实例方法调用

```vue
<template>
  <MfwUpload ref="uploadRef" v-model="imageUrl" :httpRequest="customUpload" />
  <el-button @click="handleClear">清除</el-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const uploadRef = ref();

const handleClear = () => {
  uploadRef.value?.clear();
};
</script>
```

---

## 注意事项

1. **必须提供 httpRequest**：组件默认抛出错误，需要通过 `httpRequest` prop 提供自定义上传方法

2. **文件类型验证**：`fileTypes` 支持 MIME 类型（如 `image/jpeg`）或扩展名（如 `jpg`）

3. **自动上传关闭**：组件设置 `autoUpload={false}`，需要配合 `httpRequest` 使用

4. **大小限制**：`maxSize` 单位为 MB，默认 10MB

5. **多图模式**：`multiple` 为 `true` 时，`modelValue` 为字符串数组

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-04-03 | 初始版本 |
