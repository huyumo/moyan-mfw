# 包目录结构重构：三层独立自治 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 `packages/base` 和 `packages/extensions/extension-ad` 的目录结构，前后端、共享层各自维护独立的 package.json + tsconfig.json，根目录维护聚合 package.json 统一导出 npm 包。

**Architecture:** 在 `src/backend/`、`src/frontend/`、`src/shared/` 下创建 private 子包（`@internal/base-backend` 等），pnpm-workspace.yaml 注册子包路径实现模块解析。构建时各子包独立 tsc，发布前由聚合包 tsc-alias 将 `@internal/*` 转为 npm 消费者可解析路径。

**Tech Stack:** pnpm ≥ 8.0.0, TypeScript 5.4, NestJS CLI, Vite, vue-tsc, tsc-alias, ts-jest

**Spec Reference:** `docs/superpowers/specs/2026-05-14-package-layered-isolation-design.md`

---

## 文件变更总览

### 新建文件（16 个）

| 文件 | 用途 |
|------|------|
| `packages/base/src/backend/package.json` | `@internal/base-backend` 子包声明 |
| `packages/base/src/backend/tsconfig.json` | CJS / node 解析独立配置 |
| `packages/base/src/frontend/package.json` | `@internal/base-frontend` 子包声明 |
| `packages/base/src/frontend/tsconfig.json` | ESNext / bundler 独立配置 |
| `packages/base/src/shared/package.json` | `@internal/base-shared` 子包声明 |
| `packages/base/src/shared/tsconfig.json` | 共享层 CJS 独立配置 |
| `packages/base/tsconfig.publish.json` | npm 发布前 @internal → 相对路径转换 |
| `packages/base/.npmignore` | 排除子包配置文件 |
| `packages/extensions/extension-ad/src/backend/package.json` | `@internal/ad-backend` 子包 |
| `packages/extensions/extension-ad/src/backend/tsconfig.json` | 扩展后端配置 |
| `packages/extensions/extension-ad/src/frontend/package.json` | `@internal/ad-frontend` 子包 |
| `packages/extensions/extension-ad/src/frontend/tsconfig.json` | 扩展前端配置 |
| `packages/extensions/extension-ad/src/shared/package.json` | `@internal/ad-shared` 子包 |
| `packages/extensions/extension-ad/src/shared/tsconfig.json` | 扩展共享层配置 |
| `packages/extensions/extension-ad/tsconfig.publish.json` | 扩展包发布转换 |
| `packages/extensions/extension-ad/.npmignore` | 排除子包配置文件 |

### 修改文件（12 个）

| 文件 | 变更内容 |
|------|---------|
| `pnpm-workspace.yaml` | 新增子包注册 + catalog 增加 tsc-alias |
| `packages/base/package.json` | 重写：exports + 新 scripts + 子包 devDeps |
| `packages/base/tsconfig.json` | 重写为 project references 入口 |
| `packages/base/nest-cli.json` | sourceRoot → src/backend, tsConfigPath → 子包内 |
| `packages/base/vite.config.mts` | outDir → ../../dist/frontend, alias 指向源码 |
| `packages/extensions/extension-ad/package.json` | 重写：exports + scripts |
| `packages/extensions/extension-ad/tsconfig.json` | 重写为 project references |
| `packages/extensions/extension-ad/nest-cli.json` | sourceRoot + tsConfigPath 调整 |
| `packages/extensions/extension-ad/vite.config.mts` | outDir + alias 调整 |
| 运行迁移脚本修改的 ~70 处 import | 由脚本自动处理（见阶段二） |

### 删除文件（5 个）

| 文件 | 原因 |
|------|------|
| `packages/base/tsconfig.shared.json` | 子包独立 tsconfig |
| `packages/base/tsconfig.backend.alias.json` | 不再需要两步 tsc→tsc-alias |
| `packages/base/tsconfig.test.json` | 测试配置并入 jest.config.ts |
| `packages/base/scripts/fix-shared-imports.cjs` | tsc-alias + publish config 直接生成正确路径 |
| `packages/extensions/extension-ad/tsconfig.build.json` | NestJS 构建用子包内 tsconfig |

---

## 阶段一：创建子包配置（不删除旧文件）

> **核心理念**：新配置与旧配置共存，pnpm install 验证通过后再进入下一阶段。

### Task 1: 更新 pnpm-workspace.yaml

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: 在 packages 列表中新增子包路径**

在现有 `packages` 列表的 `packages/base` 之前插入子包注册行：

```yaml
packages:
  # 子包注册（private，仅供 workspace 内部使用）
  - packages/base/src/backend        # @internal/base-backend
  - packages/base/src/frontend       # @internal/base-frontend
  - packages/base/src/shared         # @internal/base-shared

  # 扩展包子包
  - packages/extensions/*/src/backend
  - packages/extensions/*/src/frontend
  - packages/extensions/*/src/shared

  # 聚合包（public，发布到 npm）
  - packages/base
  - packages/extensions/*

  # 其他已有包（不变）
  - packages/component-demo
  - frontend
  - backend
  - examples
  - docs
  - .harness
  - business-dict
```

- [ ] **Step 2: 在 catalog 块中添加 tsc-alias**

在 catalog 块末尾增加：

```yaml
catalog:
  # … 现有条目不变 …
  tsc-alias: ^1.8.17
```

- [ ] **Step 3: 运行 pnpm install 验证**

```bash
pnpm install
```

预期：无 error / warning，`pnpm ls -r` 能看到新增的子包（但尚未创建 package.json，此时不会出现在输出中）。

- [ ] **Step 4: Commit**

```bash
git add pnpm-workspace.yaml
git commit -m "chore: add sub-package paths and tsc-alias to pnpm workspace config"
```

---

### Task 2: 创建 base 包三个子包的 package.json

**Files:**
- Create: `packages/base/src/backend/package.json`
- Create: `packages/base/src/frontend/package.json`
- Create: `packages/base/src/shared/package.json`

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

- [ ] **Step 2: 创建 `packages/base/src/frontend/package.json`**

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

- [ ] **Step 3: 创建 `packages/base/src/shared/package.json`**

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

- [ ] **Step 4: 运行 pnpm install 验证子包注册**

```bash
pnpm install
```

预期：无 error/warning。子包通过 pnpm workspace proto 软链接到 `node_modules/@internal/`。

- [ ] **Step 5: Commit**

```bash
git add packages/base/src/backend/package.json packages/base/src/frontend/package.json packages/base/src/shared/package.json
git commit -m "feat: create base sub-package declarations (@internal/base-backend, -frontend, -shared)"
```

---

### Task 3: 创建 base 包三个子包的 tsconfig.json

**Files:**
- Create: `packages/base/src/backend/tsconfig.json`
- Create: `packages/base/src/frontend/tsconfig.json`
- Create: `packages/base/src/shared/tsconfig.json`

- [ ] **Step 1: 创建 `packages/base/src/backend/tsconfig.json`**

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

- [ ] **Step 2: 创建 `packages/base/src/frontend/tsconfig.json`**

```jsonc
{
  "extends": "../../../../tsconfig.base.json",
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

- [ ] **Step 3: 创建 `packages/base/src/shared/tsconfig.json`**

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

- [ ] **Step 4: Commit**

```bash
git add packages/base/src/backend/tsconfig.json packages/base/src/frontend/tsconfig.json packages/base/src/shared/tsconfig.json
git commit -m "feat: create base sub-package tsconfigs with isolated compilation contexts"
```

---

### Task 4: 创建 extension-ad 包三个子包的配置

**Files:**
- Create: `packages/extensions/extension-ad/src/backend/package.json`
- Create: `packages/extensions/extension-ad/src/backend/tsconfig.json`
- Create: `packages/extensions/extension-ad/src/frontend/package.json`
- Create: `packages/extensions/extension-ad/src/frontend/tsconfig.json`
- Create: `packages/extensions/extension-ad/src/shared/package.json`
- Create: `packages/extensions/extension-ad/src/shared/tsconfig.json`

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

- [ ] **Step 2: 创建 `packages/extensions/extension-ad/src/backend/tsconfig.json`**

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

- [ ] **Step 4: 创建 `packages/extensions/extension-ad/src/frontend/tsconfig.json`**

```jsonc
{
  "extends": "../../../../tsconfig.base.json",
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

- [ ] **Step 7: 运行 pnpm install 验证**

```bash
pnpm install
```

预期：无 error。`pnpm ls -r --depth 0` 应显示 `@internal/ad-backend`、`@internal/ad-frontend`、`@internal/ad-shared`。

- [ ] **Step 8: Commit**

```bash
git add packages/extensions/extension-ad/src/
git commit -m "feat: create extension-ad sub-package declarations (@internal/ad-backend, -frontend, -shared)"
```

---

## 阶段二：重写聚合包配置

### Task 5: 重写 packages/base 聚合包配置

**Files:**
- Modify: `packages/base/package.json`
- Create: `packages/base/tsconfig.json`（覆盖旧文件）
- Create: `packages/base/tsconfig.publish.json`
- Create: `packages/base/.npmignore`
- Modify: `packages/base/nest-cli.json`
- Modify: `packages/base/vite.config.mts`

- [ ] **Step 1: 重写 `packages/base/package.json`**

保留原有 `name` / `version` / `description` 字段，重写其余内容：

```jsonc
{
  "name": "moyan-mfw-base",
  "version": "1.0.0",
  "description": "墨焱MFW核心框架",
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
  "files": [
    "dist/",
    "migrations/"
  ],
  "devDependencies": {
    "@internal/base-backend": "workspace:*",
    "@internal/base-frontend": "workspace:*",
    "@internal/base-shared": "workspace:*",
    "tsc-alias": "catalog:",
    "typescript": "catalog:"
  }
}
```

> 注意：原来 `dependencies` / `peerDependencies` / `devDependencies` 中的 NestJS / Vue / TypeORM 等三方包需要**移除**——它们已移到各自子包的 `dependencies` 中。但 `jest`、`ts-jest` 等测试依赖保留在聚合包的 `devDependencies` 中（也不在子包中）。

- [ ] **Step 2: 重写 `packages/base/tsconfig.json`**

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

- [ ] **Step 3: 创建 `packages/base/tsconfig.publish.json`**

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

- [ ] **Step 4: 创建 `packages/base/.npmignore`**

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

- [ ] **Step 5: 更新 `packages/base/nest-cli.json`**

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

- [ ] **Step 6: 更新 `packages/base/vite.config.mts`**

关键变更：
- `build.outDir` → `../../dist/frontend`
- `resolve.alias` 中 `@` → `./src/frontend`

检查当前配置中是否有 `rollupOptions.external` 包含 `'moyan-mfw-base/shared'`——在新结构中应移除（因为 shared 改为相对路径引用，构建产物中不再出现）。

- [ ] **Step 7: Commit**

```bash
git add packages/base/package.json packages/base/tsconfig.json packages/base/tsconfig.publish.json packages/base/.npmignore packages/base/nest-cli.json packages/base/vite.config.mts
git commit -m "feat: rewrite base aggregate package with exports, sub-path scripts, and publish config"
```

---

### Task 6: 重写 extension-ad 聚合包配置

**Files:**
- Modify: `packages/extensions/extension-ad/package.json`
- Create: `packages/extensions/extension-ad/tsconfig.json`（覆盖旧文件）
- Create: `packages/extensions/extension-ad/tsconfig.publish.json`
- Create: `packages/extensions/extension-ad/.npmignore`
- Modify: `packages/extensions/extension-ad/nest-cli.json`
- Modify: `packages/extensions/extension-ad/vite.config.mts`

- [ ] **Step 1: 重写 `packages/extensions/extension-ad/package.json`**

```jsonc
{
  "name": "moyan-mfw-extension-ad",
  "version": "0.1.0",
  "description": "MFW 广告管理扩展包",
  "exports": {
    "./backend": {
      "types": "./dist/backend/index.d.ts",
      "require": "./dist/backend/index.js"
    },
    "./frontend": {
      "types": "./dist/frontend/index.d.ts",
      "require": "./dist/frontend/index.js"
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "require": "./dist/shared/index.js"
    }
  },
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
  "files": [
    "dist/",
    "migrations/",
    "extension.json"
  ],
  "devDependencies": {
    "@internal/ad-backend": "workspace:*",
    "@internal/ad-frontend": "workspace:*",
    "@internal/ad-shared": "workspace:*",
    "tsc-alias": "catalog:",
    "typescript": "catalog:"
  }
}
```

> 注意：原来 dependencies 中的三方包移至子包、extension.json 保留在 files 中。

- [ ] **Step 2: 重写 `packages/extensions/extension-ad/tsconfig.json`**

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

- [ ] **Step 3: 创建 `packages/extensions/extension-ad/tsconfig.publish.json`**

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

- [ ] **Step 4: 创建 `packages/extensions/extension-ad/.npmignore`**

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
```

- [ ] **Step 5: 更新 `packages/extensions/extension-ad/nest-cli.json`**

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

- [ ] **Step 6: 更新 `packages/extensions/extension-ad/vite.config.mts`**

关键变更：
- `build.outDir` → `../../dist/frontend`
- `resolve.alias` 中移除 `moyan-mfw-base/frontend` 和 `moyan-mfw-base/shared` 的自定义映射（现在由 pnpm workspace 通过 `@internal/*` 解析）

- [ ] **Step 7: Commit**

```bash
git add packages/extensions/extension-ad/package.json packages/extensions/extension-ad/tsconfig.json packages/extensions/extension-ad/tsconfig.publish.json packages/extensions/extension-ad/.npmignore packages/extensions/extension-ad/nest-cli.json packages/extensions/extension-ad/vite.config.mts
git commit -m "feat: rewrite extension-ad aggregate package with exports and publish config"
```

---

### Task 7: 运行 pnpm install 并验证全 workspace 依赖解析

- [ ] **Step 1: 清理并重新安装**

```bash
pnpm install
```

- [ ] **Step 2: 检查 workspace 包列表**

```bash
pnpm ls -r --depth 0
```

预期输出应包含：
- `@internal/base-backend` (private)
- `@internal/base-frontend` (private)
- `@internal/base-shared` (private)
- `@internal/ad-backend` (private)
- `@internal/ad-frontend` (private)
- `@internal/ad-shared` (private)
- `moyan-mfw-base`
- `moyan-mfw-extension-ad`
- 以及原有的 `frontend/`、`backend/` 等

- [ ] **Step 3: 验证 @internal 包已正确 soft-link**

```bash
dir node_modules\@internal
```

预期：存在 `base-backend`、`base-frontend`、`base-shared`、`ad-backend`、`ad-frontend`、`ad-shared` 目录。

- [ ] **Step 4: Commit**

仅当有新变更时提交。

---

## 阶段三：迁移 import 语句 + 验证构建

### Task 8: 运行 base 迁移脚本 —— shared 引用替换

**Files:**
- Script: `packages/base/scripts/migrate-shared-imports.mjs`（已存在，验证可用）
- 22 个目标文件（自动修改）

- [ ] **Step 1: 在 dry-run 模式下预览变更**

脚本会在执行时输出每个文件的旧 import → 新 import 对比。先查看脚本是否存在：

```bash
dir packages\base\scripts\migrate-shared-imports.mjs
```

- [ ] **Step 2: 执行迁移脚本**

```bash
node packages/base/scripts/migrate-shared-imports.mjs
```

预期输出：每个处理文件的日志，如：
```
[OK] src/frontend/views/sys/user/UserForm.vue: 'moyan-mfw-base/shared' → '../../shared'
```

- [ ] **Step 3: 检查改动范围**

```bash
git diff --stat
```

预期：仅 22 个文件（15 前端 + 7 后端）、无意外改动。

- [ ] **Step 4: Commit**

```bash
git add -u packages/base/src/
git commit -m "refactor(base): migrate 22 shared imports to relative paths for sub-package isolation"
```

---

### Task 9: 运行 extension-ad 迁移脚本 —— @internal 命名空间引用替换

**Files:**
- Script: `packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs`（已存在，验证可用）
- ~48 个目标文件（自动修改）

- [ ] **Step 1: 确认脚本存在**

```bash
dir packages\extensions\extension-ad\scripts\migrate-internal-imports.mjs
```

- [ ] **Step 2: 执行迁移脚本**

```bash
node packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs
```

预期输出：每条替换规则的匹配数量日志。

- [ ] **Step 3: 检查改动范围**

```bash
git diff --stat
```

预期：仅 extension-ad 的 `src/` 目录下文件，数量约 40-48。

- [ ] **Step 4: Commit**

```bash
git add -u packages/extensions/extension-ad/src/
git commit -m "refactor(extension-ad): migrate ~48 imports to @internal namespace for sub-package isolation"
```

---

### Task 10: 验证构建 —— base 共享层先行

- [ ] **Step 1: 构建 base shared**

```bash
pnpm --filter @internal/base-shared build
```

预期：`tsc` 编译成功，产物输出到 `packages/base/dist/shared/`。
如果 tsc 报错：检查 import 语句是否正确、tsconfig 的 `include` 是否覆盖全部文件。

- [ ] **Step 2: 构建 base backend**

```bash
pnpm --filter @internal/base-backend build
```

预期：`tsc` 编译成功，产物输出到 `packages/base/dist/backend/`。
如果报 `Cannot find module '@internal/base-shared'`：检查 `pnpm install` 是否正常软链接子包。

- [ ] **Step 3: 构建 base frontend**

```bash
pnpm --filter @internal/base-frontend build
```

预期：`vite build` + `vue-tsc --emitDeclarationOnly` 均成功，产物输出到 `packages/base/dist/frontend/`。
如果 vue-tsc 报 `.vue` 文件错误：检查 `tsconfig.json` 的 `include` 是否包含 `.vue`。

- [ ] **Step 4: 验证 dist 产物结构**

```bash
dir packages\base\dist\backend\index.js
dir packages\base\dist\frontend\index.mjs
dir packages\base\dist\shared\index.js
```

- [ ] **Step 5: Commit**

仅当有修复性变更时提交。

---

### Task 11: 验证构建 —— extension-ad 全量构建

- [ ] **Step 1: 构建 ad shared**

```bash
pnpm --filter @internal/ad-shared build
```

预期：成功。

- [ ] **Step 2: 构建 ad backend**

```bash
pnpm --filter @internal/ad-backend build
```

预期：成功。如果报 `Cannot find module '@internal/base-backend'`：确认 base backend 已先构建（或 base backend 的 tsconfig 无 composite 导出限制）。

- [ ] **Step 3: 构建 ad frontend**

```bash
pnpm --filter @internal/ad-frontend build
```

预期：成功。

- [ ] **Step 4: 验证 dist 产物结构**

```bash
dir packages\extensions\extension-ad\dist\backend\index.js
dir packages\extensions\extension-ad\dist\frontend\index.mjs
dir packages\extensions\extension-ad\dist\shared\index.js
```

---

### Task 12: 运行 tsc-alias 发布转换验证

- [ ] **Step 1: 运行 base publish:build**

```bash
pnpm --filter moyan-mfw-base publish:build
```

预期：tsc-alias 将 `dist/backend/**/*.js` 中的 `require('@internal/base-shared')` 替换为相对路径。

- [ ] **Step 2: 验证替换结果**

```bash
# 检查 dist 产物中已无 @internal 引用
findstr /s "@internal" packages\base\dist\*.js
```

预期：无匹配（或仅出现在注释中）。

- [ ] **Step 3: 运行 extension-ad publish:build**

```bash
pnpm --filter moyan-mfw-extension-ad publish:build
```

- [ ] **Step 4: 验证替换结果**

```bash
findstr /s "@internal" packages\extensions\extension-ad\dist\*.js
```

预期：无 `@internal` 引用。关键验证：`dist/backend/**/*.js` 中应出现 `require('moyan-mfw-base/backend')`。

```bash
findstr /s "moyan-mfw-base/backend" packages\extensions\extension-ad\dist\backend\*.js
```

预期：有匹配。

- [ ] **Step 5: Commit**

```bash
git commit -m "verify: tsc-alias publish conversion correct for base and extension-ad"
```

---

### Task 13: 验证下游 consumers —— root workspace 包不受影响

- [ ] **Step 1: 启动 frontend dev server**

```bash
pnpm --filter moyan-mfw-frontend dev
```

预期：Vite 启动成功，无模块解析错误。启动后立即 `Ctrl+C` 停止。

或仅做类型检查：

```bash
pnpm --filter moyan-mfw-frontend exec vue-tsc --noEmit
```

- [ ] **Step 2: 启动 backend dev server**

```bash
pnpm --filter moyan-mfw-backend dev
```

预期：NestJS 启动成功，无 `Cannot find module 'moyan-mfw-base/backend'` 错误。启动后立即 `Ctrl+C` 停止。

或仅做编译检查：

```bash
pnpm --filter moyan-mfw-backend exec tsc --noEmit
```

- [ ] **Step 3: Commit**

仅当有修复性变更时提交。

---

## 阶段四：运行测试 + 清理旧文件

### Task 14: 运行 base 测试

- [ ] **Step 1: 确认 jest.config.ts 已更新**

检查 `packages/base/jest.config.ts` 中的 `transform` 字段：

```typescript
transform: {
  '^.+\\.tsx?$': ['ts-jest', {
    tsconfig: 'src/backend/tsconfig.json',
    types: ['jest', 'node'],
  }],
},
```

如尚未修改，执行修改。

- [ ] **Step 2: 运行测试**

```bash
pnpm --filter moyan-mfw-base test
```

预期：所有测试通过。

如果报 `Cannot find module '@internal/base-shared'`：检查 `moduleNameMapper` 或 ts-jest 是否正确读取子包 tsconfig 的 paths。

- [ ] **Step 3: Commit**

```bash
git add packages/base/jest.config.ts
git commit -m "fix(base): update jest.config.ts to reference sub-package tsconfig"
```

---

### Task 15: 清理旧配置文件

- [ ] **Step 1: 删除 5 个旧配置**

```bash
Remove-Item packages\base\tsconfig.shared.json
Remove-Item packages\base\tsconfig.backend.alias.json
Remove-Item packages\base\tsconfig.test.json
Remove-Item packages\base\scripts\fix-shared-imports.cjs
Remove-Item packages\extensions\extension-ad\tsconfig.build.json
```

- [ ] **Step 2: 确认删除后 pnpm install 仍正常**

```bash
pnpm install
```

预期：无 error / warning。

- [ ] **