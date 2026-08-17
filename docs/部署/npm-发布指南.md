# npm 发布指南（Changesets 版）

> 自 beta.59 之后，发布体系从"lockstep 统一版本 + 全量发包"迁移到 **Changesets 独立版本**。
> 迁移前的原始状态备份在分支 `backup/beta-v1.2.0-beta.59`。

## 发布包清单

发布包 = 动态发现的非私有包，无需在任何清单里登记：

| 包名 | 位置 |
|------|------|
| `moyan-mfw-base` | `packages/base/`（与 cli 绑定 fixed 组，同版本） |
| `moyan-mfw-cli` | `packages/cli/` |
| `moyan-mfw-extension-*` | `packages/extensions/extension-*/`（独立版本） |

- 新增扩展包：放入 `packages/extensions/extension-xxx/`（`mfw create extension`）即自动进入
  build / typecheck / 发布链路，**零配置**。
- `@internal/*` 子包、demo、根包均为 private，不参与版本管理与发布
  （changesets 配置 `privatePackages.version: false`）。

## 版本策略

- **独立版本**：只有出现变更（有 changeset）的包才会 bump + 发布。
- **base + cli**：fixed 组，始终同版本发布。
- **扩展对 base 的依赖**：静态 peer 范围（`^1.2.0-beta.59` 起步），不随 base 发版联动重发。
  仅当出现兼容性变化（如 base 出 2.0）时人工调整为 `^1.2.0 || ^2.0.0` 之类。

## 日常发版流程

```bash
pnpm release            # 交互确认
pnpm release --yes      # 免确认（等价 pnpm release:yes）
```

脚本（`scripts/release.ts`）依次执行：

1. 校验工作区干净（不再自动 stash，release commit 应只含版本变更）；
2. `pnpm changesets:gen` -- 从上次 release 以来的 conventional commits 自动预填
   `.changeset/auto-*.md`（feat→minor / fix|perf→patch / BREAKING→major，按文件路径归属包）；
3. 确认后 `changeset version` -- bump 受影响包 + 生成分包 `CHANGELOG.md`；
4. 提交 `chore: release <pkg>@<ver>, ...`；
5. 为每个新版本包打 tag：`moyan-mfw-xxx@<version>`；
6. push。**ReleasePipeline** 被这些 tag 触发，自动构建 + `changeset publish`。

> gen 只是预填，发版前请过目 `.changeset/`，可改 bump 级别和描述；也可以随时
> `pnpm changeset` 手工补充。

## 单包发版（独立版本的核心用法）

只改了一个包、只想发一个包时，**不需要任何额外配置**，流程与全量发版完全相同：

```bash
# 例：只修了 extension-sms 的一个 bug
git commit -am "fix(sms): 修复验证码校验超时"   # 1. 正常提交（conventional 格式）
pnpm release                                  # 2. 走标准发版流程
```

会发生什么：

- gen-changesets 按文件路径归属，只生成 `moyan-mfw-extension-sms` 的 changeset
  （commit 触达了哪些包目录，就给哪些包生成；想手动指定用 `pnpm changeset`）；
- `changeset version` 只 bump sms 的版本、只更新它的 CHANGELOG；
- 只打一个 tag：`moyan-mfw-extension-sms@<新版本>`；
- CI 仍会全量构建 + typecheck（有意的安全网，改动 base 时尤其重要），但
  `changeset publish` 只发布 registry 上不存在的版本 -- 其余 8 个包自动跳过，
  实际只发 sms。

### 两个例外

1. **base 不完全独立**：base 与 cli 是 fixed 组，动 base 必然带 cli 同版本。另外若
   base 新版本**超出扩展的 peer 范围**（如 1.2.0-beta.60 -> 1.3.0-beta.0），changesets
   会自动联动 bump 受影响扩展并改写其 peer floor；而 patch 或同号位 beta 递增
   （1.2.0-beta.60 -> 1.2.0-beta.61）时扩展零联动。"改 base 是否牵连扩展"由 peer
   范围自动裁决：只有可能不兼容时才联动。
2. **纯 beta 历史的包**（beta 期新增的扩展）：pre 模式下预发布进 latest tag，发完补
   `npm dist-tag add <pkg>@<版本> beta` 同步 beta tag（见上文 only-pre 特例），
   `preexit` 出首个稳定版后此问题消失。

## beta 通道

```bash
pnpm preenter           # changeset pre enter beta（进入预发布模式）
pnpm release            # 版本号形如 1.3.0-beta.0，npm dist-tag 自动为 beta
pnpm preexit            # 退出 pre 模式，下一次 release 出正式版本（latest）
```

- pre 模式期间所有 bump 都是 `x.y.z-beta.n`，`changeset publish` 自动打 beta dist-tag，
  不会再出现"beta 版本误发 latest"的问题（旧流水线的已知坑）。
- 用户安装：`npm install moyan-mfw-base@beta`。
- **only-pre 特例**：从未发过稳定版的包（如 beta 期新增的扩展），changesets 会把预发布
  直接打到 `latest`（否则 `npm i 包名` 无任何可装版本）。此类包发版后建议手动同步
  beta tag 保持一致：`npm dist-tag add <pkg>@<version> beta`。
- **工具版本约束**：`@changesets/cli` 锁定 **v2** -- v3 的 bin.js 依赖
  `module.enableCompileCache()`（Node 22.8+），而 CI runner 的 nodeVersion 22.3.0
  是已验证可用的版本（更高版本在 runner 上不可用，会报 npm: command not found）。

## CI 流水线

| 流水线 | 触发 | 作用 |
|--------|------|------|
| `release-pipeline.yml` | 推送 `moyan-mfw-*@*` tag | 动态构建 9 包 -> typecheck -> verify:dist -> `changeset publish`（幂等，失败直接红，不吞错） |
| `branch-pipeline.yml` | 任意分支 push | 敏感信息扫描 + 动态构建 + typecheck |
| `pr-pipeline.yml` | PR -> master | 同上 |

发布阶段关键点：

- 构建/检查全部使用包名通配（`--filter "moyan-mfw-extension-*"` 等），新增包自动纳入；
- `changeset publish` 只发布 registry 上不存在的版本，**流水线重跑安全**；
- 若发布后流水线又跑了一次（tag 重推），已发布版本被跳过，不会报错。

## 发布后验证

```bash
# 只发有变更的包：查看每个包的最新版本
npm info moyan-mfw-base dist-tags        # beta 通道确认 beta 指向新版本、latest 未动
npm info moyan-mfw-extension-sms versions

# 重跑幂等性：观察 ReleasePipeline 日志应出现
# "X packages are already published" 类跳过信息
```

## 与旧流程对照

| 旧（<= beta.59） | 新 |
|------------------|-----|
| `pnpm release:patch/minor/...` 统一 bump 9 包 | `pnpm release`，由 changeset 内容决定，只 bump 有变更的包 |
| tag `beta-v1.2.0-beta.59`（单 tag 全量） | 逐包 tag `moyan-mfw-xxx@<ver>` |
| TagPipeline / BetaTagPipeline 两条流水线硬编码包列表 | ReleasePipeline 一条，动态发现 |
| `|| echo already published` 吞错 | `changeset publish` 幂等跳过，错误真实暴露 |
| npm dist-tag 靠人工区分（有误发 latest 风险） | pre 模式自动 beta tag |

## 相关文件

| 文件 | 用途 |
|------|------|
| `.changeset/config.json` | changesets 配置（fixed 组、access、baseBranch） |
| `scripts/gen-changesets.mjs` | 从 conventional commits 预填 changeset |
| `scripts/release.ts` | 发版封装（gen -> version -> commit -> tag -> push） |
| `.workflow/release-pipeline.yml` | CI 构建与幂等发布 |
| `docs/部署/base-重构发布Runbook.md` | base 重构时的版本/依赖操作手册 |
