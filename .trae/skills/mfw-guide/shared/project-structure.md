---
version: "1.0"
last_updated: "2026-04-25"
scope: shared
triggers:
  - 项目结构
  - 框架能力
  - 目录结构
  - 框架边界
dependencies: []
maturity: stable
tags: [架构, 目录结构, 框架边界, 前端, 后端]
---

# 项目结构与框架能力

## 项目结构

```
moyan-mfw/                          # Monorepo 根 (pnpm workspace)
├── packages/
│   ├── base-backend/               # 后端服务 (NestJS 10 + TypeORM + MySQL)
│   │   ├── src/common/             # 通用基础设施
│   │   │   ├── constants/          #   权限常量（位运算值）
│   │   │   ├── decorators/         #   装饰器（Public/RequirePermission/AuditLog/User）
│   │   │   ├── entities/           #   Base 基类
│   │   │   ├── exceptions/         #   自定义异常
│   │   │   ├── filters/            #   全局异常过滤器
│   │   │   ├── guards/             #   守卫（Auth/Permission）
│   │   │   ├── interceptors/       #   拦截器（Transform/Logging/Audit）
│   │   │   ├── types/              #   通用类型（UserDto/ResourceDto/CommonTypes）
│   │   │   └── utils/              #   工具函数（encrypt/pagination/sql/tree）
│   │   ├── src/config/             # 配置（app/database/redis/user）
│   │   ├── src/modules/sys/        # 系统业务模块
│   │   │   ├── auth/               #   认证（登录/注册/Token/权限菜单）
│   │   │   ├── user/               #   用户管理
│   │   │   ├── role/               #   角色管理
│   │   │   ├── permission/         #   权限管理
│   │   │   ├── app-type/           #   应用类型管理
│   │   │   ├── app/                #   应用实例+成员管理
│   │   │   ├── audit-log/          #   审计日志
│   │   │   ├── upload/             #   文件上传（简单URL存储）
│   │   │   └── install/            #   系统初始化
│   │   ├── src/database/seeds/     # 种子数据
│   │   └── tests/integration/      # 集成测试
│   └── base-frontend/              # 前端基础设施包 (Vue3 + ElementPlus + Pinia)
│       └── src/
│           ├── apis/sys/           # API调用层（自动生成，禁止修改）
│           ├── components/         # 通用组件库（Mfw前缀）
│           ├── composables/        # 组合式函数（useColorMode/useThemeSwitch）
│           ├── directives/         # 自定义指令（v-permission）
│           ├── hooks/              # 自定义钩子（usePermission）
│           ├── layouts/            # 布局系统（AdminLayout/EmptyLayout）
│           ├── plugins/            # 插件（ElementPlus + moyan-api适配器）
│           ├── router/             # 路由（自动扫描+守卫+菜单树）
│           ├── store/              # 状态管理（auth-store + layout-store）
│           ├── styles/             # 样式系统（含暗色模式）
│           ├── themes/             # 主题系统（9套主题包）
│           ├── types/              # 类型定义
│           ├── utils/              # 工具（权限位运算）
│           └── views/              # 基础视图页面（login/dashboard/sys/...）
├── frontend/                       # 业务前端应用（消费base-frontend）
└── docs/                           # 项目文档
```

## 框架适合开发的系统类型

Moyan MFW 是一个**后台管理框架**，核心提供权限管理、用户管理、应用管理能力：

| 系统类型 | 说明 | 关键能力 |
|---------|------|---------|
| 企业管理后台 | 内部管理系统、OA、CRM | 用户/角色/权限、多应用、审计日志 |
| SaaS 平台 | 多租户/多商家 SaaS | 应用类型隔离、权限池、应用实例 |
| 运维管理平台 | 监控、配置、日志管理 | 权限控制、健康检查、审计日志 |
| 内容管理系统 | CMS、博客后台 | 权限树、角色体系、菜单管理 |
| 数据管理平台 | 报表、数据看板 | 分页查询、权限控制、角色分配 |

## 核心能力清单

- **用户管理**：创建/编辑/删除/软删除/状态管理/密码重置
- **角色管理**：全局角色/应用类型角色/应用实例角色、内置角色、拥有者角色
- **权限管理**：树形权限结构、PC/普通权限类型、位运算细粒度控制
- **应用管理**：应用类型定义、应用实例创建、成员管理、权限池配置
- **认证体系**：JWT 登录/注册/刷新/登出、Token 自动刷新
- **审计日志**：操作审计、模块分类、数据快照
- **文件上传**：简单 URL 存储、图片/媒体/文件资源类型、静态文件服务
- **系统初始化**：一键初始化、种子数据
- **前端框架**：自动路由扫描、权限菜单、组件库、主题系统、布局系统

## 框架边界（不提供的能力）

- 不提供复杂文件存储服务（仅简单 URL 存储，复杂需求需外部 OSS）
- 不提供消息队列（Redis 配置已预留但未使用）
- 不提供工作流引擎
- 不提供实时通讯（WebSocket）
- 不提供搜索引擎集成

## 反模式（Red Flags）— 立即停止

- ✋ 在 `apis/` 目录手动编写代码 → 详见 {{ref:shared/apis-redline}}
- ✋ 在 `views/` 之外创建页面组件 → 路由扫描只扫描 `views/` 目录
- ✋ 直接修改 `base-frontend` 的 `store/` 或 `router/` → 业务逻辑放 `frontend/` 应用
- ✋ 忽略框架边界强行实现不支持的特性（如文件存储、WebSocket）→ 需要外部服务
