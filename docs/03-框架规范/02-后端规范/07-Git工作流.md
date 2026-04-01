# Git 工作流

> 状态：**已完成** | 版本：2.0.0 | 最后更新：2026-03-30

---

## 7.1 分支策略

### 7.1.1 分支类型

| 分支类型 | 命名规范 | 说明 | 保护等级 |
|----------|----------|------|----------|
| 主分支 | `main` | 生产环境代码，随时可发布 | 🔴 严格保护 |
| 开发分支 | `develop` | 集成测试环境代码 | 🟢 中等保护 |
| 功能分支 | `feat/xxx` | 新功能开发 | ⚪ 无保护 |
| 修复分支 | `fix/xxx` | Bug 修复 | ⚪ 无保护 |
| 文档分支 | `docs/xxx` | 文档更新 | ⚪ 无保护 |
| 重构分支 | `refactor/xxx` | 代码重构 | ⚪ 无保护 |
| 热修复分支 | `hotfix/xxx` | 生产环境紧急修复 | 🟢 中等保护 |

### 7.1.2 分支命名示例

```bash
# ✅ 推荐：
# 功能分支 - 功能模块/功能描述
feat/user-management      # 用户管理功能
feat/auth-login           # 认证登录功能
feat/permission-system    # 权限系统功能

# 修复分支 - 模块/问题描述
fix/user-login-error      # 用户登录错误修复
fix/permission-cache      # 权限缓存修复

# 文档分支
docs/api-specification    # API 规范文档
docs/deployment-guide     # 部署指南文档

# 重构分支
refactor/database-layer   # 数据库层重构
refactor/auth-middleware  # 认证中间件重构

# 热修复分支
hotfix/production-login   # 生产登录问题修复
hotfix/security-patch     # 安全补丁

# ❌ 避免：
feature-1                 # 描述不清晰
fix-bug                   # 太笼统
test                      # 无意义命名
```

### 7.1.3 分支创建

```bash
# 从 develop 创建新功能分支（推荐）
git checkout develop
git pull origin develop
git checkout -b feat/user-management

# 从 develop 创建修复分支
git checkout -b fix/login-error

# 从 main 创建热修复分支（紧急情况）
git checkout main
git pull origin main
git checkout -b hotfix/security-patch
```

### 7.1.4 分支合并策略

```
                    ┌─────────────┐
                    │  feat/*     │
                    │  fix/*      │
                    │  docs/*     │
                    └──────┬──────┘
                           │ PR + Review
                           ↓
    ┌─────────────────────────────────┐
    │            develop              │ ← 日常开发、集成测试
    └─────────────────┬───────────────┘
                      │ 定期发布
                      ↓
    ┌─────────────────────────────────┐
    │              main               │ ← 生产环境
    └─────────────────────────────────┘
                      ↑
                      │ 紧急修复
              ┌───────┴───────┐
              │   hotfix/*    │
              └───────────────┘
```

- 功能分支 → `develop`：日常功能开发合并
- 功能分支 → `main`：重大功能直接发布
- 热修复分支 → `main` + `develop`：双向合并

---

## 7.2 Commit 规范

### 7.2.1 Commit 格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**字段说明：**
- `type`：提交类型（必填）
- `scope`：影响范围（可选）
- `subject`：简短描述（必填，不超过 50 字符）
- `body`：详细描述（可选）
- `footer`：关联 Issue、Breaking Changes（可选）

### 7.2.2 Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加用户导出功能` |
| `fix` | Bug 修复 | `fix: 修复登录页跳转问题` |
| `docs` | 文档更新 | `docs: 更新 API 接口文档` |
| `style` | 代码格式（不影响代码运行） | `style: 修复缩进格式` |
| `refactor` | 重构（既不是新功能也不是 Bug 修复） | `refactor: 重构数据库连接层` |
| `perf` | 性能优化 | `perf: 优化查询缓存逻辑` |
| `test` | 测试相关 | `test: 添加用户服务单元测试` |
| `chore` | 构建/工具/配置 | `chore: 更新依赖版本` |
| `ci` | CI/CD配置 | `ci: 添加自动化测试流程` |
| `revert` | 回滚提交 | `revert: 回滚用户导出功能` |

### 7.2.3 Scope 范围

| 范围 | 说明 | 示例 |
|------|------|------|
| `user` | 用户模块 | `feat(user): 添加用户导入功能` |
| `role` | 角色模块 | `fix(role): 修复角色权限同步问题` |
| `permission` | 权限模块 | `feat(permission): 新增权限校验接口` |
| `auth` | 认证模块 | `fix(auth): 修复 Token 过期处理` |
| `api` | API 层 | `docs(api): 更新接口文档` |
| `db` | 数据库层 | `refactor(db): 优化查询语句` |
| `config` | 配置 | `chore(config): 更新数据库配置` |

### 7.2.4 Commit 示例

```bash
# 新功能
git commit -m "feat(user): 添加用户导入导出功能"

# Bug 修复
git commit -m "fix(auth): 修复 Token 刷新时序问题"

# 文档更新
git commit -m "docs(api): 更新权限管理接口文档"

# 重构
git commit -m "refactor(db): 优化数据库连接池配置"

# 带详细描述的提交
git commit -m "feat(user): 添加用户批量导入功能

- 支持 Excel 文件格式导入
- 支持批量验证数据有效性
- 支持导入进度实时反馈
- 支持导入错误报告生成

Closes #123
Related to #456"

# 带 Breaking Change 的提交
git commit -m "feat(api): 升级用户 API 到 v2 版本

BREAKING CHANGE: 用户 API v2 移除了以下字段：
- user.passwordHash
- user.secretKey

迁移指南：
- 使用 /api/v2/users/:id/permissions 替代
```

### 7.2.5 Commit 检查清单

提交前确认：
- [ ] Commit 类型正确
- [ ] Subject 简短清晰（不超过 50 字符）
- [ ] 必要时添加 Body 描述
- [ ] 关联 Issue（如有）
- [ ] 无敏感信息（密码、密钥等）

---

## 7.3 PR 流程

### 7.3.1 创建 PR

1. **推送分支到远程**
   ```bash
   git push origin feat/user-management
   ```

2. **在 GitHub/GitLab 上创建 Pull Request**

3. **填写 PR 描述模板**

### 7.3.2 PR 描述模板

```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试 (test)
- [ ] 其他 (chore)

## 变更说明
简要描述变更内容和背景

## 关联 Issue
- Closes #123
- Related to #456

## 测试计划
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

## 测试步骤
1. 启动开发服务器
2. 访问 /users 页面
3. 点击导入按钮
4. 上传 Excel 文件
5. 验证导入结果

## 截图（如有）
[截图或录屏]

## 检查清单
- [ ] 代码遵循编码规范
- [ ] 添加了必要的单元测试
- [ ] 更新了相关文档
- [ ] 无 Breaking Changes（如有请标注）
```

### 7.3.3 Code Review

**Review 流程：**
1. 创建 PR 后自动通知 Reviewer
2. Reviewer 进行代码审查
3. 回复并解决所有 Comment
4. 获得至少 1 人 Approval
5. CI 检查全部通过
6. 合并 PR

**Review 检查项：**
- [ ] 代码功能正确
- [ ] 代码符合规范
- [ ] 无安全隐患
- [ ] 有适当的测试覆盖
- [ ] 注释清晰完整

### 7.3.4 合并 PR

**合并策略选择：**

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| Squash and Merge | 将所有提交压缩为一个 | 功能分支有多个小提交 |
| Merge | 保留所有提交历史 | 分支提交都有意义 |
| Rebase and Merge | 变基后合并 | 保持线性历史 |

**推荐：** 使用 **Squash and Merge** 保持主分支历史清晰

**合并后操作：**
- [ ] 验证测试环境
- [ ] 删除功能分支
- [ ] 更新关联 Issue 状态

---

## 7.4 版本发布

### 7.4.1 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

```
MAJOR.MINOR.PATCH
  │      │      │
  │      │      └─ 向后兼容的 Bug 修复
  │      └─ 向后兼容的功能
  └─ 不兼容的 API 变更
```

**示例：** `1.2.3`

### 7.4.2 发布流程

```bash
# 1. 切换到 main 分支
git checkout main
git pull origin main

# 2. 更新版本号
npm version patch  # 或 minor / major

# 3. 推送标签
git push origin main --tags

# 4. 在 GitHub/GitLab 创建 Release
#    - 选择新创建的 tag
#    - 填写 Release 说明
#    - 发布
```

### 7.4.3 Release 说明模板

```markdown
## 版本 x.y.z

### 🎉 新功能
- 功能 1 描述 (#Issue 号)
- 功能 2 描述

### 🐛 Bug 修复
- 修复问题 1 (#Issue 号)
- 修复问题 2

### ⚡ 性能优化
- 优化描述

### 📝 文档更新
- 文档描述

### ⚠️ Breaking Changes
- 如有，请详细说明
```

---

## 7.5 紧急情况处理

### 7.5.1 热修复流程

```bash
# 1. 从 main 创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix

# 2. 修复代码并提交
git add .
git commit -m "fix: 紧急修复线上问题"

# 3. 创建 PR（走快速通道）
git push origin hotfix/urgent-fix

# 4. 快速 Review 并合并
# 5. 同步到 develop
git checkout develop
git merge main
git push origin develop
```

### 7.5.2 回滚操作

```bash
# 找到需要回滚的 commit hash
git log --oneline

# 创建回滚提交
git revert <commit-hash>

# 或者直接重置（慎用，仅适用于未推送的提交）
git reset --hard <previous-commit>
```

---

## 7.6 Git 配置建议

### 7.6.1 全局配置

```bash
# 用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 默认行为
git config --global init.defaultBranch main
git config --global pull.rebase false

# 别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
```

### 7.6.2 项目级配置

创建 `.gitattributes` 文件：

```
# 行尾符处理
* text=auto
*.sh text eol=lf
*.bat text eol=crlf
*.md text eol=lf
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-30 | 基于前端规范和业界最佳实践编写完整版 |
| 1.0.0 | 2026-03-28 | 初始版本（草案框架） |
