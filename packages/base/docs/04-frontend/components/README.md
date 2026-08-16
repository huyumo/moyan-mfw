# 前端 · 组件总览

## 命名规范

- 通用组件统一 `Mfw` 前缀（Moyan Framework），PascalCase（`MfwListPage`、`MfwFormCard`）。
- 组件目录小写中划线（`list-page/`），导出名 PascalCase。
- TSX 组件位于 `components/` 时必须使用 `Mfw` 前缀（ESLint 强制）。

## 组件分类

| 分类 | 组件 | 文档 |
|------|------|------|
| 展示 | `MfwFormat` / `MfwDateFormat` / `MfwDictFormat` / `MfwTagFormat` / `MfwImageFormat` / `MfwDetail` / `MfwDetailPanel` / `MfwUserFormat` / `MfwCardPanel` / `ParticleBackground` | [display.md](./display.md) |
| 表单 | `MfwFormCard` | [form.md](./form.md) |
| 表格 | `MfwTableList` / `ActionButtons` | [table.md](./table.md) |
| 页面 | `MfwPageWrapper` / `MfwListPage` / `MfwCardListPage` / `MfwSearchPanel` / `MfwBaseListPage` | [page.md](./page.md) |
| 选择器 | `MfwAppSelector` / `MfwUserPicker` / `MfwIconPicker` / `MfwRadioGroup` / `MfwAlimapPicker` | [picker.md](./picker.md) |
| 编辑器 | `MfwMdEditor` / `MfwJsonEditor` / `MfwQuillEditor` | [editor.md](./editor.md) |
| 上传 | `MfwUpload` / `MfwImageSingle` / `MfwImageGallery` / `MfwVideoSingle` | [upload.md](./upload.md) |
| 反馈 | `MfwPopup`（命令式弹窗）/ `MfwPopupManager` | [feedback.md](./feedback.md) |
| 业务 | `RouteSyncButton` / `AppSelectorDialog` / `MfwPermissionTree` / `RolePermissionPanel` / `PermissionManager` / `PermissionPoolPanel` / `MfwPermissionValuePanel` / `RoleCard` / `RoleForm` / `BuiltinRoleDialog` / `OwnerChanger` / `CustomMenuEditor` / `NoAppsEmpty` | [business.md](./business.md) |
| 布局 | `ProfilePanel` / `PasswordChangeForm` | — |

## 引入方式

```typescript
// 按需引入（推荐，自动 tree-shaking）
import { MfwListPage, MfwFormCard, MfwPopup } from 'moyan-mfw-base/frontend';
```

## 组件使用约定

1. 组件 props 均支持 Element Plus 透传（`elProps`），自定义需求优先用 `elProps` 而不是包一层组件。
2. 自定义渲染优先使用 `render` 函数或插槽（各组件文档注明）。
3. 所有组件兼容 `v-model` 协议（`modelValue` + `update:modelValue`）。
