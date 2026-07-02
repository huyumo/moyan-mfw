# 登录页 Composable 化设计

## 目标

将登录页逻辑与视图分离，框架使用者可通过注入自定义模板的方式替换登录页 UI，同时复用框架的登录编排能力。

## 设计决策摘要

| 决策点 | 选择 |
|--------|------|
| 注入方式 | `createBaseAdminApp({ loginComponent })` 一次性注入 |
| 旧扩展插槽 | 废弃 `loginExtensions`，相关代码全部移除 |
| Composable 暴露范围 | `formContext`（表单相关）+ `postLoginContext`（登录后编排）+ `isDark` |
| 生命周期 | composable 内部自动执行 `onMounted`，无需使用者调用 |
| Token 持久化 | `authStore.saveToken` 提升为 store action |
| 多应用选择 | composable 内部通过 `MfwPopup` 弹窗，不依赖模板渲染 |

## 整体架构

```
createBaseAdminApp({ loginComponent: MyLogin })
  └─ createBaseAdminRouter({ loginComponent })
       └─ routes: [{ path: '/login', component: loginComponent ?? 内置 index.vue }]

内置 index.vue ──┐
                  ├── useLoginPage() ──┐
自定义 MyLogin ───┘                    │
                              ┌────────┘
                              ├── formContext      (form, loading, rules, submit, formRef, usernameInputRef, passwordInputRef)
                              ├── postLoginContext (saveToken, handlePostLogin)
                              └── isDark

authStore
  ├── saveToken()          ← 新增 action
  ├── fetchUserInfo()      ← 已有
  ├── fetchUserApps()      ← 已有
  └── autoSelectApp()      ← 已有
```

## API 契约

### `useLoginPage()` 返回结构

```typescript
interface FormContext {
  form: LoginFormState            // { username: string; password: string }
  loading: Ref<boolean>
  rules: FormRules<LoginFormState> // 使用者可覆盖
  submit: () => Promise<void>      // 内置账密登录
  formRef: Ref<FormInstance>
  usernameInputRef: Ref<InputFocusInstance>
  passwordInputRef: Ref<InputFocusInstance>
}

interface PostLoginContext {
  saveToken: (token: string, refreshToken: string, expiresIn: number) => void
  handlePostLogin: () => Promise<void>
}

// composable 返回值
{
  formContext: FormContext
  postLoginContext: PostLoginContext
  isDark: ComputedRef<boolean>
}
```

### `handlePostLogin` 流程

```
handlePostLogin()
  ├─ await authStore.fetchUserInfo()
  ├─ await authStore.fetchUserApps()
  ├─ apps.length === 0 → router.replace(redirect) 直接跳转
  ├─ autoSelectApp() 成功 → router.replace(redirect)
  └─ 多个应用 → MfwPopup.open({ component: AppSelectorPanel })
       └─ 用户选择 → selectApp() → router.replace(homePath)
```

### 使用示例

```vue
<script setup lang="ts">
import { useLoginPage } from 'moyan-mfw-base/frontend'

const { formContext, postLoginContext, isDark } = useLoginPage()

// 自定义短信登录
async function handleSmsLogin() {
  formContext.loading.value = true
  try {
    const res = await apiSmsLogin({ phone: formContext.form.username, code: smsCode.value })
    postLoginContext.saveToken(res.token, res.refreshToken, res.expiresIn)
    await postLoginContext.handlePostLogin()
  } finally {
    formContext.loading.value = false
  }
}
</script>
```

### 框架入口

```typescript
createBaseAdminApp({
  loginComponent: () => import('./views/my-login.vue'),
  // 不传则使用内置 index.vue
})
```

## 文件改动清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `store/auth-store.ts` | 改 | `saveToken` 提升为 store action |
| `composables/use-login-page.ts` | **新建** | composable 主体 |
| `router/index.ts` | 改 | `CreateBaseAdminRouterOptions` 新增 `loginComponent` |
| `create-base-admin-app.ts` | 改 | 新增 `loginComponent`，移除 `loginExtensions` |
| `views/login/index.vue` | 改 | 重构为使用 composable，移除扩展插槽渲染 |
| `types/layout-types.ts` | 改 | 移除 `LoginExtensionComponents` 及其关联类型 |
| `store/layout-store.ts` | 改 | 移除 `loginExtensions` 状态、`setLoginExtensions` action |
| `store/layout-store-model.ts` | 改 | 移除 `loginExtensions` 字段 |
| `store/layout-store-preference-actions.ts` | 改 | 移除 `setLoginExtensions` 函数 |
| `composables/index.ts` | 改 | 导出 `useLoginPage` |
| `index.ts` | 改 | 确保 `useLoginPage` 可被外部导入 |

## 注意事项

1. **`layoutExtensions` 与 `loginExtensions` 独立** — 只移除后者，前者（布局扩展）不受影响。
2. **`markRaw` import 保留** — `setLayoutExtensions` 仍在使用 `markRaw`。
3. **无现有使用者** — `loginExtensions` 在项目内无调用方，移除无破坏性影响。
4. **类型检查** — 改动完成后必须运行 `pnpm typecheck:vue` 确认零错误。
5. **内置模板行为不变** — `index.vue` 重构后 UI 和交互逻辑完全一致。
