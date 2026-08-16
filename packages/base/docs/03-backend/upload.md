# 后端 · 文件上传与 OSS

## 上传接口（内置）

框架内置上传模块（`/api/upload-files`，`@SkipPermission`，登录即可用）：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload-files` | 单文件上传（multipart，字段名 `file`），可选 `businessType` |
| POST | `/api/upload-files/batch` | 批量上传（字段名 `files`，最多 10 个） |
| GET | `/api/upload-files/oss-authorization` | 获取 OSS STS 临时凭证（前端直传用） |

上传文件默认保存到 `UPLOAD_DIR`（默认 `uploads/`），通过 `/uploads/*` 静态访问。

## 配置

```bash
UPLOAD_DIR=uploads

# 阿里云 OSS（可选，启用 OSS 直传时配置）
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_ROLE_ARN=...          # STS 角色 ARN
OSS_BUCKET=...
OSS_REGION=...
OSS_ENDPOINT=...
```

## 使用

```typescript
// 前端表单上传（默认）
import { uploadImage, uploadConfig, getUploader } from 'moyan-mfw-base/frontend';

const result = await uploadImage(file, { businessType: 'avatar' });
// { url, originalName, fileName, fileSize, mimeType }
```

```typescript
// OSS 直传（VITE_UPLOAD_TYPE=Oss 或显式指定）
import { getUploader } from 'moyan-mfw-base/frontend';

const uploader = getUploader('Oss', 'goods');
const result = await uploader.upload({ file, filename: 'file' });
```## 前端上传组件

推荐直接使用上传组件（自动处理上传方式与预览）：

```vue
<template>
  <MfwImageSingle v-model="avatar" crop :crop-ratio="1" />
  <MfwImageGallery v-model="photos" :limit="9" />
  <MfwVideoSingle v-model="video" />
  <MfwUpload v-model="files" resource-type="file" multiple />
</template>
```

详见 [上传组件文档](../04-frontend/components/upload.md)。

## 使用规范

1. 图片/视频等媒体资源建议使用 OSS 直传（减轻后端带宽压力）。
2. 前端上传组件通过环境变量 `VITE_UPLOAD_TYPE`（`Form`/`Oss`）切换上传方式。
3. 上传接口已内置审计日志（批量上传）；自定义上传接口请自行加 `@AuditLog`。
