# moyan-mfw 专属模型训练数据提取方案

## 1. 背景与目标

### 1.1 项目定位

moyan-mfw（墨焱管理框架）是一个面向后台管理场景的全栈 Monorepo 框架，核心提供 RBAC+位运算权限模型、多租户/多应用管理、用户/角色/权限管理能力。技术栈：NestJS + Vue 3 + TypeORM + Element Plus。

### 1.2 模型定位

训练一个**框架专属工具型模型**，充当专业编程 AI 的"第二大脑"和助手角色，覆盖：
- 代码审查（红线规则、反模式检测）
- 知识问答（框架概念、架构原理）
- 组件详解（每个组件的属性、事件、插槽、使用方式）
- 权限系统（位运算原理、装饰器用法、多租户权限）
- 使用场景（何时用什么能力、如何组合）
- 业务系统方案（可用框架构建的系统类型及实现路径）

### 1.3 训练配置

| 配置项 | 值 |
|--------|---|
| 基座模型 | MiniMind (~0.1B) |
| 训练方式 | SFT 微调 |
| 数据格式 | JSONL: `{"conversations": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}` |
| 单条长度 | <2048 tokens |
| 实施策略 | 分批迭代 |

---

## 2. 训练数据 10 大提取维度

### 维度总览

| # | 维度 | 优先级 | 预估条数 | 核心提取源 |
|---|------|--------|---------|-----------|
| 1 | 框架架构知识 | P0 | ~600 | project-structure.md + 源码 |
| 2 | 权限系统深度 | P0 | ~1200 | permissions.ts + 3份Skill文档 + 源码 |
| 3 | 后端模块开发规范 | P0 | ~1000 | new-backend-module.md + Controller/Service/Entity源码 |
| 4 | 前端组件与页面开发 | P0 | ~2320 | component-reference.md + form-reference.md + 组件源码 |
| 5 | 代码审查规则 | P0 | ~800 | redline.md + eslint.config.mjs + 反模式清单 |
| 6 | 业务场景问答 | P1 | ~600 | supplier模块 + 前端业务页面 |
| 7 | 测试规范 | P1 | ~400 | testing-guide.md + tests/README.md |
| 8 | 部署与运维 | P1 | ~400 | deployment.md + docker-compose.yml |
| 9 | 使用场景与最佳实践 | P0 | ~960 | Skill文档 + 源码模式 + 人工编排 |
| 10 | 可实现的业务系统 | P0 | ~1200 | project-structure.md + 多租户模型 + 种子数据 |
| **合计** | | | **~10,480** | |

### 多角度生成策略

每个知识点从以下角度生成 Q&A 变体，确保模型能从不同角度理解：

| 角度 | 说明 | 倍率 |
|------|------|------|
| 是什么 | 概念定义、功能说明 | ×1 |
| 怎么用 | 使用方法、代码示例、参数说明 | ×1 |
| 什么时候用 | 适用场景、最佳实践 | ×1 |
| 注意事项 | 陷阱、红线、反模式、常见错误 | ×0.5 |
| 对比辨析 | 与相似概念的区分 | ×0.3 |
| 故障排查 | 常见问题及解决方案 | ×0.3 |

**总倍率约 ×4.1**

---

## 3. 各维度详细提取方案

### 3.1 维度 1：框架架构知识（~600 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| 项目整体结构 | project-structure.md | 80 |
| 框架-业务分离模式 | packages/base-* vs backend/frontend 源码 | 80 |
| 技术栈与依赖 | package.json 全部 | 60 |
| 启动流程 | create-base-backend-app.ts + main.ts | 80 |
| Monorepo 工作区 | pnpm-workspace.yaml | 40 |
| 框架核心能力清单 | project-structure.md | 80 |
| 框架边界（不提供的能力） | project-structure.md | 60 |
| 数据流（前后端联动） | deployment.md | 60 |
| API 自动生成机制 | moyan-api + apis-redline.md | 60 |

### 3.2 维度 2：权限系统深度（~1200 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| 位运算原理 | permissions.ts (后端+前端) | 150 |
| 默认权限值（5种） | permissions.ts | 80 |
| 扩展权限值（4种） | permissions.ts | 80 |
| 业务权限扩展 | createBusinessPermissionDecorator + backend/permissions.ts | 120 |
| 权限编码规则 | new-backend-module.md | 80 |
| @RequirePermission 装饰器 | require-permission.decorator.ts | 100 |
| @Public / @SkipPermission | 装饰器源码 | 60 |
| AuthGuard 流程 | auth.guard.ts | 100 |
| PermissionGuard 流程 | permission.guard.ts | 120 |
| 多租户权限（三层模型） | multi-tenant.md + app-type.entity.ts | 120 |
| 前端权限控制 | usePermission hook + routing-auth.md | 100 |
| 权限调试排查 | permission-debugging.md | 100 |
| 反模式/红线 | 各 Skill 文档反模式部分 | 90 |

### 3.3 维度 3：后端模块开发规范（~1000 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| 模块目录结构 | new-backend-module.md | 80 |
| Controller 规范（11个，57+端点） | Controller 源码 + ESLint 规则 | 200 |
| Service 规范（10个，75+方法） | Service 源码 | 200 |
| DTO 规范（30+，含校验规则） | DTO 源码 | 150 |
| Entity 规范（11个，80+字段） | Entity 源码 | 120 |
| 分页查询（PaginationX + WhereBuilder） | pagination-query.md + sql.util.ts | 100 |
| 种子数据（8步流程） | SEEDS.md + seeds/index.ts | 60 |
| Migration | migration-guide.md | 40 |
| 审计日志 | @AuditLog + AuditInterceptor | 50 |

### 3.4 维度 4：前端组件与页面开发（~2320 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| MfwListPage（Props+Emits+Slots+Expose+用法） | list-page 组件源码 | 200 |
| MfwCardListPage | card-list-page 组件源码 | 180 |
| MfwSearchPanel | search-panel 组件源码 | 160 |
| MfwPageWrapper | page-wrapper 组件源码 | 120 |
| MfwFormCard | form-card 组件源码 + form-reference.md | 180 |
| MfwPopup（4种调用模式） | popup 组件源码 + form-reference.md | 200 |
| MfwTableList + ActionButtons | table 组件源码 | 120 |
| MfwUpload（3种上传模式） | upload 组件源码 | 120 |
| MfwJsonEditor / MfwMdEditor / MfwQuillEditor | editor 组件源码 | 150 |
| MfwAppSelector / MfwIconPicker / MfwUserPicker / MfwRadioGroup | picker 组件源码 | 200 |
| MfwCardPanel / MfwDetailPanel | display 组件源码 | 120 |
| MfwDateFormat / MfwImageFormat / MfwDictFormat / MfwTagFormat | format 组件源码 | 120 |
| 业务组件（11个） | business 组件源码 | 200 |
| 页面开发流程 | new-frontend-page.md | 100 |
| 路由自动扫描 | routing-auth.md + 路由源码 | 80 |
| Hooks/Composables（3个） | usePermission + useThemeSwitch + useColorMode | 120 |
| Store（3个） | auth-store + layout-store + app-loading-store | 150 |
| 工具函数（2个文件，11+函数） | utils 源码 | 100 |
| 样式主题（9套主题+暗色模式） | styling-theming.md | 100 |

### 3.5 维度 5：代码审查规则（~800 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| apis 目录红线 | redline.md + apis-redline.md（5种违规场景） | 100 |
| QueryBuilder 分页红线 | new-backend-module.md | 80 |
| JWT Secret 红线 | SKILL.md | 40 |
| ESLint 规则（moyan/comment-compliance等） | eslint.config.mjs | 150 |
| 命名规范（kebab-case/PascalCase/camelCase） | coding-conventions.md | 120 |
| 注释规范（@fileoverview+@description） | coding-conventions.md | 80 |
| Controller 限制（禁止导入swagger、禁止Req/Res注解） | eslint.config.mjs | 80 |
| TSX 组件 Mfw 前缀 | eslint.config.mjs | 40 |
| 文件行数限制（1000/200） | eslint.config.mjs | 40 |
| 14 条经验教训 | SKILL.md | 70 |

### 3.6 维度 6：业务场景问答（~600 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| 供应商模块（完整实现） | supplier controller/service/entity/DTO | 200 |
| 订单中心 | frontend/views/business/orders/ | 100 |
| 报表中心 | frontend/views/business/reports/ | 80 |
| 运维监控 | frontend/views/monitor/ | 80 |
| 应用类型配置 | app-types.config.ts | 80 |
| 安装向导 | install.service.ts | 60 |

### 3.7 维度 7：测试规范（~400 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| 后端集成测试（9个模块） | testing-guide.md + tests/ | 180 |
| 前端单元测试 | testing-guide.md + vitest | 100 |
| 测试环境配置 | tests/README.md | 60 |
| 覆盖率要求（>=70%） | tests/README.md | 60 |

### 3.8 维度 8：部署与运维（~400 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| Docker 三阶段构建 | Dockerfile | 80 |
| Docker Compose（MySQL+Redis） | docker-compose.yml | 60 |
| 后端环境变量（27个） | .env.example | 80 |
| 前端环境变量（5个） | frontend/.env.example | 40 |
| 错误诊断决策树（6类） | error-diagnosis.md | 100 |
| CI/CD | ci.yml | 40 |

### 3.9 维度 9：使用场景与最佳实践（~960 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| 权限使用场景 | 权限系统全链路 | 120 |
| 多租户使用场景 | app-types.config.ts + multi-tenant.md | 100 |
| 成员档案扩展场景 | supplier-member-profile.entity.ts 模式 | 80 |
| 业务权限扩展场景 | createBusinessPermissionDecorator | 80 |
| 前端页面配置场景 | defineBusinessPageConfig | 80 |
| 路由守卫场景 | @Public() + auth.guard.ts | 60 |
| 审计日志场景 | @AuditLog | 60 |
| 文件上传场景（Form vs OSS） | MfwUpload + .env | 80 |
| 主题定制场景 | styling-theming.md | 60 |
| API 自动生成场景 | moyan-api 工具 | 80 |
| 代码生成场景（plop） | plopfile.ts | 60 |
| 安装初始化场景 | install.service.ts + SEEDS.md | 60 |
| 搜索面板场景 | MfwSearchPanel | 40 |
| 表单联动场景 | MfwFormCard + FormItemConfig | 60 |

### 3.10 维度 10：可实现的业务系统与方案（~1200 条）

| 子类 | 提取源 | 预估条数 |
|------|--------|---------|
| 企业管理后台 | 种子数据 + 权限系统 | 150 |
| SaaS 多租户平台 | multi-tenant.md + supplier 模式 | 150 |
| 供应商管理平台 | supplier 模块完整实现 | 150 |
| 运维监控平台 | monitor 模块 + 审计日志 | 120 |
| 内容管理系统 (CMS) | 权限树 + 角色体系 | 120 |
| 数据报表平台 | 分页查询 + 角色分配 | 100 |
| 订单管理系统 | orders 页面 + 业务权限 | 100 |
| 框架能力边界 | project-structure.md | 80 |
| 系统组合方案 | 多应用类型 + 多模块 | 120 |
| 从零到一搭建流程 | 全链路 | 110 |

---

## 4. 数据格式规范

### 4.1 JSONL 格式

```jsonl
{"conversations": [{"role": "user", "content": "moyan-mfw 中 MfwListPage 的 showPagination 属性是什么？"}, {"role": "assistant", "content": "showPagination 是 MfwListPage 的 Props 属性，类型为 boolean，控制是否显示分页组件。默认行为取决于框架配置。示例：\n```vue\n<MfwListPage :show-pagination=\"true\" />\n```"}]}
```

### 4.2 质量红线

| 规则 | 说明 |
|------|------|
| 可验证 | 代码片段、配置值、API 路径必须与项目源码一致 |
| 自包含 | 单条对话不依赖上下文，可独立理解 |
| 精炼 | 单条 <2048 tokens（适配 MiniMind 上下文窗口） |
| 无幻觉 | 不编造不存在的 API、组件或功能 |
| 中文为主 | 问答均用中文，代码片段保留英文 |
| 代码准确 | 代码从源码精确提取，不可编造 |

### 4.3 命名约定

- 数据文件按维度编号：`dim01-architecture.jsonl`, `dim02-permission.jsonl`, ...
- 批次文件：`batch01-dim01-04.jsonl`, `batch02-dim05-08.jsonl`, `batch03-dim09-10.jsonl`

---

## 5. 数据提取管道

```
源数据 → 结构化提取 → Q&A 生成 → 质量校验 → 格式转换 → 最终 JSONL
  │           │            │            │            │
  ├─ Skill 文档    ├─ 按维度分桶    ├─ 多角度变体    ├─ 代码片段核对   ├─ conversations 格式
  ├─ 源码文件      ├─ 知识点拆解    ├─ 场景化编排    ├─ 去重/去冗余   └─ token 长度控制
  ├─ 测试代码      ├─ 原子化提取    ├─ 人工审核补充   └─ 完整性检查
  ├─ 种子数据      └─ 交叉引用      └─ 反模式生成
  └─ 配置文件
```

### 5.1 提取脚本

为每个维度编写自动化提取脚本：
- **Skill 文档解析器**：解析 Markdown + YAML Front Matter，按章节拆分
- **源码 AST 解析器**：提取 TypeScript/Vue 的 Props、Emits、方法签名、装饰器参数
- **配置文件解析器**：提取 ESLint 规则、环境变量、Docker 配置
- **Q&A 模板引擎**：基于提取的知识点 + 多角度模板自动生成 Q&A 对
- **质量校验器**：代码片段与源码比对、token 长度检查、去重

### 5.2 人工审核

自动化生成后，需人工审核：
- 维度 9（使用场景）和维度 10（业务系统）大量依赖人工编排
- 代码片段的准确性验证
- 反模式/红线规则的完整性检查

---

## 6. 分批迭代计划

### Batch 1：核心维度（优先级 P0，~5,880 条）

| 维度 | 预估条数 |
|------|---------|
| 2. 权限系统深度 | 1,200 |
| 4. 前端组件与页面开发 | 2,320 |
| 3. 后端模块开发规范 | 1,000 |
| 9. 使用场景与最佳实践 | 960 |
| **小计** | **5,480** |

目标：训练第一版模型，验证框架核心知识的掌握度。

### Batch 2：规范与系统维度（优先级 P0+P1，~2,800 条）

| 维度 | 预估条数 |
|------|---------|
| 5. 代码审查规则 | 800 |
| 1. 框架架构知识 | 600 |
| 10. 可实现的业务系统 | 1,200 |
| 6. 业务场景问答 | 600 |
| **小计** | **3,200** |

目标：补充代码审查能力、架构理解、业务系统方案生成能力。

### Batch 3：测试与部署维度（优先级 P1，~800 条）

| 维度 | 预估条数 |
|------|---------|
| 7. 测试规范 | 400 |
| 8. 部署与运维 | 400 |
| **小计** | **800** |

目标：补全测试和部署知识，实现全链路覆盖。

### 迭代验证

每个 Batch 训练后，使用以下方式验证：
1. **框架知识测试集**：50-100 条预留的测试 Q&A（不参与训练）
2. **实际开发任务**：让模型回答真实开发问题，与源码对照
3. **代码审查任务**：让模型审查故意包含违规代码的片段

---

## 7. 预期成果

| 指标 | 目标 |
|------|------|
| 总训练数据量 | 10,000+ 条 |
| 覆盖维度 | 10 个 |
| 代码覆盖率 | 全部 26 组件 + 25 页面 + 11 Controller + 10 Service + 11 Entity + 30 DTO |
| 场景覆盖率 | 12 类使用场景 + 10 类可构建系统 |
| 训练批次 | 3 批 |
| 模型能力 | 代码审查 + 知识问答 + 组件详解 + 权限系统 + 场景指导 + 系统方案 |
