# Checklist

## Phase 1: 消除文档-代码不一致

### new-backend-module.md 目录结构
- [x] 模块目录结构示例已改为扁平模式（controller/service 文件在模块根目录）
- [x] 已添加说明：仅多实体模块使用子目录
- [x] 已添加 Anti-Patterns 区块

### new-frontend-page.md 表单模板
- [x] 已包含 MfwFormCard + MfwPopup 标准表单组件模板
- [x] 新增模式和编辑模式两种场景均有示例
- [x] 表单校验、提交、emit('confirm') 回调写法完整
- [x] 已添加 Anti-Patterns 区块

### 权限编码单一数据源
- [x] permission-debugging.md 已确认为 canonical source
- [x] new-backend-module.md 中权限编码列表已替换为引用
- [x] routing-auth.md 中无需修改（无权限编码列表）
- [x] 引用格式使用 {{ref:permission-debugging}}

## Phase 2: 脚手架与验证脚本

### plop.js 基础设施
- [x] plop 已安装为 devDependency
- [x] scripts/generators/plopfile.ts 已创建
- [x] scripts/generators/helpers/ 目录已创建（pascal-case、kebab-case、permission-code）
- [x] package.json 已添加 gen/gen:module/gen:page/gen:component 脚本

### 后端模块生成器
- [x] templates/backend/ 目录及全部 9 个 .hbs 模板已创建
- [x] 交互 prompt 包含模块名、中文名、权限编码、权限值
- [x] 执行 `pnpm gen:module` 可生成 9 个文件
- [x] 自动修改 sys/index.ts、app.module.ts（+ 提醒手动注册实体/权限/AuditModule）
- [x] 生成代码符合 new-backend-module.md 13 项清单

### 前端页面生成器
- [x] templates/frontend/ 目录及全部 .hbs 模板已创建
- [x] 交互 prompt 包含模块名、页面名、中文名、页面类型、权限按钮、图标
- [x] 执行 `pnpm gen:page` 可生成 Index.vue + Form.vue + index.ts
- [x] 生成代码符合 new-frontend-page.md 4 项清单

### 前端组件生成器
- [x] 组件模板文件已创建（Vue/TSX 两种入口 + types + style + mod）
- [x] 交互 prompt 包含组件名、分类、类型
- [x] 执行 `pnpm gen:component` 可生成入口+types+style+mod
- [x] 提醒手动在分类 index.ts 添加导出

### 验证脚本
- [x] scripts/validate-skill-docs.ts 已创建
- [x] 引用路径验证功能正常
- [x] 权限编码一致性验证功能正常
- [x] 组件清单一致性验证功能正常
- [x] package.json 已添加 validate:skill 脚本
- [x] package.json 中引用不存在文件的脚本引用已清理

## Phase 3: Skill 格式升级

### frontmatter 元数据
- [x] 全部 12+3 个子文件已添加 YAML frontmatter
- [x] frontmatter 包含 version、last_updated、scope、triggers、dependencies、maturity
- [x] SKILL.md 路由表与 triggers 字段一致

### 交叉引用格式
- [x] SKILL.md 和 new-backend-module.md 中 "详见 `xxx.md`" 已替换为 "详见 {{ref:xxx}} — 描述"
- [x] validate-skill-docs.ts 支持 {{ref:xxx}} 格式验证

### 目录领域分组
- [ ] 延期：当前 15 文件规模尚可管理，待进一步增长再实施

### Anti-Patterns 区块
- [x] pagination-query.md 已添加 5 条反模式
- [x] new-backend-module.md 已添加 9 条反模式
- [x] new-frontend-page.md 已添加 9 条反模式
- [x] apis-redline.md 已添加 5 条反模式
- [x] permission-debugging.md 已添加 5 条反模式
- [x] routing-auth.md 已添加 5 条反模式
- [x] multi-tenant.md 已添加 4 条反模式
- [x] deployment.md 已添加 4 条反模式
- [x] project-structure.md 已添加 4 条反模式
- [x] component-reference.md 已添加 4 条反模式
- [x] coding-conventions.md 已添加 6 条反模式
- [x] styling-theming.md 已添加 5 条反模式

## Phase 4: 知识覆盖补全

### testing-guide.md
- [x] 后端集成测试标准模板已编写
- [x] 前端单元测试标准模板已编写
- [x] 测试命名和文件放置规范已定义
- [x] frontmatter 元数据和 Anti-Patterns 已添加

### migration-guide.md
- [x] TypeORM migration 创建/执行/回滚流程已编写
- [x] 种子数据管理流程已编写
- [x] frontmatter 元数据和 Anti-Patterns 已添加

### error-diagnosis.md
- [x] 数据库连接失败诊断决策树已编写
- [x] 前端构建错误诊断决策树已编写
- [x] API 生成失败诊断决策树已编写
- [x] 路由/菜单/权限常见错误诊断已编写
- [x] frontmatter 元数据已添加

### component-reference.md 丰富
- [x] 每个组件条目已补充类型定义文件路径列
- [x] 核心组件（MfwListPage、MfwPopup、MfwFormCard）关键 Props 已补充

### styling-theming.md 扩充
- [x] 9 套主题色值定义已补充
- [x] 自定义主题创建流程已补充
- [x] dark/css-vars.scss 覆盖示例已补充
- [x] 响应式断点规范已补充
