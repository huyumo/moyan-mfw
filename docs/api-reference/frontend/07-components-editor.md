# 07 · 编辑器组件

## 目录

- [`MfwJsonEditor`](#mfwjsoneditor) — JSON 编辑器
- [`MfwQuillEditor`](#mfwquilleditor) — 富文本编辑器
- [MD 编辑器](#md-编辑器) — Markdown 编辑器

---

## `MfwJsonEditor`

基于 Monaco Editor 的 JSON 编辑器。

```typescript
import { MfwJsonEditor } from 'moyan-mfw-base/frontend'
```

```vue
<MfwJsonEditor v-model="jsonContent" :height="300" />
```

---

## `MfwQuillEditor`

基于 Quill 的富文本编辑器。

```typescript
import { MfwQuillEditor } from 'moyan-mfw-base/frontend'
```

```vue
<MfwQuillEditor v-model="htmlContent" />
```

---

## MD 编辑器

Markdown 编辑器组件，从 `mfw-md-editor` 子模块导出。

```typescript
import { MfwMdEditor } from 'moyan-mfw-base/frontend'
```

```vue
<MfwMdEditor v-model="markdownContent" />
```
