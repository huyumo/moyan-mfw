# 深色模式重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除现有自定义主题系统，采用 Element Plus 标准实现深色模式和主题切换功能。

**Architecture:** 使用 VueUse useDark 实现颜色模式切换（手动 + 跟随系统），通过运行时 CSS 变量修改实现主题切换，主题包以 manifest.json 格式存储。

**Tech Stack:** Vue 3, TypeScript, Element Plus 2.x, VueUse, Pinia, SCSS

---

## Task 1: 创建类型定义文件

**Files:**
- Create: `packages/base-frontend/src/types/theme-types.ts`
- Create: `packages/base-frontend/src/types/color-mode-types.ts`

- [ ] **Step 1: 创建 theme-types.ts**

```typescript
export interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ThemePackage {
  name: string;
  label: string;
  colors: ThemeColors;
  description?: string;
  author?: string;
  version?: string;
}

export interface ThemeRegistry {
  [key: string]: ThemePackage;
}

export function isThemePackage(value: unknown): value is ThemePackage {
  if (typeof value !== 'object' || value === null) return false;
  const pkg = value as Record<string, unknown>;
  return (
    typeof pkg.name === 'string' &&
    typeof pkg.label === 'string' &&
    typeof pkg.colors === 'object'
  );
}
```

- [ ] **Step 2: 创建 color-mode-types.ts**

```typescript
export type ColorMode = 'light' | 'dark' | 'system';

export const COLOR_MODE_VALUES: ColorMode[] = ['light', 'dark', 'system'];

export function isColorMode(value: unknown): value is ColorMode {
  return typeof value === 'string' && COLOR_MODE_VALUES.includes(value as ColorMode);
}
```

- [ ] **Step 3: 验证类型定义**

Run: `pnpm --filter base-frontend typecheck`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add packages/base-frontend/src/types/theme-types.ts packages/base-frontend/src/types/color-mode-types.ts
git commit -m "feat(types): 添加主题和颜色模式类型定义"
```

---

## Task 2: 创建主题包目录和 manifest 文件

**Files:**
- Create: `packages/base-frontend/src/themes/packages/default/manifest.json`
- Create: `packages/base-frontend/src/themes/packages/ocean/manifest.json`
- Create: `packages/base-frontend/src/themes/packages/graphite/manifest.json`
- Create: `packages/base-frontend/src/themes/theme-registry.ts`
- Create: `packages/base-frontend/src/themes/index.ts`

- [ ] **Step 1: 创建 default 主题包 manifest.json**

```json
{
  "name": "default",
  "label": "默认蓝",
  "description": "Element Plus 默认主题色",
  "colors": {
    "primary": "#409eff",
    "success": "#67c23a",
    "warning": "#e6a23c",
    "danger": "#f56c6c",
    "info": "#909399"
  }
}
```

- [ ] **Step 2: 创建 ocean 主题包 manifest.json**

```json
{
  "name": "ocean",
  "label": "海洋绿",
  "description": "清新海洋绿色主题",
  "colors": {
    "primary": "#00a8cc",
    "success": "#52c41a",
    "warning": "#faad14",
    "danger": "#ff4d4f",
    "info": "#8c8c8c"
  }
}
```

- [ ] **Step 3: 创建 graphite 主题包 manifest.json**

```json
{
  "name": "graphite",
  "label": "石墨灰",
  "description": "专业石墨灰色主题",
  "colors": {
    "primary": "#5a5a5a",
    "success": "#4a9c6d",
    "warning": "#c9a227",
    "danger": "#c45656",
    "info": "#73767a"
  }
}
```

- [ ] **Step 4: 创建 theme-registry.ts**

```typescript
import defaultTheme from './packages/default/manifest.json';
import oceanTheme from './packages/ocean/manifest.json';
import graphiteTheme from './packages/graphite/manifest.json';

import type { ThemeRegistry } from '../types/theme-types';

export const themeRegistry: ThemeRegistry = {
  default: defaultTheme,
  ocean: oceanTheme,
  graphite: graphiteTheme,
};

export const defaultThemeKey = 'default';

export function getTheme(name: string) {
  return themeRegistry[name] || themeRegistry[defaultThemeKey];
}

export function getAvailableThemes() {
  return Object.values(themeRegistry);
}
```

- [ ] **Step 5: 创建 themes/index.ts**

```typescript
export * from './theme-registry';
```

- [ ] **Step 6: 验证主题包**

Run: `pnpm --filter base-frontend typecheck`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add packages/base-frontend/src/themes/
git commit -m "feat(themes): 添加主题包目录和注册表"
```

---

## Task 3: 创建组合式函数

**Files:**
- Create: `packages/base-frontend/src/composables/use-color-mode.ts`
- Create: `packages/base-frontend/src/composables/use-theme-switch.ts`
- Create: `packages/base-frontend/src/composables/index.ts`

- [ ] **Step 1: 检查 VueUse 是否已安装**

Run: `pnpm --filter base-frontend list @vueuse/core`
Expected: 显示已安装版本，或需要安装

如果未安装：
```bash
pnpm --filter base-frontend add @vueuse/core
```

- [ ] **Step 2: 创建 use-color-mode.ts**

```typescript
import { useDark, usePreferredDark, useToggle } from '@vueuse/core';
import { watch, computed } from 'vue';
import { useLayoutStore } from '../store/layout-store';
import type { ColorMode } from '../types/color-mode-types';

export function useColorMode() {
  const layoutStore = useLayoutStore();

  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
  });

  const prefersDark = usePreferredDark();

  const toggleDark = useToggle(isDark);

  const colorMode = computed<ColorMode>(() => layoutStore.styleConfig.colorMode);

  const setColorMode = (mode: ColorMode) => {
    layoutStore.styleConfig.colorMode = mode;

    if (mode === 'system') {
      isDark.value = prefersDark.value;
    } else if (mode === 'dark') {
      isDark.value = true;
    } else {
      isDark.value = false;
    }
  };

  watch(prefersDark, (newValue) => {
    if (layoutStore.styleConfig.colorMode === 'system') {
      isDark.value = newValue;
    }
  });

  const initColorMode = () => {
    const savedMode = layoutStore.styleConfig.colorMode;
    setColorMode(savedMode);
  };

  return {
    isDark,
    prefersDark,
    colorMode,
    toggleDark,
    setColorMode,
    initColorMode,
  };
}
```

- [ ] **Step 3: 创建 use-theme-switch.ts**

```typescript
import { computed } from 'vue';
import { useLayoutStore } from '../store/layout-store';
import { themeRegistry, defaultThemeKey, getTheme, getAvailableThemes } from '../themes';
import type { ThemeColors } from '../types/theme-types';

export function useThemeSwitch() {
  const layoutStore = useLayoutStore();

  const setTheme = (themeName: string) => {
    const theme = getTheme(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }

    layoutStore.styleConfig.themePackage = themeName;
    applyThemeColors(theme.colors);
  };

  const applyThemeColors = (colors: ThemeColors) => {
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--el-color-${key}`, value);
    });
  };

  const currentTheme = computed(() => {
    const name = layoutStore.styleConfig.themePackage;
    return getTheme(name);
  });

  const availableThemes = computed(() => getAvailableThemes());

  const initTheme = () => {
    const savedTheme = layoutStore.styleConfig.themePackage;
    setTheme(savedTheme);
  };

  return {
    setTheme,
    currentTheme,
    availableThemes,
    initTheme,
  };
}
```

- [ ] **Step 4: 创建 composables/index.ts**

```typescript
export { useColorMode } from './use-color-mode';
export { useThemeSwitch } from './use-theme-switch';
```

- [ ] **Step 5: 验证组合式函数**

Run: `pnpm --filter base-frontend typecheck`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/base-frontend/src/composables/
git commit -m "feat(composables): 添加颜色模式和主题切换组合式函数"
```

---

## Task 4: 修改状态管理

**Files:**
- Modify: `packages/base-frontend/src/types/layout-types.ts`
- Modify: `packages/base-frontend/src/store/layout-store-model.ts`
- Modify: `packages/base-frontend/src/store/layout-store.ts`
- Modify: `packages/base-frontend/src/store/layout-store-preference-actions.ts`
- Modify: `packages/base-frontend/src/config/layout-defaults.ts`

- [ ] **Step 1: 修改 layout-types.ts，添加 colorMode 和 themePackage**

在 `LayoutStyleConfig` 接口中添加：
```typescript
import type { ColorMode } from './color-mode-types';

export interface LayoutStyleConfig {
  layoutMode: LayoutMode;
  sidebarWidth: number;
  headerHeight: number;
  contentMaxWidth: number;
  compact: boolean;
  fixedHeader: boolean;
  showBreadcrumb: boolean;
  showTabs: boolean;
  cardRadius: number;
  colorMode: ColorMode;
  themePackage: string;
}
```

- [ ] **Step 2: 修改 layout-store-model.ts，添加 colorMode 和 themePackage 默认值**

在 `styleConfig` 中添加：
```typescript
styleConfig: {
  layoutMode: 'sidebar',
  sidebarWidth: 220,
  headerHeight: 56,
  contentMaxWidth: 1200,
  compact: false,
  fixedHeader: true,
  showBreadcrumb: true,
  showTabs: true,
  cardRadius: 8,
  colorMode: 'system',
  themePackage: 'default',
},
```

- [ ] **Step 3: 修改 layout-store.ts，移除 themes 和 activeThemeTokens**

移除以下内容：
- `themes` 状态
- `activeThemeKey` 状态
- `activeThemeTokens` getter
- `setDarkMode` action（已移除）

- [ ] **Step 4: 修改 layout-store-preference-actions.ts，添加 setColorMode**

添加：
```typescript
export function setColorMode(this: LayoutStore, mode: ColorMode) {
  this.styleConfig.colorMode = mode;
}
```

- [ ] **Step 5: 修改 layout-defaults.ts，移除主题定义**

移除：
- `auroraLight`, `auroraDark`, `oceanLight`, `oceanDark`, `graphiteLight`, `graphiteDark` 常量
- `createPalette` 函数
- `defaultThemeRegistry` 对象
- `defaultThemeKey` 常量

保留：
- `defaultLayoutStyleConfig`（添加 colorMode 和 themePackage）

- [ ] **Step 6: 验证状态管理**

Run: `pnpm --filter base-frontend typecheck`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add packages/base-frontend/src/types/layout-types.ts packages/base-frontend/src/store/ packages/base-frontend/src/config/layout-defaults.ts
git commit -m "feat(store): 添加 colorMode 和 themePackage 状态，移除旧主题系统"
```

---

## Task 5: 创建样式文件

**Files:**
- Create: `packages/base-frontend/src/styles/dark/css-vars.scss`
- Create: `packages/base-frontend/src/styles/theme-card.scss`
- Modify: `packages/base-frontend/src/main.ts`

- [ ] **Step 1: 创建 dark/css-vars.scss**

```scss
html.dark {
  --el-bg-color: #1a1a2e;
  --el-bg-color-page: #16213e;
  --el-bg-color-overlay: #0f3460;

  --el-text-color-primary: #e2e8f0;
  --el-text-color-regular: #cbd5e1;
  --el-text-color-secondary: #94a3b8;
  --el-text-color-placeholder: #64748b;
  --el-text-color-disabled: #475569;

  --el-border-color: #334155;
  --el-border-color-light: #475569;
  --el-border-color-lighter: #64748b;
  --el-border-color-extra-light: #1e293b;
  --el-border-color-dark: #1e293b;
  --el-border-color-darker: #0f172a;

  --el-fill-color: #1e293b;
  --el-fill-color-light: #334155;
  --el-fill-color-lighter: #475569;
  --el-fill-color-extra-light: #64748b;
  --el-fill-color-dark: #0f172a;
  --el-fill-color-darker: #020617;
  --el-fill-color-blank: #1e293b;

  --el-box-shadow: 0px 12px 32px 4px rgba(0, 0, 0, 0.36), 0px 8px 20px rgba(0, 0, 0, 0.72);
  --el-box-shadow-light: 0px 0px 12px rgba(0, 0, 0, 0.72);
  --el-box-shadow-lighter: 0px 0px 6px rgba(0, 0, 0, 0.72);
  --el-box-shadow-dark: 0px 16px 48px 16px rgba(0, 0, 0, 0.72), 0px 12px 32px rgba(0, 0, 0, 0.56), 0px 8px 16px -8px rgba(0, 0, 0, 0.72);

  --el-mask-color: rgba(0, 0, 0, 0.8);
  --el-mask-color-extra-light: rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 2: 创建 theme-card.scss**

```scss
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background-color: var(--el-fill-color-light);
  }

  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.theme-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-card-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
```

- [ ] **Step 3: 修改 main.ts，导入暗黑模式 CSS**

在导入 Element Plus 样式之后添加：
```typescript
import 'element-plus/theme-chalk/dark/css-vars.css';
import './styles/dark/css-vars.scss';
```

- [ ] **Step 4: 验证样式文件**

Run: `pnpm --filter base-frontend build`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add packages/base-frontend/src/styles/dark/ packages/base-frontend/src/styles/theme-card.scss packages/base-frontend/src/main.ts
git commit -m "feat(styles): 添加暗黑模式 CSS 变量和主题卡片样式"
```

---

## Task 6: 修改布局样式系统

**Files:**
- Modify: `packages/base-frontend/src/styles/base-admin/tokens-and-reset.scss`
- Modify: `packages/base-frontend/src/styles/base-admin/content-and-overrides.scss`
- Modify: `packages/base-frontend/src/layouts/composables/use-admin-layout.ts`

- [ ] **Step 1: 修改 tokens-and-reset.scss，移除 --mfw-* 变量映射**

移除以下内容：
```scss
// 移除这些映射
--el-color-primary: var(--mfw-primary-color, #2f6ef6);
--el-bg-color: var(--mfw-surface-bg, #ffffff);
--el-bg-color-page: var(--mfw-app-bg, #f3f6fb);
--el-text-color-primary: var(--mfw-text-color, #1f2a37);
--el-border-color: var(--mfw-border-color, #dcdfe6);
// ... 其他 --mfw-* 映射
```

保留 Element Plus 默认变量覆盖（如果有自定义需求）。

- [ ] **Step 2: 修改 content-and-overrides.scss，移除 .is-dark 样式**

移除以下内容：
```scss
// 移除这些样式
.mfw-admin-shell.is-dark {
  --mfw-menu-text-color: #e2e8f0;
  --mfw-menu-bg: transparent;
  // ...
}
```

深色模式样式现在由 `html.dark` 和 Element Plus 暗黑模式 CSS 处理。

- [ ] **Step 3: 修改 use-admin-layout.ts，移除 shellVars**

移除以下内容：
```typescript
// 移除 shellVars computed
const shellVars = computed<Record<string, string>>(() => ({
  '--mfw-app-bg': layoutStore.activeThemeTokens.appBackground,
  '--mfw-surface-bg': layoutStore.activeThemeTokens.surfaceBackground,
  // ...
}));

// 移除 shellClasses 中的 is-dark
const shellClasses = computed(() => ({
  'is-compact': layoutStore.styleConfig.compact && layoutStore.showSidebar,
  // 移除 'is-dark': layoutStore.styleConfig.isDark
}));
```

- [ ] **Step 4: 修改 AdminLayout.vue，移除 shellVars 绑定**

移除：
```vue
<!-- 移除 :style 绑定 -->
<div class="mfw-admin-shell" :class="shellClasses" :style="shellVars">
```

改为：
```vue
<div class="mfw-admin-shell" :class="shellClasses">
```

- [ ] **Step 5: 验证布局样式**

Run: `pnpm --filter base-frontend build`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/base-frontend/src/styles/base-admin/ packages/base-frontend/src/layouts/
git commit -m "refactor(styles): 移除自定义主题变量映射，改用 Element Plus 标准"
```

---

## Task 7: 修改 UI 组件

**Files:**
- Modify: `packages/base-frontend/src/layouts/panels/SettingsPanel.vue`
- Modify: `packages/base-frontend/src/layouts/panels/HeaderPanel.vue`
- Modify: `packages/base-frontend/src/layouts/AdminLayout.vue`

- [ ] **Step 1: 修改 SettingsPanel.vue，添加深色模式和主题切换 UI**

在外观标签页中添加：
```vue
<template>
  <el-tab-pane label="外观" name="appearance">
    <!-- 主题选择 -->
    <div class="setting-group">
      <div class="setting-label">主题</div>
      <div class="theme-grid">
        <div
          v-for="theme in availableThemes"
          :key="theme.name"
          class="theme-card"
          :class="{ active: currentTheme.name === theme.name }"
          @click="setTheme(theme.name)"
        >
          <div class="theme-preview" :style="{ background: theme.colors.primary }"></div>
          <span class="theme-card-label">{{ theme.label }}</span>
        </div>
      </div>
    </div>

    <!-- 深色模式 -->
    <div class="setting-group">
      <div class="setting-row">
        <span class="setting-label">深色模式</span>
        <el-switch v-model="isDark" @change="onDarkChange" />
      </div>
    </div>

    <!-- 跟随系统 -->
    <div class="setting-group" v-if="colorMode !== 'system'">
      <div class="setting-row">
        <span class="setting-label">跟随系统</span>
        <el-switch
          :model-value="colorMode === 'system'"
          @change="toggleFollowSystem"
        />
      </div>
    </div>
  </el-tab-pane>
</template>

<script setup lang="ts">
import { useColorMode, useThemeSwitch } from '../../composables';

const { isDark, colorMode, setColorMode } = useColorMode();
const { setTheme, currentTheme, availableThemes } = useThemeSwitch();

const onDarkChange = (value: boolean) => {
  if (colorMode.value === 'system') {
    setColorMode(value ? 'dark' : 'light');
  }
};

const toggleFollowSystem = (value: boolean) => {
  if (value) {
    setColorMode('system');
  } else {
    setColorMode(isDark.value ? 'dark' : 'light');
  }
};
</script>

<style scoped lang="scss">
@import '../../styles/theme-card.scss';
</style>
```

- [ ] **Step 2: 修改 HeaderPanel.vue，添加深色模式切换按钮**

添加：
```vue
<template>
  <div class="header-actions">
    <!-- 深色模式切换按钮 -->
    <el-button
      :icon="isDark ? Sunny : Moon"
      circle
      @click="toggleDark()"
    />
  </div>
</template>

<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue';
import { useColorMode } from '../../composables';

const { isDark, toggleDark } = useColorMode();
</script>
```

- [ ] **Step 3: 修改 AdminLayout.vue，初始化颜色模式和主题**

添加初始化逻辑：
```vue
<script setup lang="ts">
import { useColorMode, useThemeSwitch } from '../composables';

const { initColorMode } = useColorMode();
const { initTheme } = useThemeSwitch();

onMounted(() => {
  initColorMode();
  initTheme();
});
</script>
```

- [ ] **Step 4: 验证 UI 组件**

Run: `pnpm --filter base-frontend build`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add packages/base-frontend/src/layouts/panels/ packages/base-frontend/src/layouts/AdminLayout.vue
git commit -m "feat(ui): 添加深色模式和主题切换 UI"
```

---

## Task 8: 删除旧代码

**Files:**
- Delete: `packages/base-frontend/src/types/layout-theme-types.ts`

- [ ] **Step 1: 删除 layout-theme-types.ts**

```bash
rm packages/base-frontend/src/types/layout-theme-types.ts
```

- [ ] **Step 2: 更新 layouts/index.ts，移除相关导出**

如果有导出 `layout-theme-types`，移除：
```typescript
// 移除
export * from './types/layout-theme-types';
```

- [ ] **Step 3: 验证删除**

Run: `pnpm --filter base-frontend typecheck`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "refactor: 删除旧主题类型定义文件"
```

---

## Task 9: 更新测试文件

**Files:**
- Modify: `packages/base-frontend/src/layouts/panels/settings-panel-spec.ts`
- Modify: `packages/base-frontend/src/layouts/admin-layout-spec.ts`

- [ ] **Step 1: 更新 settings-panel-spec.ts mock 数据**

更新 `styleConfig` mock：
```typescript
const mockLayoutStore = {
  styleConfig: {
    layoutMode: 'sidebar',
    sidebarWidth: 220,
    headerHeight: 56,
    contentMaxWidth: 1200,
    compact: false,
    fixedHeader: true,
    showBreadcrumb: true,
    showTabs: true,
    cardRadius: 8,
    colorMode: 'system',
    themePackage: 'default',
  },
};
```

- [ ] **Step 2: 更新 admin-layout-spec.ts mock 数据**

更新相关 mock：
```typescript
const mockLayoutStore = {
  styleConfig: {
    // ... 同上
    colorMode: 'system',
    themePackage: 'default',
  },
  // 移除 themes, activeThemeKey, activeThemeTokens
};
```

- [ ] **Step 3: 验证测试**

Run: `pnpm --filter base-frontend test`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add packages/base-frontend/src/layouts/panels/settings-panel-spec.ts packages/base-frontend/src/layouts/admin-layout-spec.ts
git commit -m "test: 更新测试 mock 数据"
```

---

## Task 10: 最终验证和构建

**Files:**
- None (验证步骤)

- [ ] **Step 1: 运行类型检查**

Run: `pnpm --filter base-frontend typecheck`
Expected: PASS

- [ ] **Step 2: 运行测试**

Run: `pnpm --filter base-frontend test`
Expected: PASS

- [ ] **Step 3: 运行构建**

Run: `pnpm --filter base-frontend build`
Expected: PASS

- [ ] **Step 4: 运行 lint**

Run: `pnpm --filter base-frontend lint`
Expected: PASS

- [ ] **Step 5: 手动测试**

启动开发服务器：
```bash
pnpm --filter base-frontend dev
```

验证：
- 深色模式切换按钮正常工作
- 设置面板深色模式开关正常工作
- 跟随系统开关正常工作
- 主题选择卡片正常工作
- 深色模式下所有组件样式正确
- 主题切换后所有颜色正确
- 页面刷新后状态恢复正确

- [ ] **Step 6: 最终提交**

```bash
git add -A
git commit -m "feat: 完成深色模式重构"
```

---

## 依赖检查

- [ ] **确认 VueUse 已安装**

```bash
pnpm --filter base-frontend list @vueuse/core
```

如果未安装：
```bash
pnpm --filter base-frontend add @vueuse/core
```

---

## 风险和注意事项

1. **样式兼容性**：现有自定义样式可能与 Element Plus 暗黑模式冲突，需要逐一检查和调整
2. **状态持久化**：需要确保 colorMode 和 themePackage 状态正确持久化
3. **业务代码兼容**：业务层可能引用了旧的 theme API，需要检查并更新
4. **VueUse 依赖**：需要确保项目已安装 VueUse