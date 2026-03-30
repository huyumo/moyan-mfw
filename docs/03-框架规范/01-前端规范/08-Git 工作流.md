# Git 工作流

> 状态：**已完成** | 版本：1.0.0

---

## 8.1 分支策略

### 8.1.1 分支类型

| 分支类型 | 命名规范 | 说明 |
|----------|----------|------|
| 主分支 | `main` | 生产环境代码，受保护 |
| 功能分支 | `feat/xxx` | 新功能开发 |
| 修复分支 | `fix/xxx` | Bug 修复 |
| 文档分支 | `docs/xxx` | 文档更新 |
| 重构分支 | `refactor/xxx` | 代码重构 |

### 8.1.2 分支创建

```bash
# 从 main 创建新功能分支
git checkout main
git pull origin main
git checkout -b feat/user-management

# 从 main 创建修复分支
git checkout -b fix/login-error
```

### 8.1.3 分支合并

- 功能分支完成后合并到 `main`
- 合并前必须通过 CI 检查
- 必须经过 Code Review

---

## 8.2 Commit 规范

### 8.2.1 Commit 格式

```
<type>: <subject>

[optional body]

[optional footer]
```

### 8.2.2 Type 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响代码运行） |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具/配置 |

### 8.2.3 Commit 示例

```bash
# 新功能
git commit -m "feat: 添加用户管理页面"

# Bug 修复
git commit -m "fix: 修复登录页跳转问题"

# 文档更新
git commit -m "docs: 更新路由配置文档"

# 重构
git commit -m "refactor: 重构用户列表组件"

# 带描述的提交
git commit -m "feat: 添加订单导出功能

- 支持导出为 Excel 格式
- 支持自定义导出字段
- 添加导出进度提示

Closes #123"
```

### 8.2.4 自动化 Commit

项目配置了 auto-commit hook，提交时自动格式化：

```bash
# 提交后自动运行 lint 和 format
git add .
git commit -m "feat: xxx"
# 自动触发 lint-staged 进行检查和格式化
```

---

## 8.3 PR 流程

### 8.3.1 创建 PR

1. 推送分支到远程
2. 在 GitHub 上创建 Pull Request
3. 填写 PR 描述模板

### 8.3.2 PR 描述模板

```markdown
## 变更说明
简要描述变更内容

## 关联 Issue
- Closes #123

## 测试计划
- [ ] 单元测试通过
- [ ] 手动测试通过

## 截图（如有）

```

### 8.3.3 Code Review

- 至少需要 1 人 Review 通过
- 所有 Comment 必须解决
- CI 检查必须通过

### 8.3.4 合并 PR

- 使用 **Squash and Merge** 合并
- 合并后删除功能分支
- 验证生产环境

---

## 8.4 版本发布

### 8.4.1 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH` (如 `1.2.3`)
- `MAJOR`: 不兼容的 API 变更
- `MINOR`: 向后兼容的功能
- `PATCH`: 向后兼容的 Bug 修复

### 8.4.2 发布流程

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 推送标签
git push origin main --tags

# 3. 创建 Release
# 在 GitHub 上创建 Release 并填写变更日志
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-29 | 初始版本，定义分支策略、Commit 规范、PR 流程 |
