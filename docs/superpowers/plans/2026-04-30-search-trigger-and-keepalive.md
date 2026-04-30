# 搜索触发模式 & 页面缓存全局开关 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在偏好设置中新增全局搜索触发模式和页面缓存开关，移除页面级 keepAlive 配置

**Architecture:** 在 LayoutStyleConfig 中新增 `searchTrigger` 和 `keepAlive` 字段，复用现有草稿-预览-保存机制。SearchPanel/ListPage 读取全局偏好作为默认值，页面级 prop 可覆盖。Layout 层根据全局 keepAlive 开关决定是否渲染 `<keep-alive>`。

**Tech Stack:** Vue 3, Pinia, Element Plus, TypeScript

---

### Task 1: 扩展 LayoutStyleConfig 类型

**Files:**
- Modify: `packages/base-frontend/src/types/layout-types.ts:13-25`

- [ ] **Step 1: 在 LayoutStyleConfig 中新增 searchTrigger 和 keepAlive 字段**

在 `layout-types.ts` 的 `LayoutStyleConfig` 接口中，在 `themePackage` 字段后新增两个字段：

```typescript
export interface LayoutStyleConfig {
  layoutMode: LayoutMode;
  sidebarWidth: number;
  headerHeight: number;
  contentMaxWidth: number;
  compact: boolean;
  fixedHeader: boolean;
  showTabs: boolean;
  cardRadius: number;
  buttonRadius: number;
  colorMode: ColorMode;
  themePackage: string;
  searchTrigger: 'change' | 'submit';
  keepAlive: boolean;
}
```

---

### Task 2: 更新默认值

**Files:**
- Modify: `packages/base-frontend/src/config/layout-defaults.ts:11-23`

- [ ] **Step 1: 在 defaultLayoutStyleConfig 中新增默认值**

在 `layout-defaults.ts` 的 `defaultLayoutStyleConfig` 中，在 `themePackage: 'default'` 后新增：

```typescript
export const defaultLayoutStyleConfig: LayoutStyleConfig = {
  // ...existing fields...
  themePackage: 'default',
  searchTrigger: 'change',
  keepAlive: true,
};
```

---

### Task 3: 移除 PageConfig.keepAlive 和 RouteMeta.keepAlive

**Files:**
- Modify: `packages/base-frontend/src/router/routes.ts:41-64` (移除 PageConfig.keepAlive)
- Modify: `packages/base-frontend/src/router/routes.ts:156-170` (移除 meta 中 keepAlive 赋值)
- Modify: `packages/base-frontend/src/types/router-meta.d.ts:29` (移除 RouteMeta.keepAlive)

- [ ] **Step 1: 移除 PageConfig 接口中的 keepAlive 属性**

在 `routes.ts` 第 60-61 行，移除：

```typescript
// 移除这两行
  /** 是否缓存页面组件（keep-alive） */
  keepAlive?: boolean;
```

- [ ] **Step 2: 移除 buildRoutesFromConfigs 中 meta.keepAlive 赋值**

在 `routes.ts` 第 168 行，移除 `keepAlive: config.keepAlive,`：

```typescript
const route: RouteRecordRaw = {
  path: routePath,
  name: `Route_${segments.join('_')}` || 'Root',
  component: config.page as RouteRecordRaw['component'],
  meta: {
    title: config.name,
    menuLabel: config.name,
    menuIcon: config.icon,
    menuOrder: config.order ?? 50,
    requiresAuth: config.auth ?? true,
    hidden: config.hidden,
    permissionValue: config.permissionValue?.toString(),
    // keepAlive 已移除
  },
} as RouteRecordRaw;
```

- [ ] **Step 3: 移除 RouteMeta.keepAlive 声明**

在 `router-meta.d.ts` 第 28-29 行，移除：

```typescript
// 移除这两行
    /** 是否缓存页面 */
    keepAlive?: boolean;
```

---

### Task 4: 移除 5 个 sys 页面配置中的 keepAlive

**Files:**
- Modify: `packages/base-frontend/src/views/sys/app/index.ts`
- Modify: `packages/base-frontend/src/views/sys/app-type/index.ts`
- Modify: `packages/base-frontend/src/views/sys/audit-log/index.ts`
- Modify: `packages/base-frontend/src/views/sys/role/index.ts`
- Modify: `packages/base-frontend/src/views/sys/user/index.ts`

- [ ] **Step 1: 从每个文件中移除 `keepAlive: true,` 行**

每个文件中均有 `keepAlive: true,`，直接删除该行即可。

---

### Task 5: 更新 AdminLayout.vue 的 keep-alive 控制

**Files:**
- Modify: `packages/base-frontend/src/layouts/AdminLayout.vue:36-42`

- [ ] **Step 1: 修改 router-view 区域，根据全局 keepAlive 开关条件渲染**

将 AdminLayout.vue 第 36-42 行：

```html
<router-view v-slot="{ Component, route: slotRoute }">
  <transition name="fade-transverse">
    <keep-alive :max="20">
      <component :is="Component" :key="slotRoute.name" />
    </keep-alive>
  </transition>
</router-view>
```

改为：

```html
<router-view v-slot="{ Component, route: slotRoute }">
  <transition name="fade-transverse">
    <keep-alive v-if="layoutStore.styleConfig.keepAlive" :max="20">
      <component :is="Component" :key="slotRoute.name" />
    </keep-alive>
    <component v-else :is="Component" :key="slotRoute.name" />
  </transition>
</router-view>
```

---

### Task 6: 更新 EmptyLayout.vue 的 keep-alive 控制

**Files:**
- Modify: `packages/base-frontend/src/layouts/EmptyLayout.vue`

- [ ] **Step 1: 重写 EmptyLayout，使用全局 keepAlive 开关**

将 EmptyLayout.vue 整体改为：

```vue
<template>
  <router-view v-slot="{ Component, route: viewRoute }">
    <keep-alive v-if="keepAliveEnabled" :max="20">
      <component :is="Component" :key="viewRoute.name" />
    </keep-alive>
    <component v-else :is="Component" :key="viewRoute.name" />
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLayoutStore } from '../store/layout-store';

defineOptions({ name: 'MfwEmptyLayout' });

const route = useRoute();
const layoutStore = useLayoutStore();

const keepAliveEnabled = computed(() => layoutStore.styleConfig.keepAlive);
</script>
```

注意：EmptyLayout 原来通过 `keepAliveInclude` + `:include` 精确控制，现在改为全局开关，移除了 `keepAliveInclude` 计算逻辑。

---

### Task 7: 更新 MfwListPage 的 searchTrigger 默认值

**Files:**
- Modify: `packages/base-frontend/src/components/page/list-page/index.tsx:68-71`

- [ ] **Step 1: 修改 searchTrigger prop 默认值并引入 layoutStore**

在 `list-page/index.tsx` 中：

1. 在顶部 import 区新增：
```typescript
import { useLayoutStore } from '../../../store/layout-store';
```

2. 将 searchTrigger prop 的默认值从 `'submit'` 改为 `undefined`：

```typescript
searchTrigger: {
  type: String as PropType<MfwListPageProps['searchTrigger']>,
  default: undefined
},
```

3. 在 setup 函数开头新增：
```typescript
const layoutStore = useLayoutStore();
const resolvedSearchTrigger = computed(() => props.searchTrigger ?? layoutStore.styleConfig.searchTrigger);
```

4. 将模板中传递给 MfwSearchPanel 的 `searchTrigger: props.searchTrigger` 改为 `searchTrigger: resolvedSearchTrigger.value`

---

### Task 8: 更新 MfwCardListPage 的 searchTrigger 默认值

**Files:**
- Modify: `packages/base-frontend/src/components/page/card-list-page/index.tsx:40-43`

- [ ] **Step 1: 修改 searchTrigger prop 默认值并引入 layoutStore**

在 `card-list-page/index.tsx` 中：

1. 在顶部 import 区新增：
```typescript
import { useLayoutStore } from '../../../store/layout-store';
```

2. 将 searchTrigger prop 的默认值从 `'change'` 改为 `undefined`：

```typescript
searchTrigger: {
  type: String as PropType<'change' | 'submit'>,
  default: undefined
},
```

3. 在 setup 函数中新增：
```typescript
const layoutStore = useLayoutStore();
const resolvedSearchTrigger = computed(() => props.searchTrigger ?? layoutStore.styleConfig.searchTrigger);
```

4. 将 JSX 中传递给 MfwSearchPanel 的 `searchTrigger={props.searchTrigger}` 改为 `searchTrigger={resolvedSearchTrigger.value}`

---

### Task 9: 新增设置面板文案

**Files:**
- Modify: `packages/base-frontend/src/layouts/panels/settings-panel-text.ts`

- [ ] **Step 1: 在 settingsPanelText 中新增文案**

在 `settings-panel-text.ts` 的 `settingsPanelText` 对象中新增：

```typescript
export const settingsPanelText = {
  // ...existing fields...
  searchTrigger: '搜索触发模式',
  searchTriggerChange: '即时查询',
  searchTriggerSubmit: '手动查询',
  pageCache: '页面缓存',
} as const;
```

---

### Task 10: 更新 SettingsPanel.vue 通用 Tab

**Files:**
- Modify: `packages/base-frontend/src/layouts/panels/SettingsPanel.vue:92-112`

- [ ] **Step 1: 在通用 Tab 的功能开关区域新增搜索触发模式和页面缓存控件**

在 SettingsPanel.vue 的 `<el-tab-pane :label="text.general" name="general">` 中，在 `fixedHeader` switch-item 之后，新增：

```html
<div class="mfw-admin-switch-item">
  <span class="mfw-admin-switch-label">{{ text.searchTrigger }}</span>
  <el-radio-group v-model="draftStyleConfig.searchTrigger" size="small">
    <el-radio-button value="change">{{ text.searchTriggerChange }}</el-radio-button>
    <el-radio-button value="submit">{{ text.searchTriggerSubmit }}</el-radio-button>
  </el-radio-group>
</div>
<div class="mfw-admin-switch-item">
  <span class="mfw-admin-switch-label">{{ text.pageCache }}</span>
  <el-switch v-model="draftStyleConfig.keepAlive" />
</div>
```

---

### Task 11: 验证构建

- [ ] **Step 1: 运行 TypeScript 类型检查**

```bash
cd packages/base-frontend && npx vue-tsc --noEmit
```

预期：无类型错误

- [ ] **Step 2: 运行开发服务器，手动验证**

1. 打开偏好设置面板，确认"通用"Tab 下新增了搜索触发模式和页面缓存控件
2. 切换搜索触发模式为"手动查询"，进入一个列表页面，确认搜索面板不再即时触发
3. 切换搜索触发模式为"即时查询"，确认表单变化时自动触发搜索
4. 关闭页面缓存开关，导航到其他页面再返回，确认页面状态未保留
5. 开启页面缓存开关，导航到其他页面再返回，确认页面状态已保留
