# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- CLI 模板：Vue 插值 `{{ apiCount }}` 被 Handlebars 吞掉，改用 `v-text="apiCount"`
- CLI 模板：`{{DisplayName}}` 大小写不一致导致注释前缀丢失，统一为 `{{displayName}}`
- CLI 模板：extension tsconfig references 路径 `./src/*/tsconfig.json` 改为 `./shared/tsconfig.json` 等
- CLI 模板：vite.config.mts alias 缺少 `-mfw-` 前缀，补全为 `moyan-mfw-extension-{{name}}/shared`
- CLI 模板：extension package.json workspace 协议缺少 `*`，修正为 `workspace:*`

### Added
- CLI 脚手架包 README.md 文档
- `mfw create business <name>` 命令，生成完整业务项目（后端+前端+共享层）
- CLI 模板回归测试脚本（`_regression-test.mts`）
- AGENTS.md 新增 CLI Scaffolding 章节
- 扩展开发文档新增 CLI 命令速查

## [1.0.0] - 2026-05-17

### Added
- Initial release of moyan-mfw-base framework
- Extension system with three-layer architecture (backend/frontend/shared)
- Example extension: extension-ad (广告管理)
- moyan-mfw-cli scaffolding tool
