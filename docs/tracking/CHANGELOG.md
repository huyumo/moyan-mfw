# 基础设施文档变更日志

> 版本：2.0.0 | 最后更新：2026-03-25

---

## [2.0.0] - 2026-03-25

### 新增

- **文档分层架构**
  - 创建 `docs/README.md` - 固定入口导航（不超过 1 屏）
  - 创建 `docs/docs-manifest.json` - 机器可读元数据索引
  - 创建 `docs/docs-manifest.md` - 人类可读导航索引
  - 创建 `docs/core/` - 核心概念模块目录
  - 创建 `docs/tracking/` - 问题追踪目录

- **核心概念模块**
  - `docs/core/permissions.md` - 权限系统核心概念（pcAction 数据流、权限池隔离）
  - `docs/core/roles.md` - 角色体系核心概念（角色分类、拥有者机制）
  - `docs/core/architecture.md` - 系统架构核心概念（应用类型中心模式、五层架构）

- **问题追踪**
  - `docs/tracking/REVIEW-ISSUES.md` - 文档审查问题追踪
  - `docs/tracking/CHANGELOG.md` - 变更日志（本文档）

### 优化

- **AI 阅读路径优化**
  - 核心模块控制在 ~1,500 Token 以内
  - 推荐阅读路径总 Token 消耗 ~5,000
  - 元数据索引支持 AI 快速定位关键文档

### 目的

解决文档增长导致的 Token 超限问题，支持长期文档扩展至 50+ 个文件时仍保持高阅读效率。

---

## [1.1.0] - 2026-03-24

### 修复

- **死链接修复** (H1, H7)
  - 统一数据库实体设计链接路径为 `../database/database-entities-design.md`
  - 修复 11 处错误路径

- **拥有者权限表述** (H2)
  - 统一表述为"通过绑定拥有者角色获得权限"
  - 修复 `pages/app-management.md` 和 `flows/system-initialization.md`

- **术语不一致** (M9)
  - 统一"应用类型级角色"为"内置角色"

- **文档链接** (全局)
  - 修复 23 处链接路径问题

### 删除

- **冗余表文档** (H3)
  - 删除 `sys_app_type_builtin_role` 表相关文档
  - 更新 ER 图移除该实体

- **未使用字段** (H4)
  - 删除 `sys_user_app.isDefault` 字段文档

### 新增

- **级联处理说明** (H5)
  - `pages/role-management.md` 添加"角色删除级联处理"章节

- **拥有者记录说明** (H6)
  - 明确拥有者在 `sys_app.ownerId` 和 `sys_user_app` 两处的记录

- **系统架构图** (M1)
  - `infrastructure-detailed-design-index.md` 添加五层架构图

- **内置角色关联说明** (M2)
  - 明确内置角色通过 `sys_role.appTypeId` + `isBuiltin=1` 标识

---

## [1.0.0] - 2026-03-23

### 新增

- 基础设施详细设计主文档
- 数据库实体设计文档
- 数据库 ER 关系图文档
- 权限分配流程文档
- 权限池配置流程文档
- 系统初始化流程文档
- 应用类型管理页面文档
- 应用管理页面文档
- 角色管理页面文档

### 说明

初始版本，从基础设施页面详细设计文档拆分而来，建立完整的权限系统设计文档体系。

---

## 版本说明

| 版本 | 类型 | 说明 |
|------|------|------|
| 主版本号 (X.0.0) | 重大变更 | 架构调整、核心概念变更 |
| 次版本号 (1.X.0) | 重要更新 | 新增章节、重大修复 |
| 修订号 (1.0.X) | 小幅修改 | 文字修正、链接修复 |

---

## 相关资源

- 元数据索引：[docs-manifest.json](./docs-manifest.json)
- 问题追踪：[REVIEW-ISSUES.md](./tracking/REVIEW-ISSUES.md)
- 文档导航：[docs-manifest.md](./docs-manifest.md)

---

*本文档记录基础设施文档的所有重大变更，帮助开发者和 AI 快速了解文档演进历史*
