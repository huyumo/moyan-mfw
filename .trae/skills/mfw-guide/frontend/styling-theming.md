---
version: "1.0"
last_updated: "2026-04-25"
scope: frontend
triggers:
  - 样式
  - 主题
  - 暗色模式
  - SCSS
  - CSS 变量
  - BEM
dependencies: []
maturity: stable
tags: [前端, 样式, 主题, 暗色模式, SCSS, BEM]
---

# 样式与主题

## SCSS 规范

- 使用 `scoped` 限制样式作用域
- 类名使用 BEM 命名 + `mfw-` 前缀
- 优先使用 Element Plus CSS 变量

```scss
.mfw-component-name {
  --mfw-component-bg: var(--el-bg-color);
  --mfw-component-border: var(--el-border-color-lighter);

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__body {
    margin-bottom: 12px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
```

## 常用 Element Plus CSS 变量

| 变量 | 用途 |
|------|------|
| `--el-bg-color` | 背景色 |
| `--el-text-color-primary` | 主文字色 |
| `--el-text-color-secondary` | 次文字色 |
| `--el-text-color-regular` | 常规文字色 |
| `--el-border-color-lighter` | 边框色 |
| `--el-color-primary` | 主题色 |
| `--el-color-primary-light-9` | 主题色浅 |

## 暗色模式

- 框架已内置暗色模式 CSS 变量覆盖
- 组件使用 Element Plus 变量即可自动适配
- 自定义颜色需在 `styles/dark/css-vars.scss` 中添加覆盖

## 主题包

9 套：default / ocean / graphite / aurora / sunset / nature / fintech / tech / luxury

## 布局模式

- `sidebar`：侧边栏导航
- `top`：顶部导航
- `dual`：顶部+侧边栏双导航（默认）

## 颜色模式

`light` / `dark` / `system`

## 布局配置

```typescript
createBaseAdminApp({
  layout: { layoutMode: 'dual', showTabs: true, colorMode: 'system', themePackage: 'default' },
  layoutExtensions: { headerCommon, headerAvatar, headerUserMenu },
});
```

## 9 套主题包色值

| 主题 | 主色 | 背景色 | 侧边栏色 |
|------|------|--------|---------|
| default | `#409EFF` | `#f5f7fa` | `#304156` |
| ocean | `#0288D1` | `#e8f4f8` | `#1a3a4a` |
| graphite | `#546E7A` | `#eceff1` | `#37474f` |
| aurora | `#7C4DFF` | `#f3e5f5` | `#311b92` |
| sunset | `#FF6D00` | `#fff3e0` | `#bf360c` |
| nature | `#43A047` | `#e8f5e9` | `#1b5e20` |
| fintech | `#1565C0` | `#e3f2fd` | `#0d47a1` |
| tech | `#00BFA5` | `#e0f2f1` | `#004d40` |
| luxury | `#8D6E63` | `#efebe9` | `#4e342e` |

## 自定义主题创建流程

1. 在 `packages/base-frontend/src/themes/packages/` 下创建新目录（如 `my-theme/`）
2. 创建 `manifest.json` 主题清单文件：

```json
{
  "name": "my-theme",
  "label": "我的主题",
  "description": "自定义主题描述",
  "colors": {
    "primary": "#E91E63",
    "success": "#4CAF50",
    "warning": "#FF9800",
    "danger": "#F44336",
    "info": "#00BCD4"
  }
}
```

3. 在 `packages/base-frontend/src/themes/index.ts` 中注册主题
4. 在 `styles/` 目录下按需添加 CSS 变量覆盖

## 暗色模式覆盖示例

自定义组件的暗色模式样式，需在 `packages/base-frontend/src/styles/dark/css-vars.scss` 中添加：

```scss
html.dark {
  // 覆盖自定义组件的暗色模式变量
  --mfw-component-bg: var(--el-bg-color-overlay);
  --mfw-component-border: var(--el-border-color-darker);

  // 覆盖业务组件特定样式
  .mfw-detail-panel {
    --mfw-detail-bg: var(--el-bg-color-overlay);
    --mfw-detail-border: var(--el-border-color-darker);
  }
}
```

组件中使用 CSS 变量即可自动适配暗色模式：

```scss
.mfw-my-component {
  background: var(--mfw-component-bg, var(--el-bg-color));
  border-color: var(--mfw-component-border, var(--el-border-color-lighter));
}
```

## 响应式断点规范

框架使用 Element Plus 的断点系统：

| 断点 | 宽度 | 典型设备 |
|------|------|---------|
| `xs` | <768px | 手机 |
| `sm` | ≥768px | 平板竖屏 |
| `md` | ≥992px | 平板横屏 |
| `lg` | ≥1200px | 桌面 |
| `xl` | ≥1920px | 大屏 |

SCSS 使用方式：

```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == xs { @media (max-width: 767px) { @content; } }
  @if $breakpoint == sm { @media (min-width: 768px) { @content; } }
  @if $breakpoint == md { @media (min-width: 992px) { @content; } }
  @if $breakpoint == lg { @media (min-width: 1200px) { @content; } }
}

.usage {
  @include respond-to(xs) {
    flex-direction: column;
  }
}
```

## 反模式（Red Flags）— 立即停止

- ✋ 不使用 `scoped` 限制样式作用域 → 必须使用 `<style scoped>`
- ✋ CSS 类名不使用 BEM 命名 → 必须使用 `.mfw-block__element--modifier`
- ✋ 硬编码颜色值 → 使用 Element Plus CSS 变量或主题变量
- ✋ 直接修改 Element Plus 组件源码样式 → 使用 CSS 变量覆盖
- ✋ 暗色模式不测试 → 自定义颜色必须在 `dark/css-vars.scss` 中添加覆盖
