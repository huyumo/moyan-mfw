# 02 · 布局体系

## 目录

- [布局组件](#布局组件)
- [面板组件](#面板组件)
- [布局配置](#布局配置)
- [`useAdminLayout()`](#useadminlayout)
- [布局扩展](#布局扩展)

---

## 布局组件

### `AdminLayout`

主布局组件，整合侧边栏、顶部导航、内容区、标签页、设置面板。由框架自动装配，业务层无需手动使用。

```typescript
import { AdminLayout } from 'moyan-mfw-base/frontend'
```

### 面板组件

布局由 7 个可独立替换的面板组成：

```typescript
import {
  AsidePanel,       // 侧边栏面板
  HeaderPanel,      // 顶部面板
  MainPanel,        // 主内容区面板
  NavigationPanel,  // 导航菜单面板
  SettingsPanel,    // 设置面板（主题/布局切换）
  TabsPanel,        // 标签页面板
  UserPanel,        // 用户面板
} from 'moyan-mfw-base/frontend'
```

---

## 布局配置

布局样式配置通过 `createBaseAdminApp({ layout: {...} })` 传入。

```typescript
import { defaultLayoutStyleConfig, defaultNavigationConfig } from 'moyan-mfw-base/frontend'
```

### `defaultLayoutStyleConfig`

```typescript
{
  layoutMode: 'sidebar',      // 'sidebar' | 'top' | 'dual'
  sidebarWidth: 236,
  headerHeight: 64,
  contentMaxWidth: 1360,
  compact: false,
  fixedHeader: true,
  showTabs: true,
  cardRadius: 8,
  buttonRadius: 6,
  colorMode: 'light',
  themePackage: 'default',
  searchTrigger: 'change',
  keepAlive: true,
}
```

### `defaultNavigationConfig`

```typescript
{
  brandName: '墨研管理后台',
  brandTagline: '前端基础框架',
  homePath: '/dashboard',
  topNav: [{ key: 'guide', label: '接入指导', href: '...' }],
  sideMenu: [{ key: 'dashboard', label: '首页', to: '/dashboard', icon: 'DataBoard' }],
}
```

### 类型

```typescript
import type {
  LayoutMode,               // 'sidebar' | 'top' | 'dual'
  LayoutStyleConfig,        // 布局样式配置
  AdminNavigationConfig,    // 导航配置
  TopNavItem,               // 顶部导航项
  SideMenuItem,             // 侧边菜单项
  PageTabItem,              // 标签页项
  LayoutExtensionComponents, // 布局扩展组件
  LoginExtensionComponents,  // 登录页扩展组件
  ExtensionComponentInput,   // 扩展组件输入类型
} from 'moyan-mfw-base/frontend'
```

---

## `useAdminLayout()`

布局核心 composable，提供以下能力：

- 用户信息、应用列表、应用切换
- 布局模式（sidebar/top/dual）切换
- 颜色模式（light/dark）切换、View Transitions 动画
- 主题包切换（CSS 变量注入）
- 设置面板开关、紧凑模式
- CSS 变量同步（`--mfw-sidebar-width` 等）
- 标签页管理
- 登出

```typescript
import { useAdminLayout } from 'moyan-mfw-base/frontend'

const {
  // 状态
  user, userApps, currentApp,
  layoutMode, compact, settingsVisible,
  colorMode, currentTheme,

  // 方法
  switchApp, toggleCompact, toggleSettingsPanel,
  setLayoutMode, setColorMode,
  handleLogout,
} = useAdminLayout()
```

---

## 布局扩展

通过 `layoutExtensions` 和 `loginExtensions` 在框架默认布局中注入自定义组件。

```typescript
const { mount } = createBaseAdminApp({
  layoutExtensions: {
    headerCommon: MyHeaderWidget,    // 顶部通用区
    headerAvatar: MyAvatarWidget,    // 头像区
    headerUserMenu: MyUserMenu,     // 用户菜单
  },
  loginExtensions: {
    aside: MyLoginAside,             // 登录页侧边
    footer: MyLoginFooter,           // 登录页底部
  },
})
```

异步加载扩展组件：

```typescript
loginExtensions: {
  aside: {
    loader: () => import('./MyLoginAside.vue'),
    timeout: 5000,
  },
}
```
