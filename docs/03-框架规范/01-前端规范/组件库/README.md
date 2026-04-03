# 前端组件库 API 文档索引

> 墨焱管理后台框架基础组件库

---

## 组件列表

### 展示组件 (display)

| 组件 | 说明 | 文档 |
|------|------|------|
| MfwFormat | 格式化组件（日期、图片、字典、标签） | [MfwFormat.md](./MfwFormat.md) |

### 反馈组件 (feedback)

| 组件 | 说明 | 文档 |
|------|------|------|
| MfwPopup | 命令式弹窗组件 | [MfwPopup.md](./MfwPopup.md) |

### 上传组件 (upload)

| 组件 | 说明 | 文档 |
|------|------|------|
| MfwUpload | 文件上传组件 | [MfwUpload.md](./MfwUpload.md) |

---

## 快速开始

### 注册组件

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { MfwFormat, MfwPopup, MfwUpload } from 'moyan-mfw-base-frontend';

const app = createApp(App);

// 注册格式化组件
app.use(MfwFormat);

// 注册弹窗组件
app.component('MfwPopupManager', MfwPopup.MfwPopupManager);

// 注册上传组件
app.component('MfwUpload', MfwUpload);

app.mount('#app');
```

---

## 组件规范

### Props 命名

- 使用 camelCase
- 布尔类型以 `is` 或 `has` 开头（可选）

### Events 命名

- 使用 camelCase
- 更新值事件：`update:modelValue`

### Slots 命名

- 使用 camelCase
- 默认插槽：`default`

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-04-03 | 初始版本，包含 MfwFormat、MfwPopup、MfwUpload |
