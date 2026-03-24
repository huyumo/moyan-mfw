# 基础设施页面设计文档索引

## 概述

本文档是基础设施页面设计文档的索引文件，将所有设计文档按功能和业务流程组织在一起。

**模块路径**:
- 前端：`packages/base-frontend/src/app/pages/permission/`
- 后端：`packages/base-backend/src/database/entities/`

**版本**: 2.0.0

---

## 文档目录

### 数据库设计

| 文档 | 说明 |
|------|------|
| [数据库实体设计](./database-entities-design.md) | 所有数据库实体的详细定义，包括字段、索引和业务规则 |
| [数据库 ER 关系图](./database-er-diagram.md) | 实体间关系图、权限隔离机制和权限树形结构 |

### 页面流程

| 文档 | 说明 |
|------|------|
| [应用类型管理页面](./app-type-management.md) | 应用类型列表、详情、编辑、权限池配置和内置角色管理流程 |
| [应用实例管理页面](./app-management.md) | 应用实例的 CRUD、用户绑定流程 |
| [角色管理页面](./role-management.md) | 角色管理、权限分配流程，内置角色与应用级角色的区别 |
| [权限管理页面](./permission-management.md) | PC 权限树和 OpenAPI 权限管理流程 |

### 业务流程

| 文档 | 说明 |
|------|------|
| [权限池配置流程](./permission-pool-setup.md) | 应用类型权限池配置的详细流程和并发处理机制 |
| [权限分配流程](./permission-assignment.md) | 角色权限分配的详细流程和权限验证逻辑 |

---

## 核心概念

### 应用类型中心模式

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

### 权限类型与节点类型

| PermissionType | NodeType | 说明 |
|----------------|----------|------|
| PC | MENU | PC 菜单/目录 |
| PC | PAGE | PC 页面权限（可包含 pcAction） |
| NORMAL | MENU | 普通权限目录 |
| NORMAL | TAG | 普通权限（标签） |
| API | MENU | API 权限目录 |
| API | API | OpenAPI 权限 |

**说明**:
- `NodeType.MENU` 可以与所有 `PermissionType` (PC/NORMAL/API) 组合使用，作为目录节点
- 3 种 `PermissionType` 类型的权限都可以渲染为树形结构的数据
- 树形结构中，`MENU` 节点作为目录/分组，`PAGE/TAG/API` 节点作为叶子节点
- `pcAction` 仅存储在 `PermissionType=PC` 且 `NodeType=PAGE` 的节点上

### pcAction 数据流

```
Permission.pcAction (定义)
    ↓
AppTypePermission.pcAction (权限池配置，子集)
    ↓
RolePermission.pcAction (角色分配，子集)
    ↓
用户最终权限 (并集)
```

### 权限池约束

- 权限池通过 `appTypeId` 进行隔离，不同应用类型的权限池相互独立
- 所有角色（内置角色、应用类型级角色、应用级角色）的权限配置都必须从所属应用类型的权限池中选择
- 内置角色不绑定 `appId`，仅绑定 `appTypeId`，为应用类型全局角色
- 应用级角色必须绑定 `appId`，属于具体应用实例

### 用户最终权限计算

```
用户最终权限 = ∪(用户所有关联角色的 permissionId + pcAction)
```

- 相同 `permissionId` 的 `pcAction` 取并集

---

## 角色分类

| 类型 | 绑定字段 | 说明 | 管理位置 | 操作权限 |
|------|----------|------|----------|----------|
| 内置角色 | `appTypeId` | 应用类型全局角色 | 应用类型管理页面 | 应用类型页面：增删改 + 分配权限<br/>角色管理页面：只读 |
| 应用级角色 | `appId` | 应用实例专属角色 | 角色管理页面 | 增删改 + 分配权限 |

---

## 权限类型枚举

```typescript
enum PermissionType {
  PC = 'PC',                     // PC 权限
  NORMAL = 'NORMAL',             // 普通权限
  API = 'API',                   // OpenAPI 权限
}

enum NodeType {
  MENU = 'MENU',            // 目录（用于 PC 权限的目录节点）
  PAGE = 'PAGE',            // 页面（PermissionType=PC 时使用）
  TAG = 'TAG',              // 标签（PermissionType=NORMAL 时使用）
  API = 'API',              // API（PermissionType=API 时使用）
}

enum ShowMode {
  NORMAL = 'NORMAL',             // 普通模式
  DEV = 'DEV',                   // 开发模式
}
```

---

## 组件复用

### RolePermissionPanel 组件

| 使用场景 | 说明 |
|----------|------|
| 应用类型详情页 - 内置角色权限查看/分配 | 编辑模式（应用类型页面），可查看/分配内置角色权限 |
| 角色管理页面 - 应用级角色权限分配 | 编辑模式，分配应用级角色权限 |
| 角色管理页面 - 内置角色权限查看 | 只读模式，展示内置角色权限 |

**组件行为一致性**:
- 所有场景下都从应用类型权限池获取数据
- 都展示相同的权限选择器（PC 权限树、普通权限列表、OpenAPI 权限树）
- 都支持 pcAction 的勾选和保存
- 只读模式下禁用勾选和保存功能

---

## 开发者模式

- 应用类型管理页面仅限开发者模式访问
- 通过后端接口鉴权实现
- 当用户属于开发者时，返回的路由菜单中包含应用类型管理页面

---

## 相关文档

- [基础设施页面架构文档](./infrastructure-pages-architecture.md)
- [API 开发规范](../../api-development-guide.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-24 | 重构：添加 PermissionType/NodeType 说明，pcAction 数据流，更新角色分类 |
| 1.0.0 | 2026-03-23 | 初始版本，将原基础设施详细设计文档拆分为独立文档 |

---

*本文档由基础设施页面详细设计文档重构而来*