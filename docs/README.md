# 基础设施文档导航

> 快速入口：[核心概念](./core/permissions.md) | [文档索引](./docs-manifest.md) | [问题追踪](./tracking/REVIEW-ISSUES.md)

## 快速开始

| 角色 | 推荐路径 |
|------|----------|
| 新开发者 | [核心概念](./core/permissions.md) → [系统架构](./infrastructure-detailed-design-index.md) |
| 后端开发 | [数据库设计](./database/database-entities-design.md) → [权限分配流程](./flows/permission-assignment.md) |
| 前端开发 | [页面设计](./pages/app-type-management.md) → [权限计算逻辑](./core/permissions.md) |

## 文档结构

```
docs/
├── core/           # 核心概念（优先级最高）
├── database/       # 数据库设计
├── flows/          # 业务流程
├── pages/          # 页面设计
├── tracking/       # 问题追踪与变更日志
└── ...             # 其他设计文档
```

## 核心文档

- [核心概念模块](./core/permissions.md) - 权限、角色、架构基础概念
- [术语表](./glossary.md) - 专业术语中英文对照
- [系统架构索引](./infrastructure-detailed-design-index.md) - 整体设计视图
- [数据库 ER 图](./database/database-er-diagram.md) - 实体关系可视化
- [用户登录流程](./flows/user-login-flow.md) - 登录、应用选择与权限加载

---

**维护说明**：
- 元数据索引：[docs-manifest.json](./docs-manifest.json)（机器可读）
- 人类可读导航：[docs-manifest.md](./docs-manifest.md)
- 问题追踪：[tracking/REVIEW-ISSUES.md](./tracking/REVIEW-ISSUES.md)
