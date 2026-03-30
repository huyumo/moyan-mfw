# 角色管理接口

> **相关页面**: [角色管理页面](../pages/role-management.md)
>
> **数据结构**: [RoleEntity](../database/database-entities-design.md#13-roleentity-角色实体), [PermissionEntity](../database/database-entities-design.md#14-permissionentity-权限实体)

---

## 接口概览

| 接口 | 方法 | 使用场景 |
|------|------|----------|
| `/api/v1/roles` | GET | 角色列表页加载 |
| `/api/v1/roles` | POST | 创建应用级角色 |
| `/api/v1/roles/:id` | GET | 获取角色详情 |
| `/api/v1/roles/:id` | PUT | 编辑角色基本信息 |
| `/api/v1/roles/:id` | DELETE | 删除应用级角色 |
| `/api/v1/roles/:id/permissions` | GET | 角色权限面板加载 |
| `/api/v1/roles/:id/permissions` | PUT | 保存角色权限分配 |

**认证要求**:

除特别说明外，本接口所有请求均需在请求头中携带认证 Token：
```
Authorization: Bearer <token>
```

---

## 1. 获取角色列表

**接口**: `GET /api/v1/roles`

**使用场景**: 角色管理列表页加载。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appId | string | 条件必填 | 应用 ID（获取应用级角色） |
| appTypeId | string | 条件必填 | 应用类型 ID（获取内置角色） |
| isBuiltin | number | 否 | 是否内置角色筛选：1-是 0-否 |

**说明**: `appId` 和 `appTypeId` 至少需要一个，用于确定查询范围。

**返回数据**:

```typescript
{
  code: number;
  data: Role[];
  message?: string;
}
```

---

## 2. 创建应用级角色

**接口**: `POST /api/v1/roles`

**使用场景**: 点击新建角色按钮，创建应用级角色。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appId | string | 是 | 应用 ID |
| roleName | string | 是 | 角色名称 |
| roleCode | string | 是 | 角色编码（全局唯一） |
| roleDesc | string | 否 | 角色描述 |
| sortOrder | number | 否 | 排序值 |

```typescript
{
  appId: string;
  roleName: string;
  roleCode: string;
  roleDesc?: string;
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

---

## 3. 获取角色详情

**接口**: `GET /api/v1/roles/:id`

**使用场景**: 获取角色详细信息。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 角色 ID |

**返回数据**:

```typescript
{
  code: number;
  data: Role;
  message?: string;
}
```

---

## 4. 更新角色

**接口**: `PUT /api/v1/roles/:id`

**使用场景**: 编辑应用级角色基本信息。

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

---

## 5. 删除角色

**接口**: `DELETE /api/v1/roles/:id`

**使用场景**: 删除应用级角色。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 角色 ID |

**约束**:
- `isOwner = 1` 的拥有者角色不允许删除
- 内置角色 (`isBuiltin = 1`) 只能在应用类型管理页面删除

**返回数据**:

```typescript
{
  code: number;
  data: null;
  message?: string;
}
```

---

## 6. 获取角色权限配置

**接口**: `GET /api/v1/roles/:id/permissions`

**使用场景**: 点击角色的"分配权限"按钮，打开权限分配面板时加载。

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

**PermissionTreeNode 结构**: 见 [types.md#权限树相关](./types.md#权限树相关)

---

## 7. 更新角色权限配置

**接口**: `PUT /api/v1/roles/:id/permissions`

**使用场景**: 权限分配面板保存，提交分配的权限和 permissionValue。

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
  assigned: boolean;                       // true=分配，false=移除
  permissionValue?: bigint;                // v4.0 新增 - 位运算权限值
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
| 4.0.0 | 2026-03-28 | 位运算权限设计：PermissionTreePayload 新增 permissionValue 字段 |
| 1.0.0 | 2026-03-26 | 初始版本 |

---

*本文档由基础设施页面详细设计文档拆分而来*
