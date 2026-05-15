# 构建配置变更总结

> 日期：2026-05-16  
> 版本：moyan-mfw v1.0.0  
> 变更范围：monorepo 包分层隔离 + 构建产物规范化

---

## 一、变更背景

### 问题

项目采用 monorepo 架构，`packages/base` 和 `packages/extensions/extension-ad` 内部按层（shared / backend / frontend）组织源码。此前存在以下问题：

1. **包声明缺失**：子层目录（如 `src/shared/`）没有独立的 `package.json`，无法被 pnpm workspace 识别为独立包
2. **编译产物污染**：历史 tsconfig 配置错误，580 个 `.js` / `.js.map` / `.d.ts` / `.d.ts.map` 产物泄露在源码目录中
3. **跨层引用混乱**：源码中混用深层相对路径和包名导入，不同构建工具解析行为不一致
4. **并行构建竞态**：`pnpm -r build` 并行执行，extension-ad 依赖 base 的 dist 产物但未确保构建顺序

### 目标

- 为每个子层建立独立的包声明（`@internal/base-shared` 等）
- 确保所有 tsconfig 的 `rootDir` / `outDir` 正确，产物只输出到 `dist/`
- 统一导入方式为包名导入
- 建立正确的顺序构建依赖

---

## 二、包结构变化

### 最终包结构

```
moyan-mfw (monorepo)
├── packages/base/                          # moyan-mfw-base 聚合包
│   └── src/
│       ├── shared/    → @internal/base-shared     零依赖，纯类型定义
│       ├── backend/   → @internal/base-backend    依赖 base-shared
│       └── frontend/  → @internal/base-frontend   依赖 base-shared
│
├── packages/extensions/extension-ad/       # moyan-mfw-extension-ad 聚合包
│   └── src/
│       ├── shared/    → @internal/ad-shared        依赖 base-shared
│       ├── backend/   → @internal/ad-backend       依赖 base-backend + ad-shared
│       └── frontend/  → @internal/ad-frontend      依赖 base-frontend + ad-shared
│
├── backend/              → moyan-mfw-backend
├── frontend/             → moyan-mfw-frontend
└── business-dict/        → moyan-mfw-business-dict
```

### 新增文件（6 个 `package.json`）

| 包名 | 路径 | 依赖 |
|---|---|---|
| `@internal/base-shared` | `packages/base/src/shared/package.json` | 零依赖 |
| `@internal/base-backend` | `packages/base/src/backend/package.json` | `@internal/base-shared` + NestJS |
| `@internal/base-frontend` | `packages/base/src/frontend/package.json` | `@internal/base-shared` + Vue/Vite |
| `@internal/ad-shared` | `packages/extensions/extension-ad/src/shared/package.json` | `@internal/base-shared` |
| `@internal/ad-backend` | `packages/extensions/extension-ad/src/backend/package.json` | `@internal/ad-shared` + `@internal/base-shared` |
| `@internal/ad-frontend` | `packages/extensions/extension-ad/src/frontend/package.json` | `@internal/ad-shared` + `@internal/base-shared` |

---

## 三、tsconfig 变更

### 3.1 核心原则

所有 tsconfig 统一采用：

```json
{
  "rootDir": "./src",
  "outDir": "./dist",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.2 子层 tsconfig 变更明细

#### 后端层（base-shared / base-backend / ad-shared / ad-backend）

| 配置项 | 变更前 | 变更后 |
|---|---|---|
| `rootDir` | 指向父级目录 | `./src` |
| `outDir` | 指向父级 dist | `./dist` |
| `paths["@/*"]` | 跨层映射 | 仅映射 `["./src/*"]` |
| `noImplicitAny` | 继承 `strict:true` | `false`（ad-backend 有解构参数） |
| `tsc-alias` | 无 | build 脚本新增 `tsc && tsc-alias` |

#### 前端层（base-frontend / ad-frontend）

| 配置项 | 变更前 | 变更后 |
|---|---|---|
| `allowImportingTsExtensions` | 无 `emitDeclarationOnly` | **新增** `"emitDeclarationOnly": true` |
| `exclude` | 缺漏 | 新增 `"src/**/*-spec.ts"` |

---

## 四、聚合包 `exports` 变更

### 4.1 `packages/base/package.json`

```json
// 变更前：指向 .ts 源文件
"./shared": "./src/shared/src/index.ts"

// 变更后：指向 .js 编译产物，同时声明 import 条件
"./shared": {
  "import": "./src/shared/dist/index.js",
  "require": "./src/shared/dist/index.js",
  "types": "./src/shared/dist/index.d.ts"
}
```

三层的导出（shared / backend / frontend）均做相同更改：添加 `import` 条件 + 指向 `dist/` 编译产物。

### 4.2 `packages/extensions/extension-ad/package.json`

同上，并为 `build:backend` 脚本添加前置依赖：

```json
// 变更前
"build:backend": "pnpm --filter @internal/ad-backend build"

// 变更后
"build:backend": "pnpm --filter moyan-mfw-base run build:shared && pnpm --filter moyan-mfw-base run build:backend && pnpm --filter @internal/ad-backend build"
```

---

## 五、依赖变更

### 5.1 `pnpm-workspace.yaml`

新增：
```yaml
tsc-alias: ^1.8.17
```

### 5.2 子包新增依赖

| 包 | 新增依赖 |
|---|---|
| `@internal/base-frontend` | `"moyan-api": "catalog:"` |
| `@internal/ad-frontend` | `"moyan-api": "catalog:"` |
| `@internal/base-backend` | `"tsc-alias": "catalog:"` |
| `@internal/ad-backend` | `"tsc-alias": "catalog:"` |

---

## 六、导入路径变更

### 6.1 源码层导入修复

| 目标层 | 变更前（深层相对路径） | 变更后（包名导入） |
|---|---|---|
| base/shared | `"../../../../../shared/src"` | `"moyan-mfw-base/shared"` |
| ad/shared | `"../../../../shared/src"` | `"moyan-mfw-extension-ad/shared"` |

涉及 **18 个文件**（15 个 base/frontend + 3 个 ad/frontend）。

### 6.2 Vite alias（仅 dev 模式）

`frontend/vite.config.ts` 添加：
```ts
'moyan-mfw-base/shared':           resolve(__dirname, '../packages/base/src/shared/src/index.ts'),
'moyan-mfw-extension-ad/shared':   resolve(__dirname, '../packages/extensions/extension-ad/src/shared/src/index.ts'),
```

> **原因**：Vite 使用 ESM 解析，但 shared 编译产物为 CJS。alias 让 Vite 在 dev 模式下直接编译 `.ts` 源文件。

### 6.3 Vite lib build external

`packages/base/src/frontend/vite.config.mts`：
```ts
external: [
  // ...原有
  'moyan-mfw-base/shared'  // 新增：lib 构建时不打包 shared
]
```

---

## 七、构建顺序修正

### 7.1 根 `package.json`

```json
// 变更前：并行构建（有竞态条件）
"build": "pnpm -r build"

// 变更后：顺序构建（确保依赖就绪）
"build": "pnpm --filter moyan-mfw-base build && pnpm --filter moyan-mfw-extension-ad build && pnpm --filter moyan-mfw-business-dict build && pnpm --filter moyan-mfw-backend build && pnpm --filter moyan-mfw-frontend build"
```

---

## 八、编译产物清理

### 8.1 问题根源

历史 tsconfig 配置中 `rootDir` / `outDir` 指向错误，导致 tsc 将编译产物输出到与 `.ts` 源文件相同的目录中。后续修正配置后，这些旧文件并未被自动清除。

### 8.2 清理统计

| 轮次 | 文件类型 | 数量 |
|---|---|---|
| 第 1 轮 | `.js` + `.js.map` | 378 |
| 第 2 轮 | `.d.ts.map` | 202 |
| 第 3 轮 | `.d.ts`（含 `sourceMappingURL`） | 270+ |
| 第 4 轮 | business-dict 残留 | 6 |
| **合计** | | **~860** |

### 8.3 自动 `.d.ts` 识别方法

手写的 `.d.ts`（如 `vue-shim.d.ts`、`env.d.ts`）不含 `sourceMappingURL` 标记；tsc 自动生成的 `.d.ts` 末尾有 `//# sourceMappingURL=xxx.d.ts.map`，通过此特征区分。

---

## 九、构建验证结果

### `pnpm run build` — 退出码 0，零错误

| 包 | 产物位置 | 文件数 |
|---|---|---|
| `@internal/base-shared` | `packages/base/src/shared/dist/` | 52 |
| `@internal/base-backend` | `packages/base/src/backend/dist/` | 628 |
| `@internal/base-frontend` | `packages/base/src/frontend/dist/` | 438 |
| `@internal/ad-shared` | `packages/extensions/extension-ad/src/shared/dist/` | 24 |
| `@internal/ad-backend` | `packages/extensions/extension-ad/src/backend/dist/` | 104 |
| `@internal/ad-frontend` | `packages/extensions/extension-ad/src/frontend/dist/` | 28 |
| `moyan-mfw-business-dict` | `business-dict/dist/` | 24 |
| `moyan-mfw-backend` | `backend/dist/` | 42 |
| `moyan-mfw-frontend` | `frontend/dist/` | 11 |

### 源码泄露检测：0 文件

9 个源码目录全部零泄露（`.js` / `.js.map` / `.d.ts` / `.d.ts.map`）。

---

## 十、关键经验

### 跨包构建模型

| 场景 | 模型 | 实现方式 |
|---|---|---|
| **后端 → base** | Push 模型 | 先构建 base → `dist/`，backend 通过 `exports` + `paths` 引用编译产物 |
| **前端 dev** | Pull 模型 | Vite alias 指向 `.ts` 源文件，按需编译 |
| **前端 lib build** | Push 模型 | 先构建 shared → `dist/`，lib 通过 `external` 保留外部引用 |

### 注意事项

1. **`rootDir` 和 `outDir` 必须在各 tsconfig 中显式声明**，继承的基配置可能不适用
2. **`allowImportingTsExtensions` 必须配合 `emitDeclarationOnly` 或 `noEmit`**
3. **`exports` 的 `import` 条件不能遗漏**，否则 bundler（Vite/Rollup）无法解析
4. **并行构建（`pnpm -r`）不保证依赖顺序**，跨包依赖需要顺序构建或 workspace 协议显式等待
5. **清理历史残留时需要覆盖所有编译产物类型**：`.js` / `.js.map` / `.d.ts` / `.d.ts.map`
