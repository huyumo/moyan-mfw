# Tasks

## Phase 1: 消除文档-代码不一致

- [x] Task 1: 修正 new-backend-module.md 目录结构，与扁平模式对齐
- [x] Task 2: 补充前端表单组件标准模板到 new-frontend-page.md
- [x] Task 3: 消除权限编码重复，确立单一数据源

## Phase 2: 脚手架与验证脚本

- [x] Task 4: 初始化 plop.js 基础设施
- [x] Task 5: 实现后端模块生成器
- [x] Task 6: 实现前端页面生成器
- [x] Task 7: 实现前端组件生成器
- [x] Task 8: 创建 Skill 文档验证脚本

## Phase 3: Skill 格式升级

- [x] Task 9: 子文件添加统一 frontmatter 元数据
- [x] Task 10: 统一交叉引用格式
- [ ] Task 11: Skill 目录按领域分组重构（延期：当前 15 文件规模尚可管理，待进一步增长再实施）
- [x] Task 12: 所有子文件添加 Anti-Patterns 区块

## Phase 4: 知识覆盖补全

- [x] Task 13: 新增 testing-guide.md
- [x] Task 14: 新增 migration-guide.md
- [x] Task 15: 新增 error-diagnosis.md
- [x] Task 16: 丰富 component-reference.md
- [x] Task 17: 扩充 styling-theming.md

# Task Dependencies
- Task 8 depends on Task 10 (验证脚本需要 {{ref}} 格式先统一) — 已完成
- Task 11 延期，待文件数量进一步增长再实施
