# 组件 · 编辑器（editor）

## `MfwMdEditor` — Markdown 编辑器

```vue
<MfwMdEditor
  v-model="content"
  :height="'500px'"
  :upload-api="'/api/upload-files'"
  @save="onSave"
/>
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string` | Markdown 内容 |
| `height` | `number / string` | 高度，默认 400 |
| `placeholder` / `readonly` | — | 占位 / 只读 |
| `showToolbar` / `showCodeRowNumber` / `showMobileToggle` | `boolean` | 工具栏 / 行号 / 移动端切换 |
| `previewMode` | `'desktop' / 'mobile'` | 预览模式 |
| `mobileWidth` | `string` | 移动端视口宽度 |
| `uploadApi` | `string` | 图片上传接口（默认项目上传接口） |
| `uploadHeaders` | `Record<string, string>` | 上传请求头 |

Emits：`update:modelValue` / `change` / `save`（Ctrl+S 或工具栏保存）。
实例：`getContent()` / `clear()`。

## `MfwJsonEditor` — JSON 编辑器

```vue
<MfwJsonEditor v-model="config" :line-numbers="true" :collapsible="true" :max-depth="5" />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `any` | JSON 值（对象/数组） |
| `readonly` / `disabled` | `boolean` | 只读 / 禁用 |
| `lineNumbers` / `collapsible` / `sortKeys` | `boolean` | 行号 / 折叠 / 键排序 |
| `maxDepth` / `indent` | `number` | 最大深度 / 缩进 |
| `minHeight` / `maxHeight` | `string` | 高度范围 |
| `placeholder` | `string` | 占位文本 |

Emits：`update:modelValue` / `change` / `error`（JSON 解析错误）。
实例：`format()` / `clear()` / `copy()` / `getJsonString()`。

## `MfwQuillEditor` — 富文本编辑器

基于 Quill 的富文本编辑器，`v-model` 绑定 HTML 字符串：

```vue
<MfwQuillEditor v-model="html" :placeholder="'请输入内容'" />
```

## 使用规范

1. Markdown 内容存文本；富文本存 HTML（注意 XSS 过滤，后端展示时消毒）。
2. 编辑器默认上传接口为项目上传接口；需要自定义时传 `uploadApi`。
3. JSON 编辑器用于配置类数据（如店铺设置、分佣配置），不要用于大文本。
