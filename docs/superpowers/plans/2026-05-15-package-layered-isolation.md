# 包目录结构重构：三层独立自治 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `packages/base` 和 `packages/extensions/extension-ad` 重构为 `src/backend`/`src/frontend`/`src/shared` 各自独立管理 `package.json` + `tsconfig.json`，通过 `@internal/*` 命名空间实现 workspace 内部引用，发布阶段由 tsc-alias 转换为消费者路径。

**Architecture:** pnpm workspace 子包注册 + `@internal/*` 命名空间 + tsc-alias 发布时路径转换。每个子包 (`@internal/base-backend` 等) 为 `"private":true` 的 workspace 包，聚合包 (`moyan-mfw-base`) 作为唯一对外 npm 包，通过 `exports` 子路径映射到 `dist/` 产物。

**Tech Stack:** pnpm ≥8.0.0, TypeScript 5.4+, tsc-alias 1.8.17, NestJS CLI, Vite 5+, vue-tsc

**Spec:** [2026-05-14-package-layered-isolation-design.md](../specs/2026-05-14-package-layered-isolation-design.md)

---

## 文件结构

### 创建的文件（24个）

| 文件 | 职责 |
|------|------|
| `packages/base/src/backend/package.json` | `@internal/base-backend` 子包，CJS 编译 |
| `packages/base/src/backend/tsconfig.json` | 后端子包 TypeScript 配置 |
| `packages/base/src/frontend/package.json` | `@internal/base-frontend` 子包，Vite 构建 |
| `packages/base/src/frontend/tsconfig.json` | 前端子包 TypeScript 配置 |
| `packages/base/src/shared/package.json` | `@internal/base-shared` 子包，零依赖 |
| `packages/base/src/shared/tsconfig.json` | 共享子包 TypeScript 配置 |
| `packages/base/tsconfig.publish.json` | 发布时 tsc-alias 路径转换 |
| `packages/base/.npmignore` | 排除子包配置文件 |
| `packages/extensions/extension-ad/src/backend/package.json` | `@internal/ad-backend` 子包 |
| `packages/extensions/extension-ad/src/backend/tsconfig.json` | ad 后端子包 TypeScript 配置 |
| `packages/extensions/extension-ad/src/frontend/package.json` | `@internal/ad-frontend` 子包 |
| `packages/extensions/extension-ad/src/frontend/tsconfig.json` | ad 前端子包 TypeScript 配置 |
| `packages/extensions/extension-ad/src/shared/package.json` | `@internal/ad-shared` 子包 |
| `packages/extensions/extension-ad/src/shared/tsconfig.json` | ad 共享子包 TypeScript 配置 |
| `packages/extensions/extension-ad/tsconfig.publish.json` | 发布时跨包 + 包内路径转换 |
| `packages/extensions/extension-ad/tsconfig.vue.json` | 精简 IDE 支持（`allowImportingTsExtensions:true`, `noEmit:true`） |
| `packages/extensions/extension-ad/.npmignore` | 排除子包配置文件 |
| `packages/base/scripts/migrate-shared-imports.mjs` | **已存在** — base 包 shared 相对路径替换 |
| `packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs` | **已存在** — ad 包 @internal 引用替换 |

### 修改的文件（10个）

| 文件 | 变更内容 |
|------|---------|
| `pnpm-workspace.yaml` | 添加 3 条子包注册 + catalog 增加 `tsc-alias` |
| `packages/base/package.json` | `exports` + 新 `scripts`（`build:shared`/`build:backend`/`build:frontend`/`publish:build`）+ `devDependencies` 改为 `@internal/*` |
| `packages/base/tsconfig.json` | project references 指向 3 个子包 |
| `packages/base/nest-cli.json` | `sourceRoot: "src/backend"`, `tsConfigPath: "src/backend/tsconfig.json"` |
| `packages/base/vite.config.mts` | `outDir: '../../dist/frontend'` + alias 更新 |
| `packages/extensions/extension-ad/package.json` | `exports` + 新 `scripts` |
| `packages/extensions/extension-ad/tsconfig.json` | project references 指向 3 个子包 |
| `packages/extensions/extension-ad/nest-cli.json` | `sourceRoot: "src/backend"`, `tsConfigPath: "src/backend/tsconfig.json"` |
| `packages/extensions/extension-ad/vite.config.mts` | `outDir: '../../dist/frontend'` + alias 更新 |
| `packages/base/jest.config.ts` | 引用 `src/backend/tsconfig.json`（**已更新**，验证即可） |

### 删除的文件（5个）

| 文件 | 原因 |
|------|------|
| `packages/base/tsconfig.shared.json` | 子包独立 tsconfig |
| `packages/base/tsconfig.backend.alias.json` | 不再需要两步编译 |
| `packages/base/tsconfig.test.json` | 测试配置并入 jest.config.ts |
| `packages/base/scripts/fix-shared-imports.cjs` | tsc-alias + publish config 替代 |
| `packages/extensions/extension-ad/tsconfig.build.json` | NestJS 构建用子包 tsconfig |

---

## 阶段一：创建子包配置 + pnpm-workspace 更新

### Task 1.1: 创建 base 后端子包配置

**Files:** Create: `packages/base/src/backend/package.json`, `packages/base/src/backend/tsconfig.json`

- [ ] **Step 1: 创建 `packages/base/src/backend/package.json`**

```jsonc
{
  "name": "@internal/base-backend",
  "private": true,
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "nest start --config ../../nest-cli.json --watch"
  },
  "dependencies": {
    "@internal/base-shared": "workspace:*",
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "@nestjs/platform-express": "catalog:",
    "@nestjs/typeorm": "catalog:",
    "@nestjs/swagger": "catalog:",
    "@nestjs/jwt": "catalog:",
    "@nestjs/config": "catalog:",
    "typeorm": "catalog:",
    "class-transformer": "catalog:",
    "class-validator": "catalog:",
    "reflect-metadata": "catalog:",
    "rxjs": "catalog:",
    "dotenv": "catalog:",
    "bcrypt": "catalog:",
    "multer": "catalog:",
    "mysql2": "catalog:",
    "redis": "catalog:"
  },
  "devDependencies": {
    "@nestjs/cli": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: 创建 `packages/base/src/backend/tsconfig.json`**

```jsonc
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "strictPropertyInitialization": false,
    "composite": true,
    "outDir": "../../dist/backend",
    "declarationMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 确认文件创建成功**

```bash
ls packages/base/src/backend/package.json packages/base/src/backend/tsconfig.json
```

---

### Task 1.2: 创建 base 前端子包配置

**Files:** Create: `packages/base/src/frontend/package.json`, `packages/base/src/frontend/tsconfig.json`

- [ ] **Step 1: 创建 `packages/base/src/frontend/package.json`**

```jsonc
{
  "name": "@internal/base-frontend",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "build": "vite build --config ../../vite.config.mts && vue-tsc --emitDeclarationOnly -p tsconfig.json",
    "dev": "vite --config ../../vite.config.mts"
  },
  "dependencies": {
    "@internal/base-shared": "workspace:*",
    "vue": "catalog:",
    "vue-router": "catalog:",
    "element-plus": "catalog:",
    "@element-plus/icons-vue": "catalog:",
    "pinia": "catalog:",
    "@vueuse/core": "catalog:",
    "axios": "catalog:",
    "md-editor-v3": "catalog:",
    "quill": "catalog:",
    "vue-advanced-cropper": "catalog:"
  },
  "devDependencies": {
    "vite": "catalog:",
    "@vitejs/plugin-vue": "catalog:",
    "@vitejs/plugin-vue-jsx": "catalog:",
    "vue-tsc": "catalog:",
    "sass": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: 创建 `packages/base/src/frontend/tsconfig.json`**

```jsonc
{
  "extends": "../../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "composite": true,
    "outDir": "../../dist/frontend",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "allowImportingTsExtensions": true,
    "types": ["vite/client", "node"]
  },
  "include": ["./**/*.ts", "./**/*.tsx", "./**/*.vue", "./**/*.json"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 确认文件创建成功**

```bash
ls packages/base/src/frontend/package.json packages/base/src/frontend/tsconfig.json
```

---

### Task 1.3: 创建 base 共享子包配置

**Files:** Create: `packages/base/src/shared/package.json`, `packages/base/src/shared/tsconfig.json`

- [ ] **Step 1: 创建 `packages/base/src/shared/package.json`**

```jsonc
{
  "name": "@internal/base-shared",
  "private": true,
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: 创建 `packages/base/src/shared/tsconfig.json`**

```jsonc
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "composite": true,
    "outDir": "../../dist/shared",
    "declarationMap": true
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 3: 确认文件创建成功**

---

### Task 1.4: 创建 extension-ad 三个子包配置

**Files:** Create: `packages/extensions/extension-ad/src/backend/package.json`, `packages/extensions/extension-ad/src/backend/tsconfig.json`, `packages/extensions/extension-ad/src/frontend/package.json`, `packages/extensions/extension-ad/src/frontend/tsconfig.json`, `packages/extensions/extension-ad/src/shared/package.json`, `packages/extensions/extension-ad/src/shared/tsconfig.json`

- [ ] **Step 1: 创建 `packages/extensions/extension-ad/src/backend/package.json`**

```jsonc
{
  "name": "@internal/ad-backend",
  "private": true,
  "version": "0.1.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "nest start --config ../../nest-cli.json --watch"
  },
  "dependencies": {
    "@internal/base-backend": "workspace:*",
    "@internal/base-shared": "workspace:*",
    "@internal/ad-shared": "workspace:*",
    "typeorm": "catalog:",
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "@nestjs/typeorm": "catalog:",
    "@nestjs/swagger": "catalog:",
    "class-transformer": "catalog:",
    "class-validator": "catalog:",
    "reflect-metadata": "catalog:",
    "rxjs": "catalog:"
  },
  "devDependencies": {
    "@nestjs/cli": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: 创建 `packages/extensions/extension-ad/src/backend/tsconfig.json`**（结构与 base backend 一致，`outDir: "../../dist/backend"`）

```jsonc
{
  "extends": "../../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "strictPropertyInitialization": false,
    "composite": true,
    "outDir": "../../dist/backend",
    "declarationMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 `packages/extensions/extension-ad/src/frontend/package.json`**

```jsonc
{
  "name": "@internal/ad-frontend",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "build": "vite build --config ../../vite.config.mts && vue-tsc --emitDeclarationOnly -p tsconfig.json",
    "dev": "vite --config ../../vite.config.mts",
    "api:build": "node ../../api.build.cjs",
    "build:routes": "node ../../scripts/build-routes.mjs"
  },
  "dependencies": {
    "@internal/base-shared": "workspace:*",
    "@internal/base-frontend": "workspace:*",
    "@internal/ad-shared": "workspace:*",
    "vue": "catalog:",
    "vue-router": "catalog:",
    "element-plus": "catalog:",
    "@element-plus/icons-vue": "catalog:"
  },
  "devDependencies": {
    "vite": "catalog:",
    "@vitejs/plugin-vue": "catalog:",
    "@vitejs/plugin-vue-jsx": "catalog:",
    "vue-tsc": "catalog:",
    "sass": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 4: 创建 `packages/extensions/extension-ad/src/frontend/tsconfig.json`**（与 base frontend 结构一致）

```jsonc
{
  "extends": "../../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "composite": true,
    "outDir": "../../dist/frontend",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "allowImportingTsExtensions": true,
    "types": ["vite/client", "node"]
  },
  "include": ["./**/*.ts", "./**/*.tsx", "./**/*.vue", "./**/*.json"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: 创建 `packages/extensions/extension-ad/src/shared/package.json`**

```jsonc
{
  "name": "@internal/ad-shared",
  "private": true,
  "version": "0.1.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@internal/base-shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 6: 创建 `packages/extensions/extension-ad/src/shared/tsconfig.json`**

```jsonc
{
  "extends": "../../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "composite": true,
    "outDir": "../../dist/shared",
    "declarationMap": true
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 7: 确认 6 个文件全部创建成功**

```bash
ls packages/extensions/extension-ad/src/backend/package.json
ls packages/extensions/extension-ad/src/backend/tsconfig.json
ls packages/extensions/extension-ad/src/frontend/package.json
ls packages/extensions/extension-ad/src/frontend/tsconfig.json
ls packages/extensions/extension-ad/src/shared/package.json
ls packages/extensions/extension-ad/src/shared/tsconfig.json
```

---

### Task 1.5: 更新 `pnpm-workspace.yaml` — 注册子包 + catalog 增加 tsc-alias

**Files:** Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: 读取当前内容**

```bash
cat pnpm-workspace.yaml
```

- [ ] **Step 2: 在 `packages:` 块中添加子包注册路径**

在 `packages/base` 行之前插入：

```yaml
  # 子包注册（private，仅供 workspace 内部使用）
  - packages/base/src/backend        # @internal/base-backend
  - packages/base/src/frontend       # @internal/base-frontend
  - packages/base/src/shared         # @internal/base-shared

  # 扩展包子包
  - packages/extensions/*/src/backend
  - packages/extensions/*/src/frontend
  - packages/extensions/*/src/shared
```

- [ ] **Step 3: 在 `catalog:` 块中添加 `tsc-alias` 条目**

在现有 catalog 条目中增加：

```yaml
catalog:
  tsc-alias: ^1.8.17
```

> 注意：不要重复已有的 `typescript` 等条目，只追加缺失的。

- [ ] **Step 4: 提交变更**

```powershell
git add pnpm-workspace.yaml
git commit -m "feat: register sub-packages in pnpm workspace + add tsc-alias to catalog"
```

> **环境说明**：本计划所有脚本命令在 **Git Bash**（随 Git for Windows 安装）中执行。PowerShell 原生用户请确保 `grep`、`ls -d` 等 Unix 命令可用（`where grep` 确认 Git Bash 在 PATH 中），或改用下方标注的 `Select-String` / `Test-Path` 等效命令。

---

### Task 1.6: 运行 `pnpm install` 验证 workspace 解析

- [ ] **Step 1: 运行安装**

```bash
pnpm install
```

- [ ] **Step 2: 验证子包软链接创建成功**

```bash
# Git Bash
for pkg in @internal/base-backend @internal/base-frontend @internal/base-shared @internal/ad-backend @internal/ad-frontend @internal/ad-shared; do
  test -d "node_modules/$pkg" && echo "OK: $pkg" || echo "MISSING: $pkg"
done
```

```powershell
# PowerShell 等效
@('@internal/base-backend','@internal/base-frontend','@internal/base-shared','@internal/ad-backend','@internal/ad-frontend','@internal/ad-shared') | ForEach-Object { if (Test-Path "node_modules/$_") { "OK: $_" } else { "MISSING: $_" } }
```

**预期**：6 个目录均存在，指向对应的 `packages/*/src/*/` 目录。

- [ ] **Step 3: 检查无 workspace warning**

在 `pnpm install` 输出中搜索 `WARN` 或 `warning`，确认无 workspace 相关告警。

- [ ] **Step 4: 提交**

```bash
git add pnpm-lock.yaml
git commit -m "chore: pnpm install with sub-packages registered"
```

---

## 阶段二：更新聚合包配置 + 发布相关文件

### Task 2.1: 更新 `packages/base/package.json` — exports + scripts + devDependencies

**Files:** Modify: `packages/base/package.json`

- [ ] **Step 1: 添加 `exports` 字段**（在当前 `"name"`, `"version"` 之后）

```jsonc
"exports": {
  "./backend": {
    "require": "./dist/backend/index.js",
    "types": "./dist/backend/index.d.ts"
  },
  "./frontend": {
    "import": "./dist/frontend/index.mjs",
    "require": "./dist/frontend/index.js",
    "types": "./dist/frontend/index.d.ts"
  },
  "./shared": {
    "types": "./dist/shared/index.d.ts",
    "require": "./dist/shared/index.js",
    "default": "./dist/shared/index.js"
  }
},
```

- [ ] **Step 2: 替换 `scripts` 对象**

```jsonc
"scripts": {
  "build": "pnpm run build:shared && pnpm run build:frontend && pnpm run build:backend",
  "build:shared": "pnpm --filter @internal/base-shared build",
  "build:frontend": "pnpm --filter @internal/base-frontend build",
  "build:backend": "pnpm --filter @internal/base-backend build",
  "convert:aliases": "tsc-alias -p tsconfig.publish.json",
  "publish:build": "pnpm run build && pnpm run convert:aliases",
  "dev:backend": "pnpm --filter @internal/base-backend dev",
  "dev:frontend": "pnpm --filter @internal/base-frontend dev",
  "prepublishOnly": "pnpm run publish:build",
  "test": "jest --config jest.config.ts"
},
```

- [ ] **Step 3: 确认 `"files"` 字段**（如不存在则添加）

```jsonc
"files": [
  "dist/",
  "migrations/"
],
```

- [ ] **Step 4: 更新 `devDependencies`**（移除旧的三方构建工具，改为 `@internal/*` + 工具链；**保留** Jest 等测试工具链依赖，因为 `"test"` 脚本仍在聚合包层级运行）

```jsonc
"devDependencies": {
  "@internal/base-backend": "workspace:*",
  "@internal/base-frontend": "workspace:*",
  "@internal/base-shared": "workspace:*",
  "tsc-alias": "catalog:",
  "typescript": "catalog:",
  "jest": "catalog:",
  "ts-jest": "catalog:",
  "@types/jest": "catalog:",
  "@nestjs/testing": "catalog:",
  "supertest": "catalog:",
  "@types/supertest": "catalog:"
}
```

- [ ] **Step 4a: 删除旧的 `dependencies` 和 `peerDependencies`**

子包已各自声明运行时依赖，聚合包不应再重复声明。移除 `"dependencies"` 和 `"peerDependencies"` 字段（如有），仅保留 `"devDependencies"`。

- [ ] **Step 4b: 保留 `typesVersions` 字段不变**（向后兼容旧版 TypeScript 类型解析）

- [ ] **Step 5: 提交**

```bash
git add packages/base/package.json
git commit -m "feat: update base aggregate package.json with exports and new scripts"
```

---

### Task 2.2: 更新 `packages/base/tsconfig.json` — Project References 入口

**Files:** Modify: `packages/base/tsconfig.json`

- [ ] **Step 1: 替换为 project references 入口**

```jsonc
{
  "files": [],
  "references": [
    { "path": "./src/backend/tsconfig.json" },
    { "path": "./src/frontend/tsconfig.json" },
    { "path": "./src/shared/tsconfig.json" }
  ]
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/base/tsconfig.json
git commit -m "feat: update base tsconfig to project references"
```

---

### Task 2.3: 创建 `packages/base/tsconfig.publish.json` + `.npmignore`

**Files:** Create: `packages/base/tsconfig.publish.json`, `packages/base/.npmignore`

- [ ] **Step 1: 创建 `packages/base/tsconfig.publish.json`**

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@internal/base-shared": ["./dist/shared/index.js"]
    }
  },
  "include": ["./dist/**/*.js"]
}
```

- [ ] **Step 2: 创建 `packages/base/.npmignore`**

```
src/backend/package.json
src/backend/tsconfig.json
src/frontend/package.json
src/frontend/tsconfig.json
src/shared/package.json
src/shared/tsconfig.json
src/
tsconfig.publish.json
tsconfig.json
vite.config.mts
nest-cli.json
jest.config.ts
eslint.config.mjs
```

- [ ] **Step 3: 提交**

```bash
git add packages/base/tsconfig.publish.json packages/base/.npmignore
git commit -m "feat: add base publish config and npmignore"
```

---

### Task 2.4: 更新 `packages/base/nest-cli.json`

**Files:** Modify: `packages/base/nest-cli.json`

- [ ] **Step 1: 修改 `sourceRoot` 和 `tsConfigPath`**

```jsonc
{
  "sourceRoot": "src/backend",
  "entryFile": "main",
  "compilerOptions": {
    "tsConfigPath": "src/backend/tsconfig.json",
    "deleteOutDir": true
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/base/nest-cli.json
git commit -m "feat: update base nest-cli.json for sub-package structure"
```

---

### Task 2.5: 更新 `packages/base/vite.config.mts`

**Files:** Modify: `packages/base/vite.config.mts`

- [ ] **Step 1: 更新 `outDir`**

`build.outDir` 从当前值改为 `'../../dist/frontend'`。

- [ ] **Step 2: 更新 alias 中的 `@` 映射**

`'@'` 别名指向 `fileURLToPath(new URL('./src/frontend', import.meta.url))`。

- [ ] **Step 3: 移除 `rollupOptions.external` 中的 `'moyan-mfw-base/shared'`**

子包通过 `workspace:*` 解析，不再需要标记为 external。

- [ ] **Step 4: 提交**

```bash
git add packages/base/vite.config.mts
git commit -m "feat: update base vite config for sub-package build"
```

---

### Task 2.6: 更新 `packages/extensions/extension-ad/package.json`

**Files:** Modify: `packages/extensions/extension-ad/package.json`

- [ ] **Step 1: 添加 `exports` 字段**

```jsonc
"exports": {
  "./backend": {
    "types": "./dist/backend/index.d.ts",
    "require": "./dist/backend/index.js"
  },
  "./frontend": {
    "import": "./dist/frontend/index.mjs",
    "types": "./dist/frontend/index.d.ts",
    "require": "./dist/frontend/index.js"
  },
  "./shared": {
    "types": "./dist/shared/index.d.ts",
    "require": "./dist/shared/index.js"
  }
},
```

> **注意**：前端 exports 增加 `"import"` 条件指向 `.mjs` 产物（Vite `formats: ['es']`），确保消费者 ESM `import` 时正确解析。

- [ ] **Step 2: 替换 `scripts`**

```jsonc
"scripts": {
  "build": "pnpm run build:shared && pnpm run build:frontend && pnpm run build:backend",
  "build:shared": "pnpm --filter @internal/ad-shared build",
  "build:frontend": "pnpm --filter @internal/ad-frontend build",
  "build:backend": "pnpm --filter @internal/ad-backend build",
  "convert:aliases": "tsc-alias -p tsconfig.publish.json",
  "publish:build": "pnpm run build && pnpm run convert:aliases",
  "dev:backend": "pnpm --filter @internal/ad-backend dev",
  "dev:frontend": "pnpm --filter @internal/ad-frontend dev",
  "prepublishOnly": "pnpm run publish:build"
},
```

- [ ] **Step 3: 更新 `devDependencies`**

```jsonc
"devDependencies": {
  "@internal/ad-backend": "workspace:*",
  "@internal/ad-frontend": "workspace:*",
  "@internal/ad-shared": "workspace:*",
  "tsc-alias": "catalog:",
  "typescript": "catalog:"
}
```

- [ ] **Step 4: 确认 `"files"` 字段**

```jsonc
"files": [
  "dist/",
  "migrations/",
  "extension.json"
],
```

- [ ] **Step 5: 提交**

```bash
git add packages/extensions/extension-ad/package.json
git commit -m "feat: update extension-ad aggregate package.json"
```

---

### Task 2.7: 更新 extension-ad 的 tsconfig + nest-cli + vite + publish config + .npmignore

**Files:**
- Modify: `packages/extensions/extension-ad/tsconfig.json`, `packages/extensions/extension-ad/nest-cli.json`, `packages/extensions/extension-ad/vite.config.mts`
- Create: `packages/extensions/extension-ad/tsconfig.publish.json`, `packages/extensions/extension-ad/.npmignore`, `packages/extensions/extension-ad/tsconfig.vue.json`

- [ ] **Step 1: 更新 `packages/extensions/extension-ad/tsconfig.json` — project references**

```jsonc
{
  "files": [],
  "references": [
    { "path": "./src/backend/tsconfig.json" },
    { "path": "./src/frontend/tsconfig.json" },
    { "path": "./src/shared/tsconfig.json" }
  ]
}
```

- [ ] **Step 2: 更新 `packages/extensions/extension-ad/nest-cli.json`**

```jsonc
{
  "sourceRoot": "src/backend",
  "entryFile": "main",
  "compilerOptions": {
    "tsConfigPath": "src/backend/tsconfig.json",
    "deleteOutDir": true
  }
}
```

- [ ] **Step 3: 更新 `packages/extensions/extension-ad/vite.config.mts`**

**新建完整 `build` 块**（当前 ext-ad vite.config 无 build 配置），参考 base 的 vite.config.mts（`lib.entry`、`formats`、`outDir: '../../dist/frontend'`、`rollupOptions`）。更新 alias `@` → `fileURLToPath(new URL('./src/frontend', import.meta.url))`。移除旧的 `'moyan-mfw-base/frontend'` 和 `'moyan-mfw-base/shared'` 硬编码 alias。

- [ ] **Step 4: 创建 `packages/extensions/extension-ad/tsconfig.publish.json`**

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@internal/base-backend": ["moyan-mfw-base/backend"],
      "@internal/base-frontend": ["moyan-mfw-base/frontend"],
      "@internal/base-shared": ["moyan-mfw-base/shared"],
      "@internal/ad-shared": ["./dist/shared/index.js"]
    }
  },
  "include": ["./dist/**/*.js"]
}
```

- [ ] **Step 5: 创建 `packages/extensions/extension-ad/.npmignore`**（内容同 base 的 .npmignore）

- [ ] **Step 6: 创建精简版 `packages/extensions/extension-ad/tsconfig.vue.json`**

保留当前 `tsconfig.vue.json` 的关键选项（`allowImportingTsExtensions: true`, `noEmit: true`, `declaration: false`），仅用于 IDE/Volar。

- [ ] **Step 7: 提交**

```bash
git add packages/extensions/extension-ad/tsconfig.json packages/extensions/extension-ad/nest-cli.json packages/extensions/extension-ad/vite.config.mts packages/extensions/extension-ad/tsconfig.publish.json packages/extensions/extension-ad/.npmignore packages/extensions/extension-ad/tsconfig.vue.json
git commit -m "feat: update extension-ad config files for sub-package structure"
```

---

## 阶段三：运行迁移脚本替换 import 语句

### Task 3.1: 运行 base 迁移脚本（shared → 相对路径）

**Files:** 自动修改 22 个文件（15 前端 + 7 后端）

- [ ] **Step 1: 执行脚本**

```bash
node packages/base/scripts/migrate-shared-imports.mjs
```

**预期输出**：每个文件的"旧 import → 新 import"对比日志，22 个文件逐一处理。

- [ ] **Step 2: 验证替换结果**

```bash
# 确认 package 内无 moyan-mfw-base/shared 残留
grep -r "moyan-mfw-base/shared" packages/base/src/ --include="*.ts" --include="*.vue"
```

**预期**：空输出（零匹配）。

- [ ] **Step 3: 提交**

```bash
git add packages/base/src/
git commit -m "feat: replace base shared imports with relative paths"
```

---

### Task 3.2: 运行 extension-ad 迁移脚本（npm 路径 → @internal/*）

**Files:** 自动修改 ~48 处引用  
**前置条件:** Task 3.1（base 迁移）已完成，pnpm workspace 中 `@internal/base-*` 包已可被 Node 解析

- [ ] **Step 1: 执行脚本**

```bash
node packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs
```

**预期输出**：6 条替换规则的匹配和替换日志。

- [ ] **Step 2: 验证替换结果**

```bash
# 确认无 npm 路径残留
grep -r "moyan-mfw-base/" packages/extensions/extension-ad/src/ --include="*.ts" --include="*.vue"

# 确认无内部 shared 相对路径
grep -r "from ['\"]\.\.\/\.\.\/shared" packages/extensions/extension-ad/src/ --include="*.ts" --include="*.vue"
```

**预期**：空输出（零匹配）。
- [ ] **Step 3: 提交**

```bash
git add packages/extensions/extension-ad/src/
git commit -m "feat: replace extension-ad imports with @internal namespace"
```

---

## 阶段四：验证构建 + 清理旧文件

### Task 4.1: 验证 base shared 构建

- [ ] **Step 1: 构建 shared（零依赖，最先编译）**

```bash
pnpm --filter @internal/base-shared build
```

**预期**：编译成功，`dist/shared/` 产出 `.js` + `.d.ts` 文件。

- [ ] **Step 2: 检查产物**

```bash
ls packages/base/dist/shared/index.js
ls packages/base/dist/shared/index.d.ts
```

---

### Task 4.2: 验证 base backend 构建

- [ ] **Step 1: 构建后端**

```bash
pnpm --filter @internal/base-backend build
```

**预期**：编译成功，`dist/backend/` 产出文件。tsc 不报类型错误。

- [ ] **Step 2: 检查产物中的 @internal 引用**

```bash
grep "@internal" packages/base/dist/backend/**/*.js | head -5
```
```powershell
# PowerShell 等效
Select-String -Path "packages/base/dist/backend\**\*.js" -Pattern "@internal" | Select-Object -First 5
```

**预期**：产物中保留 `require('@internal/base-shared')` 原样（未转换）。

---

### Task 4.3: 验证 base frontend 构建

- [ ] **Step 1: 构建前端**

```bash
pnpm --filter @internal/base-frontend build
```

**预期**：Vite 构建成功 + `vue-tsc --emitDeclarationOnly` 产出 `.d.ts`。

- [ ] **Step 2: 检查产物**

```bash
ls packages/base/dist/frontend/index.mjs
ls packages/base/dist/frontend/index.d.ts
```

---

### Task 4.4: 验证 base tsc-alias 发布转换

- [ ] **Step 1: 运行 publish:build**

```bash
pnpm --filter moyan-mfw-base publish:build
```

- [ ] **Step 2: 检查转换后的路径**

```bash
grep "require.*shared" packages/base/dist/backend/modules/sys/user/entities/user.entity.js
```

**预期**：`require('@internal/base-shared')` 已转换为相对路径如 `require('../../shared/index.js')`。

- [ ] **Step 3: 确认无 @internal 残留**

```bash
grep -r "@internal" packages/base/dist/ --include="*.js"
```
```powershell
# PowerShell 等效
Select-String -Path "packages/base/dist\**\*.js" -Pattern "@internal"
```
**预期**：空输出。

---

### Task 4.5: 验证 extension-ad 全部构建

- [ ] **Step 1: 构建 extension-ad 全量**

```bash
pnpm --filter moyan-mfw-extension-ad publish:build
```

- [ ] **Step 2: 验证 publish 转换**

```bash
# 跨包引用 → npm 路径
grep "moyan-mfw-base/backend" packages/extensions/extension-ad/dist/backend/*.js | head -3

# 包内引用 → 相对路径
grep "\.\.\/shared" packages/extensions/extension-ad/dist/backend/*.js | head -3

# 确认无 @internal 残留
grep -r "@internal" packages/extensions/extension-ad/dist/ --include="*.js"
```

```powershell
# PowerShell 等效
Select-String -Path "packages/extensions/extension-ad/dist/backend\*.js" -Pattern "moyan-mfw-base/backend" | Select-Object -First 3
Select-String -Path "packages/extensions/extension-ad/dist/backend\*.js" -Pattern "\.\.\/shared" | Select-Object -First 3
Select-String -Path "packages/extensions/extension-ad/dist\**\*.js" -Pattern "@internal"
```

---

### Task 4.6: 运行测试

- [ ] **Step 1: 运行 jest 测试**

```bash
pnpm --filter moyan-mfw-base test
```

**预期**：所有测试通过，无模块解析错误。

- [ ] **Step 2: 提交验证结果**

```bash
git commit -m "test: verify all sub-package builds and tests pass"
```

---

### Task 4.7: 验证下游 consumers

- [ ] **Step 1: 验证 frontend/ 根包开发服务器**

```bash
pnpm --filter moyan-mfw-frontend dev
```

**预期**：Vite 开发服务器正常启动（观察 5 秒后 Ctrl+C）。

- [ ] **Step 2: 验证 backend/ 根包启动**

```bash
pnpm --filter moyan-mfw-backend dev
```

**预期**：NestJS 启动无模块解析错误（观察 5 秒后 Ctrl+C）。

---

### Task 4.8: 清理旧文件

- [ ] **Step 1: 删除 5 个旧配置文件 + fix-shared-imports.cjs**

```bash
rm packages/base/tsconfig.shared.json
rm packages/base/tsconfig.backend.alias.json
rm packages/base/tsconfig.test.json
rm packages/base/scripts/fix-shared-imports.cjs
rm packages/extensions/extension-ad/tsconfig.build.json
```

- [ ] **Step 2: 确认删除无误**

```bash
for f in packages/base/tsconfig.shared.json packages/base/tsconfig.backend.alias.json packages/base/tsconfig.test.json packages/base/scripts/fix-shared-imports.cjs packages/extensions/extension-ad/tsconfig.build.json; do
  test -f "$f" && echo "STILL EXISTS: $f" || echo "deleted OK: $f"
done
```
```powershell
# PowerShell 等效
@('packages/base/tsconfig.shared.json','packages/base/tsconfig.backend.alias.json','packages/base/tsconfig.test.json','packages/base/scripts/fix-shared-imports.cjs','packages/extensions/extension-ad/tsconfig.build.json') | ForEach-Object { if (Test-Path $_) { "STILL EXISTS: $_" } else { "deleted OK: $_" } }
```

- [ ] **Step 3: 提交清理**

```bash
git add -A
git commit -m "chore: remove deprecated config files"
```

---

### Task 4.9: 最终全量验证

- [ ] **Step 1: 根目录完整构建**

```bash
pnpm run build  # 如果根 package.json 有此脚本
# 或者分别构建
pnpm --filter moyan-mfw-base build
pnpm --filter moyan-mfw-extension-ad build
```

- [ ] **Step 2: 类型检查全量通过**

```bash
pnpm --filter @internal/base-shared build
pnpm --filter @internal/base-backend build
pnpm --filter @internal/base-frontend build
pnpm --filter @internal/ad-shared build
pnpm --filter @internal/ad-backend build
pnpm --filter @internal/ad-frontend build
```

**预期**：6 个子包全部编译通过，零错误。

- [ ] **Step 3: 最终提交**

```bash
git commit -m "feat: complete package layered isolation refactor"
```

---

## 回滚方案

如迁移中遇到阻塞性问题，可按阶段回滚：

1. **阶段一、二回滚**：`git revert` 对应 commit，重新 `pnpm install` 恢复旧 workspace 结构
2. **阶段三回滚**：`git checkout -- packages/base/src/ packages/extensions/extension-ad/src/`
3. **阶段四回滚**：需同时 revert 阶段三和阶段四的 commit（源码含 `@internal/*` 引用但 `@internal/*` 包已被回滚移除），然后 `pnpm install`

### 回滚后验证

```bash
# 1. 重建 workspace symlinks
pnpm install

# 2. 确认旧构建可用
pnpm --filter moyan-mfw-base run build:shared

# 3. 确认 @internal/* 软链接已清除
test -d node_modules/@internal && echo "WARN: @internal still exists" || echo "OK"

# 4. 确认源码中无 @internal 残留
grep -r "@internal" packages/base/src/ packages/extensions/ --include="*.ts" --include="*.vue"
```

关键原则：**每个阶段提交独立 commit**，确保可精确回滚到任一阶段。

### 提交建议

| 阶段 | 建议 commit 数 | 说明 |
|------|---------------|------|
| 阶段一 | 3 个 | Task 1.1~1.4（子包配置）→ Task 1.5（workspace 注册）→ Task 1.6（pnpm install） |
| 阶段二 | 2 个 | base 聚合包全量更新 → extension-ad 聚合包全量更新 |
| 阶段三 | 2 个 | base import 迁移 → extension-ad import 迁移 |
| 阶段四 | 2 个 | 构建验证通过 → 清理旧文件 |

> 阶段二的 commit 在阶段三 import 迁移完成前无法独立通过构建验证（git bisect 时请跳过）。
