# 页面组件优化设计文档

## 概述

本设计文档描述了页面组件的优化方案，旨在解决以下问题：

1. SearchPanel 组件需要独立导出，供卡片列表等其他组件复用
2. 搜索面板按钮区域需要右对齐
3. 页面标题和面包屑重复显示，需要调整为互斥显示
4. 刷新按钮位置需要优化，右对齐以按钮形式展示

## 设计目标

- SearchPanel 独立导出，可被多种列表组件复用
- 搜索面板按钮区域右对齐，布局清晰
- 页面标题和面包屑互斥显示，通过全局配置统一风格
- 刷新按钮在头部右侧，以按钮形式展示，SearchPanel 存在时不显示

## 架构设计

### 文件结构变更

```
src/components/page/
├── search-panel/           # 新建独立目录
│   ├── index.tsx           # SearchPanel 组件
│   ├── types.ts            # 类型定义
│   ├── style.scss          # 样式
│   └── mod.ts              # 导出模块
├── list-page/
│   ├── index.tsx           # 导入并使用 SearchPanel
│   ├── types.ts            # 类型定义
│   ├── style.scss          # 样式
│   └── mod.ts              # 导出模块
├── page-wrapper/
│   ├── index.tsx           # 重构头部布局
│   ├── types.ts            # 新增 headerMode 相关类型
│   ├── style.scss          # 调整头部样式
│   └── mod.ts              # 导出模块
└── index.ts                # 更新导出

src/store/layout-store.ts   # 新增 headerMode 配置项
```

### 组件层级关系

```
MfwPageWrapper
├── 头部区域（标题或面包屑 + 刷新按钮）
├── toolbar 插槽
├── 内容区
│   └── MfwListPage / MfwCardList / 其他组件
│       └── SearchPanel（可选）
└── footer 插槽
```

## SearchPanel 独立组件设计

### 目录结构

```
src/components/page/search-panel/
├── index.tsx           # SearchPanel 组件实现
├── types.ts            # 类型定义
├── style.scss          # 样式（按钮右对齐）
└── mod.ts              # 导出模块
```

### Props 定义

```typescript
interface SearchPanelProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 筛选触发模式 */
  searchTrigger?: 'change' | 'submit';
  /** 最大可见项数（一行显示的项数） */
  maxVisibleItems?: number;
  /** 是否显示筛选面板 */
  showSearch?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 每项占用的栅格数 */
  itemSpan?: number;
  /** 是否显示查询按钮 */
  showSearchButton?: boolean;
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
}
```

### Slots 定义

| 插槽名 | 位置 | 用途 |
|--------|------|------|
| `search-actions` | 按钮区域左侧 | 自定义操作按钮（如新建） |
| `search-extra` | 面板底部 | 额外内容 |

### 暴露实例

```typescript
interface SearchPanelInstance {
  reset: () => void;
  getFormValues: () => Record<string, any>;
  setFormValues: (values: Record<string, any>) => void;
  doSearch: () => void;
}
```

### 按钮布局设计

**布局结构：**
```
┌─────────────────────────────────────────────────────────────┐
│  [表单项区域]                                                │
│  [表单项1]  [表单项2]  [表单项3]  [表单项4]  ...              │
├─────────────────────────────────────────────────────────────┤
│  [search-actions 插槽]              [展开] [查询] [重置]    │
└─────────────────────────────────────────────────────────────┘
```

**样式设计：**
```scss
.search-panel {
  &__actions-row {
    display: flex;
    justify-content: flex-end;  // 右对齐
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__actions-left {
    display: flex;
    gap: 8px;
    margin-right: auto;  // 左侧插槽占据左侧空间
  }

  &__actions-right {
    display: flex;
    gap: 8px;
  }
}
```

## layoutStore 全局配置设计

### 新增配置项

```typescript
interface LayoutStyleConfig {
  // ... 现有配置项
  
  /** 页面头部显示模式 */
  headerMode: 'title' | 'breadcrumb';
}
```

**默认值：** `'breadcrumb'`

**配置说明：**
- `'title'`：显示页面标题（如"用户管理"）
- `'breadcrumb'`：显示面包屑导航（如"首页 / 系统管理 / 用户管理"）

### SettingsPanel 配置选项

在设置面板中添加头部模式选项：

```typescript
const headerModeOptions = [
  { label: '显示标题', value: 'title' },
  { label: '显示面包屑', value: 'breadcrumb' }
];
```

## MfwPageWrapper 重构设计

### Props 变更

```typescript
interface MfwPageWrapperProps {
  /** 是否显示面包屑（已废弃，使用 headerMode） */
  showBreadcrumb?: boolean;
  /** 是否显示页面标题（已废弃，使用 headerMode） */
  showTitle?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 自定义页面标题 */
  title?: string;
  /** 自定义面包屑 */
  breadcrumb?: BreadcrumbItem[];
  /** 内容区 padding */
  padding?: string | number;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 背景色 */
  background?: string;
  /** 头部显示模式（覆盖全局配置） */
  headerMode?: 'title' | 'breadcrumb' | 'none';
}
```

### 头部布局设计

**布局结构：**
```
┌─────────────────────────────────────────────────────────────┐
│  [标题/面包屑]                              [刷新按钮]       │
├─────────────────────────────────────────────────────────────┤
│  [toolbar 插槽]                                              │
├─────────────────────────────────────────────────────────────┤
│  [内容区]                                                    │
└─────────────────────────────────────────────────────────────┘
```

**头部样式设计：**
```scss
.mfw-page-wrapper {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    padding-bottom: 8px;
  }

  &__header-left {
    flex: 1;
    min-width: 0;  // 防止内容溢出
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__breadcrumb-wrap {
    padding: 0 16px;
    padding-bottom: 12px;
  }

  &__refresh-btn {
    // 刷新按钮样式
  }
}
```

### 刷新按钮逻辑

**显示条件：**
1. `showRefresh` prop 为 `true`（默认）
2. 页面内没有 SearchPanel（由使用者控制）

**使用示例：**
```vue
<!-- 有 SearchPanel 的页面，不显示刷新按钮 -->
<MfwPageWrapper :show-refresh="false">
  <MfwListPage>
    <template #search-actions>
      <el-button type="primary">新建</el-button>
    </template>
  </MfwListPage>
</MfwPageWrapper>

<!-- 没有 SearchPanel 的页面，显示刷新按钮 -->
<MfwPageWrapper>
  <UserDetailForm />
</MfwPageWrapper>
```

## MfwListPage 变更设计

### 导入 SearchPanel

```typescript
import SearchPanel from '../search-panel';
```

### Props 变更

```typescript
interface MfwListPageProps {
  // ... 现有 props
  
  /** 是否显示刷新按钮（传递给 MfwPageWrapper） */
  showPageRefresh?: boolean;
}
```

### 使用示例

```vue
<template>
  <MfwPageWrapper :show-refresh="showPageRefresh">
    <MfwListPage
      :search-template="searchTemplate"
      :columns="columns"
      :load-data="loadData"
    >
      <template #search-actions>
        <el-button type="primary">新建</el-button>
      </template>
    </MfwListPage>
  </MfwPageWrapper>
</template>
```

## MfwCardList 组件设计（示例）

展示 SearchPanel 的复用能力：

```vue
<template>
  <MfwPageWrapper :show-refresh="false">
    <SearchPanel
      :search-template="searchTemplate"
      :loading="loading"
      @search="handleSearch"
    >
      <template #search-actions>
        <el-button type="primary">新建卡片</el-button>
      </template>
    </SearchPanel>
    
    <div class="card-list">
      <el-card v-for="item in data" :key="item.id">
        <!-- 卡片内容 -->
      </el-card>
    </div>
  </MfwPageWrapper>
</template>
```

## 迁移计划

1. 创建 `search-panel` 独立目录
2. 移动 SearchPanel 相关文件到独立目录
3. 更新 `list-page` 导入 SearchPanel
4. 更新 `layout-store` 添加 `headerMode` 配置
5. 重构 `MfwPageWrapper` 头部布局
6. 更新 `page/index.ts` 导出 SearchPanel
7. 更新现有业务页面使用新 API

## 兼容性考虑

- `showBreadcrumb` 和 `showTitle` props 保留但标记为废弃
- 现有页面可逐步迁移到新的 `headerMode` 配置
- SearchPanel 保持现有 API，仅调整布局样式

## 测试要点

1. SearchPanel 独立导出和复用能力
2. 搜索面板按钮右对齐布局
3. headerMode 配置切换（标题/面包屑）
4. 刷新按钮显示/隐藏逻辑
5. 全局配置持久化
6. 响应式布局适配