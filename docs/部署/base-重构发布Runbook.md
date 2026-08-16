# base 重构发布 Runbook

> 目的：`packages/base` 后续会重构（性质未定：内部优化或 API 面 breaking）。本文记录
> 重构启动时**必须先做的前置修复**、两种重构性质各自的发布路径、以及依赖管理规则。
> 发布工具细节见《npm-发布指南.md》。

## 1. 重构前必修清单（契约外耦合）

以下三处耦合不在 `moyan-mfw-base/{backend,frontend,shared}` 三个入口契约内，
但 base 目录/导出一动就会连锁爆炸，**重构启动后第一批处理**：

| # | 问题 | 位置 | 修复方向 |
|---|------|------|----------|
| 1 | vite alias 直指 base 源码路径 | 7 个扩展的 `src/frontend/vite.config.mts`（`'moyan-mfw-base/frontend' -> ../../../../base/src/frontend/src/index.ts` 等 4 条） | 改为指 base 构建产物或 exports 子路径；否则 base 目录结构调整时 7 个扩展构建全失败 |
| 2 | 运行时 require hack | 6 个扩展 backend 的 `src/api-response.ts`（`require('moyan-mfw-base/backend')` 取 ApiResponseUtil 运行时值） | base 侧将 ApiResponseUtil 改为**值导出**，扩展删除该文件改普通 import |
| 3 | 未声明的子路径 | `moyan-mfw-base/frontend/styles/base-admin.scss`、`moyan-mfw-base/frontend/vite-helpers` | 在 base `package.json` `exports` 中正式声明这两个子路径 |

## 2. 依赖分层规则（规范）

| 层 | 协议 | 说明 |
|----|------|------|
| 第三方依赖 | `catalog:` | 现状不变 |
| `@internal/*` 私有子包、demo 内部引用 | `workspace:*` | 不发布，现状不变 |
| 扩展 -> base（发布包声明） | 静态 peer（如 `^1.2.0-beta.59`） | **不用 workspace:/不用 catalog**：不随 base 发版联动重发扩展；兼容范围变化时人工调整 |
| demo / 业务项目 -> 扩展 | `workspace:*`（用户侧为 npm 范围） | 现状不变 |

## 3. SPI 契约约束

- SPI token 一律 `Symbol.for('MOYAN:MFW:...')` 全局注册（跨包跨副本同值）。
- **token 字符串是永久公共契约：只增、不改、不删**；接口变更时新增 token，
  旧 token 保留并标 deprecated。

## 4. 两种重构性质的发布路径

### 情形 A：内部实现/结构优化（非 breaking）

1. base 发 minor（changeset 内容决定）；
2. 扩展**零联动**：静态 peer 自动覆盖新 minor，无需重发；
3. ReleasePipeline 的全量 build + typecheck 就是兼容性回归网，绿了即可。

### 情形 B：API 面重构（breaking）

推荐路径（deprecation 先行）：

1. **预告**：base 先发一个 minor，把将废弃的 API 加 `@deprecated` JSDoc + 运行时
   warn（存活一个 minor 周期）；
2. **major**：base 发 major（fixed 组内 cli 自动跟随，如 2.0.0）；
3. **扩展适配**（每个扩展二选一）：
   - 兼容无需改码：把 peer 改成 `^1.2.0 || ^2.0.0` 发 patch；
   - 需要改代码：自行适配后发 minor（peer 同步改）；
4. **可选 release train**：若多扩展需要同批切换，可临时把它们组成 fixed 组
   （改 `.changeset/config.json` 的 `fixed`）发一轮，**发完即解散**，避免长期锁死版本。

### 重构安全网（强烈建议重构前加上）

- 用 api-extractor 对 base 三个入口做 API 快照，`verify:contract` 纳入 CI：
  重构 PR 一跑即量化 API 面差异（删除/改名/签名变化），两种情形都受益；
- CI 全量 typecheck 已覆盖全部 7 个扩展（本次改造已完成），base 任何导出面的
  compile-time 破坏都会被拦截。

## 5. 回退

- 原始状态：分支 `backup/beta-v1.2.0-beta.59`（beta.59 时的 lockstep 体系快照）；
- 单包回退：npm 上 `npm dist-add <pkg>@<version> latest`（或 beta）移动 dist-tag；
  版本号本身不可撤回，走"发新修复版"而非删版本。
