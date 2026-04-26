# mfw-guide Skill 优化规范

## Why
当前 `mfw-guide` Skill 存在三个核心问题：(1) 文档与实际代码严重不一致——后端模块目录结构在文档中规定使用 `controller/` + `service/` 子目录，但 87.5% 的实际模块采用扁平模式；(2) 高度规范化的项目缺乏自动化脚手架，13 步后端清单和 4 步前端清单完全依赖手写；(3) Skill 文档缺乏机器可读元数据和反模式指引，影响 LLM 输出质量和可验证性。

## What Changes
- 修正 `new-backend-module.md` 目录结构与实际代码对齐（扁平模式）
- 补充前端表单组件标准模板到 `new-frontend-page.md`
- 消除权限编码重复，确立单一数据源
- 引入 plop.js 代码生成器（后端模块 + 前端页面 + 前端组件）
- 创建 Skill 文档验证脚本
- 子文件添加统一 frontmatter 元数据
- 统一交叉引用格式
- Skill 目录按领域分组重构
- 所有子文件添加 Anti-Patterns 区块
- 新增 testing-guide.md、migration-guide.md、error-diagnosis.md
- 丰富 component-reference.md（补充类型文件路径）
- 扩充 styling-theming.md
- 消除 package.json 中引用不存在文件的脚本

## Impact
- Affected specs: mfw-guide Skill 全部 12 个子文件 + SKILL.md
- Affected code: `scripts/generators/`（新增）、`scripts/validate-skill-docs.ts`（新增）、`package.json`（修改）
- **BREAKING**: 后端模块标准目录结构从子目录模式变更为扁平模式

## ADDED Requirements

### Requirement: 后端模块扁平目录结构
文档规范必须与实际代码惯例一致。单实体模块的 controller、service 文件直接放置在模块根目录，不创建子目录。

#### Scenario: 创建单实体后端模块
- **WHEN** 创建仅含一套 Controller/Service 的后端模块
- **THEN** controller 和 service 文件直接放在模块根目录（如 `user.controller.ts`、`user.service.ts`）
- **AND** 仅当模块包含多套 Controller/Service 时才创建 `controller/`、`service/` 子目录

### Requirement: 前端表单组件标准模板
`new-frontend-page.md` 必须包含完整的表单组件标准写法，与列表页模板形成配对。

#### Scenario: 创建新增/编辑表单
- **WHEN** 需要创建与列表页配合的弹窗表单组件
- **THEN** 使用 `MfwPopup.open()` 配合 `MfwFormCard` 标准模板
- **AND** 表单提交后通过 `emit('confirm')` 通知父组件刷新
- **AND** 编辑模式通过 `props.data` 接收行数据

### Requirement: 权限编码单一数据源
权限编码列表必须只在 `permission-debugging.md` 中维护，其他文件引用而不重复。

#### Scenario: 新增权限编码
- **WHEN** 新增后端模块需要注册权限编码
- **THEN** 仅在 `permission-debugging.md` 的权限编码列表中添加
- **AND** `new-backend-module.md` 仅引用该列表，不重复列举

### Requirement: plop.js 后端模块生成器
系统提供 `pnpm gen:module` 命令，通过交互式 prompt 生成后端模块全套文件。

#### Scenario: 生成单实体后端模块
- **WHEN** 执行 `pnpm gen:module` 并输入模块名、中文名、权限编码、权限值
- **THEN** 自动生成 9 个文件（controller、service、entity、3 个 req DTO、1 个 res DTO、dto/index、module）
- **AND** 自动修改 3 个文件（sys/index.ts 添加导出、app.module.ts 添加导入、permissions.ts 添加编码）
- **AND** 生成的代码符合 `new-backend-module.md` 中 13 项清单的全部要求

#### Scenario: 生成多实体后端模块
- **WHEN** 用户选择创建多套 Controller/Service
- **THEN** 自动创建 `controller/` 和 `service/` 子目录
- **AND** 每套 Controller/Service 对应各自的文件

### Requirement: plop.js 前端页面生成器
系统提供 `pnpm gen:page` 命令，通过交互式 prompt 生成前端页面全套文件。

#### Scenario: 生成列表页面
- **WHEN** 执行 `pnpm gen:page` 并输入模块名、页面名、中文名、页面类型、权限按钮
- **THEN** 自动生成 Index.vue（列表页）、XxxForm.vue（表单组件）、index.ts（页面配置）
- **AND** 如模块 index.ts 不存在则自动创建

### Requirement: plop.js 前端组件生成器
系统提供 `pnpm gen:component` 命令，生成前端组件全套文件。

#### Scenario: 生成前端组件
- **WHEN** 执行 `pnpm gen:component` 并输入组件名、分类、组件类型（Vue/TSX）
- **THEN** 自动生成入口文件、types.ts、style.scss、mod.ts
- **AND** 自动在分类 index.ts 中添加导出

### Requirement: Skill 文档验证脚本
系统提供 `pnpm validate:skill` 命令，验证 Skill 文档与代码的一致性。

#### Scenario: 运行验证
- **WHEN** 执行 `pnpm validate:skill`
- **THEN** 检查文档中引用的文件路径是否存在
- **AND** 检查权限编码列表与 permissions.ts 是否匹配
- **AND** 检查组件清单与 components/ 目录是否匹配
- **AND** 输出不一致报告

### Requirement: 子文件 frontmatter 元数据
所有 Skill 子文件必须包含统一的 YAML frontmatter。

#### Scenario: 文件元数据
- **WHEN** 创建或更新 Skill 子文件
- **THEN** 文件顶部包含 `version`、`last_updated`、`scope`、`triggers`、`dependencies`、`maturity` 字段
- **AND** SKILL.md 路由表可从 `triggers` 字段自动生成

### Requirement: 统一交叉引用格式
文件间引用使用 `{{ref:filename}}` 格式，可被脚本验证。

#### Scenario: 引用验证
- **WHEN** 运行验证脚本
- **THEN** 检查所有 `{{ref:xxx}}` 引用的目标文件是否存在
- **AND** 检查是否存在未被引用的孤立文件

### Requirement: Skill 目录领域分组
Skill 子文件按领域分组到子目录中。

#### Scenario: 目录结构
- **WHEN** 查看 `mfw-guide/` 目录
- **THEN** 文件按 `backend/`、`frontend/`、`auth/`、`infra/`、`_shared/` 分组
- **AND** SKILL.md 路由表缩减为领域索引

### Requirement: Anti-Patterns 区块
所有子文件必须包含 Anti-Patterns（反模式）区块，列出常见错误和红线场景。

#### Scenario: LLM 代码生成
- **WHEN** LLM 根据 Skill 文档生成代码
- **THEN** Anti-Patterns 区块提供 Red Flags 列表
- **AND** LLM 在生成代码前检查是否触犯反模式

### Requirement: 测试规范文档
新增 `testing-guide.md`，提供后端集成测试和前端单元测试的标准模板和命名规范。

#### Scenario: 编写后端集成测试
- **WHEN** 需要为新模块编写集成测试
- **THEN** 参考 `testing-guide.md` 中的标准模板
- **AND** 测试文件命名为 `xxx-api.spec.ts`，放置在 `tests/integration/`

### Requirement: 数据库迁移规范文档
新增 `migration-guide.md`，提供 TypeORM migration 的创建、执行、回滚流程。

#### Scenario: 创建数据库迁移
- **WHEN** Entity 字段发生变更
- **THEN** 参考 `migration-guide.md` 创建迁移文件
- **AND** 使用 `pnpm run migration:generate` 和 `pnpm run migration:run`

### Requirement: 错误诊断文档
新增 `error-diagnosis.md`，提供常见错误的诊断决策树。

#### Scenario: 构建或运行错误
- **WHEN** 遇到数据库连接失败、前端构建错误、API 生成失败、路由未注册等常见错误
- **THEN** 参考 `error-diagnosis.md` 中的决策树逐步排查

### Requirement: 组件类型文件路径
`component-reference.md` 为每个核心组件补充类型定义文件路径。

#### Scenario: 查看组件完整 API
- **WHEN** 需要了解组件的完整 Props/Events/Slots
- **THEN** 通过 `component-reference.md` 中的类型文件路径找到 `types.ts`
- **AND** 读取 `types.ts` 获取完整类型定义

## MODIFIED Requirements

### Requirement: SKILL.md 路由表
路由表从 12 行扁平列表重构为 4 个领域入口 + 共享区，每个领域入口指向 `_index.md`。

### Requirement: new-backend-module.md 目录结构
模块目录结构从子目录模式（`controller/`、`service/` 子目录）变更为扁平模式（controller/service 文件直接放在模块根目录），仅多实体模块使用子目录。

### Requirement: new-frontend-page.md
新增表单组件标准模板和详情页模板章节。

### Requirement: component-reference.md
每个组件条目增加 `类型定义` 列，指向 `types.ts` 文件路径。

### Requirement: styling-theming.md
扩充内容：9 套主题包各自的主题色值、自定义主题创建流程、dark/css-vars.scss 覆盖示例、响应式断点规范。

### Requirement: package.json 脚本
移除引用不存在文件的脚本引用，新增 `gen`、`gen:module`、`gen:page`、`gen:component`、`validate:skill` 脚本。

## REMOVED Requirements

### Requirement: 权限编码在多文件重复
**Reason**: 单一数据源原则，避免文档漂移
**Migration**: 权限编码列表仅保留在 `permission-debugging.md`，其他文件使用 `{{ref:permission-debugging}}` 引用

### Requirement: SKILL.md 12 行扁平路由表
**Reason**: 路由表随文件增长不可维护
**Migration**: 重构为 4 领域入口索引
