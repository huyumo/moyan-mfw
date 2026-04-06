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
| 同步功能 | ✅ 支持路由同步 | ❌ 不支持（手动添加） |
| permissionValue 配置 | ✅ 支持 | ✅ 支持 |
| 来源方式 | 路由同步生成 | 手动添加 |
| 使用场景 | PC 后台管理系统 | 移动端、非后台系统 |

> 💡 **提示**: 普通权限（NORMAL）管理请使用 [权限管理页面](./权限管理页面.md)。

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
│  │   权限树 (只读)      │   │   permissionValue 配置面板        │ │
│  │                     │   │                                 │ │
│  │ 📁 系统管理 (同步)   │   │  选中节点：应用类型列表          │ │
│  │   📄 应用类型列表    │   │  (PAGE 节点，可配置 permissionValue)│ │
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
- 点击节点选中，右侧显示 permissionValue 配置

**数据结构**:
```typescript
interface PermissionTreeNode {
  id: string;
  permName: string;
  permCode: string;
  nodeType: 'MENU' | 'PAGE';
  isAutoSync: number;  // 1=同步生成，0=手动添加
  routePath?: string;
  permissionValue?: bigint;        // v4.0 新增 - 位运算权限值
  children?: PermissionTreeNode[];
}
```

**界面状态**:
| 状态 | 说明 |
|------|------|
| 正常 | 显示节点信息 |
| 选中 | 高亮显示，右侧显示 permissionValue |
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

### 4. permissionValue 配置面板

**组件名**: `PermissionValuePanel.vue`

**功能说明**:
- 选中 PAGE 节点后，显示 permissionValue 配置面板
- 支持勾选位运算权限位（ADD, EDIT, DELETE 等）
- 实时保存

**数据结构**:
```typescript
// permissionValue 位运算权限值
// ADD(1n) | EDIT(2n) | DELETE(4n) | EXPORT(8n) | IMPORT(16n) | VIEW(32n) ...
```

**约束**:
- 仅 PAGE 节点可配置 permissionValue
- MENU 节点显示提示："仅 PAGE 节点可配置 permissionValue"
- permissionValue 必须是权限池中对应权限 permissionValue 的子集

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

**方案：懒清理策略（读取时过滤，配置时清理）**

```
用户点击"同步路由"
      ↓
调用同步 API (dryRun=false)
      ↓
仅更新 sys_permission 表
├── 新增权限：插入新记录
├── 更新权限：更新 permName、parentId、permissionValue
└── 删除权限：不处理（留在数据库中）
      ↓
刷新权限树
      ↓
显示"同步成功"提示

注意：同步时不级联清理权限池和角色配置
```

**同步策略说明**:

| 变更类型 | 权限定义表 | 权限池配置 | 角色权限配置 |
|----------|-----------|-----------|-------------|
| 新增权限 | 插入新记录 | 不处理 | 不处理 |
| 更新权限 | 更新记录 | 不处理 | 不处理 |
| 删除权限 | 不处理（或标记 permStatus=0） | 不处理 | 不处理 |
| 移动权限 | 更新 parentId | 不处理 | 不处理 |

**读取和配置时的过滤**:

1. **读取权限池**：连表查询 `sys_permission`，过滤掉不存在的 `permCode`
2. **读取角色权限**：连表查询 `sys_permission`，过滤掉不存在的 `permCode`
3. **配置权限池**：保存时自动过滤掉无效的 `permCode` 和 `permissionValue`
4. **配置角色权限**：保存时自动过滤掉无效的 `permCode` 和 `permissionValue`

**可选清理**：定时任务清理孤立的权限池和角色权限配置

### 配置 permissionValue 流程

**注意**：permissionValue 使用位运算存储，如 7n = ADD(1n) | EDIT(2n) | DELETE(4n)

```
用户在 PAGE 节点勾选权限位
      ↓
调用更新接口 PUT /api/v1/permissions/:id
      ↓
写入 sys_permission.permissionValue
      ↓
权限池配置时勾选子集
      ↓
角色分配时勾选子集
```

---

## API 调用

### 同步接口

**同步策略**：懒清理（读取时过滤，配置时清理）

> **注意**：同步路由 API 不需要 appTypeId 参数。
>
> Permission 实体是全局定义，不包含 appTypeId 字段。
> 同步路由只是将路由转换为 Permission 实体数据（全局）。
> 应用类型绑定是在"应用类型管理页面"的"权限池配置"中完成的。

```typescript
// POST /api/v1/permissions/sync
async function syncPermission(options: {
  dryRun?: boolean;
  routes: RouteNode[];  // 从 Vue Router 实例提取的路由数据
}) {
  return request({
    url: '/api/v1/permissions/sync',
    method: 'post',
    data: options
  })
}
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dryRun | boolean | 否 | 是否仅预览，默认 false |
| routes | RouteNode[] | 是 | 路由树结构，从前端 Vue Router 实例提取 |

**RouteNode 结构**:

```typescript
interface RouteNode {
  path: string;        // 路由路径
  name: string;        // 路由名称
  children?: RouteNode[];  // 子路由
}
```

**同步逻辑**:
- `dryRun = true`：预览差异，不执行同步
- `dryRun = false`：执行同步，仅更新 `sys_permission` 表
- 同步时不级联清理权限池和角色配置
- 读取和配置时自动过滤掉无效的 `permCode`

**差异类型**:
| 类型 | 说明 | 处理方式 |
|------|------|----------|
| added | 路由存在，权限不存在 | 插入新记录 |
| updated | 路由和权限都存在，字段有差异 | 更新记录 |
| removed | 权限存在，路由不存在 | 不处理（或标记 permStatus=0） |
| moved | 权限存在，parentId 变化 | 更新 parentId |

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

**响应示例**:
```typescript
interface CompareResult {
  added: Permission[];      // 新增的权限
  updated: Permission[];    // 更新的权限
  removed: Permission[];    // 删除的权限
  moved: Permission[];      // 移动的权限
}
```

### permissionValue 更新接口

```typescript
// PUT /api/v1/permissions/:id
async function updatePermission(permissionId: string, permissionValue: bigint) {
  return request({
    url: `/api/v1/permissions/${permissionId}`,
    method: 'put',
    data: { permissionValue }
  })
}
```

---

## 同步策略详解

### 懒清理策略

**核心思想**：同步时不级联清理关联数据，而是在读取和配置时过滤。

**同步流程**:

```
路由表变更
   ↓
同步脚本
   ↓
仅更新 sys_permission 表
├── 新增：插入新记录
├── 更新：更新 permName、parentId、permissionValue
├── 删除：不处理（或标记 permStatus=0）
└── 移动：更新 parentId

不涉及：
- 不删除权限池关联
- 不删除角色权限关联
```

### 读取时过滤

**获取权限池配置**：

```typescript
// 后端 API：获取权限池
async function getPermissionPool(appTypeId: string) {
  const pools = await db.query(`
    SELECT
      atp.permissionId,
      atp.permissionValue,
      p.permCode,
      p.permName,
      p.permissionValue,
      p.permStatus
    FROM sys_app_type_permission atp
    JOIN sys_permission p ON atp.permissionId = p.id
    WHERE atp.appTypeId = ? AND p.permStatus = 1
  `, [appTypeId])

  // 过滤掉 permissionValue 中已删除的操作
  return pools.map(pool => ({
    permissionId: pool.permissionId,
    permCode: pool.permCode,
    permName: pool.permName,
    permissionValue: pool.permissionValue
  }))
}
```

**获取角色权限配置**：

```typescript
// 后端 API：获取角色权限
async function getRolePermissions(roleId: string) {
  const rolePerms = await db.query(`
    SELECT
      rp.permissionId,
      rp.permissionValue,
      p.permCode,
      p.permName,
      p.permStatus
    FROM sys_role_permission rp
    JOIN sys_permission p ON rp.permissionId = p.id
    WHERE rp.roleId = ? AND p.permStatus = 1
  `, [roleId])

  // 过滤掉无效的 permissionValue
  return rolePerms.map(rp => ({
    permissionId: rp.permissionId,
    permCode: rp.permCode,
    permName: rp.permName,
    permissionValue: rp.permissionValue
  }))
}
```

### 配置时清理

**保存权限池配置**：

```typescript
// 后端 API：保存权限池
async function savePermissionPool(appTypeId: string, permissions: PermissionConfig[]) {
  // 获取有效的权限定义
  const validPermissions = await db.query(
    'SELECT id, permCode, permissionValue FROM sys_permission WHERE permStatus = 1'
  )
  const validMap = new Map(validPermissions.map(p => [p.permCode, p]))

  // 过滤并保存 - permissionValue 必须是 Permission.permissionValue 的子集
  const filtered = permissions
    .filter(p => validMap.has(p.permCode))  // 过滤掉不存在的权限
    .map(p => ({
      permissionId: validMap.get(p.permCode)!.id,
      permissionValue: p.permissionValue && ((p.permissionValue & validMap.get(p.permCode)!.permissionValue) === p.permissionValue)
        ? p.permissionValue
        : 0n
    }))

  // 保存过滤后的数据
  await db.transaction(async () => {
    await db.delete('sys_app_type_permission', { appTypeId })
    for (const perm of filtered) {
      await db.insert('sys_app_type_permission', { ...perm, appTypeId })
    }
  })
}
```

### 可选：定时清理孤立配置

```typescript
// 定时任务：每周清理孤立配置
async function cleanupOrphanConfigs() {
  // 清理权限池中的孤立记录
  await db.query(`
    DELETE FROM sys_app_type_permission
    WHERE permissionId NOT IN (SELECT id FROM sys_permission WHERE permStatus = 1)
  `)

  // 清理角色权限中的孤立记录
  await db.query(`
    DELETE FROM sys_role_permission
    WHERE permissionId NOT IN (SELECT id FROM sys_permission WHERE permStatus = 1)
  `)
}

// 每周执行一次
cron.schedule('0 0 * * 0', cleanupOrphanConfigs)
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
| permissionValue 超出范围 | "permissionValue 必须是权限池的子集" |
| 非 PAGE 节点 | "仅 PAGE 节点可配置 permissionValue" |

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v4.0 | 2026-03-28 | 位运算权限设计：pcAction → permissionValue bigint |
| v3.0 | 2026-03-28 | 新增同步功能、permissionValue 配置 |
| v1.0 | - | 初始版本 |

---

*本文档由 PC 权限同步功能方案 v3.0 衍生而来*
