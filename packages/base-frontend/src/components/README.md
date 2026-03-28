# 通用组件目录

存放业务通用的 UI 组件，这些组件可以在多个业务场景中复用。

## 命名规范

- 所有通用组件必须使用 `Mfw` 前缀命名（Moyan Framework 的缩写）
- 组件名使用 PascalCase，例如：`MfwButton`, `MfwDialog`, `MfwTable`

## 目录结构

每个组件应该使用独立的目录包裹：

```
components/
├── button/
│   ├── MfwButton.vue
│   └── index.ts
├── dialog/
│   ├── MfwDialog.vue
│   └── index.ts
└── index.ts
```

## 与布局组件的区别

- `src/components/` - 通用业务组件（Mfw 前缀），可复用的 UI 组件
- `src/layouts/components/` - 框架布局组件（Base/Layout/Menu 前缀），布局相关的内部组件
