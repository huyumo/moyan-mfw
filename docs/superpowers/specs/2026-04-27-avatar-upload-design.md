# 用户头像上传功能设计文档

## 概述

为用户管理页面 `sys/user` 的添加/编辑功能添加头像上传功能，头像字段放置在表单最上方。

## 需求总结

| 项目 | 决策 |
|------|------|
| 裁剪功能 | 需要，比例可配置，默认 1:1 |
| 组件拆分 | 拆分为两个组件：单图上传（支持裁剪）+ 多图上传（不支持裁剪） |
| 裁剪库 | vue-advanced-cropper |
| 存储格式 | ImageResource 对象 `{src, width, height}` |
| 配置方式 | 从业务层 .env 环境变量读取上传类型 |
| 后端字段 | avatar 字段改为 JSON 类型 |

## 组件架构

### 新组件结构

```
packages/base-frontend/src/components/upload/
├── index.ts              # 导出入口（更新）
├── types.ts              # 类型定义（更新）
├── uploader.ts           # 上传器（保持不变）
├── image-single.tsx      # MfwImageSingle：单图上传（支持裁剪）
├── image-gallery.tsx     # MfwImageGallery：多图上传（不支持裁剪）
├── image-cropper.tsx     # ImageCropper：裁剪对话框
└── style.scss            # 样式（更新）
```

### 组件职责划分

| 组件 | 职责 | 特性 |
|------|------|------|
| `MfwImageSingle` | 单图上传 | 支持裁剪、预览、删除，返回 `ImageResource` |
| `MfwImageGallery` | 多图上传 | 不支持裁剪、支持拖拽排序、数量限制，返回 `ImageResource[]` |
| `ImageCropper` | 裁剪对话框 | 可配置裁剪比例、输出尺寸，内部使用 |

### 导出方式

```typescript
// index.ts
export { default as MfwImageSingle } from './image-single';
export { default as MfwImageGallery } from './image-gallery';
export * from './types';
```

## 配置设计

### 前端环境变量

创建 `frontend/.env.example` 文件：

```bash
# ==================== 上传配置 ====================
# 上传类型：Form（本地上传）| Oss（阿里云 OSS）
VITE_UPLOAD_TYPE=Form

# Form 上传地址（仅 VITE_UPLOAD_TYPE=Form 时有效）
VITE_UPLOAD_FORM_URL=/api/upload-files

# OSS Endpoint（仅 VITE_UPLOAD_TYPE=Oss 时有效）
VITE_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# OSS Bucket（仅 VITE_UPLOAD_TYPE=Oss 时有效）
VITE_OSS_BUCKET=my-bucket

# OSS 上传目录（仅 VITE_UPLOAD_TYPE=Oss 时有效）
VITE_OSS_DIR=uploads/
```

### 上传配置文件

创建 `packages/base-frontend/src/config/upload-config.ts`：

```typescript
/** 上传类型 */
export type UploadType = 'Form' | 'Oss';

/** 从环境变量读取上传配置 */
export const uploadConfig = {
  uploadType: (import.meta.env.VITE_UPLOAD_TYPE as UploadType) || 'Form',
  formUrl: import.meta.env.VITE_UPLOAD_FORM_URL || '/api/upload-files',
  oss: {
    endpoint: import.meta.env.VITE_OSS_ENDPOINT || '',
    bucket: import.meta.env.VITE_OSS_BUCKET || '',
    dir: import.meta.env.VITE_OSS_DIR || 'uploads/',
  },
};

/** 获取上传器 */
export const getUploader = (uploadType?: UploadType) => {
  const type = uploadType || uploadConfig.uploadType;
  switch (type) {
    case 'Form':
      return new FormUploader(uploadConfig.formUrl);
    case 'Oss':
      return new OssUploader(
        () => Promise.resolve(''),
        uploadConfig.oss.endpoint,
        uploadConfig.oss.bucket,
        uploadConfig.oss.dir
      );
    default:
      return new FormUploader(uploadConfig.formUrl);
  }
};
```

## 组件 API 设计

### MfwImageSingle Props

```typescript
interface MfwImageSingleProps {
  modelValue?: ImageResource;           // 绑定值
  uploadType?: UploadType;              // 上传类型（覆盖配置）
  crop?: boolean;                       // 是否启用裁剪，默认 true
  cropRatio?: number | number[];        // 裁剪比例，默认 1（1:1）
  cropWidth?: number;                   // 裁剪输出宽度，默认 200
  cropHeight?: number;                  // 裁剪输出高度，默认 200
  maxSize?: number;                     // 最大文件大小 MB，默认 10
  accept?: string;                      // 接受的文件类型，默认 'image/*'
  disabled?: boolean;                   // 禁用状态
  placeholder?: string;                 // 占位文字，默认 '点击上传头像'
  businessType?: string;                // 业务类型
}
```

### MfwImageGallery Props

```typescript
interface MfwImageGalleryProps {
  modelValue?: ImageResource[];         // 绑定值
  uploadType?: UploadType;              // 上传类型（覆盖配置）
  limit?: number;                       // 最大上传数量，默认 9
  maxSize?: number;                     // 最大文件大小 MB，默认 10
  accept?: string;                      // 接受的文件类型
  disabled?: boolean;                   // 禁用状态
  draggable?: boolean;                  // 支持拖拽排序，默认 true
  businessType?: string;                // 业务类型
}
```

## 裁剪组件实现

### ImageCropper 组件

使用 `vue-advanced-cropper` 库实现裁剪功能：

```typescript
// image-cropper.tsx
import { defineComponent, ref } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

export default defineComponent({
  name: 'ImageCropper',
  props: {
    visible: Boolean,
    image: [String, Blob],
    ratio: { type: Number, default: 1 },
    outputWidth: { type: Number, default: 200 },
    outputHeight: { type: Number, default: 200 },
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const cropperRef = ref<any>(null);

    const handleConfirm = () => {
      const { canvas } = cropperRef.value?.getResult() || {};
      if (canvas) {
        canvas.toBlob((blob: Blob) => {
          emit('confirm', blob);
          emit('update:visible', false);
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
        title="裁剪头像"
        width="500px"
        onClose={handleCancel}
      >
        <div class="image-cropper-container">
          <Cropper
            ref={cropperRef}
            src={props.image}
            stencilProps={{
              aspectRatio: props.ratio,
            }}
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
```

### MfwImageSingle 集成裁剪

```typescript
// image-single.tsx
export default defineComponent({
  name: 'MfwImageSingle',
  props: {
    modelValue: Object,
    crop: { type: Boolean, default: true },
    cropRatio: { type: Number, default: 1 },
    cropWidth: { type: Number, default: 200 },
    cropHeight: { type: Number, default: 200 },
  },
  setup(props, { emit }) {
    const cropperVisible = ref(false);
    const pendingFile = ref<File | null>(null);

    const handleBeforeUpload = (file: File) => {
      if (props.crop) {
        pendingFile.value = file;
        cropperVisible.value = true;
        return false;
      }
      return true;
    };

    const handleCropConfirm = async (blob: Blob) => {
      const uploader = getUploader(props.uploadType);
      const result = await uploader.upload({
        file: blob as File,
        filename: 'file',
      });
      
      const imageResource: ImageResource = {
        src: result.url,
        width: props.cropWidth,
        height: props.cropHeight,
      };
      
      emit('update:modelValue', imageResource);
      cropperVisible.value = false;
    };

    return () => (
      <div class="mfw-image-single">
        <ElUpload beforeUpload={handleBeforeUpload}>
          {/* 上传按钮 */}
        </ElUpload>
        
        {props.crop && (
          <ImageCropper
            visible={cropperVisible.value}
            image={pendingFile.value}
            ratio={props.cropRatio}
            outputWidth={props.cropWidth}
            outputHeight={props.cropHeight}
            onConfirm={handleCropConfirm}
            onCancel={() => cropperVisible.value = false}
          />
        )}
      </div>
    );
  },
});
```

## 用户表单修改

### 前端 UserForm.vue

```vue
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '80px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { MfwFormCard, MfwRadioGroup, MfwImageSingle } from '../../../components';
import type { ImageResource } from '../../../components/upload/types';
import { ApiUserAdminCreate, ApiUserUpdate } from '../../../apis/sys';
import type { UserResponseDto } from '../../../apis/sys/schemas';

const props = defineProps<UserResponseDto>();

defineOptions({ name: 'UserForm' });

const formRef = ref<MfwFormCardInstance>();
const isEdit = computed(() => !!props?.id);

const form = reactive({
  avatar: props?.avatar || undefined,
  username: props?.username || '',
  nickname: props?.nickname || '',
  phone: props?.phone || '',
  gender: props?.gender ?? 0,
});

const formTemplate: FormItemConfig[] = [
  {
    key: 'avatar',
    label: '头像',
    component: MfwImageSingle,
    elProps: {
      crop: true,
      cropRatio: 1,
      cropWidth: 200,
      cropHeight: 200,
      placeholder: '点击上传头像',
    },
  },
  // ... 其他字段保持不变
];

const onConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) throw new Error('表单验证失败');

  if (isEdit.value) {
    await new ApiUserUpdate({
      params: { id: props.id },
      body: {
        nickname: form.nickname,
        phone: form.phone,
        gender: form.gender,
        avatar: form.avatar,
      },
    }, { hintSuccess: true });
  } else {
    await new ApiUserAdminCreate({
      body: {
        username: form.username,
        phone: form.phone,
        nickname: form.nickname,
        gender: form.gender,
        avatar: form.avatar,
      },
    }, { hintSuccess: true });
  }
};

defineExpose({ onConfirm });
</script>
```

### 后端修改

**User 实体** `user.entity.ts`：
```typescript
// avatar 字段改为 JSON 类型
@Column({ type: 'json', nullable: true, comment: '头像 - ImageResource 对象' })
avatar: { src: string; width: number; height: number };
```

**DTO 修改** `update-user.dto.ts` 和 `admin-create-user.dto.ts`：
```typescript
@ApiProperty({ description: '头像', required: false })
@IsOptional()
avatar?: { src: string; width: number; height: number };
```

## 数据流

```
用户选择图片 → 裁剪对话框 → 裁剪后 Blob → 上传到服务器 → 返回 URL → ImageResource 对象 → 存储到数据库
```

## 改动清单

| 序号 | 改动项 | 文件路径 | 说明 |
|------|--------|----------|------|
| 1 | 安装依赖 | `package.json` | 添加 `vue-advanced-cropper` |
| 2 | 创建配置文件 | `config/upload-config.ts` | 上传配置，从环境变量读取 |
| 3 | 创建环境变量模板 | `frontend/.env.example` | 上传相关环境变量 |
| 4 | 重构上传组件 | `upload/image-single.tsx` | 单图上传组件，支持裁剪 |
| 5 | 重构上传组件 | `upload/image-gallery.tsx` | 多图上传组件，不支持裁剪 |
| 6 | 创建裁剪组件 | `upload/image-cropper.tsx` | 裁剪对话框组件 |
| 7 | 更新类型定义 | `upload/types.ts` | 新增裁剪相关类型 |
| 8 | 更新导出 | `upload/index.ts` | 导出新组件 |
| 9 | 更新样式 | `upload/style.scss` | 新组件样式 |
| 10 | 修改用户表单 | `views/sys/user/UserForm.vue` | 添加头像上传字段 |
| 11 | 修改用户实体 | `user/entities/user.entity.ts` | avatar 字段改为 JSON 类型 |
| 12 | 修改用户 DTO | `user/dto/*.dto.ts` | avatar 字段类型调整 |