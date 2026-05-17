# MFW 扩展编写规范 & CLI 脚手架 & NPM 发布准备 — 设计文档

> 日期：2026-05-17 | 状态：v3 最终版（审查通过） | 分期：P0（本期）

---

## 1. 背景与目标

### 1.1 现状

| 维度 | 现状 | 问题 |
|------|------|------|
| **扩展包** | 仅 `extension-ad` 一个实例；三段式架构（backend/frontend/shared） | 缺少 `extension.json` manifest；无编写规范文档 |
| **脚手架** | Plop 引擎存在但仅输出 AI 指令，不写文件 | 无 `gen:extension` 命令；无扩展包模板 |
| **发布** | base 和 extension-ad 可发布（private 未设） | 缺 `.npmrc`、`CHANGELOG.md`、发布 scripts |

### 1.2 目标

1. **提取完整的扩展编写规范**——基于 extension-ad 实例，产出开发者手册
2. **创建独立 CLI 工具** `moyan-mfw-cli`——支持 create/generate/validate/version 四大能力
3. **准备 npm 发布配置**——.npmrc、CHANGELOG、publish scripts，不实际执行 publish

---

## 2. 方案选择

**采用方案 A：Monorepo 内嵌 CLI**

- CLI 包位于 `packages/cli/`，作为 monorepo 成员统一管理
- 技术栈：Node.js + Commander + Inquirer + Handlebars + Chalk
- 发布为 `moyan-mfw-cli`，全局安装使用
- 模板内嵌于 CLI 包，与 base 包版本绑定同步

选型理由：CLI 与框架紧密耦合（模板依赖 base 包 exports 结构），同 monorepo 最务实。

---

## 3. 交付物总览

### 3.1 文件交付清单

```
新增文件：
├── packages/cli/                          # moyan-mfw-cli 包
│   ├── bin/mfw.js                         # ESM bin 入口 (shebang + dynamic import)
│   ├── src/
│   │   ├── index.ts                       # Commander program
│   │   ├── commands/
│   │   │   ├── create.ts                  # create extension
│   │   │   ├── generate.ts                # generate module/page/component
│   │   │   ├── validate.ts                # validate extension
│   │   │   └── version.ts                 # version management
│   │   ├── templates/                     # Handlebars .hbs 模板
│   │   │   ├── extension/                 # 扩展包骨架 (~30 files)
│   │   │   ├── backend-module/            # 后端模块 (~7 files)
│   │   │   ├── frontend-page/             # 前端页面 (2 files)
│   │   │   └── frontend-component/         # 前端组件 (1 file)
│   │   ├── validators/
│   │   │   ├── index.ts
│   │   │   ├── structure.ts
│   │   │   ├── manifest.ts
│   │   │   └── conventions.ts
│   │   └── utils/
│   │       ├── fs.ts
│   │       ├── template.ts
│   │       └── npm.ts
│   ├── package.json                       # moyan-mfw-cli, bin, ESM
│   └── tsconfig.json
├── docs/extensions/                        # 扩展编写规范文档
│   ├── README.md                           # 导航入口
│   ├── writing-guide.md                    # 完整编写指南（核心）
│   ├── manifest-spec.md                    # extension.json 规范
│   ├── architecture.md                     # 运行时架构
│   ├── examples/
│   │   └── minimal-extension/              # 最小化示例
│   └── reference/
│       ├── api-catalog.md                  # Base API 索引
│       ├── anti-patterns.md                # 反模式
│       └── migration-guide.md              # 迁移指南
├── .npmrc                                  # npm 发布配置
├── CHANGELOG.md                            # 变更日志
└── LICENSE                                 # 开源许可证

修改文件：
├── package.json                            # 新增 cli/dev/publish scripts
├── packages/base/package.json              # 补充 license/repository/keywords/files
└── packages/extensions/extension-ad/package.json  # 补充元信息
```

---

## 4. CLI 工具详细设计

### 4.1 命令体系

```bash
# ===== 创建扩展包 =====
mfw create extension <name>
  --template <tpl>    # 模板名称 (default: "default")
  --dir <path>        # 输出目录 (default: packages/extensions/)
  --force             # 强制覆盖

# ===== 生成代码 =====
mfw generate module <name> [--extension <ext>]
mfw generate page <name> [--extension <ext>] [--group <group>]
mfw generate component <name> [--extension <ext>] [--category <cat>]

# ===== 校验 =====
mfw validate [path] [--fix] [--reporter text|json]

# ===== 版本管理 =====
mfw version bump <major|minor|patch>
mfw version changelog
mfw version release          # bump + changelog + git tag
```

### 4.2 `create extension` 交互流程

收集变量：
- name（kebab-case）、displayName、description
- routePrefix（默认 `/ext/{name}`，**必须以 `/ext/` 开头**，与 `createExtensionBackendApp` 校验一致）
- permPrefix（默认 `{name}`）
- hasBackend / hasFrontend / hasShared（布尔开关）

**包名生成规则**：扩展包 npm 名称为 `moyan-mfw-extension-{name}`（与 extension-ad 保持一致），子包命名为 `@internal/{name}-{layer}`。

> **注意**：base 包中 `create-extension-backend-app.ts` 的前缀剥离逻辑需同步从 `.replace('moyan-extension-', '')` 更新为 `.replace('moyan-mfw-extension-', '')`。

生成完整扩展包骨架（约 ~30 个文件），包含：

**顶层配置**（4 文件）：
- `package.json` — name: `moyan-mfw-extension-{name}`，version: `0.1.0`，exports 三入口
- `tsconfig.json` — references 子包 tsconfig
- `extension.json` — manifest（见下方模板示例）
- `README.md` — 自动生成的占位 README

**shared 层**（8 文件，条件生成）：
- `package.json` / `tsconfig.json`
- `src/index.ts` — 桶导出
- `src/constants.ts` / `src/dict.ts` / `src/types.ts` / `src/paths.ts` / `src/permission-values.ts`

**backend 层**（10+ 文件，条件生成）：
- `package.json` / `tsconfig.json` / `nest-cli.json` / `.env`
- `src/main.ts` — 独立启动入口
- `src/index.ts` — 导出入口
- `src/{name}.module.ts` — NestJS 根模块（以扩展 name 命名，如 ad.module.ts）
- `src/controller/` / `src/service/` / `src/entities/` / `src/dto/` — 骨架目录 + 占位文件

**frontend 层**（8+ 文件，条件生成）：
- `package.json` / `tsconfig.json` / `vite.config.mts` / `index.html`
- `api.build.cjs` — moyan-api 构建脚本
- `src/main.ts` / `src/index.ts` / `src/env.d.ts` — Vite 类型声明（位于 src/ 下）
- `src/views/` / `src/components/` / `src/apis/` — 骨架目录

**database 目录**（1 目录）：
- `database/migrations/` — TypeORM 迁移目录（空，含 .gitkeep）

### 4.2.1 Post-create Steps（创建后需手动完成）

`mfw create extension` 完成后，输出以下集成提示：

```
🎉 扩展包「{{name}}」创建完成！

📋 后续集成步骤：
   1. cd packages/extensions/extension-{{name}} && pnpm install
   2. 根 package.json → scripts.build 中添加 extension-{{name}} 的构建命令
   3. 根 package.json → scripts.typecheck 中添加子包 typecheck 引用
   4. （如需后端）backend/src/app.modules.ts 或 main.ts 中注册扩展 Module

💡 提示：P2 阶段将提供 mfw integrate <name> 自动完成步骤 2-4
```

### 4.3 `generate` 子命令

在已有扩展包内部生成代码：

| 子命令 | 目标目录 | 生成内容 |
|--------|---------|---------|
| `module` | `src/backend/src/{name}/` | NestJS 完整模块（module/controller/service/entity/dto） |
| `page` | `src/frontend/src/views/{group}/{name}/` | Vue 页面 + definePageConfig |
| `component` | `src/frontend/src/components/{cat}/{name}/` | Mfw 前缀组件 |

> **路径说明**：`module` 目标为 `src/backend/src/{name}/` 而非 `modules/{name}/`，与 extension-ad 实际结构一致（ad.module.ts 直接位于 backend/src/ 下）。

### 4.4 `validate` 校验规则

三级校验：

| 级别 | 规则 | 自动修复 |
|------|------|---------|
| ERROR | `extension.json` 存在且 JSON 合法 | ❌ |
| ERROR | `routePrefix` 以 `/ext/` 开头 | ❌ |
| ERROR | 条件层目录完整（hasBackend → `src/backend/` 存在，hasFrontend → `src/frontend/` 存在，hasShared → `src/shared/` 存在） | ❌ |
| ERROR | package.json exports 含 backend/frontend/shared 三入口 | ❌ |
| WARN | shared 层导出完整（constants/dict/types/paths/permission-values 5 模块） | ✅ 创建占位 |
| WARN | 组件使用 Mfw 前缀命名 | ⚠️ 提示重命名 |
| INFO | README.md 存在 | ✅ 生成模板 |
| INFO | 版本号符合 semver | ❌ |

> **结构定义**：三层指 `src/backend`、`src/frontend`、`src/shared`；每层的存在性由创建时的 hasBackend/hasFrontend/hasShared 决定。每层内部必须含 `package.json`、`tsconfig.json`、`src/` 子目录。

### 4.5 `version` 版本管理

- **bump**：同步升级扩展包及所有子包的 version 字段。包发现算法：扫描 `package.json` 中 `name` 匹配 `@internal/{extName}-{layer}` 的子包（`{extName}` 来自目标扩展包目录名或 `--extension` 参数），以及扩展包自身。
- **changelog**：基于 git log 生成 Keep a Changelog 格式
- **release**：bump → changelog → git tag 一条龙

> **注意**：根 package.json 中的 build/typecheck scripts 硬编码了 extension-ad 包名，新增扩展包后需手动更新或在 P2 阶段通过 `mfw integrate` 自动处理。

### 4.6 技术依赖

| 包 | 版本约束 | 用途 |
|----|---------|------|
| commander | catalog: | 命令行框架 |
| inquirer | catalog: | 交互式提示 |
| chalk | catalog: | 彩色输出 |
| handlebars | catalog: | 模板渲染 |
| semver | catalog: | 版本处理 |
| glob | catalog: | 文件匹配 |
| execa | catalog: | 子进程 |

---

## 5. 模板系统设计

### 5.1 模板引擎

Handlebars（`.hbs`），支持：
- 变量替换：`{{name}}`
- 条件块：`{{#if hasBackend}}...{{/if}}`
- 循环：`{{#each fields}}...{{/each}}`
- 自定义 Helpers：`pascalCase`、`camelCase`、`kebabCase`

### 5.2 模板变量类型定义

```typescript
interface ExtensionTemplateVars {
  name: string;           // kebab-case: "ad"
  displayName: string;    // "广告管理"
  description: string;
  routePrefix: string;    // "/ext/ad" (必须 /ext/ 前缀)
  permPrefix: string;     // "ad"
  className: string;      // PascalCase: "Ad"
  packageName: string;    // "moyan-mfw-extension-ad"
  hasBackend: boolean;
  hasFrontend: boolean;
  hasShared: boolean;
  version: string;        // "0.1.0"
  year: number;
}
```

### 5.3 extension.json 最小模板

CLI 生成的 `extension.json` 必须与 `createExtensionBackendApp` 的 `ExtensionManifest` 接口对齐：

```json
{
  "name": "{{name}}",
  "displayName": "{{displayName}}",
  "description": "{{description}}",
  "version": "{{version}}",
  "routePrefix": "{{routePrefix}}",
  "permCodePrefix": "{{permPrefix}}",
  "namespaceName": "{{displayName}}",
  "permCodeNodes": [],
  "provides": {
    "services": [],
    "dicts": [],
    "routes": [],
    "entities": []
  }
}
```

### 5.4 模板与 base 包同步策略

- 模板中 import 路径使用明确的 `from 'moyan-mfw-base/{layer}'`
- **前端路由**使用 `buildExtensionRoutes(allConfigs, '{{name}}', { namespaceName: '{{displayName}}' })`（非 `buildRoutesFromConfigs`）
- CLI 版本与 base 包主版本绑定
- validate 命令校验 import 路径有效性

### 5.5 根级 index.ts 策略

扩展包**不生成根级 `src/index.ts`**。各子包通过顶层 `package.json` 的 `exports` 字段直接映射到子包入口。

> **历史说明**：extension-ad 存在 `src/index.ts`（导出 extensionManifest），属于早期实现。新扩展包不再需要此文件——manifest 由 `extension.json` 独立提供，运行时加载逻辑在 base 包的 `createExtensionBackendApp` 中处理。如需 barrel export 功能，可在 P1 阶段按需添加。

---

## 6. 扩展编写规范文档设计

### 6.1 文档结构

```
docs/extensions/
├── README.md                      # 导航入口（总览+快速开始）
├── writing-guide.md               # 核心编写指南（10 章）
├── manifest-spec.md               # extension.json 字段详解 + JSON Schema
├── architecture.md                # 运行时架构图
├── examples/
│   └── minimal-extension/         # 最小化可运行示例
└── reference/
    ├── api-catalog.md             # Base 包 API 索引
    ├── anti-patterns.md           # 反模式清单
    └── migration-guide.md         # 版本迁移指南
```

### 6.2 writing-guide.md 章节大纲

| # | 章节 | 关键内容 |
|---|------|---------|
| 1 | 概述与架构 | 扩展定位、三段式架构图、与 base 包关系 |
| 2 | 快速开始 | mfw create + 3 步跑通 |
| 3 | 目录结构规范 | 每个文件职责，必选 vs 可选 |
| 4 | Manifest | extension.json 完整字段表、权限编码规则 |
| 5 | Shared 层 | types/constants/dict/paths/permissions 职责与示例 |
| 6 | Backend 层 | Module/Controller/Service/Entity/DTO 分层规则 |
| 7 | Frontend 层 | views/components/apis 分工，Mfw 命名规范 |
| 8 | 路由与权限 | definePageConfig、v-permission、@RequirePermission |
| 9 | 构建工作流 | build 顺序、dev 模式、moyan-api 生成 |
| 10 | Checklist | 发布前 15 项检查清单 |

### 6.3 显式化规则来源（基于 extension-ad 分析）

| 规则 | 来源文件 |
|------|---------|
| 子包命名 `@internal/{ext}-{layer}` | ad-backend/package.json |
| shared 必须导出 5 个模块 | shared/src/index.ts |
| DTO 分 request/response 两组 | backend/src/dto/ |
| 组件放 components/ 不放 views/ | frontend/src/ |
| 页面用 definePageConfig | views/placement/index.ts |
| Entity 继承 Base | entities/ad.entity.ts |

---

## 7. NPM 发布配置设计

### 7.1 `.npmrc`（根目录）

```npmrc
# moyan-mfw 发布配置（个人/开源包，无 scope）
# =========================================

# 确保包完整性
engine-strict=true

# 发布时始终包含源码 map（调试用）
always_include_source_maps=true

# 禁止预发布标签意外发布
tag=latest
```

### 7.2 package.json 补充字段

**moyan-mfw-base**：
- `private`: **删除或设为 `false`**（发布必须）
- `license`: "MIT"
- `repository`: { type: "git", url: "..." }
- `homepage`: "..."
- `keywords`: ["moyan", "mfw", "admin", "framework"]
- `files`: 白名单（`dist/`、`README.md`、`LICENSE`）

**moyan-mfw-cli**：
- `bin`: { "mfw": "./bin/mfw.js" }
- `private`: `false`
- `files`: `bin/`, `dist/`, `README.md`（模板编译时嵌入 dist，无需包含源码 templates/）
- `type`: "module"（与根包一致，ESM）

**ESM bin 入口处理**：
项目全局 `"type": "module"`。CLI bin 入口 `bin/mfw.js` 使用 shebang + ESM 动态 import：

```javascript
#!/usr/bin/env node
import('./dist/index.js');
```

构建时使用 tsx 或 tsup 将 TypeScript 编译为 ESM 格式的 `dist/index.js`。

### 7.3 根 scripts 补充

```jsonc
{
  "dev:cli": "pnpm --filter moyan-mfw-cli dev",
  "build:cli": "pnpm --filter moyan-mfw-cli build",
  "version:bump": "mfw version bump",
  "changelog": "mfw version changelog",
  "release": "mfw version release",
  "publish:base": "cd packages/base && npm publish --access public",
  "publish:cli": "cd packages/cli && npm publish --access public",
  "publish:all": "pnpm run publish:base && pnpm run publish:cli"
}
```

### 7.4 CHANGELOG 格式

遵循 [Keep a Changelog](https://keepachangelog.com/) 1.1.0：
- sections: Added / Changed / Deprecated / Removed / Fixed / Security
- 版本号格式：[Unreleased] / [1.0.0] - YYYY-MM-DD

---

## 8. 实施分期

| 阶段 | 内容 | 交付物 | 状态 |
|------|------|--------|------|
| **P0** | 规范文档 + CLI create extension + 发布配置 | docs/ + packages/cli/ + .npmrc + CHANGELOG.md | **本期执行** |
| **P1** | generate module/page/component + validate 命令 | commands/generate.ts + commands/validate.ts + 模板 | 后续迭代 |
| **P2** | version 命令 + changelog 自动化 + integrate 命令 | commands/version.ts + commands/integrate.ts | 后续迭代 |

> **Plop 共存策略**（#14）：P1 阶段 `generate` 命令上线后，现有 plop generator（backend-module/frontend-page/frontend-component）保留 AI-instruction 输出模式不变，两者定位不同——plop 面向 AI Agent 协作，CLI `generate` 面向开发者直接生成文件。后续可考虑统一。

---

## 9. 约束与风险

| 风险 | 缓解措施 |
|------|---------|
| 模板与 base 包接口漂移 | validate 校验 import 路径；CI 中加入模板集成测试 |
| CLI 包体积膨胀 | 按需加载模板；模板编译时嵌入 dist（不发布源码 templates/） |
| extension.json 尚未实现运行时加载 | 先定义规范（manifest-spec.md），运行时支持后续补齐 |
| routePrefix 格式约束易被忽略 | CLI 交互时强制校验 `/ext/` 前缀；validate 命令 ERROR 级检查 |
| create 后需手动集成 4 步 | Post-create Steps 明确提示；P2 阶段 `mfw integrate` 自动化 |
| base 包前缀剥离逻辑需同步修改 | P0 阶段同步修复 `create-extension-backend-app.ts` |
