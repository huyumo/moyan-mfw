# 应用类型管理页面卡片布局重构设计

## 概述

重构 `sys/app-type` 页面，将原有的表格分页布局改为卡片网格布局，提升用户体验和视觉效果。

## 背景

当前页面使用 `MfwListPage` 组件，以表格形式展示应用类型列表，支持分页和搜索。但实际业务场景中：
- 应用类型数量通常较少（一般不超过 10 个），不需要分页
- 表格布局信息密度高，视觉不够直观
- 内置角色管理同样使用表格，交互不够友好

## 设计目标

1. 移除分页功能，简化页面结构
2. 使用卡片网格布局，提升视觉效果
3. 内置角色管理同样采用卡片布局
4. 保持现有功能完整性
5. 复用现有 `MfwCardListPage` 组件

## 详细设计

### 1. 应用类型管理页面 (Index.vue)

#### 页面结构

```
┌─────────────────────────────────────────────────────┐
│  应用类型管理                         [+ 新增类型]   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  应用类型卡片 │  │  应用类型卡片 │  │  应用类型卡片 │  │
│  │             │  │             │  │             │  │
│  │  [编辑][权限]│  │  [编辑][权限]│  │  [编辑][权限]│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐                   │
│  │  应用类型卡片 │  │  应用类型卡片 │                   │
│  └─────────────┘  └─────────────┘                   │
└─────────────────────────────────────────────────────┘
```

#### 组件选择

使用现有 `MfwCardListPage` 组件，配置如下：

```vue
<MfwCardListPage
  :show-search="false"
  :show-pagination="false"
  :load-data="loadData"
  render-mode="card"
  :card-grid="{ cols: 4, gap: 20 }"
  empty-text="暂无应用类型"
>
  <template #search-actions>
    <el-button type="primary" @click="handleAdd">
      <el-icon><Plus /></el-icon>
      新增类型
    </el-button>
  </template>
  <template #card-item="{ item }">
    <AppTypeCard :data="item" @edit="handleEdit" @permission="handlePermission" @role="handleRole" />
  </template>
</MfwCardListPage>
```

#### 卡片内容

| 区域 | 内容 | 说明 |
|-----|-----|-----|
| 头部 | 图标 + 类型名称 + 类型编码 | 左侧图标，右侧名称和编码 |
| 主体 | 类型描述 + 状态标签 + 多应用标签 | 描述文字，下方两个标签 |
| 底部 | 内置角色数量 + 操作按钮 | 左侧显示角色数量，右侧三个按钮 |

#### 操作按钮

- **编辑**：打开 EditForm 抽屉编辑基本信息
- **权限池**：打开 PermissionPoolPanel 弹窗配置权限池
- **内置角色**：打开 BuiltinRoleDialog 弹窗管理内置角色

#### 新增功能

点击"新增类型"按钮，打开 AddForm 弹窗：

```typescript
const handleAdd = () => {
  MfwPopup.open({
    title: '新增应用类型',
    type: 'dialog',
    component: AddForm,
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        cardListPage.value?.refresh();
      },
    },
  });
};
```

#### 移除功能

- 移除搜索模板（searchTemplate）
- 移除分页功能
- 移除详情查看功能（handleDetail）

### 2. 内置角色管理弹窗 (BuiltinRoleDialog)

#### 弹窗结构

```
┌─────────────────────────────────────────────────────┐
│  配置内置角色 - 项目管理              [+ 新增角色]   │
├─────────────────────────────────────────────────────┤
│  💡 内置角色是与应用类型绑定的预设角色...            │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  角色卡片    │  │  角色卡片    │  │  角色卡片    │  │
│  │             │  │             │  │             │  │
│  │ [配置][编辑]│  │ [配置][编辑]│  │ [配置][编辑]│  │
│  │   [删除]    │  │   [删除]    │  │   [删除]    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────┤
│                                    [关闭]           │
└─────────────────────────────────────────────────────┘
```

#### 角色卡片内容

| 区域 | 内容 | 说明 |
|-----|-----|-----|
| 头部 | 角色图标 + 角色名称 | 左侧图标，右侧名称 |
| 主体 | 角色编码 + 角色描述 + 状态标签 | 编码、描述、状态 |
| 底部 | 操作按钮 | 配置权限、编辑、删除 |

#### 保持现有功能

- 新增角色：打开 RoleForm 弹窗
- 配置权限：打开 RolePermissionPanel 弹窗
- 编辑角色：打开 RoleForm 弹窗（带数据）
- 删除角色：调用 ApiRoleDelete

### 3. 技术实现

#### API 调用

使用 `ApiAppTypeFindAllList` 获取全部应用类型列表（无需分页参数）：

```typescript
const loadData = async (params: LoadParams) => {
  const result = await new ApiAppTypeFindAllList({});
  return {
    list: result || [],
    total: result?.length || 0,
  };
};
```

获取内置角色数量：使用 `ApiRoleFindAll` 单独查询：

```typescript
const getBuiltinRoleCount = async (appTypeId: string): Promise<number> => {
  const result = await new ApiRoleFindAll({
    query: { page: 1, pageSize: 1, appTypeId }
  });
  return result.total || 0;
};
```

#### 卡片样式（使用 Element Plus CSS 变量）

```scss
.app-type-card {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: var(--el-box-shadow);
    transform: translateY(-2px);
  }
}
```

#### 图标渲染

使用 Element Plus 图标组件，根据 `icon` 字段动态渲染：

```vue
<el-icon :size="24">
  <component :is="getIconComponent(data.icon)" />
</el-icon>
```

或使用图标字符串直接渲染：

```vue
<span class="card-icon">{{ data.icon || '📊' }}</span>
```

#### 响应式断点

复用 `MfwCardListPage` 组件的响应式断点配置：
- 默认 4 列（cols: 4）
- 组件内部已处理响应式：1200px 以下 3 列，900px 以下 2 列，600px 以下 1 列

#### 空状态和加载状态

- 空状态：`MfwCardListPage` 内部使用 `ElEmpty` 组件展示
- 加载状态：`MfwCardListPage` 内部使用 `loading` ref 控制

### 4. 文件变更

| 文件 | 变更类型 | 说明 |
|-----|---------|-----|
| `packages/base-frontend/src/views/sys/app-type/Index.vue` | 重写 | 改为使用 MfwCardListPage 卡片布局 |
| `packages/base-frontend/src/views/sys/app-type/AppTypeCard.vue` | 新增 | 应用类型卡片组件 |
| `packages/base-frontend/src/components/business/builtin-role-dialog/Index.vue` | 重写 | 改为卡片布局 |
| `packages/base-frontend/src/components/business/builtin-role-dialog/RoleCard.vue` | 新增 | 内置角色卡片组件 |

### 5. 保持不变

- `AddForm.vue`（新增表单）
- `EditForm.vue`（编辑表单）
- `DetailPopup.vue`（详情弹窗，不再使用但保留）
- `PermissionPoolPanel`（权限池配置）
- `RoleForm`（角色表单）
- `RolePermissionPanel`（角色权限配置）
- 所有 API 接口

## 验收标准

1. 应用类型以卡片网格形式展示，响应式适配不同屏幕宽度
2. 卡片显示：图标、名称、编码、描述、状态标签、多应用标签
3. 卡片底部显示内置角色数量和三个操作按钮（编辑、权限池、内置角色）
4. 页面顶部有新增类型按钮，无搜索功能，无分页
5. 点击新增按钮打开 AddForm 弹窗，创建成功后刷新列表
6. 内置角色弹窗以卡片形式展示角色列表
7. 无数据时显示空状态提示（ElEmpty）
8. 数据加载中显示加载状态
9. 响应式断点：默认 4 列，1200px 以下 3 列，900px 以下 2 列，600px 以下 1 列
10. API 调用失败时显示错误提示（ElMessage.error）
11. 所有现有功能正常工作（编辑、权限池、角色管理）