# 00 · 快速开始：应用工厂函数

## 目录

* [`createBaseAdminApp()`](#createbaseadminapp) — 创建管理后台应用（menuTrees 必填）

* [`createExtensionFrontendApp()`](#createextensionfrontendapp) — 创建扩展包前端

***

## `createBaseAdminApp()`

创建完整的管理后台应用实例，自动组装路由、状态管理、布局、插件、权限系统。

```typescript
import { createBaseAdminApp } from 'moyan-mfw-base/frontend'

function createBaseAdminApp(
  options?: BaseAdminBootstrapOptions
): BaseAdminAppInstance
```

### 返回值 `BaseAdminAppInstance`

```typescript
interface BaseAdminAppInstance {
  app: App                                           // Vue 应用实例
  router: Router                                      // 路由实例
  pinia: Pinia                                        // 状态管理实例
  mount: (selector?: string | Element) => Promise<ComponentPublicInstance>
  fetchPermissionValues: () => Promise<Array<{ name: string; bitValue: string }>>
  initPermissionCache: (values: Array<{ name: string; bitValue: string }>) => void
}
```

### 配置选项 `BaseAdminBootstrapOptions`

| 属性                 | 类型                               | 说明                                |
| ------------------ | -------------------------------- | --------------------------------- |
| `history`          | `RouterHistory`                  | 路由历史实现，默认 `createWebHistory`      |
| `base`             | `string`                         | 路由基础路径                            |
| `menuTrees`        | `FrontendAppTypeMenuConfig[]`    | **必填**。菜单树配置（路由 + 权限唯一数据源，见 01-routing.md） |
| `title`            | `string`                         | 页面标题后缀                            |
| `pinia`            | `Pinia`                          | 外部注入的 Pinia 实例                    |
| `layout`           | `Partial<LayoutStyleConfig>`     | 布局样式配置                            |
| `navigation`       | `Partial<AdminNavigationConfig>` | 导航配置                              |
| `layoutExtensions` | `LayoutExtensionComponents`      | 布局扩展组件                            |
| `loginComponent`   | `Component \| (() => Promise<unknown>)` | 自定义登录页组件（默认内置登录页） |

### 布局样式配置 `LayoutStyleConfig`

| 属性                | 类型                             | 默认值         | 说明           |
| ----------------- | ------------------------------ | ----------- | ------------ |
| `layoutMode`      | `'sidebar' \| 'top' \| 'dual'` | `'sidebar'` | 布局模式         |
| `sidebarWidth`    | `number`                       | `236`       | 侧边栏宽度 (px)   |
| `headerHeight`    | `number`                       | `64`        | 顶部高度 (px)    |
| `contentMaxWidth` | `number`                       | `1360`      | 内容区最大宽度 (px) |
| `compact`         | `boolean`                      | `false`     | 紧凑模式         |
| `fixedHeader`     | `boolean`                      | `true`      | 固定顶部         |
| `showTabs`        | `boolean`                      | `true`      | 显示标签页        |
| `cardRadius`      | `number`                       | `8`         | 卡片圆角 (px)    |
| `buttonRadius`    | `number`                       | `6`         | 按钮圆角 (px)    |
| `colorMode`       | `'light' \| 'dark'`            | `'light'`   | 颜色模式         |
| `themePackage`    | `string`                       | `'default'` | 主题包名称        |
| `searchTrigger`   | `'change' \| 'submit'`         | `'change'`  | 搜索触发方式       |
| `keepAlive`       | `boolean`                      | `true`      | 页面缓存         |

### 导航配置 `AdminNavigationConfig`

| 属性             | 类型               | 说明    |
| -------------- | ---------------- | ----- |
| `brandName`    | `string`         | 品牌名称  |
| `brandTagline` | `string`         | 品牌标语  |
| `homePath`     | `string`         | 首页路径  |
| `topNav`       | `TopNavItem[]`   | 顶部导航项 |
| `sideMenu`     | `SideMenuItem[]` | 侧边菜单项 |

### 布局扩展组件 `LayoutExtensionComponents`

```typescript
interface LayoutExtensionComponents {
  headerCommon?: Component       // 顶部通用区域扩展
  headerAvatar?: Component       // 头像区域扩展
  headerUserMenu?: Component     // 用户菜单扩展
}
```

### 自定义登录页 `loginComponent`

```typescript
loginComponent: () => import('./views/custom-login/index.vue')  // 组件或懒加载函数
```

> 旧版 `loginExtensions`（登录页局部扩展）已移除。自定义登录页可复用 `useLoginPage()` composable 获得完整登录编排。


### 完整示例

```typescript
import { createBaseAdminApp } from 'moyan-mfw-base/frontend'

const { app, mount, router } = createBaseAdminApp({
  title: '电商管理后台',
  layout: {
    layoutMode: 'sidebar',
    colorMode: 'light',
    themePackage: 'ocean',
  },
  navigation: {
    brandName: '电商后台',
    brandTagline: 'v1.0.0',
    topNav: [
      { key: 'doc', label: '文档', href: 'https://example.com/docs' },
    ],
  },
  menuTrees,        // 菜单树（必填），见 01-routing.md
})

await mount('#app')
```

***

## `createExtensionFrontendApp()`

扩展包专用工厂函数，在 `createBaseAdminApp()` 基础上预设扩展布局模式（`dual`）和路由前缀。

```typescript
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'

function createExtensionFrontendApp(
  options: CreateExtensionFrontendAppOptions
): BaseAdminAppInstance
```

### 参数

```typescript
interface CreateExtensionFrontendAppOptions {
  name: string                 // 扩展名
  menuTrees: FrontendAppTypeMenuConfig[]  // 扩展包菜单树（组件内联在节点上）
  layout?: Partial<LayoutStyleConfig>
  port?: number
}
```

### 示例

```typescript
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'

const { mount } = createExtensionFrontendApp({
  name: 'ad',
  menuTrees: adMenuTrees,
})

await mount('#app')
```