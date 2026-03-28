# PC 权限管理页面文档

**版本**: v3.0 - 同步功能
**最后更新**: 2026-03-28

---

## 概述

本文档描述 **PC 权限**（PermissionType=PC）管理页面的同步功能和相关组件设计。

**适用范围**:
- **权限类型**: `PermissionType.PC`
- **节点类型**: `MENU`（目录） + `PAGE`（页面）
- **使用场景**: PC 后台管理系统的权限管理
- **管理方式**: 路由同步生成 + 手动补充

**与权限管理页面的区别**:

| 维度 | PC 权限管理页面 | 权限管理页面（NORMAL） |
|------|----------------|----------------------|
| 权限类型 | PC | NORMAL |
| 节点类型 | MENU + PAGE | MENU + TAG |
| 同步功能 | ✅ 支持路由同步 | ❌ 不支持 |
| pcAction 配置 | ✅ 支持 | ❌ 不支持 |
| 使用场景 | PC 后台管理系统 | 移动端、非后台系统 |

> 💡 **提示**: 普通权限（NORMAL）管理请使用 [权限管理页面](./permission-management.md)。

---

## 页面入口

**访问路径**: 系统管理 → PC 权限管理

**前置条件**:
- 用户拥有 `PC` 权限类型的管理权限
- 已选择应用类型（权限按应用类型隔离）

---

## 页面布局

```
┌─────────────────────────────────────────────────────────────────┐
│  PC 权限管理                          [同步路由] [检查差异]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐ │
│  │   权限树 (只读)      │   │   pcAction 配置面板              │ │
│  │                     │   │                                 │ │
│  │ 📁 系统管理 (同步)   │   │  选中节点：应用类型列表          │ │
│  │   📄 应用类型列表    │   │  (PAGE 节点，可配置 pcAction)     │ │
│  │   📄 角色管理        │   │                                 │ │
│  │                     │   │  操作权限列表：                 │ │
│  │ 📁 业务管理 (同步)   │   │  ┌────────────────────────────┐ │ │
│  │   📄 订单管理        │   │  │ 新增  [编辑] [删除]        │ │ │
│  │                     │   │  │ 编辑  [编辑] [删除]        │ │ │
│  │                     │   │  │ 删除  [编辑] [删除]        │ │ │
│  │                     │   │  │ 导出  [编辑] [删除]        │ │ │
│  │                     │   │  └────────────────────────────┘ │ │
│  │                     │   │  [+ 添加操作权限]               │ │
│  └─────────────────────┘   └─────────────────────────────────┘ │
│                                                                 │
│  [手动添加权限]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 功能模块

### 1. 权限树展示（只读）

**组件名**: `PcPermissionTree.vue`

**功能说明**:
- 展示 PC 权限树形结构
- 同步生成的节点 (`isAutoSync=1`) 显示"同步"标签
- 节点结构不可编辑（不可拖动、不可删除、不可重命名）
- 点击节点选中，右侧显示 pcAction 配置

**数据结构**:
```typescript
interface PermissionTreeNode {
  id: string;
  permName: string;
  permCode: string;
  nodeType: 'MENU' | 'PAGE';
  isAutoSync: number;  // 1=同步生成，0=手动添加
  routePath?: string;
  pcAction?: Array<{name: string, permCode: string}>;
  children?: PermissionTreeNode[];
}
```

**界面状态**:
| 状态 | 说明 |
|------|------|
| 正常 | 显示节点信息 |
| 选中 | 高亮显示，右侧显示 pcAction |
| 同步节点 | 显示"同步"标签 |
| 手动节点 | 显示"手动"标签，可编辑结构 |

---

### 2. 同步按钮组件

**组件名**: `SyncButton.vue`

**功能说明**:
- 点击"同步路由"按钮，触发同步流程
- 点击"检查差异"按钮，检测路由与权限树的差异
- 支持同步前预览

**状态**:
| 状态 | 说明 |
|------|------|
| 正常 | 可点击 |
| 加载中 | 同步中，显示 loading |
| 有差异 | "检查差异"按钮显示角标 |

**事件**:
| 事件 | 说明 |
|------|------|
| sync-start | 开始同步 |
| sync-success | 同步成功 |
| sync-error | 同步失败 |
| diff-change | 差异数量变化 |

---

### 3. 差异预览弹窗

**组件名**: `DiffPreviewDialog.vue`

**功能说明**:
- 展示路由与权限树的差异
- 用户确认后执行同步

**差异类型**:
| 类型 | 说明 | 图标 |
|------|------|------|
| missing | 路由存在，权限不存在 | ➕ |
| mismatch | 名称不一致 | ⚠️ |
| extra | 权限存在，路由已删除 | 🗑️ |

**数据结构**:
```typescript
interface DiffItem {
  type: 'missing' | 'mismatch' | 'extra';
  permCode?: string;
  permName?: string;
  routePath?: string;
  suggestion: string;
}
```

---

### 4. pcAction 配置面板

**组件名**: `PcActionPanel.vue`

**功能说明**:
- 选中 PAGE 节点后，显示 pcAction 配置面板
- 支持添加、编辑、删除 pcAction
- 实时保存

**数据结构**:
```typescript
interface PcAction {
  name: string;        // 操作名称
  permCode: string;    // 操作编码
}
```

**约束**:
- 仅 PAGE 节点可配置 pcAction
- MENU 节点显示提示："仅 PAGE 节点可配置 pcAction"
- 已用于角色权限配置的 pcAction 不允许删除

---

### 5. 手动添加权限

**组件名**: `ManualPermissionButton.vue`

**功能说明**:
- 点击打开表单弹窗
- 手动添加权限节点（不受路由限制）
- 标记为 `isAutoSync=0`

**表单字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| permName | string | 是 | 权限名称 |
| permCode | string | 是 | 权限编码（全局唯一） |
| nodeType | MENU/PAGE | 是 | 节点类型 |
| parentId | string | 否 | 父节点 ID |
| permDesc | string | 否 | 权限描述 |

---

## 用户操作流程

### 同步流程

```
用户点击"同步路由"
      ↓
自动调用"检查差异"
      ↓
显示差异预览弹窗
      ↓
用户确认同步
      ↓
调用同步 API (dryRun=false)
      ↓
刷新权限树
      ↓
显示"同步成功"提示
```

### 配置 pcAction 流程

```
用户点击 PAGE 节点
      ↓
右侧显示 pcAction 面板
      ↓
点击"添加操作权限"
      ↓
填写 name 和 permCode
      ↓
保存到后端
      ↓
刷新 pcAction 列表
```

---

## API 调用

### 同步接口

```typescript
// POST /api/v1/permissions/sync
async function syncPermission(dryRun: boolean) {
  return request({
    url: '/api/v1/permissions/sync',
    method: 'post',
    data: { dryRun }
  })
}
```

### 比对接口

```typescript
// GET /api/v1/permissions/compare
async function comparePermission() {
  return request({
    url: '/api/v1/permissions/compare',
    method: 'get'
  })
}
```

### pcAction 管理接口

```typescript
// POST /api/v1/permissions/:id/pc-actions
async function addPcAction(permissionId: string, action: PcAction) {
  return request({
    url: `/api/v1/permissions/${permissionId}/pc-actions`,
    method: 'post',
    data: action
  })
}

// PUT /api/v1/permissions/:id/pc-actions/:permCode
async function updatePcAction(permissionId: string, permCode: string, name: string) {
  return request({
    url: `/api/v1/permissions/${permissionId}/pc-actions/${permCode}`,
    method: 'put',
    data: { name }
  })
}

// DELETE /api/v1/permissions/:id/pc-actions/:permCode
async function deletePcAction(permissionId: string, permCode: string) {
  return request({
    url: `/api/v1/permissions/${permissionId}/pc-actions/${permCode}`,
    method: 'delete'
  })
}
```

---

## 状态管理

### 权限树状态

```typescript
interface PermissionTreeState {
  treeData: PermissionTreeNode[];
  loading: boolean;
  selectedNode: PermissionTreeNode | null;
  expandedKeys: string[];
}
```

### 同步状态

```typescript
interface SyncState {
  syncing: boolean;
  diffCount: number;
  diffs: DiffItem[];
  previewVisible: boolean;
}
```

---

## 错误处理

| 错误场景 | 提示文案 |
|----------|----------|
| 同步失败 | "同步失败，请稍后重试" |
| 无差异 | "当前路由与权限树一致" |
| pcAction 已被使用 | "该操作权限已被角色使用，无法删除" |
| 非 PAGE 节点 | "仅 PAGE 节点可配置 pcAction" |

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v3.0 | 2026-03-28 | 新增同步功能、pcAction 管理 |
| v1.0 | - | 初始版本 |

---

*本文档由 PC 权限同步功能方案 v3.0 衍生而来*
