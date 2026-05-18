# 17 · 状态管理（Stores）

MFW 基于 Pinia 提供 3 个核心 Store，均在框架内部使用，也可被业务层直接调用。

---

## `useAuthStore`

认证状态管理。管理 Token、用户信息、应用列表、权限数据。

```typescript
import { useAuthStore } from 'moyan-mfw-base/frontend'

const authStore = useAuthStore()
```

### 状态

| 属性 | 类型 | 说明 |
|------|------|------|
| `token` | `string` | JWT accessToken |
| `refreshTokenValue` | `string` | JWT refreshToken |
| `user` | `UserInfo \| null` | 当前用户信息 |
| `apps` | `AppInstance[]` | 用户可访问的应用列表 |
| `currentApp` | `AppInstance \| null` | 当前选中的应用 |
| `permissionMenu` | `PermissionMenuItem[]` | 权限菜单树 |
| `permissionValueMap` | `Record<string, string>` | permCode → 位值映射 |
| `isAuthenticated` | `boolean`（computed） | 是否已认证（有 Token 和用户信息） |
| `isLoggedIn` | `boolean`（computed） | 是否已登录（仅 Token） |
| `needSelectApp` | `boolean`（computed） | 是否需选择应用（多应用且未选） |

### 主要方法

| 方法 | 说明 |
|------|------|
| `login(params)` | 登录，保存 Token 和用户信息 |
| `logout()` | 登出，清除 Token 和状态 |
| `restoreToken()` | 从 localStorage 恢复 Token |
| `saveToken(access, refresh, expiresIn)` | 保存 Token 到内存和 localStorage |
| `clearToken()` | 清除所有 Token 和状态 |
| `fetchUserInfo()` | 获取用户详细信息 |
| `fetchUserApps()` | 获取用户的应用列表 |
| `selectApp(app)` | 选择当前应用 |
| `loadPermissions()` | 加载用户权限数据 |
| `getPermCodeByRoute(path)` | 根据路由路径获取 permCode |
| `isTokenExpiringSoon()` | Token 是否即将过期（10 分钟内） |
| `refreshAccessToken()` | 刷新 Token |
| `initializeAuth()` | 完整初始化（restoreToken → fetchUserInfo → fetchUserApps → loadPermissions） |

### 类型导出

```typescript
import type { UserInfo, AppInstance, LoginParams, PermissionMenuItem } from 'moyan-mfw-base/frontend'
```

### 常量导出

```typescript
export { TOKEN_KEY, REFRESH_TOKEN_KEY, CURRENT_APP_KEY }
```

存储键名，业务层可用来自定义 Token 读取逻辑。

---

## `useLayoutStore`

布局状态管理。管理布局模式、主题、导航、标签页等。

```typescript
import { useLayoutStore } from 'moyan-mfw-base/frontend'

const layoutStore = useLayoutStore()
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `setLayoutMode(mode)` | 设置布局模式 |
| `setColorMode(mode)` | 设置颜色模式 |
| `setTheme(name)` | 设置主题包 |
| `toggleCompact()` | 切换紧凑模式 |
| `toggleSettingsPanel()` | 切换设置面板 |
| `patchStyleConfig(config)` | 部分更新布局样式 |
| `setNavigation(config)` | 设置导航配置 |
| `setLayoutExtensions(ext)` | 设置布局扩展组件 |
| `setLoginExtensions(ext)` | 设置登录扩展组件 |
| `syncActiveTopMenuByPath(path)` | 根据路径同步顶部菜单高亮 |
| `setActiveTopMenuKey(key)` | 设置顶部菜单高亮 |
| `closeTab(key)` | 关闭标签页 |
| `closeOtherTabs(key)` | 关闭其他标签页 |
| `closeAllTabs()` | 关闭所有标签页 |
| `closeTabsLeft(key)` | 关闭左侧标签页 |
| `closeTabsRight(key)` | 关闭右侧标签页 |
| `persistPreferences()` | 持久化偏好到 localStorage |
| `resetToDefaults()` | 重置为默认配置 |

---

## `useAppLoadingStore`

应用加载状态管理。

```typescript
import { useAppLoadingStore } from 'moyan-mfw-base/frontend'

const loadingStore = useAppLoadingStore()
```

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `isLoading` | `boolean` | 是否加载中 |
| `loadingText` | `string` | 加载文本 |
| `showLoading(text?)` | 方法 | 显示加载 |
| `hideLoading()` | 方法 | 隐藏加载 |
