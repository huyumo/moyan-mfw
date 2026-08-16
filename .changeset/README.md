# Changesets

本仓库使用 [Changesets](https://changesets.js.io) 管理版本与发布。

## 日常开发

功能分支合入前无需手写 changeset，发版前统一执行：

```bash
pnpm changesets:gen   # 从 conventional commits 自动预填 .changeset/*.md（人工过目微调）
```

也可以随时手动添加：`pnpm changeset`。

## 发版流程

```bash
pnpm release          # = changesets:gen -> changeset version -> 提交 -> 打 tag -> push
```

推送 `moyan-mfw-*@<version>` 格式的 tag 后，release-pipeline 自动构建并执行
`changeset publish`（幂等：registry 上已存在的版本自动跳过）。

## beta 通道

```bash
pnpm changeset pre enter beta   # 进入 beta 预发布模式
# ...正常 release，版本号形如 1.3.0-beta.0，npm dist-tag 为 beta
pnpm changeset pre exit         # 退出，下一次 release 出正式版本
```

## 版本策略

- **独立版本**：每个包只在自己有变更时 bump（`moyan-mfw-base` 与 `moyan-mfw-cli`
  为 fixed 组，始终同版本）。
- **扩展对 base 的依赖**：静态 peer 范围（如 `^1.2.0-beta.59`），不随 base 发版
  联动重发；仅当出现兼容性变化时人工调整范围。
- 私有包（`@internal/*`、demo、根包）不参与版本管理（`privatePackages.version: false`）。
