# 登录页 Composable 化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提取 `useLoginPage()` composable，支持框架使用者注入自定义登录页模板

**Architecture:** 从 `views/login/index.vue` 提取逻辑到 `composables/use-login-page.ts`，内置模板重构为使用 composable。`createBaseAdminApp` 新增 `loginComponent` 选项，废弃 `loginExtensions` 扩展机制。多应用选择改用 `MfwPopup` 弹窗。

**Tech Stack:** Vue 3 Composition API, Pinia, Element Plus, TypeScript

**Spec:** `docs/superpowers/specs/2026-07-02-login-page-composable-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `store/auth-store.ts` | 无需改动 | `saveToken` 已为 store action（第 538 行） |
| `composables/use-login-page.ts` | **新建** | composable 主体 |
| `composables/index.ts` | 改 | 新增导出 |
| `router/index.ts` | 改 | `CreateBaseAdminRouterOptions` 新增 `loginComponent` |
| `create-base-admin-app.ts` | 改 | 新增 `loginComponent`，移除 `loginExtensions` |
| `views/login/index.vue` | 改 | 重构为使用 composable |
| `views/login/login-page.scss` | 改 | 移除 `mfw-login-card--app` 样式（不再需要模板内应用选择） |
| `types/layout-types.ts` | 改 | 移除 `LoginExtensionComponents` |
| `store/layout-store.ts` | 改 | 移除 `loginExtensions` 状态和 action |
| `store/layout-store-model.ts` | 改 | 移除 `loginExtensions` 字段 |
| `store/layout-store-preference-actions.ts` | 改 | 移除 `setLoginExtensions` |
| `index.ts` | 改 | 确保 `useLoginPage` 可被外部导入 |

---

### Task 1: 新建 `composables/use-login-page.ts`

**Files:**
- Create: `packages/base/src/frontend/src/composables/use-login-page.ts`

- [ ] **Step 1: 创建 composable 文件，定义返回类型**

```typescript
// composables/use-login-page.ts
/**
 * @fileoverview 登录页逻辑 composable
 * @description 将登录页状态、登录编排、Token 持久化等逻辑提取为可复用单元
 */
```

- [ ] **Step 2: 实现 `formContext` 部分**

从 `views/login/index.vue` 的 `<script setup>` 提取以下内容到 composable：
- `form` (reactive), `loading` (ref), `rules` (FormRules)
- `formRef`, `usernameInputRef`, `passwordInputRef`
- `submit()` 函数 — 内置账密登录流程
- `lastSubmitAt` 防抖逻辑
- `focusFirstInvalidField` 辅助函数

注意：`submit()` 内部的 `authStore.login()` 已调用 `saveToken()`（第 178 行），登录成功后走 `handlePostLogin()` 编排。

- [ ] **Step 3: 实现 `postLoginContext` 部分**

```typescript
function saveToken(token: string, refreshToken: string, expiresIn: number) {
  authStore.saveToken(token, refreshToken, expiresIn)
}

async function handlePostLogin() {
  await authStore.fetchUserInfo()
  await authStore.fetchUserApps()
  ElMessage.success('登录成功')

  if (authStore.apps.length === 0) {
    layoutStore.setNavigation({ sideMenu: [] }, { clearTabs: true })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
    return
  }

  const autoSelected = await authStore.autoSelectApp()
  if (autoSelected) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
    return
  }

  // 多个应用 → MfwPopup 弹窗
  showAppSelectorPopup()
}
```

`showAppSelectorPopup()` 使用 `MfwPopup.open()` 打开 `AppSelectorPanel`，传入 `apps` 数据和选择回调。选择成功后调用 `authStore.selectApp()` → `router.replace(homePath)`。

- [ ] **Step 4: 实现 `isDark` 和生命周期**

```typescript
const { initColorMode, isDark } = useColorMode()
const { initTheme } = useThemeSwitch()

initColorMode()

onMounted(async () => {
  initTheme()

  // 已登录但尚未选择应用 → 展示选择弹窗
  if (authStore.isLoggedIn && authStore.needSelectApp) {
    if (authStore.apps.length === 0) {
      try { await authStore.fetchUserInfo(); await authStore.fetchUserApps() }
      catch { /* 回退到登录表单 */ }
    }
    if (authStore.apps.length > 0) {
      const autoSelected = await authStore.autoSelectApp()
      if (autoSelected) {
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
        await router.replace(redirect)
        return
      }
      showAppSelectorPopup()
      return
    }
  }

  void nextTick(() => { usernameInputRef.value?.focus() })
})
```

- [ ] **Step 5: 组装返回对象**

```typescript
return {
  formContext: {
    form,
    loading,
    rules,
    submit,
    formRef,
    usernameInputRef,
    passwordInputRef,
  },
  postLoginContext: {
    saveToken,
    handlePostLogin,
  },
  isDark,
}
```

- [ ] **Step 6: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 2: 导出 `useLoginPage`

**Files:**
- Modify: `packages/base/src/frontend/src/composables/index.ts`

- [ ] **Step 1: 新增导出行**

在现有导出后添加：

```typescript
export { useLoginPage } from './use-login-page'
```

- [ ] **Step 2: 确认 `index.ts` 顶层导出**

检查 `packages/base/src/frontend/src/index.ts` 是否已有 `export * from './composables'`，确保 `useLoginPage` 可通过 `moyan-mfw-base/frontend` 导入。

- [ ] **Step 3: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 3: 重构 `views/login/index.vue` 使用 composable

**Files:**
- Modify: `packages/base/src/frontend/src/views/login/index.vue`

- [ ] **Step 1: 重写 `<script setup>`**

替换整个 script 为：

```vue
<script setup lang="ts">
import { useLoginPage } from '../../composables/use-login-page'
import { useLayoutStore } from '../../store/layout-store'
import { ParticleBackground } from '../../components/display'

const layoutStore = useLayoutStore()
const {
  formContext: { form, loading, rules, submit, formRef, usernameInputRef, passwordInputRef },
  isDark,
} = useLoginPage()

const particleColor = computed(() => isDark.value ? 'rgba(255, 255, 255, 0.6)' : 'rgba(64, 158, 255, 0.6)')
const lineColor = computed(() => isDark.value ? 'rgba(255, 255, 255, 0.3)' : 'rgba(64, 158, 255, 0.3)')
</script>
```

移除所有 extension 相关代码（`methodsExtensionComponent`、`footerExtensionComponent`、`asyncExtensionCache` 等）。
移除 `selectingApp`、`loginApps`、`handleAppSelect` 相关代码。

- [ ] **Step 2: 精简 `<template>`**

移除扩展插槽渲染：
- 删除 `<div class="mfw-login-methods">` 及其内容
- 删除 `<div class="mfw-login-footer">` 及其内容

移除应用选择面板条件分支：
- 删除 `v-else` 分支中的 `<AppSelectorPanel>` 渲染
- 移除 `mfw-login-card--app` class 绑定

精简后的模板结构：

```vue
<template>
  <div class="mfw-login-page">
    <ParticleBackground ... />
    <div class="mfw-login-card">
      <div class="mfw-login-logo">...</div>
      <h1 class="mfw-login-title">...</h1>
      <el-form ref="formRef" :model="form" :rules="rules" ...>
        <el-form-item prop="username">...</el-form-item>
        <el-form-item prop="password">...</el-form-item>
        <el-form-item>
          <el-button ...>登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
```

- [ ] **Step 3: 清理 import**

在 `<script setup>` 中移除不再使用的 import：
- `defineAsyncComponent`, `markRaw` 来自 vue
- `useRoute`, `useRouter`（已在 composable 内部）
- `useAuthStore`, `AppInstance`（已在 composable 内部）
- `useColorMode`, `useThemeSwitch`（已在 composable 内部）
- `AppSelectorPanel`
- `AsyncExtensionComponent`, `ExtensionComponentInput`
- `FormRules`（已不需要）

保留：`computed`（用于 `particleColor`/`lineColor`）

- [ ] **Step 4: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 4: 清理 `login-page.scss`

**Files:**
- Modify: `packages/base/src/frontend/src/views/login/login-page.scss`

- [ ] **Step 1: 移除应用选择相关样式**

删除 `.mfw-login-card--app` 及其媒体查询：

```scss
// 删除这些规则
.mfw-login-card--app {
  width: 680px;
  max-width: 90vw;
}

@media (max-width: 480px) {
  .mfw-login-card--app {
    width: auto;
    max-width: none;
  }
}
```

保留 `.mfw-login-card` 和响应式规则。

- [ ] **Step 2: 移除 methods/footer 相关样式（可选）**

`.mfw-login-methods` 和 `.mfw-login-footer` 样式已无对应模板元素，可一并移除或保留（不影响功能）。

---

### Task 5: 修改 `router/index.ts` 支持 `loginComponent`

**Files:**
- Modify: `packages/base/src/frontend/src/router/index.ts`

- [ ] **Step 1: 新增 import**

```typescript
import type { Component } from 'vue'
```

- [ ] **Step 2: 在 `CreateBaseAdminRouterOptions` 中新增字段**

```typescript
export interface CreateBaseAdminRouterOptions {
  // ... 现有字段
  /** 自定义登录页组件 */
  loginComponent?: Component | (() => Promise<unknown>)
}
```

- [ ] **Step 3: 修改路由注册逻辑**

将第 97-106 行：

```typescript
{
  path: "/login",
  name: "AdminLogin",
  component: () => import("../views/login/index.vue"),
  meta: { title: "登录", menu: false },
},
```

改为：

```typescript
{
  path: "/login",
  name: "AdminLogin",
  component: options.loginComponent ?? (() => import("../views/login/index.vue")),
  meta: { title: "登录", menu: false },
},
```

- [ ] **Step 4: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 6: 修改 `create-base-admin-app.ts`

**Files:**
- Modify: `packages/base/src/frontend/src/create-base-admin-app.ts`

- [ ] **Step 1: 新增 `loginComponent` 选项，移除 `loginExtensions`**

在 `BaseAdminBootstrapOptions` 中（第 29-40 行）：

```typescript
export interface BaseAdminBootstrapOptions extends CreateBaseAdminRouterOptions {
  pinia?: Pinia
  layout?: Partial<LayoutStyleConfig>
  navigation?: Partial<AdminNavigationConfig>
  layoutExtensions?: LayoutExtensionComponents
  /** 自定义登录页组件 */
  loginComponent?: Component | (() => Promise<unknown>)
}
```

移除 `loginExtensions?: LoginExtensionComponents` 行。

- [ ] **Step 2: 移除 `LoginExtensionComponents` import**

删除第 11 行的 `LoginExtensionComponents` import。

- [ ] **Step 3: 移除 `setLoginExtensions` 调用**

删除第 91 行：

```typescript
layoutStore.setLoginExtensions(options.loginExtensions)
```

- [ ] **Step 4: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 7: 清理 `types/layout-types.ts`

**Files:**
- Modify: `packages/base/src/frontend/src/types/layout-types.ts`

- [ ] **Step 1: 移除 `LoginExtensionComponents`**

删除第 87-92 行：

```typescript
/** 登录页扩展组件配置。 */
export interface LoginExtensionComponents {
  methods?: ExtensionComponentInput;
  aside?: ExtensionComponentInput;
  footer?: ExtensionComponentInput;
}
```

- [ ] **Step 2: 检查关联类型**

`ExtensionComponentInput`（第 85 行）、`AsyncExtensionComponent`（第 79-82 行）、`AsyncExtensionLoader`（第 76 行）可能只被 `LoginExtensionComponents` 使用。检查是否有其他引用：

Run: `rg "ExtensionComponentInput|AsyncExtensionComponent|AsyncExtensionLoader" packages/base/src/frontend/src --type ts -l`

如果仅 `layout-types.ts` 和 `views/login/index.vue` 引用（后者即将重构移除），一并删除这些类型。

- [ ] **Step 3: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 8: 清理 `store/layout-store.ts`

**Files:**
- Modify: `packages/base/src/frontend/src/store/layout-store.ts`

- [ ] **Step 1: 移除 import**

删除第 14 行 `LoginExtensionComponents` import。
删除第 31 行 `setLoginExtensions` import。

- [ ] **Step 2: 移除 state 中的 `loginExtensions`**

删除第 74 行：

```typescript
loginExtensions: {},
```

- [ ] **Step 3: 移除 `setLoginExtensions` action**

删除第 126-128 行：

```typescript
setLoginExtensions(payload: LoginExtensionComponents = {}) {
  setLoginExtensions(this as unknown as LayoutPreferenceActionContext, payload);
},
```

- [ ] **Step 4: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 9: 清理 `store/layout-store-model.ts`

**Files:**
- Modify: `packages/base/src/frontend/src/store/layout-store-model.ts`

- [ ] **Step 1: 移除 import**

删除第 8 行 `LoginExtensionComponents` import。

- [ ] **Step 2: 移除 `LayoutState` 中的 `loginExtensions`**

删除第 61-62 行：

```typescript
/** 登录扩展组件 */
loginExtensions: LoginExtensionComponents;
```

- [ ] **Step 3: 移除 `LayoutPreferenceActionContext` 中的 `loginExtensions`**

删除第 97-98 行：

```typescript
/** 登录扩展组件 */
loginExtensions: LoginExtensionComponents;
```

- [ ] **Step 4: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 10: 清理 `store/layout-store-preference-actions.ts`

**Files:**
- Modify: `packages/base/src/frontend/src/store/layout-store-preference-actions.ts`

- [ ] **Step 1: 移除 import**

删除第 11 行 `LoginExtensionComponents` import。

- [ ] **Step 2: 移除 `setLoginExtensions` 函数**

删除第 149-158 行：

```typescript
/** 偏好操作实现。 */
export function setLoginExtensions(store: LayoutPreferenceActionContext, payload: LoginExtensionComponents = {}): void {
  const markedExtensions: LoginExtensionComponents = {};
  for (const [key, component] of Object.entries(payload)) {
    if (component) {
      markedExtensions[key as keyof LoginExtensionComponents] = markRaw(component);
    }
  }
  store.loginExtensions = markedExtensions;
}
```

- [ ] **Step 3: 确认 `markRaw` import 仍被使用**

`setLayoutExtensions` 在第 143 行使用 `markRaw`，确认 import 保留。

- [ ] **Step 4: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

---

### Task 11: 全局类型检查与验证

- [ ] **Step 1: 运行完整 Vue 类型检查**

Run: `pnpm typecheck:vue`
Expected: 零错误

- [ ] **Step 2: 检查是否有遗漏的 import/引用**

Run: `rg "loginExtensions|LoginExtensionComponents|setLoginExtensions|methodsExtensionComponent|footerExtensionComponent|ExtensionComponentInput|AsyncExtensionComponent" packages/base/src/frontend/src --type ts -n`

Expected: 仅在已删除的位置出现，无其他引用。

- [ ] **Step 3: 提交所有改动**

```bash
git add -A
git commit -m "feat: extract useLoginPage() composable, support custom login component"
```
