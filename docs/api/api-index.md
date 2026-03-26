# API 接口文档索引

> 基础设施 API 接口定义 - 按页面拆分
>
> **版本**: 1.0.0
> **最后更新**: 2026-03-26

---

## 接口文档分册

| 文档 | 说明 | 路径 |
|------|------|------|
| 应用类型管理接口 | 应用类型的增删改查、权限池配置、内置角色管理 | [./app-type-api.md](./app-type-api.md) |
| 应用管理接口 | 应用实例的增删改查、拥有者管理 | [./app-api.md](./app-api.md) |
| 角色管理接口 | 应用级角色的增删改查、权限分配 | [./role-api.md](./role-api.md) |
| 成员管理接口 | 成员管理、角色分配 | [./member-api.md](./member-api.md) |
| 权限管理接口 | PC 权限树管理、普通权限管理 | [./permission-api.md](./permission-api.md) |
| 用户接口 | 用户搜索（复用接口） | [./user-api.md](./user-api.md) |
| 认证接口 | 用户登录、Token 刷新、用户信息、权限树 | [./auth-api.md](./auth-api.md) |

---

## 通用类型定义

以下类型定义在多个接口中复用：

| 类型文档 | 说明 | 路径 |
|----------|------|------|
| 统一响应结构、分页参数、权限树相关、用户/应用/角色摘要 | [./types.md](./types.md) |

---

## 数据结构引用

实体定义统一引用数据库设计文档：

| 实体 | 说明 | 路径 |
|------|------|------|
| AppTypeEntity | 应用类型实体 | [../database/database-entities-design.md#11-apptypeentity-应用类型实体](../database/database-entities-design.md#11-apptypeentity-应用类型实体) |
| AppEntity | 应用实例实体 | [../database/database-entities-design.md#12-appentity-应用实例实体](../database/database-entities-design.md#12-appentity-应用实例实体) |
| RoleEntity | 角色实体 | [../database/database-entities-design.md#13-roleentity-角色实体](../database/database-entities-design.md#13-roleentity-角色实体) |
| PermissionEntity | 权限实体 | [../database/database-entities-design.md#14-permissionentity-权限实体](../database/database-entities-design.md#14-permissionentity-权限实体) |
| UserEntity | 用户实体 | [../database/database-entities-design.md#15-userentity-用户实体](../database/database-entities-design.md#15-userentity-用户实体) |

---

## 接口调用流程示例

### 用户登录 + 获取权限树

```
1. POST /api/v1/auth/login
   → 获取 token, refreshToken

2. GET /api/v1/auth/me
   → 获取用户详细信息 + 可访问的应用列表 (apps)

3. 用户选择一个应用后
   GET /api/v1/auth/permissions?appCode={appCode}&permissionType=PC
   → 获取该应用下的 PC 权限树，用于渲染菜单和构建路由
```

### 应用类型管理

```
1. GET /api/v1/app-types
   → 获取应用类型列表

2. GET /api/v1/app-types/:id
   → 获取应用类型详情 + 权限池树 + 内置角色列表

3. 编辑应用类型基本信息
   PUT /api/v1/app-types/:id

4. 保存权限池配置
   PUT /api/v1/app-types/:appTypeId/permission-pool

5. 管理内置角色
   POST /api/v1/app-types/:appTypeId/roles
   PUT /api/v1/app-types/roles/:id
   DELETE /api/v1/app-types/roles/:id

6. 分配角色权限
   PUT /api/v1/app-types/roles/:id/permissions
```

### 成员管理

```
1. GET /api/v1/apps/:appId/members
   → 获取成员列表

2. GET /api/v1/users/search?keyword=手机号
   → 搜索用户（复用接口）

3. POST /api/v1/apps/:appId/members
   → 添加成员

4. GET /api/v1/apps/:appId/available-roles
   → 获取可选角色列表

5. PUT /api/v1/apps/:appId/members/:userId/roles
   → 更新成员角色配置
```

---

## 相关文档

- [应用类型管理页面](../pages/app-type-management.md)
- [应用管理页面](../pages/app-management.md)
- [角色管理页面](../pages/role-management.md)
- [成员管理页面](../pages/member-management.md)
- [权限管理页面](../pages/permission-management.md)
- [数据库实体设计](../database/database-entities-design.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本，按页面拆分接口文档 |

---

*本文档由基础设施页面详细设计文档拆分而来*
