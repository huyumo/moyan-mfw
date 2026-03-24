# 基础设施页面设计文档

> **注意**: 本文档已重构拆分为独立文档，请查看 [基础设施页面设计文档索引](./infrastructure-detailed-design-index.md) 获取完整内容。

## 概述

本文档是基础设施页面设计文档的入口，详细描述数据库实体设计、ER 关系、前端页面流程和核心业务流程。

**模块路径**:
- 前端：`packages/base-frontend/src/app/pages/permission/`
- 后端：`packages/base-backend/src/database/entities/`

**版本**: 2.0.0

---

## 快速导航

### 数据库设计

- [数据库实体设计](./database-entities-design.md) - 所有数据库实体的详细定义
- [数据库 ER 关系图](./database-er-diagram.md) - 实体间关系图和权限隔离机制

### 页面流程

- [应用类型管理页面](./app-type-management.md) - 应用类型列表、详情、编辑、权限池配置和内置角色管理
- [应用实例管理页面](./app-management.md) - 应用实例的 CRUD、用户绑定
- [角色管理页面](./role-management.md) - 角色管理、权限分配流程
- [权限管理页面](./permission-management.md) - PC 权限树和 OpenAPI 权限管理

### 业务流程

- [权限池配置流程](./permission-pool-setup.md) - 权限池配置的详细流程
- [权限分配流程](./permission-assignment.md) - 角色权限分配的详细流程

---

## 核心概念速查

### 权限类型与节点类型

| PermissionType | NodeType | 说明 |
|----------------|----------|------|
| PC | MENU | PC 菜单/目录 |
| PC | PAGE | PC 页面权限（可包含 pcAction） |
| NORMAL | TAG | 普通权限 |
| API | API | OpenAPI 权限 |

### pcAction 数据流

```
Permission.pcAction → AppTypePermission.pcAction → RolePermission.pcAction → 用户最终权限
    (定义)              (权限池配置，子集)           (角色分配，子集)           (并集)
```

### 角色分类

| 类型 | 绑定字段 | 管理位置 | 操作权限 |
|------|----------|----------|----------|
| 内置角色 | `appTypeId` | 应用类型管理页面 | 应用类型页面：增删改 + 分配权限 |
| 应用级角色 | `appId` | 角色管理页面 | 增删改 + 分配权限 |

### 权限池约束

所有角色的权限配置都必须从所属应用类型的权限池中选择。

### 用户最终权限

```
用户最终权限 = ∪(用户所有关联角色的 permissionId + pcAction)
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-24 | 重构：简化 PermissionType，新增 NodeType，添加 pcAction 字段 |
| 1.0.0 | 2026-03-23 | 初始版本 |

---

*完整内容请查看 [基础设施页面设计文档索引](./infrastructure-detailed-design-index.md)*