# 12 · 插件与工具

## 插件

```typescript
import { MoAxios, setupPlugins } from 'moyan-mfw-base/frontend'
```

| 导出 | 说明 |
|------|------|
| `MoAxios` | MFW API 请求适配器（基于 Axios），自动注入 JWT Token |
| `setupPlugins(app)` | 安装所有基础插件（ElementPlus + MoAxios） |

> `setupPlugins()` 由 `createBaseAdminApp()` 自动调用，业务层通常无需手动使用。

---

## 布局组件

框架提供两个可复用的内嵌组件：

```typescript
import { ProfilePanel, PasswordChangeForm } from 'moyan-mfw-base/frontend'
```

| 组件 | 说明 |
|------|------|
| `ProfilePanel` | 个人信息面板 |
| `PasswordChangeForm` | 修改密码表单 |

---

## 图片工具

```typescript
import { getImageSrc } from 'moyan-mfw-base/frontend'
```

### `getImageSrc(image)`

从图片资源中提取 URL 地址。兼容字符串、图片对象和 `undefined`。

```typescript
getImageSrc('https://example.com/avatar.png')  // → 'https://...'
getImageSrc({ src: '/img/a.png' })              // → '/img/a.png'
getImageSrc(undefined)                           // → undefined
```
