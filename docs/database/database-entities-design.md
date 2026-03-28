# 数据库实体设计文档

## 概述

本文档描述基础设施页面的数据库实体设计，包括实体定义、索引和业务规则。

**版本**: 2.0.0

---

## 通用字段规范

所有实体表均包含以下标准字段，用于审计追踪：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| createAt | datetime(3) | 创建时间 |
| updateAt | datetime(3) | 更新时间 |

**说明**：
- `createAt`：记录创建时间，创建后不可修改
- `updateAt`：记录最后更新时间，每次更新时自动刷新
- `createdBy` / `updateBy`：由数据库层面或基础实体基类统一管理，不在各实体中单独定义

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
  createAt!: Date;                // 创建时间 (datetime(3))
  updateAt?: Date;                // 更新时间 (datetime(3))
}
```

**索引**:
- `idx_type_code` (typeCode, unique)
- `idx_type_status` (typeStatus)

**业务规则**:
- `typeCode = 'system'` 为系统内置类型，不可删除
- `multiAppEnabled = 1` 表示该类型下可创建多个应用实例
- 应用类型不允许前端新增、删除，仅允许后端程序启动时通过代码按编码管理
- 前端仅允许编辑字段：typeName（应用类型名称）、icon（图标）、typeDesc（应用类型描述）
- 应用类型管理页面仅限开发者模式访问

---

## 1.2 AppEntity (应用实例实体)

**表名**: `sys_app`

**用途**: 具体的应用实例，归属于某个应用类型，必须且只能有 1 个拥有者。

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
  createAt!: Date;                // 创建时间 (datetime(3))
  updateAt?: Date;                // 更新时间 (datetime(3))
}
```

**索引**:
- `uk_app_code` (appCode, unique)
- `idx_app_type_id` (appTypeId)
- `idx_owner_id` (ownerId)
- `idx_app_status` (appStatus)

**业务规则**:
- `appCode` 全局唯一，创建后不可修改
- 创建应用时自动绑定拥有者到 `sys_user_app` 表（拥有者同时在 `sys_app.ownerId` 和 `sys_user_app` 中记录）
- 应用实例必须归属于一个应用类型
- 拥有者变更时，后端 Service 层用事务保证原子性（更新 ownerId + 调整拥有者角色绑定 + 更新 sys_user_app 表）

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
  isOwner!: number;               // 是否拥有者角色：1-是 0-否 (tinyint(1), default 0)
  roleStatus!: number;            // 状态：1-启用 0-禁用 (tinyint(1), default 1)
  sortOrder!: number;             // 排序值 (int, default 0)
  createAt!: Date;                // 创建时间 (datetime(3))
  updateAt?: Date;                // 更新时间 (datetime(3))
}
```

**索引**:
- `idx_role_app_id` (appId)
- `idx_role_app_type_id` (appTypeId)
- `idx_role_code` (roleCode, unique)
- `idx_role_status` (roleStatus)
- `idx_is_owner` (isOwner)

**业务规则**:
- **内置角色** (`isBuiltin = 1`): 必须关联 `appTypeId`，不绑定 `appId`，为应用类型全局角色
- **应用级角色** (`isBuiltin = 0`): 必须绑定 `appId`，属于具体应用实例
- **拥有者角色** (`isOwner = 1`): 每个应用类型必须有一个特殊的"管理员"拥有者角色（应用类型的内置角色），该角色不允许删除，可以修改名称
- **内置角色管理位置**: 应用类型管理页面详情页，可进行添加、编辑、删除、分配权限操作
- **内置角色查看位置**: 应用实例角色管理列表中只读显示
- **应用级角色管理位置**: 应用实例角色管理页面，可进行编辑、删除、分配权限操作
- 所有角色的权限配置都必须从所属应用类型的权限池中选择
- 拥有者变更时，自动将原拥有者的拥有者角色移除，并将新拥有者绑定拥有者角色
- **角色删除级联处理**: 删除角色时，先删除 `sys_role_permission` 中的权限关联，再删除 `sys_user_role` 中的用户关联，最后删除角色记录，所有操作在事务中执行

---

## 1.4 PermissionEntity (权限实体)

**表名**: `sys_permission`

**用途**: 定义权限节点，支持树形结构，包含 PC 权限、普通权限等类型。

```typescript
class PermissionEntity {
  id!: string;                                              // 主键 ID (UUID)
  permName!: string;                                        // 权限名称 (varchar(64))
  permCode!: string;                                        // 权限编码 (varchar(128), 唯一索引)
  permDesc?: string;                                        // 权限描述 (varchar(255))
  permissionType!: PermissionType;                          // 权限类型 (enum)
  nodeType?: NodeType;                                      // 节点类型 (enum)
  parentId?: string;                                        // 父权限 ID (char(36), 自引用外键)
  routePath?: string;                                       // 路由路径 (varchar(255), v3.0 新增)
  isAutoSync?: number;                                      // 是否同步生成：1-是 0-否 (tinyint(1), default 0, v3.0 新增)
  componentPath?: string;                                   // 组件路径 (varchar(255))
  iconName?: string;                                        // 图标名称 (varchar(64))
  sortOrder!: number;                                       // 排序值 (int, default 0)
  isVisible!: number;                                       // 是否可见：1-是 0-否 (tinyint(1), default 1)
  isCache!: number;                                         // 是否缓存：1-是 0-否 (tinyint(1), default 1)
  showMode!: ShowMode;                                      // 显示模式 (enum: NORMAL/DEV)
  permStatus!: number;                                      // 状态：1-启用 0-禁用 (tinyint(1), default 1)
  permissionValue!: bigint;                                 // 位运算权限值 (bigint, v4.0 新增)
  createAt!: Date;                                          // 创建时间 (datetime(3))
  updateAt?: Date;                                          // 更新时间 (datetime(3))
}
```

**字段变更说明 (v3.0)**:
- `routePath`: 新增字段，用于标记权限节点来源的路由路径，同步功能使用
- `isAutoSync`: 新增字段，为 1 时表示该节点由路由同步生成，节点结构不可编辑

**字段变更说明 (v4.0)**:
- `permissionValue`: 新增字段，位运算存储权限值，替代 `pcAction` 字段
- `pcAction`: 已移除，改用 `permissionValue` 使用位运算存储

**枚举类型**:

```typescript
enum PermissionType {
  PC = 'PC',                     // PC 权限
  NORMAL = 'NORMAL',             // 普通权限
}

enum NodeType {
  MENU = 'MENU',            // 目录（用于 PC 权限的目录节点）
  PAGE = 'PAGE',            // 页面（PermissionType=PC 时使用）
  TAG = 'TAG',              // 标签（PermissionType=NORMAL 时使用）
}

enum ShowMode {
  NORMAL = 'NORMAL',             // 普通模式
  DEV = 'DEV',                   // 开发模式
}
```

**PermissionType 与 NodeType 对应关系**:

| PermissionType | NodeType | 说明 |
|----------------|----------|------|
| PC | MENU | PC 菜单/目录 |
| PC | PAGE | PC 页面权限（可包含 permissionValue） |
| NORMAL | MENU | 普通权限目录 |
| NORMAL | TAG | 普通权限（标签） |

**说明**:
- `NodeType.MENU` 可以与所有 `PermissionType` (PC/NORMAL) 组合使用，作为目录节点
- 2 种 `PermissionType` 类型的权限都可以渲染为树形结构的数据
- 树形结构中，`MENU` 节点作为目录/分组，`PAGE/TAG` 节点作为叶子节点
- `permissionValue` 仅存储在 `PermissionType=PC` 且 `NodeType=PAGE` 的节点上
- `NORMAL` 权限类型通常用于移动端、非后台管理的程序

**索引**:
- `idx_perm_code` (permCode)
- `idx_permission_type` (permissionType)
- `idx_parent_id` (parentId)
- `idx_perm_status` (permStatus)
- `idx_route_path` (routePath) - **v3.0 新增**
- `idx_auto_sync` (isAutoSync) - **v3.0 新增**

**业务规则**:
- `PAGE`、`TAG` 类型的 `parentId` 必须指向 `MENU` 类型
- `permissionValue` 字段仅存储在 `PermissionType=PC` 且 `NodeType=PAGE` 的节点上
- `permissionValue` 表示该页面下的所有操作权限（按钮）列表，使用位运算存储
- `showMode = DEV` 的权限仅对开发模式用户可见
- `permCode` 全局唯一，创建后不可修改
- `isAutoSync = 1` 的节点，前端禁止编辑节点结构（permName、parentId 等），但可配置 permissionValue
- `routePath` 用于同步功能比对路由与权限树的差异

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
  isDeveloper?: number;           // 是否开发者：1-是 0-否 (tinyint(1), default 0)
  createAt!: Date;                // 创建时间 (datetime(3))
  updateAt?: Date;                // 更新时间 (datetime(3))
}
```

**索引**:
- `uk_username` (username, unique)
- `uk_phone` (phone, unique)
- `idx_user_status` (userStatus)

**业务规则**:
- `isDeveloper = 1` 的用户可访问应用类型管理等开发者功能

---

## 6. 关联实体

### 1.6 RolePermissionEntity (角色权限关联实体)

**表名**: `sys_role_permission`

**用途**: 角色与权限的多对多关联，存储角色分配的权限及操作权限。

```typescript
class RolePermissionEntity {
  id!: string;                    // 主键 ID (UUID)
  roleId!: string;                // 角色 ID (char(36), 外键)
  permissionId!: string;          // 权限 ID (char(36), 外键)
  permissionValue!: bigint;       // 位运算权限值 (bigint, v4.0 新增)
  createAt!: Date;                // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_role_id` (roleId)
- `idx_permission_id` (permissionId)
- `uk_role_permission` (roleId + permissionId, 唯一)

**业务规则**:
- `permissionValue` 存储角色对该权限已勾选的操作权限子集
- `permissionValue` 必须是对应权限在权限池中 `permissionValue` 的子集（`(roleValue & poolValue) === roleValue`）
- v4.0 起使用位运算 `permissionValue` 替代 pcAction JSON 存储

---

### 1.7 AppTypePermissionEntity (应用类型权限池实体)

**表名**: `sys_app_type_permission`

**用途**: 定义应用类型可用的权限池，角色权限只能从权限池中选择。

```typescript
class AppTypePermissionEntity {
  id!: string;                    // 主键 ID (UUID)
  appTypeId!: string;             // 应用类型 ID (char(36), 外键)
  permissionId!: string;          // 权限 ID (char(36), 外键)
  permissionValue!: bigint;       // 位运算权限值 (bigint, v4.0 新增)
  createAt!: Date;                // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_app_type_id` (appTypeId)
- `idx_permission_id` (permissionId)
- `uk_app_type_permission` (appTypeId + permissionId, 唯一)

**业务规则**:
- 权限池通过 `appTypeId` 进行隔离，不同应用类型的权限池相互独立
- 角色权限只能从所属应用类型的权限池中选择
- `permissionValue` 是对应权限在 `Permission.permissionValue` 的子集（`(poolValue & permValue) === poolValue`）

---

### 1.8 UserAppEntity (用户应用关联实体)

**表名**: `sys_user_app`

**用途**: 用户与应用的多对多关联，表示用户拥有或可访问的应用。

```typescript
class UserAppEntity {
  id!: string;                    // 主键 ID (UUID)
  userId!: string;                // 用户 ID (char(36), 外键)
  appId!: string;                 // 应用 ID (char(36), 外键)
  createAt!: Date;                // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_user_id` (userId)
- `idx_app_id` (appId)
- `uk_user_app` (userId + appId, 唯一)

**业务规则**:
- 拥有者同时在 `sys_app.ownerId` 和 `sys_user_app` 表中记录
- `sys_app.ownerId` 用于快速查询某个应用的拥有者（一对一）
- `sys_user_app` 用于统一记录所有用户可访问的应用（包括拥有者和成员）
- 创建应用时，拥有者自动添加到 `sys_user_app` 表
- 拥有者变更时，需要同时更新 `sys_app.ownerId` 和 `sys_user_app` 表（移除原拥有者记录，添加新拥有者记录）
- 一个用户可以拥有多个应用

---

### 1.9 UserRoleEntity (用户角色关联实体)

**表名**: `sys_user_role`

**用途**: 用户与角色的多对多关联。

```typescript
class UserRoleEntity {
  id!: string;                    // 主键 ID (UUID)
  userId!: string;                // 用户 ID (char(36), 外键)
  roleId!: string;                // 角色 ID (char(36), 外键)
  createAt!: Date;                // 创建时间 (datetime(3))
}
```

**索引**:
- `idx_user_id` (userId)
- `idx_role_id` (roleId)
- `uk_user_role` (userId + roleId, 唯一)

---

## permissionValue 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. 权限定义 (PermissionEntity)                                  │
│    permissionValue: 7n (ADD|EDIT|DELETE)                        │
└────────────────────┬────────────────────────────────────────────┘
                     │ 权限池配置时读取并选择子集
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 权限池配置 (AppTypePermissionEntity)                         │
│    permissionValue: 3n (ADD|EDIT)  ← 子集                       │
└────────────────────┬────────────────────────────────────────────┘
                     │ 角色分配权限时读取并选择子集
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. 角色权限分配 (RolePermissionEntity)                          │
│    permissionValue: 1n (ADD)  ← 子集                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ 运行时权限验证
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. 用户最终权限 = 所有关联角色的 permissionValue 取 OR           │
│    userValue = role1Value | role2Value | ...                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 相关文档

- [数据库 ER 关系图](./database-er-diagram.md)
- [应用类型管理页面](../pages/app-type-management.md)
- [应用实例管理页面](../pages/app-management.md)
- [角色管理页面](../pages/role-management.md)
- [权限管理页面](../pages/permission-management.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.7.0 | 2026-03-28 | 位运算权限设计：移除 pcAction，新增 permissionValue bigint |
| 2.1.0 | 2026-03-25 | 统一字段命名：createTime → createAt，updateTime → updateAt |
| 2.0.0 | 2026-03-24 | 重构：简化 PermissionType，新增 NodeType，添加 pcAction 字段 |
| 1.0.0 | 2026-03-23 | 初始版本，从基础设施详细设计文档拆分 |

---

*本文档由基础设施页面详细设计文档拆分而来*