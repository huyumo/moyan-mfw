## 目标

当布局模式为"侧边栏"（sidebar）时，将 tabs 标签栏从 MainPanel 内容区上方移到顶部 header 的 `mfw-admin-top-nav` 区域展示（替换快捷导航）。其他模式（dual/top）保持 tabs 在内容区上方不变。

## 核心逻辑

新增 computed `tabsInHeader`：`layoutMode === 'sidebar' && showTabs` 时为 `true`。

| 场景 | tabsInHeader | Tabs 渲染位置 |
|------|-------------|-------------|
| sidebar + showTabs=true | true | Header → NavigationPanel（替换 top-nav） |
| sidebar + showTabs=false | false | 不渲染，header 显示 topNav 快捷导航 |
| dual/top + showTabs=true | false | MainPanel 内容区上方（保持原位） |
| dual/top + showTabs=false | false | 不渲染 |

## 修改文件清单

### 1. `packages/base/src/frontend/src/layouts/composables/use-admin-layout.ts`
- 在 `showPrimaryTopMenus` computed 附近新增：
  ```ts
  const tabsInHeader = computed(
    () => layoutStore.styleConfig.layoutMode === 'sidebar' && layoutStore.styleConfig.showTabs,
  );
  ```
- 在 return 对象中导出 `tabsInHeader`

### 2. `packages/base/src/frontend/src/layouts/panels/NavigationPanel.vue`
- **新增 props**：`visitedTabs: PageTabItem[]`、`activeTabPath: string`、`showTabs: boolean`
- **新增 emits**：`update:activeTabPath`、`tab-remove`、`tab-command`
- **导入** `TabsPanel` 和 `PageTabItem` 类型
- **模板调整**：在 `!showPrimaryTopMenus` 分支下增加一层判断：
  ```vue
  <!-- dual/top 模式：主导航菜单（不变） -->
  <nav v-if="showPrimaryTopMenus" class="mfw-admin-primary-nav" ...>...</nav>

  <!-- sidebar 模式 + showTabs：tabs 标签栏替换 top-nav -->
  <div v-else-if="showTabs" class="mfw-admin-top-tabs">
    <TabsPanel
      :model-value="activeTabPath"
      :visited-tabs="visitedTabs ?? []"
      @update:model-value="emit('update:activeTabPath', $event)"
      @tab-remove="emit('tab-remove', $event)"
      @tab-command="emit('tab-command', $event)"
    />
  </div>

  <!-- sidebar 模式 + !showTabs：快捷导航（不变） -->
  <nav v-else class="mfw-admin-top-nav" ...>...</nav>
  ```
- **scoped 样式**：用 `:deep(.tab-action-btn)` 覆盖 MoreFilled 图标颜色为半透明白色（适配主题色 header 背景）

### 3. `packages/base/src/frontend/src/layouts/panels/HeaderPanel.vue`
- **新增 props**：`visitedTabs: PageTabItem[]`、`activeTabPath: string`、`showTabs: boolean`
- **新增 emits**：`update:activeTabPath`、`tab-remove`、`tab-command`
- **导入** `PageTabItem` 类型
- **模板**：把这些 props/events 透传给 `NavigationPanel`：
  ```vue
  <NavigationPanel
    ...（原有 props）...
    :visited-tabs="visitedTabs"
    :active-tab-path="activeTabPath"
    :show-tabs="showTabs"
    @update:active-tab-path="emit('update:activeTabPath', $event)"
    @tab-remove="emit('tab-remove', $event)"
    @tab-command="emit('tab-command', $event)"
  />
  ```

### 4. `packages/base/src/frontend/src/layouts/AdminLayout.vue`
- 从 `useAdminLayout()` 解构新增的 `tabsInHeader`
- **HeaderPanel** 增加 tabs 相关绑定：
  ```vue
  <HeaderPanel
    ...（原有 props/events）...
    :visited-tabs="layoutStore.visitedTabs"
    :active-tab-path="activeTabPath"
    :show-tabs="layoutStore.styleConfig.showTabs"
    @update:active-tab-path="activeTabPath = $event"
    @tab-remove="removeTab"
    @tab-command="handleTabCommand"
  >
  ```
- **MainPanel** 的 `:show-tabs` 改为 `layoutStore.styleConfig.showTabs && !tabsInHeader`（sidebar 模式 + showTabs 时不在此渲染）：
  ```vue
  <MainPanel
    v-model="activeTabPath"
    :show-tabs="layoutStore.styleConfig.showTabs && !tabsInHeader"
    :visited-tabs="layoutStore.visitedTabs"
    @tab-remove="removeTab"
    @tab-command="handleTabCommand"
  >
  ```

### 5. `packages/base/src/frontend/src/styles/base-admin/shell-and-sidebar.scss`
在 `.mfw-admin-top-nav` 样式附近新增 `.mfw-admin-top-tabs` 样式，使 tabs 适配 header 主题色背景：

```scss
.mfw-admin-top-tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;

  .mfw-admin-tabs-wrap {
    background: transparent;
    flex: 1;
    min-width: 0;
  }

  .el-tabs {
    --el-tabs-header-height: 36px;
  }

  .el-tabs__header {
    margin: 0;
    border: none;
  }

  .el-tabs__nav {
    border: none !important;
    gap: 4px;
  }

  .el-tabs__item {
    color: rgba(255, 255, 255, 0.75);
    border: 1px solid color-mix(in srgb, #fff 25%, transparent) !important;
    border-radius: 8px;
    background: transparent;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      color: #fff;
      background: color-mix(in srgb, #fff 12%, transparent);
    }

    &.is-active {
      color: #fff;
      background: color-mix(in srgb, #fff 22%, transparent);
      border-color: color-mix(in srgb, #fff 40%, transparent) !important;
    }
  }

  .is-icon-close {
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      color: #fff;
      background: color-mix(in srgb, #fff 25%, transparent);
      border-radius: 50%;
    }
  }
}
```

> 注：`.tab-action-btn`（MoreFilled 图标）颜色在 NavigationPanel.vue 的 scoped 样式中用 `:deep()` 覆盖，因为它是 TabsPanel 的 scoped 样式。

## 不需要修改的部分
- **TabsPanel.vue**：组件本身不变，复用即可
- **MainPanel.vue**：`v-if="showTabs"` 逻辑不变，由 AdminLayout 传入调整后的 `showTabs` 值控制
- **SettingsPanel.vue**：无需新增开关，sidebar 模式下 tabs 自动移到顶部
- **e2e 测试**：`[data-testid="tabs-panel"]` 在 TabsPanel 组件上，无论渲染位置都能定位，无需改动
- **store**：无需改动，`tabsInHeader` 是纯前端 computed

## 验证方式
1. `pnpm typecheck:vue` 确认类型无误
2. `pnpm dev:frontend` 启动开发服务器，在偏好设置中切换到"侧边栏"模式，确认 tabs 出现在顶部 header 中、内容区上方不再显示 tabs
3. 切换到"双栏菜单"模式，确认 tabs 回到内容区上方
4. sidebar 模式下关闭 showTabs 开关，确认 header 显示 topNav 快捷导航（或为空）
