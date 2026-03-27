# 文档导航索引

> 版本：2.0.0 | 最后更新：2026-03-25

## 🎯 推荐阅读路径

### 新开发者快速上手（~15 分钟）

```
README.md (本入口)
    ↓
core/permissions.md (权限核心概念)
    ↓
core/roles.md (角色核心概念)
    ↓
core/architecture.md (架构核心概念)
    ↓
infrastructure-detailed-design-index.md (系统整体设计)
```

**预计 Token 消耗**: ~5,000 | **核心认知建立**: ✅

---

## 📚 文档分类

### 核心概念模块（优先级：高）

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| [权限系统](./core/permissions.md) | pcAction 数据流、权限池、验证逻辑 | 5min |
| [角色体系](./core/roles.md) | 内置角色、应用级角色、拥有者机制 | 5min |
| [系统架构](./core/architecture.md) | 应用类型中心模式、五层架构 | 5min |
| [术语表](./glossary.md) | 专业术语中英文对照与使用场景 | 5min |

### 数据库设计（优先级：高）

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| [实体设计](./database/database-entities-design.md) | 表结构定义、字段说明 | 10min |
| [ER 关系图](./database/database-er-diagram.md) | 实体关系可视化 | 5min |

### 业务流程（优先级：中）

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| [权限分配流程](./flows/permission-assignment.md) | 角色权限分配详细流程 | 10min |
| [权限池配置流程](./flows/permission-pool-setup.md) | 应用类型权限池配置 | 8min |
| [系统初始化流程](./flows/system-initialization.md) | 系统启动时初始化逻辑 | 5min |
| [用户登录流程](./flows/user-login-flow.md) | 用户登录、应用实例选择与权限加载 | 5min |

### 页面设计（优先级：中）

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| [应用类型管理](./pages/app-type-management.md) | 应用类型 CRUD 页面 | 8min |
| [应用管理](./pages/app-management.md) | 应用实例管理页面 | 8min |
| [角色管理](./pages/role-management.md) | 角色配置与权限分配 | 10min |

### 追踪文档（按需查阅）

| 文档 | 说明 |
|------|------|
| [问题追踪](./tracking/REVIEW-ISSUES.md) | 文档审查发现的问题与解决状态 |
| [变更日志](./tracking/CHANGELOG.md) | 文档修改历史记录 |

---

## 🔍 按主题查找

### 权限相关

```
core/permissions.md              # 核心概念
flows/permission-assignment.md   # 分配流程
flows/permission-pool-setup.md   # 权限池配置
database/database-entities-design.md  # 数据库定义 (sys_permission, sys_role_permission)
```

### 角色相关

```
core/roles.md                    # 核心概念
pages/role-management.md         # 角色管理页面
database/database-entities-design.md  # 数据库定义 (sys_role, sys_user_role)
```

### 应用类型相关

```
core/architecture.md             # 应用类型中心模式
pages/app-type-management.md     # 应用类型管理页面
database/database-entities-design.md  # 数据库定义 (sys_app_type, sys_app)
```

---

## 📊 文档统计

- **核心模块**: 4 个
- **数据库文档**: 2 个
- **流程文档**: 4 个
- **页面文档**: 3 个
- **追踪文档**: 2 个
- **总计**: ~15 个核心文档

---

## 🛠️ 维护指南

### 添加新文档

1. 确定文档分类（core/database/flows/pages/tracking）
2. 在对应目录创建文件
3. 更新 `docs-manifest.json` 中的元数据
4. 在本文件中添加导航链接

### 更新核心概念

- 核心模块文件应保持在 ~1,500 Token 以内
- 如内容超出，考虑拆分为独立文档
- 保持核心模块的稳定性，避免频繁变动

### AI 阅读优化

- 元数据索引 (`docs-manifest.json`) 供 AI 快速定位
- 核心模块优先阅读，建立认知框架
- 详细文档按需查阅，避免 Token 浪费

---

**相关资源**:
- 机器可读元数据：[docs-manifest.json](./docs-manifest.json)
- 问题追踪：[tracking/REVIEW-ISSUES.md](./tracking/REVIEW-ISSUES.md)
- 变更日志：[tracking/CHANGELOG.md](./tracking/CHANGELOG.md)
