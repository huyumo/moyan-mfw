# PC 权限同步功能方案设计

**文档编号**: PLAN-PC-SYNC-2026-0328
**版本**: v1.0 草案
**编制日期**: 2026-03-28
**编制人**: 技术团队 (@tech-lead, @backend, @frontend)
**审核人**: @pm

---

## 1. 需求概述

### 1.1 背景

当前 PC 权限管理系统中，权限树数据需要手动录入创建，存在以下问题：
- 重复劳动：需同时维护路由配置和权限树两份数据
- 数据不一致：容易出现有权限无菜单或有菜单无权限的情况
- 维护成本高：路由变更后需手动同步更新权限树

### 1.2 目标

实现 PC 权限树与前端路由自动同步，减少手动维护成本，确保数据一致性。

### 1.3 核心需求

| 需求 | 说明 | 优先级 |
|------|------|--------|
| 路由同步 | 点击同步按钮，从前端路由生成权限树 | P0 |
| 自动比对 | 启动时自动比对路由与权限树差异 | P0 |
| 权限树只读 | 同步后的权限树不允许编辑结构 | P0 |
| pcAction 可编辑 | 可对叶子节点的 pcAction 进行增删改 | P0 |
| 手动补充 | 支持手动添加特殊权限（不在路由中） | P1 |
| 数据迁移 | 已有权限数据迁移到新结构 | P1 |

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用层                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 路由配置文件 │  │ 同步按钮组件 │  │ 权限树组件  │             │
│  │ (router.ts) │  │(SyncButton) │  │(只读 Tree)  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          │ HTTP           │ HTTP           │
          │ GET /routes    │ POST /sync     │ GET /tree
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API 网关层                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ /api/routes     │  │ /api/sync       │  │ /api/permission │ │
│  │ 获取路由配置     │  │ 同步权限树       │  │ 权限 CRUD       │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        服务层                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ RouteService    │  │ SyncService     │  │PermissionService│ │
│  │ - parseRoutes   │  │ - compare       │  │ - treeBuilder   │ │
│  │ - buildTree     │  │ - sync          │  │ - actionManager │ │
│  │                 │  │ - migrate       │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据持久层                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ sys_permission (新增 is_auto_sync, route_path 字段)        ││
│  │ sys_pc_action (不变)                                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
1. 同步流程：
   用户点击同步 → 读取路由配置 → 解析构建树 → 比对差异 → 用户确认 → 写入数据库

2. 展示流程：
   页面加载 → 请求权限树 → 构建只读树形 → 渲染节点 → 加载 pcAction

3. 比对流程：
   应用启动 → 请求比对接口 → 返回差异列表 → 提示用户 → 选择同步/忽略
```

---

## 3. 数据库设计

### 3.1 表结构变更

#### sys_permission 表

| 字段 | 类型 | 说明 | 变更类型 |
|------|------|------|----------|
| id | BIGINT | 主键 | 不变 |
| parent_id | BIGINT | 父节点 ID | 不变 |
| name | VARCHAR(100) | 节点名称 | 不变 |
| route_path | VARCHAR(255) | 路由 path | **新增** |
| route_name | VARCHAR(100) | 路由 name | **新增** |
| component | VARCHAR(255) | 组件路径 | 不变 |
| sort | INT | 排序 | 不变 |
| is_auto_sync | TINYINT(1) | 是否自动同步生成 | **新增** |
| is_editable | TINYINT(1) | 是否可编辑（手动添加的节点） | **新增** |
| created_at | DATETIME | 创建时间 | 不变 |
| updated_at | DATETIME | 更新时间 | 不变 |

#### sys_pc_action 表

| 字段 | 类型 | 说明 | 变更类型 |
|------|------|------|----------|
| id | BIGINT | 主键 | 不变 |
| permission_id | BIGINT | 所属权限节点 ID | 不变 |
| action_name | VARCHAR(100) | 权限名称 (如 user:view) | 不变 |
| action_type | VARCHAR(50) | 操作类型 (view/create/edit/delete) | 不变 |
| description | VARCHAR(255) | 描述 | 不变 |
| is_active | TINYINT(1) | 是否启用 | 不变 |
| created_at | DATETIME | 创建时间 | 不变 |
| updated_at | DATETIME | 更新时间 | 不变 |

### 3.2 字段说明

**is_auto_sync**:
- `1`: 自动同步生成（节点结构只读）
- `0`: 手动创建（节点结构可编辑）

**is_editable**:
- `1`: 允许编辑节点信息（手动添加的特殊权限）
- `0`: 不允许编辑节点信息（同步生成的节点）

### 3.3 迁移脚本

```sql
-- 1. 添加新字段
ALTER TABLE sys_permission
ADD COLUMN route_path VARCHAR(255) COMMENT '路由 path' AFTER name,
ADD COLUMN route_name VARCHAR(100) COMMENT '路由 name' AFTER route_path,
ADD COLUMN is_auto_sync TINYINT(1) DEFAULT 0 COMMENT '是否自动同步生成' AFTER sort,
ADD COLUMN is_editable TINYINT(1) DEFAULT 1 COMMENT '是否可编辑' AFTER is_auto_sync;

-- 2. 已有数据标记为手动创建（可编辑）
UPDATE sys_permission SET is_auto_sync = 0, is_editable = 1 WHERE id > 0;

-- 3. 添加索引
CREATE INDEX idx_route_path ON sys_permission(route_path);
CREATE INDEX idx_auto_sync ON sys_permission(is_auto_sync);
```

---

## 4. API 接口设计

### 4.1 获取路由配置

**请求**:
```
GET /api/routes
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "routes": [
      {
        "path": "/system",
        "name": "System",
        "component": "Layout",
        "meta": {
          "title": "系统管理",
          "icon": "setting"
        },
        "children": [
          {
            "path": "/system/user",
            "name": "UserManage",
            "component": "system/user/index",
            "meta": {
              "title": "用户管理",
              "icon": "user"
            },
            "actions": ["view", "create", "edit", "delete"]
          }
        ]
      }
    ]
  }
}
```

### 4.2 同步权限树

**请求**:
```
POST /api/permission/sync
Content-Type: application/json

{
  "dryRun": true,  // true=仅预览差异，false=执行同步
  "strategy": "merge"  // merge=合并，replace=替换
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "synced": true,
    "summary": {
      "added": 5,
      "removed": 2,
      "updated": 3
    },
    "details": [
      {
        "type": "add",
        "path": "/system/role",
        "name": "角色管理",
        "message": "新增节点"
      },
      {
        "type": "remove",
        "path": "/system/old",
        "name": "旧菜单",
        "message": "路由已删除"
      }
    ],
    "preview": [
      {
        "path": "/system",
        "name": "系统管理",
        "status": "unchanged"
      },
      {
        "path": "/system/user",
        "name": "用户管理",
        "status": "added"
      }
    ]
  }
}
```

### 4.3 比对差异

**请求**:
```
GET /api/permission/compare
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "hasDiff": true,
    "diffCount": 3,
    "diffs": [
      {
        "type": "missing",
        "path": "/system/role",
        "name": "角色管理",
        "suggestion": "添加到权限树"
      },
      {
        "type": "extra",
        "path": "/old/menu",
        "name": "旧菜单",
        "suggestion": "从权限树移除"
      },
      {
        "type": "mismatch",
        "path": "/system/user",
        "name": "用户管理",
        "diff": {
          "routeTitle": "用户管理",
          "permissionTitle": "用户管理 V1"
        },
        "suggestion": "更新节点名称"
      }
    ]
  }
}
```

### 4.4 获取权限树

**请求**:
```
GET /api/permission/tree
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "tree": [
      {
        "id": 1,
        "name": "系统管理",
        "path": "/system",
        "is_auto_sync": 1,
        "is_editable": 0,
        "children": [
          {
            "id": 2,
            "name": "用户管理",
            "path": "/system/user",
            "is_auto_sync": 1,
            "is_editable": 0,
            "pcActions": [
              {
                "id": 101,
                "actionName": "user:view",
                "actionType": "view",
                "is_active": true
              },
              {
                "id": 102,
                "actionName": "user:create",
                "actionType": "create",
                "is_active": true
              }
            ],
            "children": []
          }
        ]
      }
    ],
    "manualNodes": [
      {
        "id": 99,
        "name": "特殊权限",
        "path": "manual_001",
        "is_auto_sync": 0,
        "is_editable": 1,
        "pcActions": [],
        "children": []
      }
    ]
  }
}
```

### 4.5 pcAction 管理

#### 4.5.1 添加 pcAction

**请求**:
```
POST /api/permission/:permissionId/actions
Content-Type: application/json

{
  "actionName": "user:export",
  "actionType": "export",
  "description": "导出用户数据",
  "is_active": true
}
```

#### 4.5.2 编辑 pcAction

**请求**:
```
PUT /api/permission/:permissionId/actions/:actionId
Content-Type: application/json

{
  "actionName": "user:export",
  "description": "导出用户数据和报表",
  "is_active": true
}
```

#### 4.5.3 删除 pcAction

**请求**:
```
DELETE /api/permission/:permissionId/actions/:actionId
```

---

## 5. 前端实现方案

### 5.1 组件结构

```
src/views/permission/
├── index.vue              # PC 权限管理主页面
├── components/
│   ├── PermissionTree.vue # 权限树组件（只读）
│   ├── SyncButton.vue     # 同步按钮组件
│   ├── DiffPreview.vue    # 差异预览组件
│   ├── PcActionList.vue   # pcAction 列表组件
│   └── PcActionForm.vue   # pcAction 表单组件
└── composables/
    ├── usePermissionSync.ts   # 同步逻辑
    ├── usePermissionTree.ts   # 树形逻辑
    └── usePcAction.ts         # pcAction 逻辑
```

### 5.2 同步按钮组件

```vue
<template>
  <div class="sync-button-group">
    <el-button
      type="primary"
      @click="handleSync"
      :loading="syncing"
    >
      同步路由
    </el-button>

    <el-badge :value="diffCount" :hidden="diffCount === 0">
      <el-button @click="handleCompare">
        检查差异
      </el-button>
    </el-badge>

    <!-- 差异预览弹窗 -->
    <DiffPreview
      v-model:visible="previewVisible"
      :diffs="diffs"
      @confirm="confirmSync"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { compareRoutes, syncPermissions } from '@/api/permission'

const syncing = ref(false)
const diffCount = ref(0)
const diffs = ref([])
const previewVisible = ref(false)

onMounted(async () => {
  // 启动时自动比对
  const res = await compareRoutes()
  if (res.data.hasDiff) {
    diffCount.value = res.data.diffCount
  }
})

const handleCompare = async () => {
  const res = await compareRoutes()
  diffs.value = res.data.diffs
  diffCount.value = res.data.diffCount
  previewVisible.value = true
}

const handleSync = async () => {
  // 先预览差异
  await handleCompare()
}

const confirmSync = async (strategy: 'merge' | 'replace') => {
  syncing.value = true
  try {
    await syncPermissions({ dryRun: false, strategy })
    ElMessage.success('同步成功')
    emit('refresh')
  } catch (e) {
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
    previewVisible.value = false
  }
}
</script>
```

### 5.3 权限树组件（只读）

```vue
<template>
  <div class="permission-tree-container">
    <div class="tree-header">
      <span class="title">权限树（只读）</span>
      <el-tooltip content="同步生成的节点不可编辑结构，可手动添加特殊权限">
        <el-icon><Info-Filled /></el-icon>
      </el-tooltip>
    </div>

    <el-tree
      :data="treeData"
      :props="treeProps"
      :expand-on-click-node="false"
      node-key="id"
      default-expand-all
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <span class="node-name">{{ node.label }}</span>
          <span class="node-path">{{ data.path }}</span>
          <el-tag
            v-if="data.is_auto_sync"
            size="small"
            type="info"
          >
            同步
          </el-tag>
          <el-tag
            v-else
            size="small"
            type="warning"
          >
            手动
          </el-tag>
        </div>
      </template>
    </el-tree>

    <!-- 手动添加节点区域 -->
    <div class="manual-section">
      <el-divider>手动添加的权限</el-divider>
      <el-button
        type="primary"
        size="small"
        @click="showAddManualDialog"
      >
        + 添加特殊权限
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPermissionTree } from '@/api/permission'
import { ref, onMounted } from 'vue'

const treeData = ref([])
const treeProps = {
  children: 'children',
  label: 'name'
}

onMounted(async () => {
  const res = await getPermissionTree()
  treeData.value = res.data.tree
})
</script>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-path {
  font-size: 12px;
  color: #999;
}

.manual-section {
  margin-top: 20px;
  padding: 16px;
  border: 1px dashed #ddd;
}
</style>
```

### 5.4 pcAction 管理组件

```vue
<template>
  <div class="pc-action-panel">
    <div class="panel-header">
      <span class="title">操作权限 (pcAction)</span>
      <el-button type="primary" size="small" @click="showAddAction">
        + 添加操作权限
      </el-button>
    </div>

    <el-table :data="actions" border>
      <el-table-column prop="actionName" label="权限标识" />
      <el-table-column prop="actionType" label="类型">
        <template #default="{ row }">
          <el-tag :type="getActionTypeColor(row.actionType)">
            {{ row.actionType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="is_active" label="状态">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_active"
            @change="toggleActionStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="editAction(row)">编辑</el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteAction(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
```

---

## 6. 同步逻辑详细设计

### 6.1 同步流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        同步流程                                 │
└─────────────────────────────────────────────────────────────────┘

  用户点击同步按钮
         │
         ▼
  ┌─────────────────┐
  │ 1. 读取路由配置 │
  │ GET /api/routes │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 2. 解析路由树    │
  │ RouteService    │
  │ - parseRoutes() │
  │ - buildTree()   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 3. 获取当前权限树 │
  │ GET /tree       │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 4. 比对差异      │
  │ - 新增节点       │
  │ - 删除节点       │
  │ - 更新节点       │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 5. 展示差异预览   │
  │ (dryRun=true)   │
  └────────┬────────┘
           │
           ▼
     用户确认同步？
           │
    ┌──────┴──────┐
    │             │
   是            否
    │             │
    ▼             ▼
  ┌─────────┐   结束
  │6.执行同步 │
  │SyncService│
  │- compare()│
  │- sync()   │
  └─────┬─────┘
        │
        ▼
  ┌─────────────────┐
  │ 7. 写入数据库    │
  │ - 插入新节点     │
  │ - 标记删除节点   │
  │ - 更新变更节点   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 8. 返回结果      │
  │ - 同步成功/失败  │
  │ - 变更统计       │
  └─────────────────┘
```

### 6.2 比对算法

```typescript
interface RouteNode {
  path: string
  name: string
  children?: RouteNode[]
}

interface PermissionNode {
  id: number
  path: string
  name: string
  is_auto_sync: number
  children?: PermissionNode[]
}

interface DiffResult {
  type: 'add' | 'remove' | 'update'
  route?: RouteNode
  permission?: PermissionNode
  message: string
}

/**
 * 比对路由树和权限树
 */
function compareTrees(
  routes: RouteNode[],
  permissions: PermissionNode[]
): DiffResult[] {
  const diffs: DiffResult[] = []

  // 1. 查找新增节点（路由存在，权限不存在）
  const routeMap = buildPathMap(routes)
  const permissionMap = buildPathMap(permissions)

  for (const [path, route] of routeMap.entries()) {
    if (!permissionMap.has(path)) {
      diffs.push({
        type: 'add',
        route,
        message: `新增节点：${route.name} (${path})`
      })
    }
  }

  // 2. 查找删除节点（权限存在且为同步生成，路由不存在）
  for (const [path, permission] of permissionMap.entries()) {
    if (!routeMap.has(path) && permission.is_auto_sync === 1) {
      diffs.push({
        type: 'remove',
        permission,
        message: `删除节点：${permission.name} (${path})`
      })
    }
  }

  // 3. 查找更新节点（名称变更）
  for (const [path, route] of routeMap.entries()) {
    const permission = permissionMap.get(path)
    if (permission && permission.name !== route.name) {
      diffs.push({
        type: 'update',
        route,
        permission,
        message: `更新节点：${permission.name} → ${route.name}`
      })
    }
  }

  return diffs
}
```

### 6.3 同步策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| merge（合并） | 仅新增缺失节点，不删除已有节点 | 首次同步、增量更新 |
| replace（替换） | 完全替换，删除路由中不存在的节点 | 重构后重新同步 |

### 6.4 手动添加节点处理

```typescript
// 手动添加的节点标记
interface ManualPermissionNode {
  id: number
  path: string  // manual_001, manual_002...
  name: string
  is_auto_sync: 0  // 手动添加
  is_editable: 1   // 可编辑
  parent_id: number | null
}

// 同步时保留手动节点
function syncWithManualNodes(routes: RouteNode[], manualNodes: ManualPermissionNode[]) {
  const syncedTree = buildTreeFromRoutes(routes)

  // 将手动节点挂载到对应位置或根节点
  for (const manual of manualNodes) {
    if (manual.parent_id) {
      // 挂载到指定父节点
      attachToParent(syncedTree, manual)
    } else {
      // 作为根节点
      syncedTree.push(manual)
    }
  }

  return syncedTree
}
```

---

## 7. 数据迁移方案

### 7.1 迁移策略

| 数据类型 | 迁移策略 | 说明 |
|----------|----------|------|
| 已有权限节点 | 标记为手动创建 | `is_auto_sync=0, is_editable=1` |
| 已有 pcAction | 保留不变 | 保持现有关联关系 |
| 已有角色权限 | 保留不变 | 不影响现有权限分配 |

### 7.2 迁移步骤

```sql
-- Step 1: 备份数据
CREATE TABLE sys_permission_backup AS SELECT * FROM sys_permission;
CREATE TABLE sys_pc_action_backup AS SELECT * FROM sys_pc_action;

-- Step 2: 添加新字段（见 3.3 迁移脚本）

-- Step 3: 标记已有数据
UPDATE sys_permission
SET is_auto_sync = 0,
    is_editable = 1
WHERE id > 0;

-- Step 4: 验证
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN is_auto_sync = 0 THEN 1 ELSE 0 END) as manual,
  SUM(CASE WHEN is_auto_sync = 1 THEN 1 ELSE 0 END) as auto
FROM sys_permission;
```

### 7.3 回滚方案

```sql
-- 如有问题，回滚数据
DROP TABLE sys_permission;
DROP TABLE sys_pc_action;

RENAME TABLE sys_permission_backup TO sys_permission;
RENAME TABLE sys_pc_action_backup TO sys_pc_action;
```

---

## 8. 实施计划

### 8.1 任务分解

| 阶段 | 任务 | 负责人 | 工时 | 依赖 |
|------|------|--------|------|------|
| 1 | 数据库表结构变更 | @backend | 2h | - |
| 2 | 后端 API 开发-基础接口 | @backend | 4h | 1 |
| 3 | 后端 API 开发-同步接口 | @backend | 4h | 1 |
| 4 | 后端 API 开发-比对接口 | @backend | 2h | 1 |
| 5 | 前端组件-SyncButton | @frontend | 2h | - |
| 6 | 前端组件-PermissionTree | @frontend | 4h | - |
| 7 | 前端组件-DiffPreview | @frontend | 3h | - |
| 8 | 前端组件-PcAction 管理 | @frontend | 4h | - |
| 9 | 前后端联调 | @backend, @frontend | 4h | 2-8 |
| 10 | 数据迁移 | @backend | 2h | 1 |
| 11 | 测试用例编写 | @qa | 4h | 9 |
| 12 | 文档编写 | @doc | 2h | 9 |

### 8.2 里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: 数据库就绪 | Day 1 | 表结构变更完成 |
| M2: API 完成 | Day 3 | 所有接口可用 |
| M3: 前端完成 | Day 5 | 所有组件可用 |
| M4: 联调完成 | Day 6 | 端到端可用 |
| M5: 测试通过 | Day 7 | 测试报告 |
| M6: 上线发布 | Day 8 | 正式发布 |

### 8.3 风险评估

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 路由格式不统一 | 中 | 高 | 制定路由规范，增加格式校验 |
| 大量历史数据迁移 | 低 | 中 | 分批迁移，提供回滚方案 |
| 前端组件兼容性问题 | 中 | 低 | 充分测试，保留降级方案 |
| 同步导致权限丢失 | 低 | 高 | merge 策略优先，人工确认 |

---

## 9. 验收标准

### 9.1 功能验收

| 编号 | 验收项 | 标准 |
|------|--------|------|
| F1 | 路由同步功能 | 点击同步按钮，正确生成权限树 |
| F2 | 自动比对功能 | 启动时自动检测差异并提示 |
| F3 | 权限树只读 | 同步节点不可编辑结构 |
| F4 | pcAction 可编辑 | 可对 pcAction 进行增删改 |
| F5 | 手动添加节点 | 支持添加特殊权限节点 |
| F6 | 差异预览 | 同步前展示变更预览 |

### 9.2 性能验收

| 编号 | 验收项 | 标准 |
|------|--------|------|
| P1 | 同步接口响应 | < 3s (1000 节点内) |
| P2 | 比对接口响应 | < 1s |
| P3 | 树形加载响应 | < 2s |

### 9.3 数据验收

| 编号 | 验收项 | 标准 |
|------|--------|------|
| D1 | 数据迁移完整 | 迁移后数据无丢失 |
| D2 | 回滚有效 | 回滚后数据一致 |

---

## 10. 附录

### 10.1 术语表

| 术语 | 说明 |
|------|------|
| pcAction | 权限操作，如 user:view、user:create |
| 权限树 | 树形结构的权限节点 |
| 同步 | 从路由配置生成/更新权限树 |
| 比对 | 比较路由和权限树的差异 |

### 10.2 参考文档

- [现有权限系统设计](./core/permissions.md)
- [数据库设计](./database/database-entities-design.md)
- [API 接口文档](./api/api-index.md)

---

**文档版本**: v1.0 草案
**待办**: 等待老板评审确认
