# 数据库实体设计文档

## 概述

本文档描述基础设施页面的数据库实体设计，包括实体定义、索引和业务规则。

**模块路径**: `packages/base-backend/src/database/entities/`

**版本**: 1.0.0

---

## 目录

1. [AppTypeEntity (应用类型实体)](#11-apptypeentity-应用类型实体)
2. [AppEntity (应用实例实体)](#12-appentity-应用实例实体)
3. [RoleEntity (角色实体)](#13-roleentity-角色实体)
4. [PermissionEntity (权限实体)](#14-permissionentity-权限实体)
5. [UserEntity (用户实体)](#15-userentity-用户实体)
6. [关联实体](#6-关联实体)

---

## 1.1 AppTypeEntity (应用类型实体)

**表名**: `sys_app_type`

**用途**: 定义应用类型模板，作为应用实例的分类和权限隔离的基础单元。

```typescript
class AppTypeEntity {
  id!: string;                    // 主键 ID (UUID)
  typeName!: string;              // 应用类型名称 (varchar(64))
  typeCode!: string;              // 应用类型编码 (varchar(64), 唯一索引)
  typeDesc?: string;              // 应用类型描述 (varchar(255))
  icon?: string;                  // 应用类型图标 (varchar(128))
  multiAppEnabled!: number;       // 是否支持多应用 (tinyint(1), default 0)
  typeStatus!: number;            // 状态：1-启用 0-禁用 (tinyint(1), default 1)
  sortOrder!: number;             // 排序值 (int, default 0)
  createTime!: Date;              // 创建时间 (datetime(3))
  updateTime?: Date;              // 更新时间 (datetime(3))
}
```

**索引**:
- `idx_type_code` (typeCode, unique)
- `idx_type_status` (typeStatus)

**业务规则**:
- `typeCode = 'system'` 为系统内置类型，不可编辑/删除
- `multiAppEnabled = 1` 表示该类型下可创建多个应用实例
- 应用类型不允许前端新增、删除，仅允许后端程序启动时，通过代码因编码管理
- 前端仅允许编辑字段：typeName（应用类型名称）、icon（图标）、typeDesc（应用类型描述）

---

## 1.2 AppEntity (应用实例实体)

**表名**: `sys_app`

**用途**: 具体的应用实例，归属于某个应用类型，必须且只能有1个拥有者。

```typescript
class AppEntity {
  id!: string;                    // 主键 ID (UUID)
  appTypeId!: string;             // 应用类型 ID (char(36), 外键)
  appName!: string;               // 应用名称 (varchar(64))
  appCode!: string;               // 应用编码 (varchar(64), 唯一索引)
  appDesc?: string;               // 应用描述 (varchar(255))
  appLogo?: string;               // 应用标识图 (varchar(255))
  ownerId!: string;               // 拥有者 ID (char(36), 外键)
  appStatus!: number;             // 状态：1-启用 0-禁用 (tinyint(1), default 1)
  sortOrder!: number;             // 排序值 (int, default 0)
  createTime!: Date;              // 创建时间 (datetime(3))
  updateTime?: Date;              // 更新时间 (datetime(3))
}
```

**索引**:
- `uk_app_code` (appCode, unique)
- `idx_app_type_id` (appTypeId)
- `idx_owner_id` (ownerId)
- `idx_app_status` (appStatus)

**业务规则**:
- `appCode` 全局唯一，创建后不可修改
- 创建应用时自动绑定拥有者到 `sys_user_app` 表

---

## 1.3 RoleEntity (角色实体)

**表名**: `sys_role`

**用途**: 定义角色，可关联到应用或应用类型，用于权限分组。

```typescript
class RoleEntity {
  id!: string;                    // 主键 ID (UUID)
  appId?: string;                 // 应用 ID (char(36), 可选)
  appTypeId?: string;             // 应用类型 ID (char(36), 可选)
  roleName!: string;              // 角色名称 (varchar(64))
  roleCode!: string;              // 角色编码 (varchar(64), 唯一索引)
  roleDesc?: string;              // 角色描述 (varchar(255))
  isBuiltin!: number;             // 是否内置：1-是 0-否 (tinyint(1), default 0)
  roleStatus!: number;            // 状态：1-启用 0-禁用 (tinyint(1), default 1)
  sortOrder!: number;             // 排序值 (int, default 0)
  createTime!: Date;              // 创建时间 (datetime(3))
  updateTime?: Date;              // 更新时间 (datetime(3))
}
```

**索引**:
- `idx_role_app_id` (appId)
- `idx_role_app_type_id` (appTypeId)
- `idx_role_code` (roleCode, unique)
- `idx_role_status` (roleStatus)

**业务规则**:
- 内置角色 (`isBuiltin = 1`) 必须关联 `appTypeId`，不绑定 `appId`，为应用类型全局角色
- 应用实体角色 (`isBuiltin = 0`) 必须绑定 `appId`，属于具体应用实例
- 内置角色不允许在前端编辑、删除、分配权限，仅可在应用实例详情页查看
- 应用实体角色可在应用实例详情页进行编辑、删除、权限分配操作
- 内置角色和应用实体角色的权限配置行为一致：都从所属应用类型的权限池中选择
- 前端实现：内置角色查看权限与应用实体角色分配权限使用同一组件 `RolePermissionPanel`

---

## 1.4 PermissionEntity (权限实体)

**表名**: `sys_permission`

**用途**: 定义权限节点，支持树形结构，包含菜单、页面、操作、API 等类型。

```typescript
class PermissionEntity {
  id!: string;                                              // 主键 ID (UUID)
  permName!: string;                                        // 权限名称 (varchar(64))
  permCode!: string;                                        // 权限编码 (varchar(128), 唯一索引)
  permDesc?: string;                                        // 权限描述 (varchar(255))
  permissionType!: PermissionType;                          // 权限类型 (enum)
  nodeType?: NodeType;                                      // 节点类型 (enum) 根据 permissionType 设置，不能混淆使用
  parentId?: string;                                        // 父权限 ID (char(36), 自引用外键)
  routePath?: string;                                       // 路由路径 (varchar(255))
  componentPath?: string;                                   // 组件路径 (varchar(255))
  apiPath?: string;                                         // API 路径 (varchar(255))
  apiMethod?: string;                                       // API 方法 (varchar(10))
  iconName?: string;                                        // 图标名称 (varchar(64))
  sortOrder!: number;                                       // 排序值 (int, default 0)
  isVisible!: number;                                       // 是否可见：1-是 0-否 (tinyint(1), default 1)
  isCache!: number;                                         // 是否缓存：1-是 0-否 (tinyint(1), default 1)
  showMode!: ShowMode;                                      // 显示模式 (enum: NORMAL/DEV)
  permStatus!: number;                                      // 状态：1-启用 0-禁用 (tinyint(1), default 1)
  pcAction?:Array<{name:string,permCode: string}>;          // pc 操作权限（按钮）(json)
  createTime!: Date;                                        // 创建时间 (datetime(3))
  updateTime?: Date;                                        // 更新时间 (datetime(3))
}
```

**枚举类型**:

```typescript
enum PermissionType {
  PC = 'PC',                     // PC 权限
  NORMAL = 'NORMAL',             // 普通权限
  API = 'API',                   // OpenAPI 权限
}

enum ShowMode {
  NORMAL = 'NORMAL',             // 普通模式
  DEV = 'DEV',                   // 开发模式
}

enum NodeType {
  MENU = 'MENU',            // 目录
  PAGE = 'PAGE',            // 页面权限 PermissionType = PC 使用 PAGE
  TAG = 'TAG',              // 普通权限 PermissionType = NORMAL 使用 TAG
  API = 'API',              // OpenAPI 权限 PermissionType = API 使用 API
}


```

**索引**:
- `idx_perm_code` (permCode)
- `idx_permission_type` (permissionType)
- `idx_parent_id` (parentId)
- `idx_perm_status` (permStatus)

**业务规则**:
- `PAGE|TAG|API` 类型的 `parentId` 必须指向 `MENU` 类型
- API 权限通过 `syncOpenApiNodes()` 自动同步代码元数据
- `showMode = DEV` 的权限仅对开发模式用户可见

---

## 1.5 UserEntity (用户实体)

**表名**: `sys_user`

**用途**: 系统用户，可拥有应用、分配角色。

```typescript
class UserEntity {
  id!: string;                    // 主键 ID (UUID)
  username!: string;              // 用户名 (varchar(64), 唯一)
  password!: string;              // 密码 (varchar(255), 加密存储)
  nickname?: string;              // 昵称 (varchar(64))
  phone?: string;                 // 手机号 (varchar(20), 唯一)
  email?: string;                 // 邮箱 (varchar(128))
  avatar?: string;                // 头像 (varchar(255))
  gender!: number;                // 性别：0-未知 1-男 2-女 (tinyint, default 0)
  userStatus!: number;            // 状态：1-启用 0-禁用 (tinyint(1), default 1)
  createTime!: Date;              // 创建时间 (datetime(3))
  updateTime?: Date;              // 更新时间 (datetime(3))
}
```

**索引**:
- `uk_username` (username, unique)
- `uk_phone` (phone, unique)
- `idx_user_status` (userStatus)

---

## 6. 关联实体

### 1.6 RolePermissionEntity (角色权限关联实体)

**表名**: `sys_role_permission`

**用途**: 角色与权限的多对多关联。

```typescript
class RolePermissionEntity {
  id!: string;                    // 主键 ID (UUID)
  roleId!: string;                // 角色 ID (char(36), 外键)
  permissionId!: string;          // 权限 ID (char(36), 外键)
  createTime!: Date;              // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_role_id` (roleId)
- `idx_permission_id` (permissionId)
- `uk_role_permission` (roleId + permissionId, 唯一)

---

### 1.7 AppTypePermissionEntity (应用类型权限池实体)

**表名**: `sys_app_type_permission`

**用途**: 定义应用类型可用的权限池，角色权限只能从权限池中选择。

```typescript
class AppTypePermissionEntity {
  id!: string;                    // 主键 ID (UUID)
  appTypeId!: string;             // 应用类型 ID (char(36), 外键)
  permissionId!: string;          // 权限 ID (char(36), 外键)
  paramFields?: JsonValue;        // 选中的参数字段配置 (JSON)
  resultFields?: JsonValue;       // 选中的响应字段配置 (JSON)
  pcAction?:Array<{name:string,permCode: string}>;  // pc 选中的操作权限（按钮）(json)
  createTime!: Date;              // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_app_type_id` (appTypeId)
- `idx_permission_id` (permissionId)
- `uk_app_type_permission` (appTypeId + permissionId, 唯一)

**JSON 字段结构**:

```typescript
interface ApiField {
  name: string;            // 字段名
  source: 'path' | 'query' | 'body' | 'response';
  type?: string;           // 类型：string/number/boolean/object/array
  required?: boolean;      // 是否必填
  description?: string;    // 描述
  example?: string;        // 示例值
}

// paramFields: ApiField[] - API 参数配置
// resultFields: ApiField[] - API 响应字段配置
```

---

### 1.8 AppTypeBuiltinRoleEntity (应用类型内置角色关联实体)

**表名**: `sys_app_type_builtin_role`

**用途**: 应用类型与内置角色的关联。

```typescript
class AppTypeBuiltinRoleEntity {
  id!: string;                    // 主键 ID (UUID)
  appTypeId!: string;             // 应用类型 ID (char(36), 外键)
  roleId!: string;                // 角色 ID (char(36), 外键)
  createTime!: Date;              // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_app_type_id` (appTypeId)
- `idx_role_id` (roleId)
- `uk_app_type_builtin_role` (appTypeId + roleId, 唯一)

---

### 1.9 UserAppEntity (用户应用关联实体)

**表名**: `sys_user_app`

**用途**: 用户与应用的多对多关联，表示用户拥有或可访问的应用。

```typescript
class UserAppEntity {
  id!: string;                    // 主键 ID (UUID)
  userId!: string;                // 用户 ID (char(36), 外键)
  appId!: string;                 // 应用 ID (char(36), 外键)
  isDefault!: number;             // 是否默认应用：1-是 0-否 (tinyint(1), default 0)
  createTime!: Date;              // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_user_id` (userId)
- `idx_app_id` (appId)
- `uk_user_app` (userId + appId, 唯一)

---

### 1.10 UserRoleEntity (用户角色关联实体)

**表名**: `sys_user_role`

**用途**: 用户与角色的多对多关联。

```typescript
class UserRoleEntity {
  id!: string;                    // 主键 ID (UUID)
  userId!: string;                // 用户 ID (char(36), 外键)
  roleId!: string;                // 角色 ID (char(36), 外键)
  createTime!: Date;              // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_user_id` (userId)
- `idx_role_id` (roleId)
- `uk_user_role` (userId + roleId, 唯一)

---

## 相关文档

- [数据库 ER 关系图](./database-er-diagram.md)
- [应用类型管理页面](./app-type-management.md)
- [应用实例管理页面](./app-management.md)
- [角色管理页面](./role-management.md)
- [权限管理页面](./permission-management.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-23 | 初始版本，从基础设施详细设计文档拆分 |

---

*本文档由基础设施页面详细设计文档拆分而来*