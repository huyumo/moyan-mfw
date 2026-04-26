---
version: "1.0"
last_updated: "2026-04-25"
scope: frontend
triggers:
  - 组件 API
  - 组件属性
  - MfwListPage
  - MfwPopup
  - MfwFormCard
  - 组件使用场景
dependencies: []
maturity: stable
tags: [前端, 组件, API, 属性, MfwListPage, MfwPopup]
---

# 组件参考

## 页面类组件

| 组件 | 场景 | 关键属性 | 类型定义 |
|------|------|---------|---------|
| `MfwPageWrapper` | 所有管理页面的外层容器 | `#header-extra` 插槽放操作按钮 | `page/page-wrapper/types.ts` |
| `MfwListPage` | 表格型列表页 | `searchTemplate` / `columns` / `actionColumn` / `loadData` | `page/list-page/types.ts` |
| `MfwCardListPage` | 卡片型列表页 | `render-mode="card"` / `#card-item` 插槽 | `page/card-list-page/types.ts` |
| `MfwSearchPanel` | 搜索面板 | `searchTemplate` 配置 | `page/search-panel/types.ts` |

## 表格组件

| 组件 | 场景 | 用法 | 类型定义 |
|------|------|------|---------|
| `MfwTableList` | 独立表格 | `columns` + `loadData` | `table/table-list/types.ts` |
| `ActionButtons` + `renderActionButtons` | 操作列按钮组 | `renderActionButtons([{label,permission,onClick,disabled}], options, row)` | `table/action-buttons/types.ts` |

## 反馈组件

| 组件 | 场景 | 用法 | 类型定义 |
|------|------|------|---------|
| `MfwPopup` | 命令式弹窗 | `MfwPopup.open({ title, component, data, on })` | `feedback/popup/types.ts` |

## 选择器组件

| 组件 | 场景 | 类型定义 |
|------|------|---------|
| `MfwUserPicker` | 选择用户（弹窗形式） | `picker/user-picker/types.ts` |
| `MfwIconPicker` | 选择图标 | `picker/icon-picker/types.ts` |
| `MfwAppSelector` | 选择应用实例 | `picker/app-selector/types.ts` |
| `MfwRadioGroup` | 单选组 | `picker/radio-group/types.ts` |

## 展示组件

| 组件 | 场景 | 类型定义 |
|------|------|---------|
| `MfwDateFormat` | 日期格式化显示 | `display/mfw-format/types.ts` |
| `MfwTagFormat` | 标签格式化显示 | `display/mfw-format/types.ts` |
| `MfwDictFormat` | 字典值格式化 | `display/mfw-format/types.ts` |
| `MfwImageFormat` | 图片格式化显示 | `display/mfw-format/types.ts` |
| `MfwDetailPanel` | 详情面板 | `display/mfw-detail/types.ts` |

## 业务组件

| 组件 | 场景 | 类型定义 |
|------|------|---------|
| `PermissionManager` | 权限树管理 | `business/permission-manager/types.ts` |
| `PermissionTree` / `TreeSelect` | 权限树选择 | `business/permission-tree/types.ts` |
| `RoleCard` | 角色卡片展示 | `business/role-card/types.ts` |
| `RoleForm` | 角色新增/编辑表单 | `business/rolo-form/types.ts` |
| `RolePermissionPanel` | 角色权限配置面板 | `business/role-permission-panel/types.ts` |
| `AppSelectorDialog` | 应用选择弹窗 | `business/app-selector-dialog/types.ts` |

## Upload 组件

| 组件 | 场景 | 类型定义 |
|------|------|---------|
| `MfwUpload` | 通用上传 | `upload/types.ts` |

## 核心组件 Props 说明

### MfwListPage

| Prop | 类型 | 说明 |
|------|------|------|
| `searchTemplate` | `SearchItemConfig[]` | 搜索面板配置 |
| `columns` | `ColumnConfig[]` | 表格列配置 |
| `actionColumn` | `ColumnConfig` | 操作列配置 |
| `loadData` | `(params) => Promise<PaginatedResult>` | 数据加载函数 |

### MfwPopup

| Prop | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 弹窗标题 |
| `type` | `'dialog' \| 'drawer'` | 弹窗类型 |
| `component` | `Component` | 表单组件引用 |
| `data` | `object` | 传递给组件的 props |
| `popupProps` | `object` | dialog 用 width，drawer 用 size |
| `on` | `{ confirm?: Function }` | 确认后回调 |

### MfwFormCard

| Prop | 类型 | 说明 |
|------|------|------|
| `form-data` | `Record<string, any>` | 响应式表单数据 |
| `template` | `FormItemConfig[]` | 表单项配置 |
| `rules` | `FormRules` | 额外验证规则 |
| `form-props` | `object` | 透传给 el-form 的属性 |

## 反模式（Red Flags）— 立即停止

- ✋ 不使用 MfwListPage 自己手写表格+分页 → 使用 MfwListPage 统一列表页模式（例外：极度定制化的表格布局 MfwListPage 无法满足时，可手写，但须复用 `loadData` 分页模式）
- ✋ 用 `v-if` 判断权限显示按钮 → 使用 `v-permission` 指令或 `renderActionButtons`（例外：权限需与其它业务条件组合判断时，可使用 `usePermission` + `v-if`，但权限部分必须通过 `usePermission` 获取）
- ✋ 手动管理弹窗状态（visible/ref）→ 使用 `MfwPopup.open()` 命令式调用
- ✋ 组件缺少 `mod.ts` 导出文件 → 每个组件目录必须有 mod.ts
