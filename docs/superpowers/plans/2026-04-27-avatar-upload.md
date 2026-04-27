# 用户头像上传功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为用户管理页面添加头像上传功能，支持裁剪，头像字段放置在表单最上方。

**Architecture:** 拆分上传组件为 MfwImageSingle（单图+裁剪）和 MfwImageGallery（多图），使用 vue-advanced-cropper 实现裁剪，配置从环境变量读取。

**Tech Stack:** Vue 3, TypeScript, vue-advanced-cropper, Element Plus, NestJS, TypeORM

---

## 文件结构

### 新建文件
- `packages/base-frontend/src/config/upload-config.ts` - 上传配置
- `packages/base-frontend/src/components/upload/image-single.tsx` - 单图上传组件
- `packages/base-frontend/src/components/upload/image-gallery.tsx` - 多图上传组件
- `packages/base-frontend/src/components/upload/image-cropper.tsx` - 裁剪对话框
- `frontend/.env.example` - 环境变量模板

### 修改文件
- `packages/base-frontend/package.json` - 添加依赖
- `packages/base-frontend/src/components/upload/types.ts` - 类型定义
- `packages/base-frontend/src/components/upload/index.ts` - 导出
- `packages/base-frontend/src/components/upload/style.scss` - 样式
- `packages/base-frontend/src/components/index.ts` - 组件导出
- `packages/base-frontend/src/views/sys/user/UserForm.vue` - 用户表单
- `packages/base-backend/src/modules/sys/user/entities/user.entity.ts` - 用户实体
- `packages/base-backend/src/modules/sys/user/dto/req/update-user.dto.ts` - 更新 DTO
- `packages/base-backend/src/modules/sys/user/dto/req/admin-create-user.dto.ts` - 创建 DTO

---

## Task 1: 安装 vue-advanced-cropper 依赖

**Files:**
- Modify: `packages/base-frontend/package.json`

- [ ] **Step 1: 添加依赖到 package.json**

在 `packages/base-frontend/package.json` 的 dependencies 中添加：

```json
"vue-advanced-cropper": "^2.8.8"
```

- [ ] **Step 2: 安装依赖**

Run: `cd packages/base-frontend; pnpm install`
Expected: 依赖安装成功

- [ ] **Step 3: Commit**

```bash
git add packages/base-frontend/package.json
git commit -m "feat: add vue-advanced-cropper dependency"
```

---

## Task 2: 创建上传配置文件

**Files:**
- Create: `packages/base-frontend/src/config/upload-config.ts`

- [ ] **Step 1: 创建配置文件**

创建 `packages/base-frontend/src/config/upload-config.ts`：

```typescript
import { FormUploader, OssUploader } from '../components/upload/uploader';
import type { UploadResult, UploadRequestOptions } from '../components/upload/types';

export type UploadType = 'Form' | 'Oss';

export interface UploadConfig {
  uploadType: UploadType;
  formUrl: string;
  oss: {
    endpoint: string;
    bucket: string;
    dir: string;
  };
}

export const uploadConfig: UploadConfig = {
  uploadType: (import.meta.env.VITE_UPLOAD_TYPE as UploadType) || 'Form',
  formUrl: import.meta.env.VITE_UPLOAD_FORM_URL || '/api/upload-files',
  oss: {
    endpoint: import.meta.env.VITE_OSS_ENDPOINT || '',
    bucket: import.meta.env.VITE_OSS_BUCKET || '',
    dir: import.meta.env.VITE_OSS_DIR || 'uploads/',
  },
};

export const getUploader = (uploadType?: UploadType, businessType?: string) => {
  const type = uploadType || uploadConfig.uploadType;
  switch (type) {
    case 'Form':
      return new FormUploader(uploadConfig.formUrl, businessType);
    case 'Oss':
      return new OssUploader(
        () => Promise.resolve(''),
        uploadConfig.oss.endpoint,
        uploadConfig.oss.bucket,
        uploadConfig.oss.dir
      );
    default:
      return new FormUploader(uploadConfig.formUrl, businessType);
  }
};

export const uploadImage = async (
  file: File | Blob,
  options?: {
    uploadType?: UploadType;
    businessType?: string;
    onProgress?: (percentage: number) => void;
  }
): Promise<UploadResult> => {
  const uploader = getUploader(options?.uploadType, options?.businessType);
  return uploader.upload({
    file: file as File,
    filename: 'file',
    onProgress: options?.onProgress,
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/config/upload-config.ts
git commit -m "feat: add upload config from environment variables"
```

---

## Task 3: 创建环境变量模板

**Files:**
- Create: `frontend/.env.example`

- [ ] **Step 1: 创建环境变量模板**

创建 `frontend/.env.example`：

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

- [ ] **Step 2: Commit**

```bash
git add frontend/.env.example
git commit -m "feat: add upload environment variables template"
```

---

## Task 4: 更新类型定义

**Files:**
- Modify: `packages/base-frontend/src/components/upload/types.ts`

- [ ] **Step 1: 添加裁剪相关类型**

在 `packages/base-frontend/src/components/upload/types.ts` 中添加：

```typescript
export type UploadType = 'Form' | 'Oss';

export interface CropOptions {
  enabled?: boolean;
  ratio?: number;
  outputWidth?: number;
  outputHeight?: number;
}

export interface MfwImageSingleProps {
  modelValue?: ImageResource;
  uploadType?: UploadType;
  crop?: boolean;
  cropRatio?: number;
  cropWidth?: number;
  cropHeight?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  businessType?: string;
}

export interface MfwImageGalleryProps {
  modelValue?: ImageResource[];
  uploadType?: UploadType;
  limit?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
  draggable?: boolean;
  businessType?: string;
}

export interface ImageCropperProps {
  visible: boolean;
  image: string | Blob;
  ratio?: number;
  outputWidth?: number;
  outputHeight?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/upload/types.ts
git commit -m "feat: add crop and new component types"
```

---

## Task 5: 创建裁剪对话框组件

**Files:**
- Create: `packages/base-frontend/src/components/upload/image-cropper.tsx`

- [ ] **Step 1: 创建裁剪组件**

创建 `packages/base-frontend/src/components/upload/image-cropper.tsx`：

```typescript
import { defineComponent, ref, watch } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { ImageCropperProps } from './types';

export default defineComponent({
  name: 'ImageCropper',
  props: {
    visible: { type: Boolean, default: false },
    image: { type: [String, Blob], default: '' },
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
        title="裁剪图片"
        width="500px"
        onClose={handleCancel}
        destroyOnClose
      >
        <div class="image-cropper-container">
          <Cropper
            ref={cropperRef}
            src={props.image}
            stencilProps={{
              aspectRatio: props.ratio,
            }}
            class="image-cropper"
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

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/upload/image-cropper.tsx
git commit -m "feat: add image cropper dialog component"
```

---

## Task 6: 创建单图上传组件

**Files:**
- Create: `packages/base-frontend/src/components/upload/image-single.tsx`

- [ ] **Step 1: 创建单图上传组件**

创建 `packages/base-frontend/src/components/upload/image-single.tsx`：

```typescript
import './style.scss';
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import { ElUpload, ElMessage, ElImage } from 'element-plus';
import { Plus, Delete, ZoomIn } from '@element-plus/icons-vue';
import ImageCropper from './image-cropper';
import { uploadImage } from '../../config/upload-config';
import type { ImageResource, MfwImageSingleProps, UploadType } from './types';

const getImageDimensions = (file: File | Blob): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法获取图片尺寸'));
    };
    img.src = url;
  });
};

export default defineComponent({
  name: 'MfwImageSingle',
  props: {
    modelValue: { type: Object as PropType<ImageResource>, default: undefined },
    uploadType: { type: String as PropType<UploadType>, default: undefined },
    crop: { type: Boolean, default: true },
    cropRatio: { type: Number, default: 1 },
    cropWidth: { type: Number, default: 200 },
    cropHeight: { type: Number, default: 200 },
    maxSize: { type: Number, default: 10 },
    accept: { type: String, default: 'image/*' },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '点击上传' },
    businessType: { type: String, default: undefined },
  },
  emits: ['update:modelValue', 'change', 'success', 'error'],
  setup(props, { emit }) {
    const cropperVisible = ref(false);
    const pendingFile = ref<File | null>(null);
    const previewVisible = ref(false);
    const uploading = ref(false);

    const imageUrl = computed(() => {
      if (!props.modelValue) return '';
      return typeof props.modelValue === 'string' 
        ? props.modelValue 
        : props.modelValue.src;
    });

    const beforeUpload = (file: File): boolean => {
      const maxSize = props.maxSize * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
        return false;
      }

      if (!file.type.startsWith('image/')) {
        ElMessage.error('请上传图片文件');
        return false;
      }

      if (props.crop) {
        pendingFile.value = file;
        cropperVisible.value = true;
        return false;
      }

      return true;
    };

    const handleHttpRequest = async (options: any) => {
      uploading.value = true;
      try {
        const result = await uploadImage(options.file, {
          uploadType: props.uploadType,
          businessType: props.businessType,
          onProgress: options.onProgress,
        });
        
        const dimensions = await getImageDimensions(options.file);
        const imageResource: ImageResource = {
          src: result.url,
          width: dimensions.width,
          height: dimensions.height,
        };
        
        emit('update:modelValue', imageResource);
        emit('change', imageResource);
        emit('success', result);
        
        return result;
      } catch (error) {
        ElMessage.error('上传失败');
        emit('error', error);
        throw error;
      } finally {
        uploading.value = false;
      }
    };

    const handleCropConfirm = async (blob: Blob) => {
      uploading.value = true;
      try {
        const result = await uploadImage(blob, {
          uploadType: props.uploadType,
          businessType: props.businessType,
        });
        
        const imageResource: ImageResource = {
          src: result.url,
          width: props.cropWidth,
          height: props.cropHeight,
        };
        
        emit('update:modelValue', imageResource);
        emit('change', imageResource);
        emit('success', result);
      } catch (error) {
        ElMessage.error('上传失败');
        emit('error', error);
      } finally {
        uploading.value = false;
        cropperVisible.value = false;
        pendingFile.value = null;
      }
    };

    const handleRemove = () => {
      emit('update:modelValue', undefined);
      emit('change', undefined);
    };

    const handlePreview = () => {
      previewVisible.value = true;
    };

    return () => (
      <div class="mfw-image-single">
        <ElUpload
          class="avatar-uploader"
          action="#"
          showFileList={false}
          autoUpload={!props.crop}
          beforeUpload={beforeUpload}
          httpRequest={props.crop ? undefined : handleHttpRequest}
          disabled={props.disabled || uploading.value}
          accept={props.accept}
        >
          {imageUrl.value ? (
            <div class="avatar-uploader-image-box">
              <ElImage
                class="avatar-image"
                src={imageUrl.value}
                fit="cover"
              />
              <span class="avatar-actions" onClick={(e: Event) => e.stopPropagation()}>
                <ZoomIn class="action-icon" onClick={handlePreview} />
                {!props.disabled && <Delete class="action-icon" onClick={handleRemove} />}
              </span>
            </div>
          ) : (
            <div class="avatar-uploader-placeholder">
              <Plus class="placeholder-icon" />
              <span class="placeholder-text">{props.placeholder}</span>
            </div>
          )}
        </ElUpload>

        {imageUrl.value && (
          <ElImage
            class="preview-image"
            src={imageUrl.value}
            previewSrcList={[imageUrl.value]}
            initialIndex={0}
            style={{ display: 'none' }}
          />
        )}

        {previewVisible.value && (
          <ElImage
            previewSrcList={[imageUrl.value]}
            initialIndex={0}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}
          />
        )}

        {props.crop && (
          <ImageCropper
            visible={cropperVisible.value}
            image={pendingFile.value || ''}
            ratio={props.cropRatio}
            outputWidth={props.cropWidth}
            outputHeight={props.cropHeight}
            onConfirm={handleCropConfirm}
            onCancel={() => { cropperVisible.value = false; pendingFile.value = null; }}
          />
        )}
      </div>
    );
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/upload/image-single.tsx
git commit -m "feat: add MfwImageSingle component with crop support"
```

---

## Task 7: 创建多图上传组件

**Files:**
- Create: `packages/base-frontend/src/components/upload/image-gallery.tsx`

- [ ] **Step 1: 创建多图上传组件**

创建 `packages/base-frontend/src/components/upload/image-gallery.tsx`：

```typescript
import './style.scss';
import { defineComponent, ref, computed, type PropType } from 'vue';
import { ElUpload, ElMessage, ElImage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { uploadImage } from '../../config/upload-config';
import type { ImageResource, MfwImageGalleryProps, UploadType } from './types';

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法获取图片尺寸'));
    };
    img.src = url;
  });
};

export default defineComponent({
  name: 'MfwImageGallery',
  props: {
    modelValue: { type: Array as PropType<ImageResource[]>, default: () => [] },
    uploadType: { type: String as PropType<UploadType>, default: undefined },
    limit: { type: Number, default: 9 },
    maxSize: { type: Number, default: 10 },
    accept: { type: String, default: 'image/*' },
    disabled: { type: Boolean, default: false },
    draggable: { type: Boolean, default: true },
    businessType: { type: String, default: undefined },
  },
  emits: ['update:modelValue', 'change', 'success', 'error', 'remove'],
  setup(props, { emit }) {
    const uploading = ref(false);

    const fileList = computed(() => {
      return (props.modelValue || []).map((item, index) => ({
        url: typeof item === 'string' ? item : item.src,
        uid: index,
      }));
    });

    const beforeUpload = (file: File): boolean => {
      if (fileList.value.length >= props.limit) {
        ElMessage.error(`最多上传 ${props.limit} 张图片`);
        return false;
      }

      const maxSize = props.maxSize * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
        return false;
      }

      if (!file.type.startsWith('image/')) {
        ElMessage.error('请上传图片文件');
        return false;
      }

      return true;
    };

    const handleHttpRequest = async (options: any) => {
      uploading.value = true;
      try {
        const result = await uploadImage(options.file, {
          uploadType: props.uploadType,
          businessType: props.businessType,
          onProgress: options.onProgress,
        });
        
        const dimensions = await getImageDimensions(options.file);
        const imageResource: ImageResource = {
          src: result.url,
          width: dimensions.width,
          height: dimensions.height,
        };
        
        const newValue = [...(props.modelValue || []), imageResource];
        emit('update:modelValue', newValue);
        emit('change', newValue);
        emit('success', result);
        
        return result;
      } catch (error) {
        ElMessage.error('上传失败');
        emit('error', error);
        throw error;
      } finally {
        uploading.value = false;
      }
    };

    const handleRemove = (file: any) => {
      const index = file.uid;
      const newValue = (props.modelValue || []).filter((_, i) => i !== index);
      emit('update:modelValue', newValue);
      emit('change', newValue);
      emit('remove', file);
    };

    return () => (
      <div class="mfw-image-gallery">
        <ElUpload
          action="#"
          fileList={fileList.value}
          listType="picture-card"
          limit={props.limit}
          beforeUpload={beforeUpload}
          httpRequest={handleHttpRequest}
          onRemove={handleRemove}
          disabled={props.disabled || uploading.value}
          accept={props.accept}
        >
          {fileList.value.length < props.limit && (
            <div class="upload-placeholder">
              <Plus class="placeholder-icon" />
            </div>
          )}
        </ElUpload>
      </div>
    );
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/upload/image-gallery.tsx
git commit -m "feat: add MfwImageGallery component for multiple images"
```

---

## Task 8: 更新样式文件

**Files:**
- Modify: `packages/base-frontend/src/components/upload/style.scss`

- [ ] **Step 1: 添加新组件样式**

在 `packages/base-frontend/src/components/upload/style.scss` 中添加：

```scss
.mfw-image-single {
  .avatar-uploader {
    width: 100px;
    height: 100px;
  }

  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    transition: border-color 0.3s;

    &:hover {
      border-color: #409eff;
    }
  }

  .avatar-uploader-image-box {
    width: 100%;
    height: 100%;
    position: relative;

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-actions {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s;

      .action-icon {
        font-size: 20px;
        color: #fff;
        cursor: pointer;
      }

      &:hover {
        opacity: 1;
      }
    }
  }

  .avatar-uploader-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .placeholder-icon {
      font-size: 28px;
      color: #8c939d;
    }

    .placeholder-text {
      font-size: 12px;
      color: #8c939d;
      margin-top: 8px;
    }
  }
}

.image-cropper-container {
  .image-cropper {
    height: 300px;
  }
}

.mfw-image-gallery {
  .upload-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;

    .placeholder-icon {
      font-size: 28px;
      color: #8c939d;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/components/upload/style.scss
git commit -m "feat: add styles for MfwImageSingle and MfwImageGallery"
```

---

## Task 9: 更新导出文件

**Files:**
- Modify: `packages/base-frontend/src/components/upload/index.ts`
- Modify: `packages/base-frontend/src/components/index.ts`

- [ ] **Step 1: 更新 upload/index.ts**

修改 `packages/base-frontend/src/components/upload/index.ts`：

```typescript
export { default as MfwUpload } from './upload';
export { default as MfwImageSingle } from './image-single';
export { default as MfwImageGallery } from './image-gallery';
export { default as ImageCropper } from './image-cropper';
export * from './types';
export { FormUploader, OssUploader, BaseUploader } from './uploader';
```

- [ ] **Step 2: 更新 components/index.ts**

在 `packages/base-frontend/src/components/index.ts` 中添加导出：

```typescript
export { MfwImageSingle, MfwImageGallery, ImageCropper } from './upload';
export type { ImageResource, MfwImageSingleProps, MfwImageGalleryProps, UploadType } from './upload';
```

- [ ] **Step 3: Commit**

```bash
git add packages/base-frontend/src/components/upload/index.ts packages/base-frontend/src/components/index.ts
git commit -m "feat: export new upload components"
```

---

## Task 10: 修改后端用户实体

**Files:**
- Modify: `packages/base-backend/src/modules/sys/user/entities/user.entity.ts`

- [ ] **Step 1: 修改 avatar 字段类型**

修改 `packages/base-backend/src/modules/sys/user/entities/user.entity.ts`：

将 avatar 字段从：
```typescript
@Column({ type: 'varchar', length: 255, nullable: true, comment: '头像 URL 地址' })
avatar: string;
```

改为：
```typescript
@Column({ type: 'json', nullable: true, comment: '头像 - ImageResource 对象' })
avatar: { src: string; width: number; height: number };
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-backend/src/modules/sys/user/entities/user.entity.ts
git commit -m "feat: change user avatar field to JSON type"
```

---

## Task 11: 修改后端用户 DTO

**Files:**
- Modify: `packages/base-backend/src/modules/sys/user/dto/req/update-user.dto.ts`
- Modify: `packages/base-backend/src/modules/sys/user/dto/req/admin-create-user.dto.ts`

- [ ] **Step 1: 修改 update-user.dto.ts**

修改 `packages/base-backend/src/modules/sys/user/dto/req/update-user.dto.ts`：

将 avatar 字段从：
```typescript
@ApiProperty({ description: '头像 URL', required: false })
@IsOptional()
@IsString()
avatar?: string;
```

改为：
```typescript
@ApiProperty({ description: '头像', required: false })
@IsOptional()
avatar?: { src: string; width: number; height: number };
```

- [ ] **Step 2: 修改 admin-create-user.dto.ts**

修改 `packages/base-backend/src/modules/sys/user/dto/req/admin-create-user.dto.ts`：

将 avatar 字段从：
```typescript
@ApiProperty({ description: '头像 URL', required: false })
@IsOptional()
@IsString()
avatar?: string;
```

改为：
```typescript
@ApiProperty({ description: '头像', required: false })
@IsOptional()
avatar?: { src: string; width: number; height: number };
```

- [ ] **Step 3: Commit**

```bash
git add packages/base-backend/src/modules/sys/user/dto/req/update-user.dto.ts packages/base-backend/src/modules/sys/user/dto/req/admin-create-user.dto.ts
git commit -m "feat: change user DTO avatar field to object type"
```

---

## Task 12: 修改用户表单组件

**Files:**
- Modify: `packages/base-frontend/src/views/sys/user/UserForm.vue`

- [ ] **Step 1: 添加头像字段到表单**

修改 `packages/base-frontend/src/views/sys/user/UserForm.vue`：

1. 在 import 中添加 MfwImageSingle：
```typescript
import { MfwFormCard, MfwRadioGroup, MfwImageSingle } from '../../../components';
import type { ImageResource } from '../../../components/upload/types';
```

2. 在 form reactive 中添加 avatar：
```typescript
const form = reactive({
  avatar: props?.avatar || undefined,
  username: props?.username || '',
  nickname: props?.nickname || '',
  phone: props?.phone || '',
  gender: props?.gender ?? 0,
});
```

3. 在 formTemplate 数组开头添加头像字段：
```typescript
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
```

4. 在 onConfirm 中添加 avatar 到请求体：
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/base-frontend/src/views/sys/user/UserForm.vue
git commit -m "feat: add avatar upload to user form"
```

---

## Task 13: 运行类型检查和测试

**Files:**
- None (verification)

- [ ] **Step 1: 运行前端类型检查**

Run: `cd packages/base-frontend; pnpm run typecheck:vue`
Expected: 无类型错误

- [ ] **Step 2: 运行后端类型检查**

Run: `cd packages/base-backend; pnpm run build`
Expected: 编译成功

- [ ] **Step 3: 运行后端测试**

Run: `cd packages/base-backend; pnpm test`
Expected: 测试通过

---

## Task 14: 最终提交

**Files:**
- None (final commit)

- [ ] **Step 1: 检查所有改动**

Run: `git status`
Expected: 所有改动已提交

- [ ] **Step 2: 创建功能分支合并提交**

```bash
git checkout -b feature/avatar-upload
git push origin feature/avatar-upload
```

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-04-27-avatar-upload.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**