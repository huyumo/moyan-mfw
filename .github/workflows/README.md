# GitHub Actions 质量检查配置

> 状态：**已完成** | 最后更新：2026-03-31

---

## 概述

本项目配置了 3 个 GitHub Actions 工作流，实现 CI/CD 质量门禁自动化。

---

## 工作流列表

### 1. 文档质量检查 (`docs-quality.yml`)

**触发条件**：
- Push：`main` 分支或 `docs/**` 分支，且包含文档变更
- PR：针对 `main` 分支的文档变更

**检查项**：
- 文档链接有效性
- 文档模板合规性

**文件范围**：
- `docs/**`
- `*.md`
- `scripts/validate-doc-links.ts`

---

### 2. 代码质量检查 (`code-quality.yml`)

**触发条件**：
- Push：`main` 或 `develop` 分支，且包含代码变更
- PR：针对 `main` 分支的代码变更

**检查项**：
- TypeScript 类型定义完整性
- ESLint 代码风格
- Prettier 格式检查

**文件范围**：
- `packages/**`
- `scripts/validate-types.ts`

---

### 3. 全量质量检查 (`quality-gate.yml`)

**触发条件**：
- Push：`main` 分支
- PR：针对 `main` 分支

**检查项**：
- 文档链接检查
- 类型定义检查
- ESLint 检查
- Prettier 格式检查

**特点**：
- 所有检查项必须全部通过
- 生成质量报告输出到 GitHub Step Summary

---

## 本地运行

在提交前可以本地运行相同的检查：

```bash
# 检查文档链接
pnpm run validate:links

# 检查类型定义
pnpm run validate:types

# 检查代码风格
pnpm run lint

# 检查代码格式
pnpm run format:check

# 运行所有检查
pnpm run validate:all
```

---

## Git Pre-commit Hook

项目已配置 Git 提交前钩子 (`.git/hooks/pre-commit`)，在本地提交前自动运行：

- 文档链接检查（仅检查变更文件）
- 敏感文件检查（防止提交 .env、密钥等）

---

## 状态徽章

可将以下徽章添加到 README.md 显示 CI/CD 状态：

```markdown
[![文档质量检查](../../actions/workflows/docs-quality.yml/badge.svg)](../../actions/workflows/docs-quality.yml)
[![代码质量检查](../../actions/workflows/code-quality.yml/badge.svg)](../../actions/workflows/code-quality.yml)
[![全量质量检查](../../actions/workflows/quality-gate.yml/badge.svg)](../../actions/workflows/quality-gate.yml)
```

---

## 故障排查

### 工作流失败

1. 查看 GitHub Actions 日志
2. 本地运行相同命令复现问题
3. 修复后重新提交或推送到远程

### 跳过检查

在提交信息中添加 `[skip ci]` 可跳过 CI 检查：

```
docs: 更新说明 [skip ci]
```

> 注意：仅限文档小修改时使用，核心代码变更不建议跳过

---

## 相关文件

- `.github/workflows/docs-quality.yml` - 文档质量检查工作流
- `.github/workflows/code-quality.yml` - 代码质量检查工作流
- `.github/workflows/quality-gate.yml` - 全量质量检查工作流
- `.git/hooks/pre-commit` - Git 提交前钩子
- `scripts/validate-doc-links.ts` - 文档链接检查器
- `scripts/validate-types.ts` - 类型定义检查器

---

**维护**: @maintainer | **审查**: @audit | **状态**: 已完成
