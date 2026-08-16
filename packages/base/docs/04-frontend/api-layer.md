# 前端 · API 调用层

## moyan-api 适配器

框架在 `setupPlugins` 中注册 `MoAxios`（axios 适配器），所有通过 `moyan-api` 的 ApiEntity 调用自动：

- 携带 `Authorization: Bearer <token>`（localStorage `TOKEN_KEY`）
- 携带 `X-App-Id` 请求头（当前选中应用，业务参数可覆盖）
- 401 时自动用 refreshToken 刷新并重试排队请求（并发刷新去重）
- 403 提示「您没有权限执行该操作」
- 401（刷新失败）清除凭证并跳转登录页
- GET + `fileName` 自动下载文件
- 业务错误自动 `ElMessage.error` 提示

## 使用 ApiEntity

```typescript
import { ApiCall } from 'moyan-api';

// 方式一：实例化 ApiEntity 并 await（框架推荐的业务 API 写法）
const result = await new ApiAuthLogin({
  body: { username: 'admin', password: 'Admin@123' },
});

// 方式二：ApiCall
await new ApiCall(new ApiAuthLogin({ body: {...} })).request();
```

## 独立工具函数

```typescript
import { getAccessToken, getCurrentAppId } from 'moyan-mfw-base/frontend';

const token = getAccessToken();       // localStorage 中的 token
const appId = getCurrentAppId();      // 当前选中应用 ID
```

## 自定义请求（业务侧）

```typescript
// 需要手动带 token 的 fetch 示例（demo/ledger-option-loaders.ts）
import { useAuthStore } from 'moyan-mfw-base/frontend';

const auth = useAuthStore();
const res = await fetch(`/api/demo/${path}`, {
  headers: { Authorization: `Bearer ${auth.token}` },
}).then((r) => r.json());
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 基础路径 | 空（同源） |
| `VITE_UPLOAD_TYPE` | 上传方式 `Form` / `Oss` | Form |
| `VITE_UPLOAD_FORM_URL` | 表单上传地址 | /api/upload-files |
| `VITE_OSS_ENDPOINT` / `VITE_OSS_BUCKET` / `VITE_OSS_DIR` | OSS 直传配置 | — |
| `VITE_AMAP_KEY` / `VITE_AMAP_SECURITY_CODE` | 高德地图凭证（`configureAmap`） | — |

## 高德地图配置

```typescript
import { configureAmap } from 'moyan-mfw-base/frontend';

configureAmap({
  key: import.meta.env.VITE_AMAP_KEY,
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
});
```
