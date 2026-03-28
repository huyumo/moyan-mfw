# 应用类型管理接口

> 应用类型管理仅限开发者模式访问（后端路由鉴权）。
>
> **相关页面**: [应用类型管理页面](../pages/app-type-management.md)
>
> **数据结构**: [AppTypeEntity](../database/database-entities-design.md#11-apptypeentity-应用类型实体), [RoleEntity](../database/database-entities-design.md#13-roleentity-角色实体), [PermissionEntity](../database/database-entities-design.md#14-permissionentity-权限实体)
>
> **通用类型**: [PermissionTreeNode, PermissionTreePayload](./types.md#权限树相关)

---

## 接口概览

| 接口 | 方法 | 使用场景 |
|------|------|----------|
| `/api/v1/app-types` | GET | 应用类型列表页加载 |
| `/api/v1/app-types/:id` | GET | 应用类型详情页加载 |
| `/api/v1/app-types/:id` | PUT | 编辑应用类型基本信息 |
| `/api/v1/app-types/:appTypeId/permission-pool` | GET/PUT | 权限池配置面板加载/保存 |
| `/api/v1/app-types/:appTypeId/roles` | GET/POST | 内置角色列表加载/添加角色 |
| `/api/v1/app-types/roles/:id` | PUT/DELETE | 编辑/删除内置角色 |
| `/api/v1/app-types/roles/:id/permissions` | GET/PUT | 角色权限面板加载/保存 |

---

## 1. 获取应用类型列表

**接口**: `GET /api/v1/app-types`

**使用场景**: 应用类型列表页加载。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| typeStatus | number | 否 | 状态筛选：1-启用 0-禁用 |

**返回数据**:

```typescript
{
  code: number;
  data: {
    list: AppType[];      // 见 database-entities-design.md#AppTypeEntity
    total: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}
```

---

## 2. 获取应用类型详情

**接口**: `GET /api/v1/app-types/:id`

**使用场景**: 应用类型详情页加载，展示基本信息、权限池树、内置角色列表。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 应用类型 ID |

**返回数据**:

```typescript
{
  code: number;
  data: {
    // 应用类型基本信息
    id: string;
    typeName: string;
    typeCode: string;
    typeDesc?: string;
    icon?: string;
    multiAppEnabled: number;
    typeStatus: number;
    sortOrder: number;
    createAt: string;
    updateAt?: string;

    // 权限池（树形结构，前端直接用 tree 组件渲染）
    permissionPool: {
      pcTree: PermissionTreeNode[];      // PC 权限树
      normalTree: PermissionTreeNode[];   // 普通权限树
    };

    // 内置角色列表
    builtinRoles: Role[];
  };
  message?: string;
}
```

**PermissionTreeNode 结构**:

```typescript
interface PermissionTreeNode {
  id: string;
  permName: string;
  permCode: string;
  permissionType: 'PC' | 'NORMAL';
  nodeType: 'MENU' | 'PAGE' | 'TAG';
  parentId?: string;
  iconName?: string;
  sortOrder: number;
  // 权限池配置状态
  inPool: boolean;                       // 是否已加入权限池
  // permissionValue 仅在 nodeType=PAGE 且 permissionType=PC 时有效
  permissionValue?: bigint;              // 位运算权限值
  children?: PermissionTreeNode[];
}
```

---

## 3. 更新应用类型

**接口**: `PUT /api/v1/app-types/:id`

**使用场景**: 编辑应用类型基本信息（名称、图标、描述）。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 应用类型 ID |

**请求体** (字段均可选):

```typescript
{
  typeName?: string;
  icon?: string;
  typeDesc?: string;
  typeStatus?: number;
  sortOrder?: number;
}
```

**返回数据**:

```typescript
{
  code: number;
  data: AppType;
  message?: string;
}
```

---

## 4. 权限池配置

### 4.1 获取权限池配置

**接口**: `GET /api/v1/app-types/:appTypeId/permission-pool`

**使用场景**: 权限池配置面板加载，展示已勾选的权限节点和 permissionValue。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appTypeId | string | 是 | 应用类型 ID |

**返回数据**:

```typescript
{
  code: number;
  data: {
    appTypeId: string;
    permissionTrees: {
      pcTree: PermissionTreeNode[];
      normalTree: PermissionTreeNode[];
    };
  };
  message?: string;
}
```

### 4.2 更新权限池配置

**接口**: `PUT /api/v1/app-types/:appTypeId/permission-pool`

**使用场景**: 权限池配置面板保存，提交勾选的权限节点和 permissionValue。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appTypeId | string | 是 | 应用类型 ID |

**请求体**:

```typescript
{
  permissionTrees: {
    pcTree: PermissionTreePayload[];
    normalTree: PermissionTreePayload[];
  };
}

interface PermissionTreePayload {
  permissionId: string;
  checked: boolean;                      // true=加入权限池，false=移除
  permissionValue?: bigint;              // v4.0 新增 - 位运算权限值
  children?: PermissionTreePayload[];
}
```

**返回数据**:

```typescript
{
  code: number;
  data: {
    appTypeId: string;
    updatedCount: number;
  };
  message?: string;
}
```

---

## 5. 内置角色管理

### 5.1 获取内置角色列表

**接口**: `GET /api/v1/app-types/:appTypeId/roles`

**使用场景**: 应用类型详情页的内置角色面板加载。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appTypeId | string | 是 | 应用类型 ID |

**返回数据**:

```typescript
{
  code: number;
  data: Role[];
  message?: string;
}
```

### 5.2 创建内置角色

**接口**: `POST /api/v1/app-types/:appTypeId/roles`

**使用场景**: 添加内置角色。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appTypeId | string | 是 | 应用类型 ID |

**请求体**:

```typescript
{
  roleName: string;
  roleCode: string;
  roleDesc?: string;
  isOwner?: number;
  sortOrder?: number;
}
```

**返回数据**:

```typescript
{
  code: number;
  data: Role;
  message?: string;
}
```

### 5.3 更新内置角色

**接口**: `PUT /api/v1/app-types/roles/:id`

**使用场景**: 编辑内置角色基本信息。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 角色 ID |

**请求体** (字段均可选):

```typescript
{
  roleName?: string;
  roleDesc?: string;
  roleStatus?: number;
  sortOrder?: number;
}
```

**返回数据**:

```typescript
{
  code: number;
  data: Role;
  message?: string;
}
```

### 5.4 删除内置角色

**接口**: `DELETE /api/v1/app-types/roles/:id`

**使用场景**: 删除内置角色。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 角色 ID |

**约束**: `isOwner = 1` 的拥有者角色不允许删除

**返回数据**:

```typescript
{
  code: number;
  data: null;
  message?: string;
}
```

---

## 6. 角色权限配置

### 6.1 获取角色权限配置

**接口**: `GET /api/v1/app-types/roles/:id/permissions`

**使用场景**: 角色权限分配面板加载，展示已分配的权限。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 角色 ID |

**返回数据**:

```typescript
{
  code: number;
  data: {
    roleId: string;
    permissionTrees: {
      pcTree: PermissionTreeNode[];
      normalTree: PermissionTreeNode[];
    };
  };
  message?: string;
}
```

### 6.2 更新角色权限配置

**接口**: `PUT /api/v1/app-types/roles/:id/permissions`

**使用场景**: 角色权限分配面板保存。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 角色 ID |

**请求体**:

```typescript
{
  permissionTrees: {
    pcTree: PermissionTreePayload[];
    normalTree: PermissionTreePayload[];
  };
}

interface PermissionTreePayload {
  permissionId: string;
  checked: boolean;                      // true=分配，false=移除
  permissionValue?: bigint;              // v4.0 新增 - 位运算权限值
  children?: PermissionTreePayload[];
}
```

**返回数据**:

```typescript
{
  code: number;
  data: {
    roleId: string;
    updatedCount: number;
  };
  message?: string;
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本，统一权限池和角色权限的请求体结构 |

---

*本文档由基础设施页面详细设计文档拆分而来*
