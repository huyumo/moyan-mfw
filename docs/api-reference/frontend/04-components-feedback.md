# 04 · 反馈类组件 + 05 · 表单组件 + 06 · 上传组件

## 反馈类组件

### `MfwPopup` / `MfwPopupManager`

弹窗组件，支持命令式和声明式调用。

```typescript
import { MfwPopup, MfwPopupManager } from 'moyan-mfw-base/frontend'
```

---

## 表单组件

### `MfwFormCard`

表单卡片组件，将表单包裹在卡片容器中，提供标准的表单布局。

```typescript
import { MfwFormCard } from 'moyan-mfw-base/frontend'
```

```vue
<MfwFormCard title="创建用户" icon="User" @submit="handleSubmit">
  <el-form :model="form" label-width="100px">
    <el-form-item label="用户名">
      <el-input v-model="form.username" />
    </el-form-item>
  </el-form>
</MfwFormCard>
```

---

## 上传组件

```typescript
import {
  MfwUpload,        // 通用上传
  MfwImageSingle,   // 单图上传
  MfwImageGallery,  // 图片画廊（多图）
  MfwVideoSingle,   // 单视频上传
  ImageCropper,     // 图片裁剪
  BaseUploader,     // 基础上传器
  FormUploader,     // 表单上传器
  OssUploader,      // OSS 上传器
} from 'moyan-mfw-base/frontend'
```

### `MfwUpload`

通用文件上传组件。

```vue
<MfwUpload
  v-model="fileList"
  :limit="5"
  :max-size="10"
  accept=".jpg,.png,.pdf"
/>
```

### `MfwImageSingle`

单图上传（通常用于头像、封面等）。

```vue
<MfwImageSingle v-model="avatarUrl" :width="120" :height="120" />
```

### `MfwImageGallery`

多图上传，支持拖拽排序和预览。

```vue
<MfwImageGallery v-model="imageList" :limit="9" />
```

### `ImageCropper`

图片裁剪组件。

```vue
<ImageCropper
  :src="rawImageUrl"
  :aspect-ratio="1"
  @crop="handleCropped"
/>
```

### 上传器后端

| 上传器 | 说明 |
|--------|------|
| `BaseUploader` | 基础上传器基类 |
| `FormUploader` | 表单上传（`multipart/form-data`） |
| `OssUploader` | 阿里云 OSS 直传 |
