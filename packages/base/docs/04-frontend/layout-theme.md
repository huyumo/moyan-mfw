# 前端 · 布局与主题

## 布局配置 `LayoutStyleConfig`

```typescript
const layout = {
  layoutMode: 'sidebar',   // 'sidebar' | 'top' | 'dual'
  sidebarWidth: 236,       // 侧边栏宽度 px
  headerHeight: 64,        // 顶部高度 px
  contentMaxWidth: 1360,   // 内容区最大宽度 px
  compact: false,          // 紧凑模式
  fixedHeader: true,       // 固定顶部
  showTabs: true,          // 多页签
  cardRadius: 8,           // 卡片圆角 px
  buttonRadius: 6,         // 按钮圆角 px
  colorMode: 'light',      // 'light' | 'dark' | 'system'
  themePackage: 'tech',    // 主题包名
  searchTrigger: 'change', // 搜索触发：'change' | 'submit'
  keepAlive: true,         // 页面缓存
};
```

传入 `createBaseAdminApp({ layout })`；用户通过设置面板修改后会持久化到 localStorage，**刷新后以用户偏好为准**。

## 导航配置 `AdminNavigationConfig`

```typescript
const navigation = {
  brandName: '墨焱管理后台',
  brandTagline: '业务演示应用',
  homePath: '/',
  topNav: [{ key: 'doc', label: '文档', href: 'https://...' }],
  sideMenu: [],   // 通常由权限菜单自动生成，不需要手动配置
};

createBaseAdminApp({ navigation });
```

## 布局扩展 `layoutExtensions`

| 插槽 | 说明 | 示例 |
|------|------|------|
| `headerCommon` | 顶部通用区域 | 业务快捷入口、消息铃铛 |
| `headerAvatar` | 头像区域 | 自定义头像展示 |
| `headerUserMenu` | 用户菜单 | 自定义菜单项 |
| `sidebarFooter` | 侧边栏底部 | `RouteSyncButton`（权限同步按钮） |

```typescript
createBaseAdminApp({
  layoutExtensions: {
    headerCommon: HeaderCommonActions,
    sidebarFooter: RouteSyncButton,
  },
});
```

## 主题系统

### 内置主题（9 套）

`default` / `ocean` / `graphite` / `fintech` / `tech` / `luxury` / `nature` / `aurora` / `sunset`（默认 `tech`）。

```typescript
import { getTheme, getAvailableThemes, themeRegistry } from 'moyan-mfw-base/frontend';

getTheme('ocean');        // 主题对象，不存在时回退默认
getAvailableThemes();     // 全部主题列表
```

### 运行时切换

```typescript
import { useThemeSwitch, useColorMode } from 'moyan-mfw-base/frontend';

const { setTheme, currentTheme, availableThemes, initTheme } = useThemeSwitch();
const { isDark, toggleDark, setColorMode, colorMode } = useColorMode();

setTheme('ocean');      // 应用主题包
toggleDark();           // 切换亮/暗色
setColorMode('dark');   // 指定模式
```

### 自定义业务主题

```typescript
// src/themes.ts
import type { ThemeRegistry } from './types/layout-theme-types';

export const businessThemes: ThemeRegistry = {
  sunset: {
    label: '落日橙',
    tokens: {
      light: {
        appBackground: '#fff8f4',
        surfaceBackground: '#ffffff',
        borderColor: '#f3dacb',
        textColor: '#3f2c24',
        mutedTextColor: '#86685a',
        primaryColor: '#d26a33',
        headerGradient: 'linear-gradient(120deg, #8a3f1f 0%, #d26a33 55%, #f6a04d 100%)',
        headerTextColor: '#fffaf6',
        cardShadow: '0 10px 28px rgba(210, 106, 51, 0.15)',
      },
      dark: { /* ... */ },
    },
  },
};
```

> 完整示例见 `demo/frontend/src/themes.ts`。
