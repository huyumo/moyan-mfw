# API 开发文档

> 版本：1.0.0
> 制定日期：2026-03-28

---

## 1. API 概述

### 1.1 接口规范

**基础 URL**: `/api`

**响应格式**:
```typescript
// 成功响应
{
  "code": 0,
  "data": { /* 业务数据 */ },
  "message": "success"
}

// 错误响应
{
  "code": 10001,
  "data": null,
  "message": "参数错误",
  "details": { /* 详细错误信息 */ }
}
```

**认证方式**:
```
Authorization: Bearer <jwt_token>
```

### 1.2 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 10001 | 参数错误 |
| 40001 | 未认证 |
| 40003 | 无权限 |
| 40004 | 资源不存在 |
| 50000 | 服务器内部错误 |

---

## 2. 认证模块

### 2.1 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expiresIn": 7200,
    "user": {
      "id": "uuid",
      "username": "admin",
      "nickname": "管理员",
      "avatar": "https://...",
      "isDeveloper": 1
    }
  }
}
```

### 2.2 用户登出

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### 2.3 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "username": "admin",
    "nickname": "管理员",
    "avatar": "https://...",
    "phone": "13800138000",
    "email": "admin@example.com",
    "gender": 1,
    "isDeveloper": 1
  }
}
```

### 2.4 获取用户权限树

```http
GET /api/auth/permissions?appCode=oa
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "appCode": "oa",
    "appName": "OA 系统",
    "permissions": [
      {
        "id": "uuid",
        "permCode": "system",
        "permName": "系统管理",
        "permissionType": "PC",
        "nodeType": "MENU",
        "iconName": "Setting",
        "routePath": "/system",
        "children": [
          {
            "id": "uuid",
            "permCode": "system/user-list",
            "permName": "用户管理",
            "permissionType": "PC",
            "nodeType": "PAGE",
            "routePath": "/system/user-list",
            "permissionValue": "7",
            "iconName": "User"
          }
        ]
      }
    ]
  }
}
```

---

## 3. 应用类型模块

### 3.1 获取应用类型列表

```http
GET /api/app-types?page=1&pageSize=20&status=1
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "total": 10,
    "list": [
      {
        "id": "uuid",
        "typeName": "OA 系统",
        "typeCode": "oa",
        "typeDesc": "办公自动化系统",
        "icon": "OfficeBuilding",
        "multiAppEnabled": 1,
        "typeStatus": 1,
        "sortOrder": 1,
        "createAt": "2026-03-28T00:00:00.000Z",
        "updateAt": "2026-03-28T00:00:00.000Z"
      }
    ]
  }
}
```

### 3.2 创建应用类型

```http
POST /api/app-types
Content-Type: application/json
Authorization: Bearer <token>

{
  "typeName": "CRM 系统",
  "typeCode": "crm",
  "typeDesc": "客户关系管理系统",
  "icon": "UserFilled",
  "multiAppEnabled": 1
}
```

### 3.3 更新应用类型

```http
PUT /api/app-types/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "typeName": "CRM 系统（新版）",
  "typeDesc": "客户关系管理系统 - 升级版",
  "icon": "User"
}
```

### 3.4 删除应用类型

```http
DELETE /api/app-types/{id}
Authorization: Bearer <token>
```

### 3.5 获取权限池配置

```http
GET /api/app-types/{id}/permissions
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "permissionId": "perm-uuid",
      "appTypeId": "app-type-uuid",
      "permission": {
        "id": "perm-uuid",
        "permCode": "system/user-list",
        "permName": "用户管理",
        "permissionType": "PC",
        "nodeType": "PAGE"
      },
      "permissionValue": "7",
      "createAt": "2026-03-28T00:00:00.000Z"
    }
  ]
}
```

### 3.6 配置权限池

```http
PUT /api/app-types/{id}/permissions
Content-Type: application/json
Authorization: Bearer <token>

{
  "permissions": [
    {
      "permissionId": "perm-uuid-1",
      "permissionValue": "7"
    },
    {
      "permissionId": "perm-uuid-2",
      "permissionValue": "15"
    }
  ]
}
```

### 3.7 获取内置角色列表

```http
GET /api/app-types/{id}/builtin-roles
Authorization: Bearer <token>
```

### 3.8 创建内置角色

```http
POST /api/app-types/{id}/builtin-roles
Content-Type: application/json
Authorization: Bearer <token>

{
  "roleName": "运营专员",
  "roleCode": "crm-operator",
  "roleDesc": "负责日常运营操作",
  "isOwner": 0
}
```

---

## 4. 应用实例模块

### 4.1 获取应用实例列表

```http
GET /api/apps?page=1&pageSize=20&appTypeId=uuid&status=1
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "total": 5,
    "list": [
      {
        "id": "uuid",
        "appTypeId": "app-type-uuid",
        "appType": {
          "typeName": "OA 系统",
          "typeCode": "oa"
        },
        "appName": "OA 系统 - 北京分公司",
        "appCode": "oa-beijing",
        "appDesc": "北京分公司办公系统",
        "appLogo": "https://...",
        "ownerId": "user-uuid",
        "owner": {
          "id": "user-uuid",
          "username": "zhangsan",
          "nickname": "张三"
        },
        "appStatus": 1,
        "sortOrder": 1,
        "createAt": "2026-03-28T00:00:00.000Z"
      }
    ]
  }
}
```

### 4.2 创建应用实例

```http
POST /api/apps
Content-Type: application/json
Authorization: Bearer <token>

{
  "appTypeId": "app-type-uuid",
  "appName": "OA 系统 - 上海分公司",
  "appCode": "oa-shanghai",
  "appDesc": "上海分公司办公系统",
  "ownerId": "user-uuid",
  "sortOrder": 1
}
```

### 4.3 更新应用实例

```http
PUT /api/apps/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "appName": "OA 系统 - 上海分公司（新版）",
  "appDesc": "上海分公司办公系统 - 升级版",
  "appLogo": "https://...",
  "sortOrder": 2
}
```

### 4.4 变更拥有者

```http
PUT /api/apps/{id}/owner
Content-Type: application/json
Authorization: Bearer <token>

{
  "newOwnerId": "new-user-uuid"
}
```

### 4.5 获取成员列表

```http
GET /api/apps/{id}/members
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "user": {
        "id": "user-uuid",
        "username": "zhangsan",
        "nickname": "张三",
        "avatar": "https://..."
      },
      "roles": [
        {
          "id": "role-uuid",
          "roleName": "普通用户"
        }
      ],
      "createAt": "2026-03-28T00:00:00.000Z"
    }
  ]
}
```

---

## 5. 角色模块

### 5.1 获取角色列表

```http
GET /api/roles?appTypeId=uuid&appId=uuid&isBuiltin=1
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "appId": null,
      "appTypeId": "app-type-uuid",
      "roleName": "管理员",
      "roleCode": "oa-admin",
      "roleDesc": "系统管理员",
      "isBuiltin": 1,
      "isOwner": 1,
      "roleStatus": 1,
      "createAt": "2026-03-28T00:00:00.000Z"
    }
  ]
}
```

### 5.2 创建角色

```http
POST /api/roles
Content-Type: application/json
Authorization: Bearer <token>

{
  "appTypeId": "app-type-uuid",
  "roleName": "审批专员",
  "roleCode": "oa-approver",
  "roleDesc": "负责审批操作",
  "isBuiltin": 0
}
```

### 5.3 更新角色

```http
PUT /api/roles/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "roleName": "高级审批专员",
  "roleDesc": "负责高级审批操作"
}
```

### 5.4 删除角色

```http
DELETE /api/roles/{id}
Authorization: Bearer <token>
```

### 5.5 获取角色权限

```http
GET /api/roles/{id}/permissions
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "roleId": "role-uuid",
      "permissionId": "perm-uuid",
      "permission": {
        "id": "perm-uuid",
        "permCode": "system/user-list",
        "permName": "用户管理",
        "permissionType": "PC",
        "nodeType": "PAGE"
      },
      "permissionValue": "3",
      "createAt": "2026-03-28T00:00:00.000Z"
    }
  ]
}
```

### 5.6 分配角色权限

```http
PUT /api/roles/{id}/permissions
Content-Type: application/json
Authorization: Bearer <token>

{
  "permissions": [
    {
      "permissionId": "perm-uuid-1",
      "permissionValue": "7"
    },
    {
      "permissionId": "perm-uuid-2",
      "permissionValue": "1"
    }
  ]
}
```

---

## 6. 权限模块

### 6.1 获取权限树

```http
GET /api/permissions?appTypeId=uuid
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "permCode": "system",
      "permName": "系统管理",
      "permDesc": "系统管理模块",
      "permissionType": "PC",
      "nodeType": "MENU",
      "parentId": null,
      "routePath": "/system",
      "iconName": "Setting",
      "sortOrder": 1,
      "isVisible": 1,
      "isCache": 1,
      "showMode": "NORMAL",
      "permStatus": 1,
      "children": [
        {
          "id": "uuid",
          "permCode": "system/user-list",
          "permName": "用户管理",
          "permissionType": "PC",
          "nodeType": "PAGE",
          "parentId": "parent-uuid",
          "routePath": "/system/user-list",
          "iconName": "User",
          "sortOrder": 1,
          "isVisible": 1,
          "isCache": 1,
          "showMode": "NORMAL",
          "permStatus": 1,
          "permissionValue": "7"
        }
      ]
    }
  ]
}
```

### 6.2 创建权限节点

```http
POST /api/permissions
Content-Type: application/json
Authorization: Bearer <token>

{
  "permName": "数据导出",
  "permCode": "system/user-export",
  "permDesc": "导出用户数据",
  "permissionType": "PC",
  "nodeType": "TAG",
  "parentId": "page-uuid",
  "routePath": "/system/user-list",
  "iconName": "Download",
  "sortOrder": 1,
  "isVisible": 1,
  "showMode": "NORMAL",
  "permissionValue": "8"
}
```

### 6.3 更新权限节点

```http
PUT /api/permissions/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "permName": "批量导出",
  "permDesc": "批量导出用户数据",
  "sortOrder": 2
}
```

### 6.4 删除权限节点

```http
DELETE /api/permissions/{id}
Authorization: Bearer <token>
```

### 6.5 同步路由

```http
POST /api/permissions/sync-routes
Content-Type: application/json
Authorization: Bearer <token>

{
  "appTypeId": "app-type-uuid",
  "confirm": true
}
```

### 6.6 比对路由差异

```http
GET /api/permissions/diff-routes?appTypeId=uuid
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "newRoutes": [
      {
        "path": "/system/new-page",
        "permCode": "system/new-page",
        "permName": "新页面"
      }
    ],
    "removedRoutes": [
      {
        "id": "uuid",
        "permCode": "system/old-page",
        "permName": "旧页面"
      }
    ],
    "modifiedRoutes": [
      {
        "id": "uuid",
        "permCode": "system/changed-page",
        "changes": {
          "permName": { "old": "旧名称", "new": "新名称" }
        }
      }
    ]
  }
}
```

---

## 7. 用户模块

### 7.1 获取用户列表

```http
GET /api/users?page=1&pageSize=20&keyword=admin&status=1
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "total": 10,
    "list": [
      {
        "id": "uuid",
        "username": "admin",
        "nickname": "管理员",
        "phone": "13800138000",
        "email": "admin@example.com",
        "avatar": "https://...",
        "gender": 1,
        "userStatus": 1,
        "isDeveloper": 1,
        "createAt": "2026-03-28T00:00:00.000Z"
      }
    ]
  }
}
```

### 7.2 创建用户

```http
POST /api/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "username": "newuser",
  "password": "password123",
  "nickname": "新用户",
  "phone": "13900139000",
  "email": "newuser@example.com",
  "gender": 1
}
```

### 7.3 更新用户

```http
PUT /api/users/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "nickname": "更新后的昵称",
  "phone": "13900139000",
  "email": "updated@example.com",
  "gender": 2
}
```

### 7.4 删除用户

```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

### 7.5 获取用户角色

```http
GET /api/users/{id}/roles
Authorization: Bearer <token>
```

### 7.6 分配用户角色

```http
PUT /api/users/{id}/roles
Content-Type: application/json
Authorization: Bearer <token>

{
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

---

## 8. 审计日志模块

### 8.1 获取审计日志列表

```http
GET /api/audit-logs?page=1&pageSize=20&module=USER&startDate=2026-03-01&endDate=2026-03-28
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "total": 100,
    "list": [
      {
        "id": "uuid",
        "module": "USER",
        "event": "USER_CREATE",
        "operatorId": "user-uuid",
        "operator": {
          "id": "user-uuid",
          "username": "admin",
          "nickname": "管理员"
        },
        "targetId": "target-uuid",
        "targetType": "USER",
        "description": "创建用户 newuser",
        "snapshot": {
          "before": null,
          "after": {
            "username": "newuser",
            "nickname": "新用户"
          }
        },
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createAt": "2026-03-28T10:00:00.000Z"
      }
    ]
  }
}
```

### 8.2 获取审计日志详情

```http
GET /api/audit-logs/{id}
Authorization: Bearer <token>
```

---

## 9. 位运算权限值说明

### 9.1 权限位定义

| 权限位 | 十进制 | 二进制 | 说明 |
|--------|--------|--------|------|
| ADD | 1 | 00000001 | 新增 |
| EDIT | 2 | 00000010 | 编辑 |
| DELETE | 4 | 00000100 | 删除 |
| EXPORT | 8 | 00001000 | 导出 |
| IMPORT | 16 | 00010000 | 导入 |
| VIEW | 32 | 00100000 | 查看 |
| APPROVE | 64 | 01000000 | 审批 |
| REJECT | 128 | 10000000 | 拒绝 |

### 9.2 权限值计算

```javascript
// 新增 + 编辑 + 删除 = 1 | 2 | 4 = 7
const fullPermission = 1n | 2n | 4n; // 7n

// 仅查看 + 导出 = 32 | 8 = 40
const viewExport = 32n | 8n; // 40n

// 权限验证 (子集检查)
const hasPermission = (roleValue, requiredValue) => {
  return (roleValue & requiredValue) === requiredValue;
};

hasPermission(7n, 3n); // true (7 & 3 = 3)
hasPermission(5n, 3n); // false (5 & 3 = 1 !== 3)
```

---

## 10. 相关文档

- [后端开发文档](./03-后端开发文档.md)
- [数据库设计](../docs/database/database-entities-design.md)
- [权限 API 文档](../docs/api/permission-api.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-28 | 初始版本 |

---

*本文档定义所有后端 API 接口，前后端开发应严格遵循本规范*
