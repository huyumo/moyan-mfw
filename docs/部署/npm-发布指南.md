# npm 发布指南

## 发布包清单

| 包名 | 位置 | npm 页面 |
|------|------|----------|
| `moyan-mfw-base` | `packages/base/` | https://www.npmjs.com/package/moyan-mfw-base |
| `moyan-mfw-cli` | `packages/cli/` | https://www.npmjs.com/package/moyan-mfw-cli |
| `moyan-mfw-extension-ad` | `packages/extensions/extension-ad/` | https://www.npmjs.com/package/moyan-mfw-extension-ad |
| `moyan-mfw-extension-config` | `packages/extensions/extension-config/` | https://www.npmjs.com/package/moyan-mfw-extension-config |

> `moyan-mfw-frontend`（`frontend/`）为 `private: true` 的应用层包，不发布到 npm。

## 发布流程

### 1. 正式版发布（latest tag）

```bash
# 选择一个 release 类型
pnpm release:patch    # 1.1.9 → 1.1.10（Bug 修复）
pnpm release:minor    # 1.1.9 → 1.2.0（新功能）
pnpm release:major    # 1.1.9 → 2.0.0（破坏性变更）
```

执行后自动完成：
1. 更新根 + 4 个子包的版本号
2. `git commit` 提交版本变更
3. `git tag v{version}` 创建标签
4. `git push origin main --tags` 推送

### 2. Beta 版发布（beta tag）

```bash
pnpm release:prerelease   # 1.1.9 → 1.1.10-beta.0
                           # 再执行 → 1.1.10-beta.1
```

> 用户可以 `npm install moyan-mfw-base@beta` 安装测试版。

## CI/CD 自动发布（TagPipeline）

推送 `v*` 前缀标签后，TagPipeline 自动触发：

```
TagPipeline 触发条件：推送 v* 标签
  │
  ├─ 构建: moyan-mfw-base → extension-ad → extension-config → cli
  ├─ 类型检查: pnpm run typecheck
  └─ 发布:
       ├─ 版本含 '-' → --tag beta
       └─ 版本不含 '-' → --tag latest
```

### 流水线关键代码

`.workflow/tag-pipeline.yml` 中的 tag 判断逻辑：

```yaml
- NPM_TAG=$(node -p "require('./package.json').version.includes('-') ? 'beta' : 'latest'")
- npm publish --access public --tag ${NPM_TAG}
```

## 版本号与 npm dist-tag 对照

| Git Tag | package.json version | npm dist-tag | 安装方式 |
|---------|---------------------|:--:|----------|
| `v1.1.9` | `1.1.9` | `latest` | `npm install moyan-mfw-base` |
| `v1.1.10` | `1.1.10` | `latest` | `npm install moyan-mfw-base` |
| `v1.1.10-beta.0` | `1.1.10-beta.0` | `beta` | `npm install moyan-mfw-base@beta` |
| `v1.2.0` | `1.2.0` | `latest` | `npm install moyan-mfw-base` |

**规则**：版本号含 `-` → `beta` 标签；不含 `-` → `latest` 标签。

## 发布后验证

```bash
# 1. 查看所有版本
npm info moyan-mfw-base versions

# 2. 查看 dist-tags（确认 beta 指向 beta 版，latest 不变）
npm info moyan-mfw-base dist-tags
# 预期输出：
# { latest: '1.1.9', beta: '1.1.10-beta.0' }

# 3. 测试安装 beta 版
npm install moyan-mfw-base@beta
# → 应安装 1.1.10-beta.0

# 4. 确认 latest 不受影响
npm install moyan-mfw-base
# → 应安装 latest 版本（非 beta）

# 5. CI 日志确认
# 查看 TagPipeline 日志，应有：
# >>> 发布版本：v1.1.10-beta.0
# >>> npm tag: beta
```

## 相关文件

| 文件 | 用途 |
|------|------|
| `scripts/release.ts` | 版本号管理 + Git tag 创建 |
| `.workflow/tag-pipeline.yml` | CI 自动构建发布 |
| `.npmrc` | npm 发布配置 |
| 根 `package.json` | 版本号基准（`release:prerelease` 脚本入口） |
