# 组件 · 上传（upload）

上传方式由环境变量 `VITE_UPLOAD_TYPE` 决定：`Form`（默认，走后端 `/api/upload-files`）或 `Oss`（阿里云 OSS 直传，先取 STS 授权）。

## `MfwUpload` — 通用上传

```vue
<MfwUpload
  v-model="files"
  resource-type="file"
  :multiple="true"
  :limit="5"
  :max-size="10 * 1024 * 1024"
  :accept=".pdf,.docx"
  business-type="contract"
  @success="onSuccess"
/>
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `ResourceValue / ResourceValue[]` | 资源值（string / ImageResource / MediaResource / FileResource） |
| `resourceType` | `image / media / file` | 资源类型 |
| `uploadType` | `form / oss / custom` | 上传方式 |
| `multiple` / `limit` | `boolean / number` | 多选 / 数量上限 |
| `maxSize` / `accept` / `fileTypes` | — | 大小 / 类型限制 |
| `beforeUpload` | `(file) => boolean / Promise<File>` | 上传前校验/处理 |
| `httpRequest` | `(options) => Promise<UploadResult>` | 自定义上传实现 |
| `elProps` | `Partial<UploadProps>` | Element Plus 透传 |
| `listType` | `text / picture / picture-card` | 展示样式 |
| `uploadUrl` / `businessType` | `string` | 上传地址 / 业务类型 |

Emits：`update:modelValue` / `change` / `success` / `error` / `remove`。

## `MfwImageSingle` — 单图上传

```vue
<MfwImageSingle v-model="avatar" crop :crop-ratio="1" :crop-width="200" :crop-height="200" />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `ImageResource` | `{ src, width, height }` |
| `crop` | `boolean` | 开启裁剪 |
| `cropRatio` / `cropWidth` / `cropHeight` | `number` | 裁剪比例与输出尺寸 |
| `uploadType` | `Form / Oss` | 上传方式 |
| `placeholder` | `string` | 占位文本 |## `MfwImageGallery` — 多图上传

```vue
<MfwImageGallery v-model="photos" :limit="9" draggable />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `ImageResource[]` | 图片数组 |
| `limit` / `draggable` | `number / boolean` | 上限 / 拖拽排序 |

## `MfwVideoSingle` — 视频上传

```vue
<MfwVideoSingle v-model="video" />
```

`modelValue` 为 `MediaResource`：`{ url, name, type, size?, duration? }`。

## 编程式上传

```typescript
import { uploadImage, getUploader } from 'moyan-mfw-base/frontend';

// 快速上传单图
const result = await uploadImage(file, { businessType: 'avatar', onProgress: (p) => {} });

// 自定义上传器
const uploader = getUploader('Oss', 'goods');
const result = await uploader.upload({ file, filename: 'file' });
```

## 使用规范

1. 图片类资源用 `MfwImageSingle` / `MfwImageGallery`（自动处理预览与 ImageResource 结构）。
2. 头像等场景开启 `crop`，避免用户上传畸形图片。
3. 后端可配置 `maxSize` 校验；OSS 直传时大小限制在授权接口中下发。
4. 上传结果结构统一 `{ url, originalName, fileName, fileSize, mimeType }`。
