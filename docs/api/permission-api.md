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

---

## 1. 获取权限树

**接口**: `GET /api/v1/permissions/tree`

**使用场景**: 权限管理页面加载，展示权限树表格。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| permissionType | string | 否 | 权限类型：PC / NORMAL |
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
| pcAction | array | 否 | 操作权限列表（仅 PAGE 节点有效） |

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
  pcAction?: Array<{
    name: string;
    permCode: string;
  }>;
}
```

**约束**:
- `nodeType = PAGE` 时，`parentId` 必须指向 `nodeType = MENU` 的节点
- `nodeType = ROOT` 时，不传 `parentId`
- `pcAction` 仅在 `permissionType = PC` 且 `nodeType = PAGE` 时有效

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

**使用场景**: 编辑权限节点基本信息或 pcAction。

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
  pcAction?: Array<{
    name: string;
    permCode: string;
  }>;
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
  pcAction?: Array<{
    name: string;
    permCode: string;
  }>;
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
