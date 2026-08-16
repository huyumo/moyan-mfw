# 组件 · 选择器（picker）

## `MfwAppSelector` — 应用实例选择器

用于选择应用实例（登录后切换应用、业务表单选择所属应用等）：

```vue
<MfwAppSelector
  v-model="appId"
  :load-app-list="fetchApps"
  searchable
  show-role-tag
  show-app-type
/>
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string / AppInstanceItem` | 选中应用 ID 或对象 |
| `appList` | `AppInstanceItem[]` | 静态列表（静态模式） |
| `loadAppList` | `({ keyword }) => Promise<AppInstanceItem[]>` | 动态加载（动态模式） |
| `searchable` / `debounce` | `boolean` / `number` | 搜索与防抖 |
| `showRoleTag` / `showAppType` | `boolean` | 显示角色（owner/member）与应用类型 |
| `clearable` / `disabled` / `size` | — | 常规属性 |

`AppInstanceItem`：`{ appId, appName, appCode, appTypeId, appTypeCode, appTypeName, role, logo?, appStatus? }`。

## `MfwUserPicker` — 用户选择器

按用户名/手机号搜索用户，支持创建/编辑用户（主题化表单）：

```vue
<MfwUserPicker
  v-model="ownerId"
  :on-search="searchUser"
  :on-create="createUser"
  :on-update="updateUser"
  theme="member"
  search-by="both"
  @change="onUserChange"
/>
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string` | 用户 ID |
| `theme` | `string` | 表单主题（内置 `member` 等，可注册自定义主题函数 `UserPickerThemeFn`） |
| `searchBy` | `'phone' / 'username' / 'both'` | 搜索维度 |
| `onSearch` | `(keyword) => Promise<UserResponseDto / null>` | 搜索用户（必传） |
| `onCreate` / `onUpdate` | `(data) => Promise<UserResponseDto>` | 新建/编辑用户（表单提交用） |
| `helper` | `string` | 辅助文案 |

## `MfwIconPicker` — 图标选择器

```vue
<MfwIconPicker v-model="iconName" show-search />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string` | 图标名 |
| `icons` | `IconItem[]` | 自定义图标列表（默认内置 Element Plus 图标） |
| `showSearch` / `searchPlaceholder` | — | 搜索 |
| `columns` / `iconSize` / `popupWidth` | — | 布局 |

## `MfwRadioGroup` — 单选组

```vue
<MfwRadioGroup v-model="value" :options="[{ label: '是', value: 1 }, { label: '否', value: 0 }]" button-mode />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string / number / boolean` | 选中值 |
| `options` | `RadioOption[]` | `{ label, value }[]` |
| `buttonMode` | `boolean` | 按钮样式 |

## `MfwAlimapPicker` — 高德地图选点

需要先 `configureAmap({ key, securityJsCode })`：

```vue
<MfwAlimapPicker v-model="location" :height="'360px'" show-point-set />
```

```typescript
import { configureAmap } from 'moyan-mfw-base/frontend';

configureAmap({ key: import.meta.env.VITE_AMAP_KEY, securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE });
```

`modelValue` 为 `AlimapMarkerData`：`{ lat, lng, name, address, adcode, city, district, province, street, ... }`。

辅助工具：`ProvinceCityDistrict` / `getProvinceCityDistrict(options)` 获取省市区级联数据（`SimplyDataItem` 树）。

## 使用规范

1. 业务选择器优先复用内置组件；自定义选项数据用 `loadAppList` 之类的动态加载函数。
2. `MfwUserPicker` 的 `onSearch` 必须提供，否则无法搜索（组件不内置数据源）。
3. 高德地图组件必须在 `main.ts` 调用 `configureAmap` 完成凭证配置。
