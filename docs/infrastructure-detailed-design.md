# 基础设施页面设计文档

> **注意**: 本文档已重构拆分为独立文档，请查看 [基础设施页面设计文档索引](./infrastructure-detailed-design-index.md) 获取完整内容。

## 概述

本文档是基础设施页面设计文档的入口，详细描述数据库实体设计、ER 关系、页面流程和核心业务流程。

**版本**: 2.0.0

---

## 快速导航

### 数据库设计

- [数据库实体设计](./database/database-entities-design.md) - 所有数据库实体的详细定义
- [数据库 ER 关系图](./database/database-er-diagram.md) - 实体间关系图和权限隔离机制

### 页面流程

- [应用类型管理页面](./pages/app-type-management.md) - 应用类型列表、详情、编辑、权限池配置和内置角色管理
- [应用实例管理页面](./pages/app-management.md) - 应用实例的 CRUD、拥有者绑定流程
- [成员管理页面](./pages/member-management.md) - 应用实例成员管理、角色分配流程
- [角色管理页面](./pages/role-management.md) - 角色管理、权限分配流程
- [权限管理页面](./pages/permission-management.md) - PC 权限树管理流程

### 业务流程

- [用户登录流程](./flows/user-login-flow.md) - 用户登录后的应用实例选择、权限加载和切换流程
- [权限池配置流程](./flows/permission-pool-setup.md) - 应用类型权限池配置的详细流程和并发处理机制
- [权限分配流程](./flows/permission-assignment.md) - 角色权限分配的详细流程和权限验证逻辑
- [权限计算规则](./flows/permission-calculation-rules.md) - 用户最终权限的计算逻辑和规则说明
- [开发者模式说明](./flows/developer-mode.md) - 开发者模式的定义、鉴权方式、可见功能
- [系统初始化说明](./flows/system-initialization.md) - 内置应用类型、内置应用实例、初始数据的创建

---

## 概述

本文档是基础设施页面设计文档的入口，完整内容请查看 [基础设施页面设计文档索引](./infrastructure-detailed-design-index.md)。

**版本**: 2.0.0

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-24 | 重构：简化 PermissionType，新增 NodeType，添加 pcAction 字段 |
| 1.0.0 | 2026-03-23 | 初始版本 |

---

*完整内容请查看 [基础设施页面设计文档索引](./infrastructure-detailed-design-index.md)*