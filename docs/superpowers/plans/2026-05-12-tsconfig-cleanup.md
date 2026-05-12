# Tsconfig 统一清理方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一项目中 16 个 tsconfig 文件的配置，建立清晰继承链，消除 IDE 与 CLI 类型检查不一致问题。

**Architecture:** 新建 `tsconfig.base.json` 作为唯一共享基础配置（不含 module/moduleResolution），所有 tsconfig 通过 `extends` 链接到它；`packages/base/tsconfig.json` 转为 project-references 方案文件，让 VS Code 能正确为前后端文件分派对应的 tsconfig。

**Tech Stack:** TypeScript 5.9, pnpm monorepo, Vue 3, NestJS

---

## 根因分析

| 问题 | 根因 |
|------|------|
| 配置混乱 | 16 个文件，9 个无 extends，target/strict 不统一 |
| IDE 报错但 CLI 通过 | `packages/base/src/frontend/` 文件在 VS Code 中无法匹配到 `tsconfig.frontend.json`，回退到内置默认设置 |
| 改这里坏那里 | `tsconfig.frontend.json` 继承根 tsconfig（`composite: true`），兄弟文件继承本地 tsconfig，两条继承链互相干扰 |

### IDE vs CLI 不一致的详细链路

```
packages/base/src/frontend/router/routes.ts
  ├─ CLI: tsc -p tsconfig.frontend.json → module:ESNext+bundler ✓
  └─ IDE: packages/base/tsconfig.json → 排除 src/frontend → 跳过
          根 tsconfig.json → 排除 packages → 跳过
          VS Code 内置默认 → ??? → 类型错误 ✗
```

---

## 继承树（改造后）

```
                    tsconfig.base.json (NEW at root)
                   /       |              \
                  /        |               \
          root            |                 \
       tsconfig.json    tsconfig.backend.json   tsconfig.frontend.json
      (workspace)       (packages/base)         (packages/base)
       composite:true          |
                    ┌─────────┼──────────┐
                    |         |          |
            tsconfig.test.json  shared   backend.alias

其他独立配置:
  backend/tsconfig.json       → extends 根 tsconfig.base.json
  frontend/tsconfig.json      → extends 根 tsconfig.base.json
  business-dict/tsconfig.json → extends 根 tsconfig.base.json
    tsconfig.cjs.json         → extends ./tsconfig.json (覆盖为 commonjs)
    tsconfig.esm.json         → DELETE (与 tsconfig.json 冗余)
  extension-ad/tsconfig.json  → extends 根 tsconfig.base.json
    tsconfig.vue.json         → extends ./tsconfig.json
    tsconfig.build.json       → extends ./tsconfig.json
  e2e/tsconfig.json           → extends 根 tsconfig.base.json

  packages/base/tsconfig.json → SOLUTION 文件 (references only)
```

---

## 任务分解

### 阶段一：新建共享基础配置

#### Task 1: 创建 `tsconfig.base.json`

**Files:**
- Create: `tsconfig.base.json`（项目根目录）

- [ ] **Step 1: 写入 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "sourceMap": true,
    "removeComments": false
  }
}
```

> **设计决策：** 
> - 不含 `module` / `moduleResolution`：由各领域配置自行指定
> - 不含 `composite`：由需要 project references 的配置自行添加
> - `target: ES2022`：统一到最高版本
> - `strict: true`：统一开启严格模式（NestJS 实体可用 `!` 或 `?` 处理）
> - `experimentalDecorators: true` + `emitDecoratorMetadata: true`：NestJS 必需

---

### 阶段二：改造根 tsconfig

#### Task 2: 修改根 `tsconfig.json` 继承 base

**Files:**
- Modify: `tsconfig.json`（项目根目录）

- [ ] **Step 1: 改写为继承 base**

当前 `tsconfig.json` 独立定义了所有 compilerOptions。改为 extends tsconfig.base.json，仅保留 workspace 级别的差异化配置。

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "composite": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": ".",
    "paths": {
      "moyan-mfw-core": ["./packages/core/dist"],
      "moyan-mfw-base/backend": ["./packages/base/dist/backend"],
      "moyan-mfw-base/frontend": ["./packages/base/src/frontend/index.ts"],
      "moyan-mfw-base-api": ["./packages/base-api/dist"]
    }
  },
  "exclude": [
    "node_modules",
    "dist",
    "scripts",
    "e2e",
    "backend",
    "frontend",
    "business-dict",
    "packages",
    "packages/*/tests",
    "packages/*/__tests__"
  ]
}
```

> **改动说明：** 删除了与 base 重复的字段（target, strict, esModuleInterop, skipLibCheck, forceConsistentCasingInFileNames, resolveJsonModule, allowSyntheticDefaultImports, experimentalDecorators, emitDecoratorMetadata, removeComments, declaration, sourceMap）。

- [ ] **Step 2: 验证根 tsconfig 类型检查**

```bash
cd packages/base
npx tsc --noEmit --project ../../tsconfig.json
```

---

### 阶段三：改造 packages/base（核心变更）

这是本次改造最重要的部分——解决 IDE 类型错误问题。

#### Task 3: 将 `packages/base/tsconfig.json` 转为 solution 文件

**Files:**
- Modify: `packages/base/tsconfig.json`

- [ ] **Step 1: 改写为 project-references solution**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.backend.json" },
    { "path": "./tsconfig.frontend.json" }
  ]
}
```

> **为什么这样做：** VS Code 打开此目录的任意 `.ts` 文件时，会自动发现 `tsconfig.json` 中的 `references`，然后根据文件路径匹配到正确的子 tsconfig。这彻底解决了 "IDE 找不到正确 tsconfig" 的问题。

- [ ] **Step 2: 验证 solution 文件能被 tsc 识别**

```bash
cd packages/base
npx tsc --noEmit --project tsconfig.json
```
预期：无错误（因为 `files: []` 不编译任何文件，references 中的项目各自独立检查）

---

#### Task 4: 修改 `packages/base/tsconfig.backend.json`

**Files:**
- Modify: `packages/base/tsconfig.backend.json`

- [ ] **Step 1: 改为继承根 tsconfig.base.json，添加 composite**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "composite": true,
    "outDir": "./dist/backend",
    "rootDir": "./src/backend",
    "declarationMap": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/backend/*"],
      "@common/*": ["src/backend/common/*"],
      "@modules/*": ["src/backend/modules/*"],
      "@config/*": ["src/backend/config/*"],
      "@database/*": ["src/backend/database/*"],
      "moyan-mfw-base/shared": ["dist/shared"]
    }
  },
  "include": ["src/backend/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> **改动说明：** 
> - `extends` 从 `./tsconfig.json` 改为 `../../tsconfig.base.json`（因为本地 tsconfig.json 已变成 solution 文件，不可被继承）
> - 新增 `composite: true`：project references 要求
> - 保留原有 `module: commonjs` / `moduleResolution: node`：后端领域配置

- [ ] **Step 2: 验证后端构建**

```bash
cd packages/base
npx tsc --noEmit --project tsconfig.backend.json
```
预期：零错误

---

#### Task 5: 修改 `packages/base/tsconfig.frontend.json`

**Files:**
- Modify: `packages/base/tsconfig.frontend.json`

> ⚠️ **用户要求：不影响前端代码。** 此文件的改动仅涉及 tsconfig 元数据，不触及任何 `.vue` / `.ts` 业务代码。

- [ ] **Step 1: 改为继承根 tsconfig.base.json，添加 composite**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "composite": true,
    "outDir": "./dist/frontend",
    "rootDir": "./src/frontend",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/frontend/*"]
    },
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "types": ["vite/client", "node"]
  },
  "include": ["src/frontend/**/*"],
  "exclude": ["node_modules", "dist", "src/frontend/**/*.spec.ts", "src/frontend/**/*-spec.ts"]
}
```

> **改动说明：** 
> - `extends` 从 `../../tsconfig.json`（根 tsconfig）改为 `../../tsconfig.base.json`
> - `composite` 从 `false` 改为 `true`：project references 要求
> - 删除了 `skipLibCheck: true`（base 已包含）
> - 其余前端构建配置不变

- [ ] **Step 2: 验证前端类型检查**

```bash
cd packages/base
npx tsc --noEmit --project tsconfig.frontend.json
```
预期：零错误

---

#### Task 6: 修改 `packages/base/tsconfig.test.json`

**Files:**
- Modify: `packages/base/tsconfig.test.json`

- [ ] **Step 1: 改为继承 tsconfig.backend.json**

```json
{
  "extends": "./tsconfig.backend.json",
  "compilerOptions": {
    "rootDir": ".",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/backend/*"],
      "@common/*": ["src/backend/common/*"],
      "@modules/*": ["src/backend/modules/*"],
      "@config/*": ["src/backend/config/*"],
      "@database/*": ["src/backend/database/*"],
      "moyan-mfw-base/shared": ["src/shared"]
    },
    "types": ["jest", "node"],
    "inlineSources": true
  },
  "include": ["src/backend/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

> **改动说明：** 
> - `extends` 从 `./tsconfig.json` 改为 `./tsconfig.backend.json`（因为本地 tsconfig.json 已成 solution 文件）
> - 删除 `module: commonjs` 和 `moduleResolution: node`（从 backend 继承）
> - 删除 `outDir`（从 backend 继承，但 rootDir 覆盖为 `.`）
> - 删除 `esModuleInterop` / `sourceMap`（从 base 继承）
> - 保留 `outDir` 实际上需要保留因为 rootDir 变了... wait, tsconfig.test.json 用于 `tsc --noEmit`，不需要 outDir。但之前有设置。让我 check the typecheck command...

实际上根 typecheck 脚本是：
```
"typecheck:base-backend": "tsc --noEmit -p packages/base/tsconfig.test.json"
```
用了 `--noEmit`，所以 outDir 无关紧要。可以删除以简化。

让我重新检查：tsconfig.test.json 原来的 outDir 是 `./dist/backend`，跟 backend 一样。继承 backend 后会继承 outDir。由于用了 --noEmit，这不影响。保留 backend 的 outDir 即可，不需要覆盖。

- [ ] **Step 2: 验证测试类型检查**

```bash
cd packages/base
npx tsc --noEmit --project tsconfig.test.json
```
预期：零错误（当前可能存在的业务代码类型错误不计入本次改造）

---

#### Task 7: 修改 `packages/base/tsconfig.shared.json`

**Files:**
- Modify: `packages/base/tsconfig.shared.json`

- [ ] **Step 1: 改为继承 tsconfig.backend.json**

```json
{
  "extends": "./tsconfig.backend.json",
  "compilerOptions": {
    "outDir": "./dist/shared"
  },
  "include": ["src/shared/**/*.ts"]
}
```

> **改动说明：** 极简化 —— 仅覆盖 outDir（因为 shared 输出到 dist/shared 而非 dist/backend），其余全部继承。

- [ ] **Step 2: 验证 shared 构建**

```bash
cd packages/base
npx tsc --noEmit --project tsconfig.shared.json
```
预期：零错误

---

#### Task 8: 修改 `packages/base/tsconfig.backend.alias.json`

**Files:**
- Modify: `packages/base/tsconfig.backend.alias.json`

- [ ] **Step 1: 改为继承 tsconfig.backend.json**

```json
{
  "extends": "./tsconfig.backend.json",
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/backend/*"],
      "@common/*": ["src/backend/common/*"],
      "@modules/*": ["src/backend/modules/*"],
      "@config/*": ["src/backend/config/*"],
      "@database/*": ["src/backend/database/*"]
    }
  },
  "include": ["dist/backend/**/*.js"],
  "exclude": ["node_modules", "src"]
}
```

> **改动说明：** 此文件用途特殊 —— 为 `tsc-alias` 提供编译后 JS 的类型别名映射。保留其特殊 include/exclude。

---

### 阶段四：改造其他独立配置

#### Task 9: 修改 `backend/tsconfig.json`

**Files:**
- Modify: `backend/tsconfig.json`

- [ ] **Step 1: 改为继承根 tsconfig.base.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "removeComments": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strictPropertyInitialization": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> **改动说明：** 
> - 新增 `extends: "../tsconfig.base.json"`
> - 删除与 base 重复的字段（target, declaration, emitDecoratorMetadata, experimentalDecorators, allowSyntheticDefaultImports, sourceMap, skipLibCheck, strictNullChecks, esModuleInterop）
> - `removeComments: true` 覆盖 base 的 `false`（NestJS 惯例）
> - `strictPropertyInitialization: false` 覆盖 base 的 `strict: true` 中的此子项（NestJS 注入不初始化）

---

#### Task 10: 修改 `frontend/tsconfig.json`

**Files:**
- Modify: `frontend/tsconfig.json`

- [ ] **Step 1: 改为继承根 tsconfig.base.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"],
    "paths": {
      "@/*": ["src/*"],
      "moyan-mfw-base/frontend": ["../packages/base/src/frontend/index.ts"],
      "moyan-mfw-base/frontend/*": ["../packages/base/src/frontend/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> **改动说明：** 删除与 base 重复的字段（target, strict, esModuleInterop, skipLibCheck, forceConsistentCasingInFileNames, resolveJsonModule, experimentalDecorators, emitDecoratorMetadata）。

---

#### Task 11: 修改 `business-dict/tsconfig.json`

**Files:**
- Modify: `business-dict/tsconfig.json`

- [ ] **Step 1: 改为继承根 tsconfig.base.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declarationMap": true,
    "outDir": "./dist/esm",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> **改动说明：** 删除与 base 重复的字段（target, strict, esModuleInterop, skipLibCheck, experimentalDecorators, emitDecoratorMetadata, forceConsistentCasingInFileNames, declaration, sourceMap）。

---

#### Task 12: 修改 `business-dict/tsconfig.cjs.json`

**Files:**
- Modify: `business-dict/tsconfig.cjs.json`

- [ ] **Step 1: 改为继承本地 tsconfig.json，覆盖为 commonjs**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist/cjs",
    "paths": {
      "moyan-mfw-base/shared": ["../packages/base/dist/shared"]
    }
  }
}
```

> **改动说明：** 
> - 新增 `extends: "./tsconfig.json"`（复用本地配置）
> - 新增 `moduleResolution: "node"`（**修复缺失字段！** 之前没有 moduleResolution 可能导致解析问题）
> - 删除与继承重复的字段

---

#### Task 13: 删除 `business-dict/tsconfig.esm.json`

**Files:**
- Delete: `business-dict/tsconfig.esm.json`

- [ ] **Step 1: 确认 tsconfig.json 已完全覆盖其功能**

`tsconfig.esm.json` 与 `tsconfig.json` 内容几乎完全一致（同样的 module/moudleResolution/outDir）。`tsconfig.json` 本身就是 ESM 配置。

- [ ] **Step 2: 删除文件并更新 package.json 脚本**

```bash
# 删除文件后，修改 business-dict/package.json 的 build 脚本
```

原脚本：
```json
"build:cjs": "tsc -p tsconfig.cjs.json",
"build:esm": "tsc -p tsconfig.esm.json",
"build": "pnpm run build:cjs && pnpm run build:esm"
```

改为：
```json
"build:cjs": "tsc -p tsconfig.cjs.json",
"build:esm": "tsc -p tsconfig.json",
"build": "pnpm run build:cjs && pnpm run build:esm"
```

---

#### Task 14: 修改 `packages/extensions/extension-ad/tsconfig.json`

**Files:**
- Modify: `packages/extensions/extension-ad/tsconfig.json`

- [ ] **Step 1: 改为继承根 tsconfig.base.json**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "strictPropertyInitialization": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "typeorm": ["./node_modules/typeorm"],
      "moyan-mfw-base/backend": ["../../base/dist/backend"],
      "moyan-mfw-base/frontend": ["../../base/src/frontend/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["src/frontend"]
}
```

> **改动说明：** 
> - 新增 `extends: "../../../tsconfig.base.json"`
> - 删除与 base 重复的字段（target, strict, esModuleInterop, skipLibCheck, experimentalDecorators, emitDecoratorMetadata, resolveJsonModule, declaration）
> - `strictPropertyInitialization: false` 覆盖 base 中的 `strict: true`

---

#### Task 15: 修改 `e2e/tsconfig.json`

**Files:**
- Modify: `e2e/tsconfig.json`

- [ ] **Step 1: 改为继承根 tsconfig.base.json，修复 moduleResolution**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "noEmit": true,
    "types": ["node"],
    "baseUrl": ".."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

> **改动说明：** 
> - `moduleResolution` 从 `"node"` 改为 `"bundler"`（**修复**：ESNext+node 是不推荐的组合）
> - 新增 `extends: "../tsconfig.base.json"`
> - 删除与 base 重复的字段（target, strict, esModuleInterop, skipLibCheck, forceConsistentCasingInFileNames, resolveJsonModule, allowSyntheticDefaultImports）

---

### 阶段五：验证

#### Task 16: 全量类型检查

- [ ] **Step 1: 验证所有独立 tsconfig 的 tsc --noEmit**

```bash
# packages/base - 后端
cd packages/base && npx tsc --noEmit --project tsconfig.backend.json

# packages/base - 前端
cd packages/base && npx tsc --noEmit --project tsconfig.frontend.json

# packages/base - 测试
cd packages/base && npx tsc --noEmit --project tsconfig.test.json

# packages/base - shared
cd packages/base && npx tsc --noEmit --project tsconfig.shared.json

# backend
cd backend && npx tsc --noEmit --project tsconfig.json

# frontend (vue-tsc)
cd frontend && npx vue-tsc --noEmit -p tsconfig.json

# business-dict ESM
cd business-dict && npx tsc --noEmit --project tsconfig.json

# business-dict CJS
cd business-dict && npx tsc --noEmit --project tsconfig.cjs.json

# extension-ad
cd packages/extensions/extension-ad && npx tsc --noEmit --project tsconfig.json

# e2e
cd e2e && npx tsc --noEmit --project tsconfig.json
```

- [ ] **Step 2: 运行项目根 typecheck 脚本**

```bash
pnpm run typecheck
```

- [ ] **Step 3: 验证 packages/base 的 solution tsconfig**

```bash
cd packages/base && npx tsc --noEmit --project tsconfig.json
```
预期：零错误（`files: []` 不编译文件，references 各自检查）

---

## 风险与回滚

| 风险 | 缓解 |
|------|------|
| `composite: true` 影响增量编译 | 已正确设置 rootDir/outDir，删除 tsbuildinfo 缓存 |
| business-dict 删除 esm.json 影响构建 | 同时修改 package.json 脚本指向 tsconfig.json |
| strict: true 暴露新的类型错误 | 本次改造只改 tsconfig 元数据；如发现业务代码类型错误，在后续 PR 中修复 |

**回滚方式：** `git revert` 本次提交即可恢复所有 tsconfig 文件。

---

## 改动统计

| 操作 | 数量 |
|------|------|
| 新建文件 | 1 (`tsconfig.base.json`) |
| 修改文件 | 14 个 tsconfig + 1 个 package.json |
| 删除文件 | 1 (`business-dict/tsconfig.esm.json`) |
| 前端业务代码 | **0 个文件受影响** |
