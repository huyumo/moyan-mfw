# 权限管理接口

> **相关页面**: [权限管理页面](../pages/permission-management.md)
>
> **数据结构**: [PermissionEntity](../database/database-entities-design.md#14-permissionentity-权限实体)
>
> **通用类型**: [PermissionTreeNode, PermissionTreePayload](./types.md#权限树相关)

---

## 接口概览

| 接口 | 方法 | 使用场景 |
|------|------|----------|
| `/api/v1/permissions/tree` | GET | 加载权限树 |
| `/api/v1/permissions` | POST | 创建权限节点 |
| `/api/v1/permissions/:id` | GET | 获取权限详情 |
| `/api/v1/permissions/:id` | PUT | 更新权限节点 |
| `/api/v1/permissions/:id` | DELETE | 删除权限节点 |
| `/api/v1/permissions/sync` | POST | 同步路由到权限树（新增） |
| `/api/v1/permissions/compare` | GET | 比对路由与权限树差异（新增） |

**认证要求**:

除特别说明外，本接口所有请求均需在请求头中携带认证 Token：
```
Authorization: Bearer <token>
```

---

## 1. 获取权限树

**接口**: `GET /api/v1/permissions/tree`

**使用场景**: 权限管理页面加载，或用户选择应用后获取该应用的权限树。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appTypeId | string | 是 | 应用类型 ID（权限按应用类型隔离） |
| permissionType | string | 否 | 权限类型：PC / NORMAL，默认 PC |
| keyword | string | 否 | 关键词过滤 |

**返回数据**:

```typescript
{
  code: number;
  data: PermissionTreeNode[];
  message?: string;
}
```

---

## 2. 创建权限节点

**接口**: `POST /api/v1/permissions`

**使用场景**: 点击新建根节点或新建子节点按钮，填写表单后保存。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| permName | string | 是 | 权限名称 |
| permCode | string | 是 | 权限编码（全局唯一） |
| permissionType | string | 是 | 权限类型：PC / NORMAL |
| nodeType | string | 是 | 节点类型：MENU / PAGE / TAG |
| parentId | string | 否 | 父节点 ID（根节点不传） |
| permDesc | string | 否 | 权限描述 |
| routePath | string | 否 | 路由路径 |
| componentPath | string | 否 | 组件路径 |
| iconName | string | 否 | 图标名称 |
| sortOrder | number | 否 | 排序值 |
| isVisible | number | 否 | 是否可见：1-是 0-否 |
| isCache | number | 否 | 是否缓存：1-是 0-否 |
| showMode | string | 否 | 显示模式：NORMAL / DEV |
| permStatus | number | 否 | 状态：1-启用 0-禁用 |
| permissionValue | bigint | 否 | 位运算权限值（PC 权限的 PAGE 节点、普通权限的 TAG 节点有效），如 7n = ADD\|EDIT\|DELETE |

```typescript
{
  permName: string;
  permCode: string;
  permissionType: 'PC' | 'NORMAL';
  nodeType: 'MENU' | 'PAGE' | 'TAG';
  parentId?: string;
  permDesc?: string;
  routePath?: string;
  componentPath?: string;
  iconName?: string;
  sortOrder?: number;
  isVisible?: number;
  isCache?: number;
  showMode?: 'NORMAL' | 'DEV';
  permStatus?: number;
  permissionValue?: bigint;      // v4.0 新增 - 位运算权限值，如 7n = ADD|EDIT|DELETE
}
```

**约束**:
- `nodeType = PAGE` 时，`parentId` 必须指向 `nodeType = MENU` 的节点
- `nodeType = TAG` 时，`parentId` 必须指向 `nodeType = MENU` 的节点
- 创建根节点时，不传 `parentId`
- `permissionValue` 在 `permissionType = PC` 且 `nodeType = PAGE` 时有效（PC 页面权限）
- `permissionValue` 在 `permissionType = NORMAL` 且 `nodeType = TAG` 时有效（普通权限标签）

**返回数据**:

```typescript
{
  code: number;
  data: Permission;
  message?: string;
}
```

---

## 3. 获取权限详情

**接口**: `GET /api/v1/permissions/:id`

**使用场景**: 编辑权限节点前获取详情。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 权限 ID |

**返回数据**:

```typescript
{
  code: number;
  data: Permission;
  message?: string;
}
```

---

## 4. 更新权限节点

**接口**: `PUT /api/v1/permissions/:id`

**使用场景**: 编辑权限节点基本信息或 permissionValue。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 权限 ID |

**请求体** (字段均可选):

```typescript
{
  permName?: string;
  permDesc?: string;
  routePath?: string;
  componentPath?: string;
  iconName?: string;
  sortOrder?: number;
  isVisible?: number;
  isCache?: number;
  showMode?: 'NORMAL' | 'DEV';
  permStatus?: number;
  permissionValue?: bigint;      // v4.0 新增 - 位运算权限值
}
```

**约束**:
- `permCode` 不允许修改
- `permissionType` 和 `nodeType` 不允许修改
- `parentId` 不允许修改（如需调整层级，先删除后创建）

**返回数据**:

```typescript
{
  code: number;
  data: Permission;
  message?: string;
}
```

---

## 5. 删除权限节点

**接口**: `DELETE /api/v1/permissions/:id`

**使用场景**: 删除权限节点。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 权限 ID |

**约束**:
- 级联删除所有子节点
- 已用于权限池配置的权限节点不允许删除（或先提示解除关联）

**返回数据**:

```typescript
{
  code: number;
  data: null;
  message?: string;
}
```

---

## 6. 同步路由到权限树

**接口**: `POST /api/v1/permissions/sync`

**使用场景**: 在 PC 权限管理页面点击"同步路由"按钮，将前端路由配置同步到权限树。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dryRun | boolean | 否 | 是否仅预览：true=预览，false=执行，默认 false |

```typescript
{
  dryRun?: boolean;
}
```

**返回数据**:

```typescript
{
  code: number;
  data: {
    synced: boolean;
    summary: {
      added: number;
      updated: number;
      unchanged: number;
    };
    details: Array<{
      type: 'add' | 'update' | 'unchanged';
      permCode: string;
      permName: string;
      nodeType: 'MENU' | 'PAGE';
      routePath: string;
      message?: string;
    }>;
  };
  message?: string;
}
```

**业务规则**:
- 仅同步 PC 权限，不影响 NORMAL 权限
- 同步生成权限树结构，permissionValue 为 0n
- 路由新增 → 添加权限节点
- 路由删除 → 标记 `permStatus=0`（不物理删除）
- 路由名称变更 → 更新 `permName`

---

## 7. 比对路由与权限树差异

**接口**: `GET /api/v1/permissions/compare`

**使用场景**: 在 PC 权限管理页面点击"检查差异"按钮，或在应用启动时自动检测。

**返回数据**:

```typescript
{
  code: number;
  data: {
    hasDiff: boolean;
    diffCount: number;
    diffs: Array<{
      type: 'missing' | 'mismatch' | 'extra';
      permCode?: string;
      permName?: string;
      routePath?: string;
      suggestedPermCode?: string;
      suggestion: string;
    }>;
  };
  message?: string;
}
```

**差异类型说明**:

| 类型 | 说明 | 建议操作 |
|------|------|----------|
| missing | 路由存在，权限不存在 | 添加权限节点 |
| mismatch | 路由与权限名称不一致 | 更新权限名称 |
| extra | 权限存在，路由已删除 | 禁用权限节点 |

---

## 数据结构

### Permission

```typescript
interface Permission {
  id: string;
  permName: string;
  permCode: string;
  permDesc?: string;
  permissionType: 'PC' | 'NORMAL';
  nodeType: 'MENU' | 'PAGE' | 'TAG';
  parentId?: string;
  routePath?: string;
  componentPath?: string;
  iconName?: string;
  sortOrder: number;
  isVisible: number;
  isCache: number;
  showMode: 'NORMAL' | 'DEV';
  permStatus: number;
  permissionValue?: bigint;        // v4.0 新增 - 位运算权限值
  createAt: string;
  updateAt?: string;
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |

---

*本文档由基础设施页面详细设计文档拆分而来*
