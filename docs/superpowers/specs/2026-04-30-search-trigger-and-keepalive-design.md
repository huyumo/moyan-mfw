# 搜索触发模式 & 页面缓存全局开关 设计

## 需求概述

| # | 需求 | 策略 |
|---|------|------|
| 1 | 搜索面板默认 change 模式 | 全局默认 `'change'`，页面级 prop 可覆盖 |
| 2 | 偏好设置新增"搜索触发模式" | 集成到 SettingsPanel "通用"Tab |
| 3 | 偏好设置新增"页面缓存开关" | 全局纯开关，移除 `PageConfig.keepAlive` |

## 设计决策

- **方案选择**：在现有 `LayoutStyleConfig` 中新增字段（方案 A），复用草稿-预览-保存机制
- **覆盖策略**：全局默认 + 允许页面级覆盖（searchTrigger）；keepAlive 为纯全局开关
- **keepAlive 策略**：移除 `PageConfig.keepAlive` 和 `RouteMeta.keepAlive`，全局开关控制 `<keep-alive>` 的渲染

## 类型层变更

### `LayoutStyleConfig` 新增字段

文件：`packages/base-frontend/src/types/layout-types.ts`

```typescript
export interface LayoutStyleConfig {
  // ...existing fields...
  searchTrigger: 'change' | 'submit';
  keepAlive: boolean;
}
```

### 移除的类型

1. `PageConfig<T>.keepAlive` — `routes.ts:61`
2. `RouteMeta.keepAlive` — `router-meta.d.ts`

## 默认值

文件：`packages/base-frontend/src/config/layout-defaults.ts`

```typescript
searchTrigger: 'change',
keepAlive: true,
```

## SearchPanel / ListPage 行为变更

- `MfwListPage` 和 `MfwCardListPage` 的 `searchTrigger` prop 默认值改为 `undefined`
- 组件内部取值：`props.searchTrigger ?? layoutStore.styleConfig.searchTrigger`
- 显式传 prop 的页面不受全局偏好影响

## keepAlive 变更

### 移除项

1. `PageConfig<T>.keepAlive` 属性
2. `RouteMeta.keepAlive` 声明
3. `routes.ts` 中 `meta: { keepAlive: config.keepAlive }` 赋值
4. 5 个 sys 页面配置中的 `keepAlive: true`

### Layout 层变更

- `AdminLayout.vue`：读取 `layoutStore.styleConfig.keepAlive`，为 `true` 渲染 `<keep-alive>`，为 `false` 直接渲染 `<component>`
- `EmptyLayout.vue`：移除 `keepAliveInclude` 计算逻辑，改为全局开关控制

## SettingsPanel UI 变更

"通用"Tab 新增：

| 控件 | 类型 | 选项 |
|------|------|------|
| 搜索触发模式 | ElRadioGroup | 即时查询 (change) / 手动查询 (submit) |
| 页面缓存 | ElSwitch | 开/关 |

## 持久化

`searchTrigger` 和 `keepAlive` 作为 `LayoutStyleConfig` 的一部分，自动通过 `persistPreferences()` 写入 `mfw:base-frontend:layout-preferences`。

## 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `types/layout-types.ts` | 新增 searchTrigger、keepAlive 字段 |
| `config/layout-defaults.ts` | 新增默认值 |
| `store/layout-store-model.ts` | LayoutState 包含新字段 |
| `store/layout-store-utils.ts` | mergeStyleConfig 处理新字段 |
| `store/layout-store-preference-actions.ts` | persistPreferences 自动覆盖 |
| `layouts/panels/SettingsPanel.vue` | 通用 Tab 新增控件 |
| `layouts/panels/settings-panel-text.ts` | 新增文案 |
| `components/page/list-page/index.tsx` | searchTrigger 默认值改为 undefined，读取全局偏好 |
| `components/page/list-page/types.ts` | searchTrigger prop 类型调整 |
| `components/page/card-list-page/index.tsx` | 同上 |
| `components/page/search-panel/index.tsx` | 无直接变更（由上层传递） |
| `components/page/search-panel/types.ts` | 无直接变更 |
| `layouts/AdminLayout.vue` | keepAlive 开关控制 |
| `layouts/EmptyLayout.vue` | keepAlive 开关控制，移除 keepAliveInclude |
| `router/routes.ts` | 移除 PageConfig.keepAlive，移除 meta 赋值 |
| `types/router-meta.d.ts` | 移除 RouteMeta.keepAlive |
| `views/sys/app/index.ts` | 移除 keepAlive: true |
| `views/sys/app-type/index.ts` | 移除 keepAlive: true |
| `views/sys/audit-log/index.ts` | 移除 keepAlive: true |
| `views/sys/role/index.ts` | 移除 keepAlive: true |
| `views/sys/user/index.ts` | 移除 keepAlive: true |
