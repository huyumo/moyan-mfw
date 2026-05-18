# moyan-mfw-base/frontend API 参考手册

## 概览

`moyan-mfw-base/frontend` 是 MFW 框架的前端基础包，基于 Vue 3 + Element Plus + Vite + Pinia 构建。通过 `createBaseAdminApp()` 工厂函数一键创建管理后台应用，自动装配路由、布局、状态管理、权限系统等。

## 导入方式

```typescript
import { createBaseAdminApp } from 'moyan-mfw-base/frontend'
```

## 文档导航

| 文档 | 内容 |
|------|------|
| [00-quick-start.md](./00-quick-start.md) | 应用工厂函数、扩展包启动、配置选项、应用实例 API |
| [01-routing.md](./01-routing.md) | 路由体系：`createBaseAdminRouter` / `definePageConfig` / `defineModuleConfig` / 守卫 |
| [02-layout.md](./02-layout.md) | 布局体系：`AdminLayout` / 面板组件 / 布局配置 / `useAdminLayout` |
| [03-components-display.md](./03-components-display.md) | 展示组件：`MfwCardPanel` / `MfwDetail` / `MfwFormat` / `ParticleBackground` |
| [04-components-feedback.md](./04-components-feedback.md) | 反馈/表单/上传：`MfwPopup` / `MfwFormCard` / `MfwUpload` / `ImageCropper` |
| [07-components-editor.md](./07-components-editor.md) | 编辑器组件：`MfwJsonEditor` / `MfwQuillEditor` / MD 编辑器 |
| [08-components-page.md](./08-components-page.md) | 页面组件：`MfwPageWrapper` / `MfwListPage` / `MfwCardListPage` / `MfwSearchPanel` |
| [09-components-table.md](./09-components-table.md) | 表格/选择器/composables：`MfwTableList` / `ActionButtons` / `MfwUserPicker` / `useColorMode` / `useThemeSwitch` |
| [11-components-business.md](./11-components-business.md) | 业务组件：`RoleCard` / `PermissionManager` / `AppSelectorDialog` / ... |
| [12-plugins-and-utils.md](./12-plugins-and-utils.md) | 插件与工具：`MoAxios` / `ProfilePanel` / `getImageSrc` |
| [13-hooks.md](./13-hooks.md) | 权限 Hook：`usePermission` |
| [14-directives.md](./14-directives.md) | 指令：`v-permission` / `setupPermissionDirective` |
| [15-themes.md](./15-themes.md) | 主题系统：`themeRegistry` / `getTheme` / `getAvailableThemes` |
| [16-permission-system.md](./16-permission-system.md) | 权限工具：`buildPerValue` / `parsePerValue` / `createBusinessPageConfigFn` / ... |
| [17-stores.md](./17-stores.md) | 状态管理：`useAuthStore` / `useLayoutStore` / `useAppLoadingStore` |

## 架构概览

```
createBaseAdminApp()
  ├── createApp(BaseAdminRoot)
  ├── setupPlugins (ElementPlus + MoAxios)
  ├── pinia (状态管理)
  ├── createBaseAdminRouter()
  │     ├── 基包路由扫描 (import.meta.glob)
  │     ├── 业务路由注入
  │     └── setupRouteGuard (认证 + 权限守卫)
  └── layoutStore (布局 + 导航 + 主题)
```

## 最小启动示例

```typescript
import { createBaseAdminApp } from 'moyan-mfw-base/frontend'

const { app, router, mount } = createBaseAdminApp({
  title: '我的管理后台',
  layout: { layoutMode: 'sidebar' },
})

await mount('#app')
```
