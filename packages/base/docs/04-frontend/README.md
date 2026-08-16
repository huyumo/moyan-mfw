# 前端总览（`moyan-mfw-base/frontend`）

## 架构

基于 Vue 3 + Element Plus + Pinia + Vue Router + Vite。`createBaseAdminApp()` 完成全部初始化：

```
createBaseAdminApp({ menuTrees, layout, navigation, layoutExtensions, loginComponent, ... })
  ├─ createApp(BaseAdminRoot) + Pinia + Router
  ├─ setupPlugins：Element Plus + moyan-api 适配器（MoAxios）
  ├─ buildRoutesFromMenuTrees(menuTrees) → 全部业务路由
  ├─ mergeRoutes(base, options.routes) → 业务路由覆盖同名基包路由
  ├─ setupRouteGuard：鉴权 / 初始化检查 / 权限 / AppType 隔离
  ├─ layoutStore：应用 bootstrap 布局 + 持久化偏好
  ├─ provide: mfw:menuTrees / mfw:appVersion
  └─ 返回 { app, router, pinia, mount, fetchPermissionValues, initPermissionCache }
```

## 内置页面

框架提供以下页面组件（**需要业务层在 menuTrees 中显式挂载**，不再自动注册路由）：

| 导出名 | 页面 |
|--------|------|
| `SysUserPage` | 用户管理 |
| `SysRolePage` | 角色管理 |
| `SysAppPage` | 应用管理 |
| `SysAppTypePage` | 应用类型管理 |
| `SysMemberPage` | 成员管理 |
| `SysPermissionPage` | 权限管理 |
| `SysAuditLogPage` | 审计日志 |
| `DashboardPage` | 内置仪表盘示例 |

## 前端导出速览

| 分类 | 内容 |
|------|------|
| 应用工厂 | `createBaseAdminApp` / `createExtensionFrontendApp` |
| 路由 | `createBaseAdminRouter` / `buildRoutesFromMenuTrees` / `serializeMenuTrees` |
| 布局 | `AdminLayout` / `AsidePanel` / `HeaderPanel` / `SettingsPanel` / `TabsPanel` / `UserPanel` 等 |
| Store | `useAuthStore` / `useLayoutStore` / `useAppLoadingStore` |
| 权限 | `registerPermissionValues` / `createBusinessPageConfigFn` / `initPermissionCache` / `v-permission` / `usePermission` |
| 主题 | `themeRegistry` / `getTheme` / `getAvailableThemes` / `useThemeSwitch` / `useColorMode` / `useLoginPage` |
| 上传 | `uploadConfig` / `getUploader` / `uploadImage` |
| API 工具 | `getAccessToken` / `getCurrentAppId` / `configureAmap` |
| 组件 | 全部 `Mfw*` 组件（见 [组件总览](./components/README.md)） |## 文档导航

- [应用工厂与入口](./app-factory.md)
- [路由与菜单树](./routing.md)
- [布局与主题](./layout-theme.md)
- [前端权限](./permissions.md)
- [Store](./stores.md)
- [API 调用层](./api-layer.md)
- [组件总览](./components/README.md)
- [使用规范](./conventions.md)
