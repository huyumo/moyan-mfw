# 前端 · 应用工厂与入口

## `createBaseAdminApp(options)`

```typescript
import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend';

const admin = createBaseAdminApp({
  title: '墨焱前端演示',
  menuTrees,                       // 必填：菜单树（路由 + 权限唯一数据源）
  appVersion: '1.0.0',             // 可选：显示在偏好设置面板
  layout: {                        // 可选：初始布局（用户已保存偏好时以用户偏好为准）
    layoutMode: 'sidebar',
    showTabs: true,
    colorMode: 'system',
    themePackage: 'tech',
  },
  navigation: {
    brandName: '墨焱管理后台',
    brandTagline: '业务演示应用',
    homePath: '/',
  },
  layoutExtensions: {              // 可选：布局扩展插槽
    headerCommon: HeaderCommonActions,
    sidebarFooter: RouteSyncButton,
  },
  loginComponent: () => import('./views/custom-login/index.vue'), // 可选：自定义登录页
});

// 初始化权限值缓存（必须，v-permission 与 buildPerValue 依赖）
const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount('#app');
```

### 选项

| 选项 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `menuTrees` | `FrontendAppTypeMenuConfig[]` | ✅ | 菜单树（见 [路由与菜单树](./routing.md)） |
| `title` | `string` | 否 | 页面标题后缀 |
| `routes` | `RouteRecordRaw[]` | 否 | 额外路由（覆盖同名基包路由） |
| `history` / `base` | `RouterHistory` / `string` | 否 | 路由历史与基础路径 |
| `pinia` | `Pinia` | 否 | 外部 Pinia 实例（测试/微前端注入） |
| `layout` | `Partial<LayoutStyleConfig>` | 否 | 初始布局样式 |
| `navigation` | `Partial<AdminNavigationConfig>` | 否 | 导航配置 |
| `layoutExtensions` | `LayoutExtensionComponents` | 否 | 布局扩展组件 |
| `loginComponent` | `Component \| () => Promise<unknown>` | 否 | 自定义登录页（默认内置登录页） |
| `appVersion` | `string` | 否 | 版本号（设置面板展示） |

### `LayoutExtensionComponents`

```typescript
interface LayoutExtensionComponents {
  headerCommon?: Component;      // 顶部通用区域（如业务快捷入口）
  headerAvatar?: Component;      // 头像区域
  headerUserMenu?: Component;    // 用户菜单
  sidebarFooter?: Component;     // 侧边栏底部（如 RouteSyncButton）
}
```

### 返回值

```typescript
interface BaseAdminAppInstance {
  app: App;
  router: Router;
  pinia: Pinia;
  mount: (selector?: string | Element) => Promise<ComponentPublicInstance>;
  fetchPermissionValues: () => Promise<Array<{ name: string; bitValue: string }>>;
  initPermissionCache: (values: Array<{ name: string; bitValue: string }>) => void;
}
```## `createExtensionFrontendApp(options)`

扩展包专用工厂：基于 `createBaseAdminApp` 预设 `dual` 双栏布局与品牌配置。

```typescript
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend';

const { mount } = createExtensionFrontendApp({
  name: 'ad',
  menuTrees: adMenuTrees,   // 扩展包菜单树（组件内联）
  layout: { showTabs: true },
});

await mount('#app');
```

## 自定义登录页

通过 `loginComponent` 传入自定义登录组件，可复用框架的 `useLoginPage()` composable 获取完整登录编排（表单校验、登录、应用选择、跳转）：

```vue
<script setup lang="ts">
import { useLoginPage } from 'moyan-mfw-base/frontend';

const { formContext, postLoginContext, isDark } = useLoginPage();
</script>
```

## 完整入口示例

仓库 `demo/frontend/src/main.ts` 为完整示例：权限值注册、高德地图配置（`configureAmap`）、业务扩展组件挂载、自定义登录页等。

## 常见问题

1. **必须调用 `fetchPermissionValues` + `initPermissionCache`**，否则 `v-permission` 无法工作（权限值缓存为空）。
2. 布局偏好（主题/模式/布局）会持久化到 localStorage；bootstrap 传入的 layout 只在用户未保存过偏好时生效。
3. 旧版 `loginExtensions` 选项已移除，自定义登录页请用 `loginComponent`。
