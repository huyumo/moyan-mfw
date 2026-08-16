# 前端 · Store

## `useAuthStore()` — 认证与权限

```typescript
import { useAuthStore } from 'moyan-mfw-base/frontend';

const auth = useAuthStore();

// 状态
auth.token;                 // 访问令牌
auth.user;                  // 用户信息 { id, username, nickname, avatar, isDeveloper, ... }
auth.apps;                  // 可访问应用列表
auth.currentApp;            // 当前选中应用
auth.permissionMenu;        // 权限菜单树
auth.permissionValueMap;    // permCode → 权限值（按钮权限用）
auth.devmodeEnabled;

// 计算属性
auth.isAuthenticated;       // token + user 均存在
auth.isLoggedIn;
auth.hasApps;
auth.needSelectApp;         // 多应用且未选择
auth.isDevModeActive;       // 开发者模式激活

// 方法
await auth.login({ username, password });
await auth.logout();
await auth.fetchUserInfo();
await auth.fetchUserApps();
await auth.selectApp(app);  // 选择应用（同步布局 store + 加载权限）
await auth.loadPermissions(appId);
await auth.initializeAuth();// 恢复 Token → 用户 → 应用 → 自动选择
await auth.enableDevMode(); // 开发者模式（含密码验证弹窗）
await auth.disableDevMode();
```

## `useLayoutStore()` — 布局与偏好

```typescript
import { useLayoutStore } from 'moyan-mfw-base/frontend';

const layout = useLayoutStore();

layout.styleConfig;                // 当前布局配置（LayoutStyleConfig）
layout.navigation;                 // 导航配置
layout.persistPreferences();       // 持久化偏好到 localStorage
layout.setNavigation({ sideMenu }, { clearTabs: true });
layout.setCurrentApp(app);         // 设置当前应用（顶部展示）
layout.setUserApps(apps);
layout.setLayoutExtensions(ext);   // 布局扩展组件
layout.patchStyleConfig(cfg);      // 局部更新布局配置
layout.syncActiveTopMenuByPath(path);
```

## `useAppLoadingStore()` — 全局加载态

```typescript
import { useAppLoadingStore } from 'moyan-mfw-base/frontend';

const loading = useAppLoadingStore();
loading.showLoading('正在初始化认证...');
loading.hideLoading();
```

## 存储键（storage-keys）

```typescript
import { TOKEN_KEY, REFRESH_TOKEN_KEY, CURRENT_APP_KEY, DEV_MODE_KEY } from 'moyan-mfw-base/frontend';
```

Token 等敏感信息存储在 localStorage；开发者模式标识在 sessionStorage。
