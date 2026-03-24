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

- [应用类型管理页面](./app-type-management.md) - 应用类型列表、详情、编辑和权限池配置
- [应用实例管理页面](./app-management.md) - 应用实例的 CRUD、用户绑定
- [角色管理页面](./role-management.md) - 角色管理、权限分配流程
- [权限管理页面](./permission-management.md) - PC 权限树和 OpenAPI 权限管理

### 业务流程

- [权限池配置流程](./permission-pool-setup.md) - 权限池配置的详细流程
- [权限分配流程](./permission-assignment.md) - 角色权限分配的详细流程

---

## 核心概念速查

### 应用类型中心模式

应用类型 (AppType) 是权限系统的中心节点，权限池通过 `appTypeId` 隔离。

### 角色分类

| 类型 | 绑定字段 | 操作权限 |
|------|----------|----------|
| 内置角色 | `appTypeId` | 只读 |
| 应用级角色 | `appId` | 可编辑/删除/分配权限 |

### 权限池约束

所有角色的权限配置都必须从所属应用类型的权限池中选择。

### 用户最终权限

```
用户最终权限 = ∪(用户所有关联角色的权限集合)
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-24 | 重构为文档索引入口，原文档拆分为独立文档 |
| 1.0.0 | 2026-03-23 | 初始版本 |

---

*完整内容请查看 [基础设施页面设计文档索引](./infrastructure-detailed-design-index.md)*
