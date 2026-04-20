# 深色模式重构设计文档

## 概述

本文档描述 moyan-mfw 项目深色模式重构的设计方案。目标是移除现有的自定义主题系统，采用 Element Plus 标准实现深色模式和主题切换功能。

## 需求总结

| 需求项 | 选择 |
|--------|------|
| 触发方式 | 手动切换 + 跟随系统 |
| 应用范围 | 全局统一（Element Plus 标准） |
| 主题系统 | 简化为 EP 标准，移除现有多主题 |
| 主题包机制 | 本地插件 + 编译时合并 |
| 跟随系统实现 | VueUse useDark |
| 设置面板 UI | 开关切换 |

## 架构设计

### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        应用入口                              │
│  main.ts                                                    │
│  ├── 导入 EP 暗黑模式 CSS                                    │
│  ├── 导入主题包 CSS                                          │
│  └── 初始化 useDark                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     状态管理层                               │
│  layout-store.ts                                            │
│  ├── colorMode: 'light' | 'dark' | 'system'                 │
│  ├── themePackage: string (主题包名称)                       │
│  └── setColorMode() / setThemePackage()                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     组合式函数层                             │
│  use-color-mode.ts                                          │
│  ├── 基于 VueUse useDark                                    │
│  ├── 监听系统偏好 prefers-color-scheme                      │
│  └── 同步 HTML.dark 类名                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     主题包层                                 │
│  themes/packages/                                           │
│  ├── default/                                               │
│  │   ├── manifest.json (主题元数据)                          │
│  │   └── overrides.scss (可选的组件样式覆盖)                  │
│  ├── ocean/                                                 │
│  ├── graphite/                                              │
│  └─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     UI 层                                    │
│  SettingsPanel.vue                                          │
│  ├── 深色模式开关                                            │
│  ├── 跟随系统开关                                            │
│  └── 主题包选择                                              │
└─────────────────────────────────────────────────────────────┘
```

### 核心变化

- 移除 `ThemeTokens` / `ThemeTokenPalette` 类型系统
- 移除 `activeThemeTokens` getter 和 `shellVars` 动态注入
- 使用 Element Plus 标准 `html.dark` 类名切换
- 主题包通过运行时 CSS 变量修改实现切换

## 类型定义

### 主题包类型

```typescript
// types/theme-types.ts

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
```

### 颜色模式类型

```typescript
// types/color-mode-types.ts

export type ColorMode = 'light' | 'dark' | 'system';
```

### 布局配置类型（修改）

```typescript
// types/layout-types.ts

export interface LayoutStyleConfig {
  // 保留现有配置
  layoutMode: LayoutMode;
  sidebarWidth: number;
  headerHeight: number;
  contentMaxWidth: number;
  compact: boolean;
  fixedHeader: boolean;
  showBreadcrumb: boolean;
  showTabs: boolean;
  cardRadius: number;
  
  // 新增颜色模式配置
  colorMode: ColorMode;
  themePackage: string;
}
```

## 组合式函数设计

### useColorMode

```typescript
// composables/use-color-mode.ts

import { useDark, usePreferredDark, useToggle } from '@vueuse/core';
import { watch, computed } from 'vue';
import { useLayoutStore } from '@/store/layout-store';
import type { ColorMode } from '@/types/color-mode-types';

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
    colorMode: computed(() => layoutStore.styleConfig.colorMode),
    toggleDark,
    setColorMode,
    initColorMode,
  };
}
```

### useThemeSwitch

```typescript
// composables/use-theme-switch.ts

import { computed } from 'vue';
import { useLayoutStore } from '@/store/layout-store';
import { themeRegistry } from '@/themes/theme-registry';
import type { ThemeColors } from '@/types/theme-types';

export function useThemeSwitch() {
  const layoutStore = useLayoutStore();
  
  const setTheme = (themeName: string) => {
    const theme = themeRegistry[themeName];
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
    return themeRegistry[name] || themeRegistry.default;
  });
  
  const availableThemes = computed(() => Object.values(themeRegistry));
  
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

## 主题包结构

### 目录结构

```
themes/
├── packages/
│   ├── default/
│   │   ├── manifest.json
│   │   └── overrides.scss (可选)
│   ├── ocean/
│   │   ├── manifest.json
│   │   └── overrides.scss
│   └── graphite/
│       ├── manifest.json
│       └── overrides.scss
├── theme-registry.ts (编译时生成)
└── index.ts
```

### manifest.json 示例

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

### 主题注册表

```typescript
// themes/theme-registry.ts

import defaultTheme from './packages/default/manifest.json';
import oceanTheme from './packages/ocean/manifest.json';
import graphiteTheme from './packages/graphite/manifest.json';

import type { ThemeRegistry } from '@/types/theme-types';

export const themeRegistry: ThemeRegistry = {
  default: defaultTheme,
  ocean: oceanTheme,
  graphite: graphiteTheme,
};
```

## 样式系统

### 导入 Element Plus 暗黑模式 CSS

```typescript
// main.ts
import 'element-plus/theme-chalk/dark/css-vars.css';
```

### 自定义暗黑模式变量覆盖

```scss
// styles/dark/css-vars.scss
html.dark {
  --el-bg-color: #1a1a2e;
  --el-bg-color-page: #16213e;
  --el-bg-color-overlay: #0f3460;
  
  --el-text-color-primary: #e2e8f0;
  --el-text-color-regular: #cbd5e1;
  --el-text-color-secondary: #94a3b8;
  
  --el-border-color: #334155;
  --el-border-color-light: #475569;
  --el-border-color-lighter: #64748b;
  
  --el-fill-color: #1e293b;
  --el-fill-color-light: #334155;
  --el-fill-color-lighter: #475569;
}
```

## UI 设计

### SettingsPanel 深色模式 UI

```vue
<!-- SettingsPanel.vue -->
<template>
  <el-drawer v-model="visible" title="偏好设置" size="320px">
    <el-tabs v-model="activeTab">
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
              <span>{{ theme.label }}</span>
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
      
      <el-tab-pane label="布局" name="layout">
        <!-- 现有布局配置 -->
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup lang="ts">
import { useColorMode, useThemeSwitch } from '@/composables';

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
```

### HeaderPanel 深色模式快捷按钮

```vue
<!-- HeaderPanel.vue -->
<template>
  <div class="header-actions">
    <el-button
      :icon="isDark ? Sunny : Moon"
      circle
      @click="toggleDark()"
    />
  </div>
</template>

<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue';
import { useColorMode } from '@/composables';

const { isDark, toggleDark } = useColorMode();
</script>
```

## 需要移除的代码

### 类型定义文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/layout-theme-types.ts` | 删除 | ThemeTokens、ThemeTokenPalette、ThemeTokenInput 类型 |
| `src/types/layout-types.ts` | 修改 | 移除 theme 相关字段，添加 colorMode、themePackage |

### 配置文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/config/layout-defaults.ts` | 修改 | 移除 defaultThemeRegistry、aurora/ocean/graphite 主题定义 |

### Store 文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/store/layout-store.ts` | 修改 | 移除 themes、activeThemeKey、activeThemeTokens getter |
| `src/store/layout-store-model.ts` | 修改 | 移除 themes 状态，添加 colorMode、themePackage |
| `src/store/layout-store-preference-actions.ts` | 修改 | 添加 setColorMode、setThemePackage |

### Composables 文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/layouts/composables/use-admin-layout.ts` | 修改 | 移除 shellVars 动态注入，移除 shellClasses 中的 is-dark |

### 样式文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/styles/base-admin/tokens-and-reset.scss` | 修改 | 移除 --mfw-* 变量映射，保留 Element Plus 变量覆盖 |
| `src/styles/base-admin/content-and-overrides.scss` | 修改 | 移除 .is-dark 相关样式，改用 html.dark |
| `src/styles/admin-layout-settings.scss` | 修改 | 移除主题选择器样式，添加新的主题卡片样式 |

### UI 组件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/layouts/panels/SettingsPanel.vue` | 修改 | 移除现有主题选择 UI，添加新的深色模式/主题切换 UI |
| `src/layouts/panels/HeaderPanel.vue` | 修改 | 添加深色模式切换按钮 |
| `src/layouts/AdminLayout.vue` | 修改 | 移除 shellVars 绑定，移除 shellClasses 中的 is-dark |

## 需要新增的代码

### 类型定义文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/theme-types.ts` | 新增 | ThemeColors、ThemePackage、ThemeRegistry 类型 |
| `src/types/color-mode-types.ts` | 新增 | ColorMode 类型 |

### Composables 文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/composables/use-color-mode.ts` | 新增 | 基于 VueUse useDark 的颜色模式切换 |
| `src/composables/use-theme-switch.ts` | 新增 | 运行时主题切换 |
| `src/composables/index.ts` | 新增 | 导出所有组合式函数 |

### 主题包文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/themes/packages/default/manifest.json` | 新增 | 默认主题包配置 |
| `src/themes/packages/ocean/manifest.json` | 新增 | 海洋绿主题包配置 |
| `src/themes/packages/graphite/manifest.json` | 新增 | 石墨灰主题包配置 |
| `src/themes/theme-registry.ts` | 新增 | 主题注册表 |
| `src/themes/index.ts` | 新增 | 主题模块入口 |

### 样式文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/styles/dark/css-vars.scss` | 新增 | 自定义暗黑模式 CSS 变量覆盖 |
| `src/styles/theme-card.scss` | 新增 | 主题选择卡片样式 |

## 测试策略

### 单元测试

| 测试文件 | 测试内容 |
|----------|----------|
| `use-color-mode.spec.ts` | 颜色模式切换逻辑、系统偏好监听、状态持久化 |
| `use-theme-switch.spec.ts` | 主题切换逻辑、CSS 变量应用、主题注册表 |
| `theme-registry.spec.ts` | 主题注册表生成、主题包加载 |

### 集成测试

| 测试文件 | 测试内容 |
|----------|----------|
| `SettingsPanel.spec.ts` | 深色模式开关交互、主题选择交互、跟随系统切换 |
| `HeaderPanel.spec.ts` | 深色模式快捷按钮交互 |
| `AdminLayout.spec.ts` | 深色模式下布局样式正确性 |

### 手动测试清单

- 深色模式切换按钮正常工作
- 设置面板深色模式开关正常工作
- 跟随系统开关正常工作
- 主题选择卡片正常工作
- 深色模式下所有组件样式正确
- 主题切换后所有颜色正确
- 状态持久化正常工作
- 页面刷新后状态恢复正确

## 实施计划

### 阶段一：基础设施

1. 导入 Element Plus 暗黑模式 CSS
2. 创建自定义暗黑模式 CSS 变量覆盖文件
3. 创建类型定义文件
4. 创建主题包目录结构和 manifest.json 文件
5. 创建主题注册表

### 阶段二：组合式函数

1. 实现 useColorMode 组合式函数
2. 实现 useThemeSwitch 组合式函数
3. 创建 composables/index.ts 导出文件

### 阶段三：状态管理

1. 修改 layout-store-model.ts，添加 colorMode、themePackage 状态
2. 修改 layout-store.ts，移除 themes、activeThemeKey、activeThemeTokens
3. 修改 layout-store-preference-actions.ts，添加 setColorMode、setThemePackage

### 阶段四：样式重构

1. 移除 tokens-and-reset.scss 中的 --mfw-* 变量映射
2. 移除 content-and-overrides.scss 中的 .is-dark 相关样式
3. 添加新的主题卡片样式

### 阶段五：UI 组件

1. 修改 SettingsPanel.vue，添加深色模式/主题切换 UI
2. 修改 HeaderPanel.vue，添加深色模式切换按钮
3. 修改 AdminLayout.vue，移除 shellVars 绑定

### 阶段六：清理旧代码

1. 删除 layout-theme-types.ts
2. 清理 layout-defaults.ts 中的主题定义
3. 清理 use-admin-layout.ts 中的 shellVars

### 阶段七：测试和验证

1. 编写单元测试
2. 编写集成测试
3. 手动测试验证
4. 构建验证

## 依赖

- VueUse（useDark、usePreferredDark）
- Element Plus 2.x（暗黑模式 CSS）

## 风险和注意事项

1. **样式兼容性**：现有自定义样式可能与 Element Plus 暗黑模式冲突，需要逐一检查和调整
2. **状态持久化**：需要确保 colorMode 和 themePackage 状态正确持久化
3. **业务代码兼容**：业务层可能引用了旧的 theme API，需要检查并更新
4. **VueUse 依赖**：需要确保项目已安装 VueUse，或添加依赖