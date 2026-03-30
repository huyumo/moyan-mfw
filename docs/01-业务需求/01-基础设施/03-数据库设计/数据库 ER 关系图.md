# 数据库 ER 关系图文档

## 概述

本文档描述基础设施页面的数据库 ER 关系和实体间关联。

**版本**: 2.0.0

---

## 目录

1. [完整 ER 图](#完整 ER 图)
2. [核心关系说明](#核心关系说明)
3. [应用类型中心模式](#应用类型中心模式)
4. [权限隔离机制](#权限隔离机制)
5. [角色权限继承](#角色权限继承)
6. [权限树形结构](#权限树形结构)

---

## 完整 ER 图

```mermaid
erDiagram
    SYS_APP_TYPE ||--o{ SYS_APP : "1:N 包含应用实例"
    SYS_APP_TYPE ||--o{ SYS_APP_TYPE_PERMISSION : "1:N 定义权限池"
    SYS_APP_TYPE ||--o{ SYS_ROLE : "1:N 关联内置角色"

    SYS_APP ||--o{ SYS_USER_APP : "1:N 绑定用户"
    SYS_APP ||--o{ SYS_ROLE : "1:N 关联应用级角色"

    SYS_ROLE ||--o{ SYS_ROLE_PERMISSION : "1:N 分配权限"
    SYS_ROLE ||--o{ SYS_USER_ROLE : "1:N 分配给用户"

    SYS_PERMISSION ||--o{ SYS_PERMISSION : "自引用 父子关系"
    SYS_PERMISSION ||--o{ SYS_ROLE_PERMISSION : "1:N 被角色引用"
    SYS_PERMISSION ||--o{ SYS_APP_TYPE_PERMISSION : "1:N 加入权限池"

    SYS_USER ||--o{ SYS_USER_APP : "1:N 拥有应用"
    SYS_USER ||--o{ SYS_USER_ROLE : "1:N 拥有角色"

    SYS_APP_TYPE {
        string id PK
        string typeName
        string typeCode UK
        string typeDesc
        string icon
        int multiAppEnabled
        int typeStatus
        int sortOrder
        datetime createAt
    }

    SYS_APP {
        string id PK
        string appTypeId FK
        string appName
        string appCode UK
        string appDesc
        string appLogo
        string ownerId FK
        int appStatus
        int sortOrder
        datetime createAt
    }

    SYS_ROLE {
        string id PK
        string appId FK
        string appTypeId FK
        string roleName
        string roleCode UK
        string roleDesc
        int isBuiltin
        int isOwner
        int roleStatus
        int sortOrder
        datetime createAt
    }

    SYS_PERMISSION {
        string id PK
        string permName
        string permCode UK
        string permDesc
        enum permissionType
        enum nodeType
        string parentId FK
        string routePath
        string componentPath
        string iconName
        int sortOrder
        int isVisible
        int isCache
        enum showMode
        int permStatus
        bigint permissionValue
        datetime createAt
    }

    SYS_USER {
        string id PK
        string username UK
        string password
        string nickname
        string phone UK
        string email
        string avatar
        int gender
        int isDeveloper
        int userStatus
        datetime createAt
    }

    SYS_ROLE_PERMISSION {
        string id PK
        string roleId FK
        string permissionId FK
        bigint permissionValue
        datetime createAt
    }

    SYS_APP_TYPE_PERMISSION {
        string id PK
        string appTypeId FK
        string permissionId FK
        bigint permissionValue
        datetime createAt
    }

    SYS_USER_APP {
        string id PK
        string userId FK
        string appId FK
        datetime createAt
    }

    SYS_USER_ROLE {
        string id PK
        string userId FK
        string roleId FK
        datetime createAt
    }
```

---

## 核心关系说明

| 关系 | 类型 | 说明 |
|------|------|------|
| AppType → App | 1:N | 一个应用类型可包含多个应用实例 |
| AppType → AppTypePermission | 1:N | 一个应用类型有多个权限池配置 |
| AppType → Role | 1:N | 一个应用类型有多个内置角色（通过 `sys_role.appTypeId` + `isBuiltin=1` 标识） |
| App → UserApp | 1:N | 一个应用可绑定多个用户 |
| App → Role | 1:N | 一个应用有多个应用级角色 |
| Role → RolePermission | 1:N | 一个角色有多个权限分配 |
| Role → UserRole | 1:N | 一个角色可分配给多个用户 |
| Permission → Permission | 1:N | 权限自引用形成树形结构 |
| Permission → RolePermission | 1:N | 一个权限可被多个角色引用 |
| Permission → AppTypePermission | 1:N | 一个权限可加入多个权限池 |
| User → UserApp | 1:N | 一个用户可拥有多个应用 |
| User → UserRole | 1:N | 一个用户可拥有多个角色 |

**注意**: 内置角色通过 `sys_role` 表的 `appTypeId` + `isBuiltin=1` 字段标识，无需单独的关联表。

---

## 应用类型中心模式

```
应用类型 (AppType) 是整个权限系统的中心节点：

                    ┌─────────────────┐
                    │   AppType       │
                    │  (应用类型)     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│      App        │ │      Role       │ │AppTypePermission│
│  (应用实例)     │ │  (应用类型角色) │ │  (权限池)       │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   │
┌─────────────────┐ ┌─────────────────┐         │
│    UserApp      │ │  RolePermission │         │
│  (用户绑定)     │ │  (角色权限)     │         │
└─────────────────┘ └────────┬────────┘         │
                             │                  │
                             └────────┬─────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │   Permission    │
                             │    (权限)       │
                             └─────────────────┘
```

---

## 权限隔离机制

```
应用类型级别隔离：

┌─────────────────────────────────────────────────────────────┐
│                      应用类型 A                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  权限池 A    │  │  内置角色   │  │  应用级角色  │         │
│  │ [P1,P2,P3]  │  │  A1,A2     │  │  A-app1    │         │
│  │ [pcA1,pcA2] │  │ [P1,P2]     │  │ [P2,P3]     │         │
│  │             │  │ [pcA1]      │  │ [pcA2]      │         │
│  │ 所有角色的权 │  └─────────────┘  └─────────────┘         │
│  │ 限都从权限池 │         │                  │               │
│  │ 中选择       │         └──────────────────┘               │
│  └─────────────┘                  │                          │
│         ▲                         │                          │
│         └─────────────────────────┘                          │
│                   权限配置数据源                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      应用类型 B                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  权限池 B    │  │  内置角色   │  │  应用级角色  │         │
│  │ [P4,P5,P6]  │  │  B1,B2     │  │  B-app1    │         │
│  │ [pcB1,pcB2] │  │ [P4,P5]     │  │ [P5,P6]     │         │
│  │             │  │ [pcB1]      │  │ [pcB2]      │         │
│  │ 所有角色的权 │  └─────────────┘  └─────────────┘         │
│  │ 限都从权限池 │         │                  │               │
│  │ 中选择       │         └──────────────────┘               │
│  └─────────────┘                  │                          │
│         ▲                         │                          │
│         └─────────────────────────┘                          │
│                   权限配置数据源                              │
└─────────────────────────────────────────────────────────────┘

说明:
1. 内置角色：不绑定 appId，仅绑定 appTypeId，为应用类型全局角色
2. 应用级角色：必须绑定 appId，属于具体应用实例
3. 所有角色的权限配置数据源均为应用类型权限池
4. permissionValue 数据流：Permission → AppTypePermission → RolePermission
5. 权限 P1,P2,P3 仅在应用类型 A 中可用
6. 权限 P4,P5,P6 仅在应用类型 B 中可用
7. 拥有者角色 (isOwner=1)：每个应用类型必须有一个特殊的拥有者角色，不允许删除，拥有者自动绑定该角色
```

---

## 角色权限继承

```
用户最终权限计算：

用户 U
├── 直接绑定的角色 R1
│   └── 权限集合 {P1: 3n, P2: 3n}
├── 通过应用 A 绑定的角色 R2
│   └── 权限集合 {P3: 1n}
└── 通过应用类型 T 绑定的角色 R3
    └── 权限集合 {P1: 3n}

用户 U 的最终权限 =
  P1: 3n  ← 位运算 OR（相同 permissionId 的 permissionValue 取 OR）
  P2: 3n
  P3: 1n
```

---

## 权限树形结构

### 新的 PermissionType + NodeType 结构

```
Permission 树形示例 (PC 权限):

ROOT (MENU)
├── system (MENU)
│   ├── user-list (PAGE)
│   │   └── permissionValue: 7n (ADD|EDIT|DELETE)
│   ├── role-list (PAGE)
│   │   └── permissionValue: 3n (ADD|EDIT)
│   └── config-page (PAGE)
│       └── permissionValue: 4n (DELETE)
└── business (MENU)
    └── order-list (PAGE)
        └── permissionValue: 96n (APPROVE|REJECT)
```

### PermissionType 与 NodeType 对应关系

| PermissionType | NodeType | 用途 | 父节点要求 |
|----------------|----------|------|------------|
| PC | MENU | PC 菜单/目录 | 无（可为根节点） |
| PC | PAGE | PC 页面权限 | 必须是 MENU |
| NORMAL | MENU | 普通权限目录 | 无（可为根节点） |
| NORMAL | TAG | 普通权限（标签） | 必须是 MENU |

**说明**:
- `NodeType.MENU` 可以与所有 `PermissionType` 组合使用，作为目录节点
- 2 种 `PermissionType` 类型的权限都可以渲染为树形结构的数据
- 树形结构中，`MENU` 节点作为目录/分组，`PAGE/TAG` 节点作为叶子节点
- `NORMAL` 权限类型通常用于移动端、非后台管理的程序

---

## 相关文档

- [数据库实体设计](./database-entities-design.md)
- [应用类型管理页面](../页面/应用类型管理页面.md)
- [角色管理页面](../页面/角色管理页面.md)
- [权限池配置流程](../流程/权限池配置流程.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.7.0 | 2026-03-28 | 位运算权限设计：pcAction → permissionValue bigint |
| 2.0.0 | 2026-03-24 | 重构：更新 ER 图，添加 pcAction 字段，更新权限树结构 |
| 1.0.0 | 2026-03-23 | 初始版本，从基础设施详细设计文档拆分 |

---

*本文档由基础设施页面详细设计文档拆分而来*