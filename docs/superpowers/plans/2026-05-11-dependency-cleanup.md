# 依赖重构 & Base 层合并 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 合并 base-backend + base-frontend 为 moyan-base，使用 pnpm catalog 统一依赖版本，迁移 ESLint 到 v9 + flat config。

**Architecture:** 将 packages/base-backend 和 packages/base-frontend 合并为 packages/base，采用与 extension-ad 一致的多导出入口模式（./backend, ./frontend, ./shared）。通过 pnpm catalog 统一全项目依赖版本。不设顶层 `"type"` 以兼容 CJS（后端）和 ESM（前端）双格式输出。

**Tech Stack:** pnpm v10 (catalog:), NestJS v10, Vue 3, Vite 5, ESLint v9, TypeScript 5

**Spec:** `docs/superpowers/specs/2026-05-11-dependency-cleanup-design.md`

---

## File Structure

### 新建文件
- `packages/base/package.json` — 合并后的包配置
- `packages/base/tsconfig.json` — 基础共享 TS 配置
- `packages/base/tsconfig.backend.json` — 后端 CJS 构建配置
- `packages/base/tsconfig.frontend.json` — 前端 ESM 构建配置
- `packages/base/tsconfig.test.json` — 后端测试 TS 配置
- `packages/base/nest-cli.json` — NestJS CLI 配置
- `packages/base/vite.config.ts` — 前端 Vite 构建配置
- `packages/base/jest.config.ts` — 后端 Jest 测试配置
- `packages/base/eslint.config.mjs` — ESLint v9 flat config
- `packages/base/src/backend/**` — 原 base-backend/src 的全部内容
- `packages/base/src/frontend/**` — 原 base-frontend/src 的全部内容
- `packages/base/src/shared/index.ts` — 跨前后端共享入口
- `packages/base/tests/**` — 原 base-backend/tests 的全部内容
- `backend/eslint.config.mjs` — 后端应用 ESLint v9 flat config

### 修改文件
- `pnpm-workspace.yaml` — 添加 catalog，更新 packages 列表
- `package.json` (root) — 依赖版本改为 catalog:，清理多余依赖
- `backend/package.json` — 依赖版本改为 catalog:，更新 workspace 引用
- `frontend/package.json` — 依赖版本改为 catalog:，更新 workspace 引用
- `packages/extensions/extension-ad/package.json` — 版本改为 catalog:，清理重复声明
- `business-dict/package.json` — 版本改为 catalog:
- `packages/shared-dict/package.json` — 版本改为 catalog:
- `backend/src/main.ts` — import 路径 `moyan-base-backend` → `moyan-base/backend`
- `backend/src/permissions.ts` — 同上
- `backend/src/app-types.config.ts` — 同上
- `backend/src/database/data-source.ts` — 同上
- `backend/src/database/run-seeds.ts` — 同上
- `backend/src/database/clear-database.ts` — 同上
- `backend/src/database/seeds/index.ts` — 同上
- `backend/src/modules/supplier/entities/supplier-member-profile.entity.ts` — 同上
- `frontend/src/main.ts` — import 路径 `moyan-mfw-base-frontend` → `moyan-base/frontend`
- `frontend/src/permissions.ts` — 同上
- `frontend/src/router.ts` — 同上
- `frontend/src/components/Layout/components/HeaderCommonActions.vue` — 同上
- `frontend/vite.config.ts` — alias 路径更新
- `frontend/tsconfig.json` — paths 映射更新
- `packages/extensions/extension-ad/vite.config.mts` — alias 路径更新
- `packages/extensions/extension-ad/src/backend/api-response.ts` — require 路径更新
- `packages/extensions/extension-ad/src/backend/main.ts` — import 路径更新
- `packages/extensions/extension-ad/src/backend/service/*.ts` — import 路径更新
- `packages/extensions/extension-ad/src/backend/controller/*.ts` — import 路径更新
- `packages/extensions/extension-ad/src/backend/dto/*.ts` — import 路径更新
- `packages/extensions/extension-ad/src/backend/entities/*.ts` — import 路径更新
- `packages/extensions/extension-ad/src/frontend/main.ts` — import 路径更新
- `packages/extensions/extension-ad/src/frontend/views/**/*.vue` — import 路径更新
- `packages/extensions/extension-ad/src/frontend/views/**/*.ts` — import 路径更新
- `packages/extensions/extension-ad/src/frontend/components/**/*.vue` — import 路径更新
- `packages/extensions/extension-ad/src/frontend/index.ts` — import 路径更新
- `eslint.config.mjs` (root) — 硬编码路径更新
- `tsconfig.json` (root) — paths 映射更新

### 删除文件
- `packages/base-backend/` — 整个目录
- `packages/base-frontend/` — 整个目录
- `backend/.eslintrc.js` — 迁移到 eslint.config.mjs

---

### Task 1: 创建 feature 分支 + 回滚标记

**Files:**
- N/A (git 操作)

- [ ] **Step 1: 创建 feature 分支**

```bash
git checkout -b refactor/dependency-cleanup
```

- [ ] **Step 2: 在当前主干打 tag**

```bash
git tag pre-dependency-cleanup
```

- [ ] **Step 3: 提交**

```bash
git commit --allow-empty -m "chore: start dependency cleanup refactor"
```

---

### Task 2: 建立 pnpm catalog

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: 更新 pnpm-workspace.yaml，添加 catalog 字段**

将 `pnpm-workspace.yaml` 内容替换为：

```yaml
packages:
  - packages/base-backend
  - packages/base-frontend
  - packages/extensions/*
  - packages/component-demo
  - packages/shared-dict
  - frontend
  - backend
  - examples
  - docs
  - .harness
  - business-dict

ignoredBuiltDependencies:
  - '@nestjs/core'
  - '@parcel/watcher'
  - cypress
  - ejs
  - esbuild
  - unrs-resolver
  - vue-demi

catalog:
  # NestJS 生态
  "@nestjs/common": "^10.4.22"
  "@nestjs/core": "^10.4.22"
  "@nestjs/platform-express": "^10.4.22"
  "@nestjs/typeorm": "^10.0.2"
  "@nestjs/jwt": "^10.2.0"
  "@nestjs/swagger": "^7.4.2"
  "@nestjs/config": "^3.3.0"
  "@nestjs/cli": "^10.4.9"
  "@nestjs/schematics": "^10.1.4"
  "@nestjs/testing": "^10.4.9"
  typeorm: "^0.3.28"
  rxjs: "^7.8.2"
  reflect-metadata: "^0.1.14"

  # Vue 生态
  vue: "^3.5.30"
  vue-router: "^4.5.1"
  element-plus: "^2.13.5"
  "@element-plus/icons-vue": "^2.3.2"
  pinia: "^2.3.2"
  vite: "^5.4.21"
  "@vitejs/plugin-vue": "^5.2.4"
  "@vitejs/plugin-vue-jsx": "^5.1.5"
  vue-tsc: "^2.2.12"
  "@vueuse/core": "^14.2.1"

  # 共享工具
  typescript: "^5.7.3"
  class-validator: "^0.14.4"
  class-transformer: "^0.5.1"
  mysql2: "^3.11.5"
  redis: "^4.7.0"
  bcrypt: "^5.1.1"
  "@types/node": "^22.19.15"
  eslint: "^9.38.0"
  prettier: "^3.5.3"
  ts-node: "^10.9.2"
  tsconfig-paths: "^4.2.0"
  axios: "^1.6.5"
  multer: "^2.1.1"
  sass: "^1.70.0"
  dotenv: "^17.3.1"
  md-editor-v3: "^6.4.2"
  quill: "^2.0.3"
  vue-advanced-cropper: "^2.8.8"
  moyan-api: "^2.1.19"

  # 测试工具
  jest: "^30.3.0"
  ts-jest: "^29.4.6"
  vitest: "^1.6.1"
  "@types/jest": "^30.0.0"
  "@vue/test-utils": "^2.4.6"
  jsdom: "^24.1.0"
  supertest: "^7.2.2"
  "@types/supertest": "^7.2.0"
  "@vitest/coverage-v8": "^1.0.0"

  # 类型
  "@types/bcrypt": "^5.0.0"
  "@types/express": "^4.17.17"
  "@types/multer": "^2.1.0"
  "@types/dotenv": "^8.2.3"

  # 构建工具
  ts-loader: "^9.4.3"
  source-map-support: "^0.5.21"
  tsx: "^4.21.0"
```

- [ ] **Step 2: 运行 `pnpm install` 验证 catalog 生效**

```bash
pnpm install
```

Expected: 安装成功，无错误

- [ ] **Step 3: 提交**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: add pnpm catalog for unified dependency versions"
```

---

### Task 3: 各包依赖版本号改为 catalog:

**Files:**
- Modify: `packages/base-backend/package.json`
- Modify: `packages/base-frontend/package.json`
- Modify: `backend/package.json`
- Modify: `frontend/package.json`
- Modify: `packages/extensions/extension-ad/package.json`
- Modify: `business-dict/package.json`
- Modify: `packages/shared-dict/package.json`
- Modify: `package.json` (root)

- [ ] **Step 1: 更新 `packages/base-backend/package.json` 中的版本号为 `catalog:`**

将所有 `dependencies`、`peerDependencies`、`devDependencies` 中与 catalog 匹配的依赖版本号替换为 `catalog:`。同时清理 `dependencies` 中与 `peerDependencies` 重复的 NestJS 核心依赖。

修改后的 `dependencies` 仅保留：
```json
"dependencies": {
  "business-dict": "workspace:*",
  "moyan-shared-dict": "workspace:*",
  "multer": "catalog:"
}
```

将 `@nestjs/common`, `@nestjs/config`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/typeorm`, `bcrypt`, `class-transformer`, `class-validator`, `mysql2`, `redis`, `reflect-metadata`, `rxjs`, `typeorm` 从 `dependencies` 中移除（已在 `peerDependencies` 中声明）。

`peerDependencies` 和 `devDependencies` 中所有匹配 catalog 的版本号改为 `catalog:`。

- [ ] **Step 2: 更新 `packages/base-frontend/package.json` 中的版本号为 `catalog:`**

`dependencies` 和 `devDependencies` 中所有匹配 catalog 的版本号改为 `catalog:`。

- [ ] **Step 3: 更新 `backend/package.json`**

- `dependencies` 中所有版本号改为 `catalog:`
- 移除 `devDependencies` 中的 `eslint`、`@typescript-eslint/eslint-plugin`、`@typescript-eslint/parser`、`eslint-config-prettier`、`eslint-plugin-prettier`（由 root ESLint 配置覆盖）
- 其余 `devDependencies` 版本号改为 `catalog:`

- [ ] **Step 4: 更新 `frontend/package.json`**

所有版本号改为 `catalog:`。

- [ ] **Step 5: 更新 `packages/extensions/extension-ad/package.json`**

- `peerDependencies` 版本号改为 `catalog:`，`moyan-base-backend` 改为 `moyan-base/backend` (workspace:^)，`moyan-mfw-base-frontend` 改为 `moyan-base/frontend` (workspace:^)，`moyan-shared-dict` 改为 `workspace:^`
- `devDependencies` 中移除与 `peerDependencies` 重复的包：`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/typeorm`, `class-transformer`, `class-validator`, `reflect-metadata`, `rxjs`, `typeorm`, `vue`, `vue-router`
- 保留 `devDependencies` 中的开发工具：`@nestjs/cli`, `@element-plus/icons-vue`, `element-plus`, `moyan-api`, `moyan-mfw-base-frontend`(改为 `moyan-base/frontend`: `workspace:*`), `sass`, `vite`, `vue-tsc`, `tsx`, `@types/node`, `@vitejs/plugin-vue`
- 所有版本号改为 `catalog:`

- [ ] **Step 6: 更新 `business-dict/package.json`**

`dependencies` 中 `reflect-metadata` 改为 `catalog:`，`devDependencies` 中 `typescript` 改为 `catalog:`。

- [ ] **Step 7: 更新 `packages/shared-dict/package.json`**

`dependencies` 中 `reflect-metadata` 改为 `catalog:`，`devDependencies` 中 `typescript` 改为 `catalog:`。

- [ ] **Step 8: 更新 `package.json` (root)**

- `devDependencies` 中所有匹配 catalog 的版本号改为 `catalog:`
- 移除以下依赖：`@nestjs/cli`、`typeorm`、`@vitejs/plugin-vue-jsx`、`eslint-plugin-jsdoc`
- 保留 `vue-eslint-parser`（ESLint v9 + eslint-plugin-vue 仍需要）
- 移除 `pnpm.overrides`（已通过 catalog 统一 `reflect-metadata`）

- [ ] **Step 9: 运行 `pnpm install` 验证**

```bash
pnpm install
```

Expected: 安装成功。可能有 peer 依赖警告，但不应有错误。

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "chore: migrate all package versions to pnpm catalog: protocol"
```

---

### Task 4: 创建 packages/base 目录结构

**Files:**
- Create: `packages/base/` 目录及子目录

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p packages/base/src/backend
mkdir -p packages/base/src/frontend
mkdir -p packages/base/src/shared
mkdir -p packages/base/tests
```

- [ ] **Step 2: 复制 base-backend/src 到 packages/base/src/backend**

```powershell
Copy-Item -Recurse -Force packages/base-backend/src/* packages/base/src/backend/
```

- [ ] **Step 3: 复制 base-frontend/src 到 packages/base/src/frontend**

```powershell
Copy-Item -Recurse -Force packages/base-frontend/src/* packages/base/src/frontend/
```

- [ ] **Step 4: 复制 base-backend/tests 到 packages/base/tests**

```powershell
Copy-Item -Recurse -Force packages/base-backend/tests/* packages/base/tests/
```

- [ ] **Step 5: 创建 shared/index.ts**

```typescript
export {};
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: create packages/base directory with migrated source files"
```

---

### Task 5: 创建 packages/base 的配置文件

**Files:**
- Create: `packages/base/package.json`
- Create: `packages/base/tsconfig.json`
- Create: `packages/base/tsconfig.backend.json`
- Create: `packages/base/tsconfig.frontend.json`
- Create: `packages/base/tsconfig.test.json`
- Create: `packages/base/nest-cli.json`
- Create: `packages/base/vite.config.ts`
- Create: `packages/base/jest.config.ts`

- [ ] **Step 1: 创建 `packages/base/package.json`**

```json
{
  "name": "moyan-base",
  "version": "1.0.0",
  "description": "墨焱基础框架 - 前后端统一基础设施",
  "exports": {
    "./backend": {
      "types": "./dist/backend/src/index.d.ts",
      "require": "./dist/backend/src/index.js",
      "default": "./dist/backend/src/index.js"
    },
    "./frontend": {
      "types": "./dist/frontend/index.d.ts",
      "import": "./dist/frontend/index.mjs",
      "require": "./dist/frontend/index.js",
      "default": "./dist/frontend/index.mjs"
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "import": "./dist/shared/index.mjs",
      "default": "./dist/shared/index.mjs"
    }
  },
  "typesVersions": {
    "*": {
      "backend": ["./dist/backend/src/index.d.ts"],
      "frontend": ["./dist/frontend/index.d.ts"],
      "shared": ["./dist/shared/index.d.ts"]
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "pnpm build:frontend && pnpm build:backend",
    "build:backend": "nest build",
    "build:frontend": "vite build && tsc -p tsconfig.frontend.json --emitDeclarationOnly",
    "dev:backend": "nest start --watch",
    "dev:frontend": "vite",
    "typecheck:vue": "vue-tsc --noEmit -p tsconfig.frontend.json",
    "test": "jest --config jest.config.ts",
    "test:integration": "jest --config jest.config.ts --testPathPatterns=integration"
  },
  "peerDependencies": {
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "@nestjs/platform-express": "catalog:",
    "@nestjs/typeorm": "catalog:",
    "@nestjs/jwt": "catalog:",
    "@nestjs/config": "catalog:",
    "@nestjs/swagger": "catalog:",
    "typeorm": "catalog:",
    "mysql2": "catalog:",
    "redis": "catalog:",
    "bcrypt": "catalog:",
    "class-validator": "catalog:",
    "class-transformer": "catalog:",
    "reflect-metadata": "catalog:",
    "rxjs": "catalog:",
    "vue": "catalog:",
    "vue-router": "catalog:",
    "element-plus": "catalog:",
    "pinia": "catalog:"
  },
  "dependencies": {
    "business-dict": "workspace:*",
    "moyan-shared-dict": "workspace:*",
    "moyan-api": "catalog:",
    "multer": "catalog:",
    "axios": "catalog:",
    "@vueuse/core": "catalog:",
    "@element-plus/icons-vue": "catalog:",
    "md-editor-v3": "catalog:",
    "quill": "catalog:",
    "vue-advanced-cropper": "catalog:"
  },
  "devDependencies": {
    "@nestjs/cli": "catalog:",
    "@nestjs/schematics": "catalog:",
    "@nestjs/testing": "catalog:",
    "@types/bcrypt": "catalog:",
    "@types/express": "catalog:",
    "@types/jest": "catalog:",
    "@types/multer": "catalog:",
    "@types/node": "catalog:",
    "@types/supertest": "catalog:",
    "@vitejs/plugin-vue": "catalog:",
    "@vitejs/plugin-vue-jsx": "catalog:",
    "@vue/test-utils": "catalog:",
    "dotenv": "catalog:",
    "jest": "catalog:",
    "jsdom": "catalog:",
    "sass": "catalog:",
    "source-map-support": "catalog:",
    "supertest": "catalog:",
    "ts-jest": "catalog:",
    "ts-loader": "catalog:",
    "ts-node": "catalog:",
    "tsconfig-paths": "catalog:",
    "tsx": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vitest": "catalog:",
    "vue-tsc": "catalog:"
  }
}
```

- [ ] **Step 2: 创建 `packages/base/tsconfig.json` (基础共享配置)**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "declaration": true,
    "removeComments": false,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 3: 创建 `packages/base/tsconfig.backend.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist/backend",
    "rootDir": "./src/backend",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "target": "ES2021",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/backend/*"],
      "@common/*": ["src/backend/common/*"],
      "@modules/*": ["src/backend/modules/*"],
      "@config/*": ["src/backend/config/*"],
      "@database/*": ["src/backend/database/*"]
    }
  },
  "include": ["src/backend/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: 创建 `packages/base/tsconfig.frontend.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist/frontend",
    "rootDir": "./src/frontend",
    "declaration": true,
    "emitDeclarationOnly": true,
    "target": "ES2020",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/frontend/*"]
    },
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "composite": false,
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "skipLibCheck": true
  },
  "include": ["src/frontend/**/*.ts", "src/frontend/**/*.vue", "src/shared/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: 创建 `packages/base/tsconfig.test.json`**

```json
{
  "extends": "./tsconfig.backend.json",
  "compilerOptions": {
    "baseUrl": "./src/backend",
    "paths": {
      "@/*": ["./*"],
      "@common/*": ["common/*"],
      "@config/*": ["config/*"],
      "@modules/*": ["modules/*"],
      "@database/*": ["database/*"]
    },
    "types": ["jest", "node"],
    "esModuleInterop": true,
    "sourceMap": true,
    "inlineSources": true
  },
  "include": ["src/backend/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

- [ ] **Step 6: 创建 `packages/base/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src/backend",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": false,
    "outDir": "dist/backend",
    "tsConfigPath": "tsconfig.backend.json"
  }
}
```

- [ ] **Step 7: 创建 `packages/base/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/frontend'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/frontend/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
    },
    rollupOptions: {
      external: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        'element-plus',
        '@element-plus/icons-vue',
        'reflect-metadata',
      ],
    },
    outDir: 'dist/frontend',
    sourcemap: true,
  },
});
```

- [ ] **Step 8: 创建 `packages/base/jest.config.ts`**

基于原 base-backend/jest.config.ts，将路径映射从 `src/` 改为 `src/backend/`：

```typescript
import type { Config } from 'jest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_integration_testing_only';
process.env.JWT_EXPIRES_IN = '7200';

import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';
dotenvConfig({ path: path.join(__dirname, '.env.test') });

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/backend/$1',
    '^@common/(.*)$': '<rootDir>/src/backend/common/$1',
    '^@config/(.*)$': '<rootDir>/src/backend/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/backend/modules/$1',
    '^@database/(.*)$': '<rootDir>/src/backend/database/$1',
  },
  roots: ['<rootDir>/src/backend', '<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  setupFiles: ['<rootDir>/tests/setup/jest.env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    '!src/backend/**/*.dto.ts',
    '!src/backend/**/*.entity.ts',
    '!src/backend/**/*.module.ts',
    '!src/backend/**/*.interface.ts',
    '!src/backend/**/*.types.ts',
    '!src/backend/main.ts',
    '!src/backend/database/migrations/**/*',
    '!src/backend/database/seeds/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text', 'text-summary'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  bail: 0,
  globalSetup: '<rootDir>/tests/setup/jest.global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/jest.global-teardown.ts',
};

export default config;
```

- [ ] **Step 9: 复制其他必需文件**

复制 `packages/base-backend/` 下的 `.env.test`、`.prettierrc`、`.gitignore` 等配置文件到 `packages/base/`。也复制 `packages/base-frontend/` 下的 `api.build.cjs` 到 `packages/base/`。

```powershell
if (Test-Path packages/base-backend/.env.test) { Copy-Item packages/base-backend/.env.test packages/base/ }
if (Test-Path packages/base-backend/.prettierrc) { Copy-Item packages/base-backend/.prettierrc packages/base/ }
if (Test-Path packages/base-backend/.gitignore) { Copy-Item packages/base-backend/.gitignore packages/base/ }
if (Test-Path packages/base-frontend/api.build.cjs) { Copy-Item packages/base-frontend/api.build.cjs packages/base/ }
```

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "chore: add packages/base configuration files"
```

---

### Task 6: 更新 pnpm-workspace.yaml 引用

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: 更新 packages 列表**

将 `pnpm-workspace.yaml` 中的 packages 列表从 `packages/base-backend` + `packages/base-frontend` 替换为 `packages/base`：

```yaml
packages:
  - packages/base
  - packages/extensions/*
  - packages/component-demo
  - packages/shared-dict
  - frontend
  - backend
  - examples
  - docs
  - .harness
  - business-dict
```

（catalog 和 ignoredBuiltDependencies 部分不变）

- [ ] **Step 2: 运行 `pnpm install`**

```bash
pnpm install
```

Expected: 安装成功，`moyan-base` 包被正确识别。

- [ ] **Step 3: 提交**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: update pnpm-workspace.yaml to reference packages/base"
```

---

### Task 7: 全局替换 import 路径

**Files:**
- Modify: 所有包含 `moyan-base-backend` 和 `moyan-mfw-base-frontend` 的 .ts/.vue/.mts 文件

- [ ] **Step 1: 搜索所有需要修改的文件**

```bash
grep -rn "moyan-base-backend" --include="*.ts" --include="*.vue" --include="*.mts" --include="*.mjs" --include="*.json" .
grep -rn "moyan-mfw-base-frontend" --include="*.ts" --include="*.vue" --include="*.mts" --include="*.mjs" --include="*.json" .
```

排除 `pnpm-lock.yaml`、`docs/`、`packages/base-backend/`、`packages/base-frontend/`（这些将被删除）和 spec/plan 文件。

- [ ] **Step 2: 替换 `backend/` 目录下的所有 `moyan-base-backend` → `moyan-base/backend`**

涉及文件（基于搜索结果）：
- `backend/src/main.ts`
- `backend/src/permissions.ts`
- `backend/src/app-types.config.ts`
- `backend/src/database/data-source.ts`
- `backend/src/database/run-seeds.ts`
- `backend/src/database/clear-database.ts`
- `backend/src/database/seeds/index.ts`
- `backend/src/modules/supplier/entities/supplier-member-profile.entity.ts`

- [ ] **Step 3: 替换 `frontend/` 目录下的所有 `moyan-mfw-base-frontend` → `moyan-base/frontend`**

涉及文件：
- `frontend/src/main.ts`
- `frontend/src/permissions.ts`
- `frontend/src/router.ts`
- `frontend/src/components/Layout/components/HeaderCommonActions.vue`

- [ ] **Step 4: 替换 `packages/extensions/extension-ad/` 下的所有引用**

涉及文件：
- `packages/extensions/extension-ad/src/backend/api-response.ts` — `require('moyan-base-backend')` → `require('moyan-base/backend')`
- `packages/extensions/extension-ad/src/backend/main.ts`
- `packages/extensions/extension-ad/src/backend/service/ad.service.ts`
- `packages/extensions/extension-ad/src/backend/service/ad-placement.service.ts`
- `packages/extensions/extension-ad/src/backend/service/ad-placement-type.service.ts`
- `packages/extensions/extension-ad/src/backend/controller/ad-placement-type.controller.ts`
- `packages/extensions/extension-ad/src/backend/controller/ad-placement.controller.ts`
- `packages/extensions/extension-ad/src/backend/controller/ad.controller.ts`
- `packages/extensions/extension-ad/src/backend/dto/query-ad-placement-type.dto.ts`
- `packages/extensions/extension-ad/src/backend/dto/query-ad.dto.ts`
- `packages/extensions/extension-ad/src/backend/dto/query-ad-placement.dto.ts`
- `packages/extensions/extension-ad/src/backend/entities/ad.entity.ts`
- `packages/extensions/extension-ad/src/backend/entities/ad-placement.entity.ts`
- `packages/extensions/extension-ad/src/backend/entities/ad-placement-type.entity.ts`
- `packages/extensions/extension-ad/src/frontend/main.ts`
- `packages/extensions/extension-ad/src/frontend/index.ts`
- `packages/extensions/extension-ad/src/frontend/views/ad/Index.vue`
- `packages/extensions/extension-ad/src/frontend/views/placement/Index.vue`
- `packages/extensions/extension-ad/src/frontend/views/type/Index.vue`
- `packages/extensions/extension-ad/src/frontend/views/ad/index.ts`
- `packages/extensions/extension-ad/src/frontend/views/placement/index.ts`
- `packages/extensions/extension-ad/src/frontend/views/type/index.ts`
- `packages/extensions/extension-ad/src/frontend/views/index.ts`
- `packages/extensions/extension-ad/src/frontend/components/ad-form/Index.vue`
- `packages/extensions/extension-ad/src/frontend/components/ad-placement-form/Index.vue`
- `packages/extensions/extension-ad/src/frontend/components/ad-placement-type-form/Index.vue`

- [ ] **Step 5: 更新 `frontend/vite.config.ts` alias**

将：
```typescript
const baseFrontendSrc = resolve(__dirname, '../packages/base-frontend/src');
// ...
'moyan-mfw-base-frontend': baseFrontendSrc,
```

改为：
```typescript
const baseFrontendSrc = resolve(__dirname, '../packages/base/src/frontend');
// ...
'moyan-base/frontend': baseFrontendSrc,
```

- [ ] **Step 6: 更新 `packages/extensions/extension-ad/vite.config.mts` alias**

将：
```typescript
'moyan-mfw-base-frontend': resolve(import.meta.dirname, '../../base-frontend/src'),
```

改为：
```typescript
'moyan-base/frontend': resolve(import.meta.dirname, '../../base/src/frontend'),
```

- [ ] **Step 7: 更新 `frontend/tsconfig.json` paths**

将：
```json
"paths": {
  "@/*": ["src/*"],
  "moyan-mfw-base-frontend": ["../packages/base-frontend/src/index.ts"],
  "moyan-mfw-base-frontend/*": ["../packages/base-frontend/src/*"]
}
```

改为：
```json
"paths": {
  "@/*": ["src/*"],
  "moyan-base/frontend": ["../packages/base/src/frontend/index.ts"],
  "moyan-base/frontend/*": ["../packages/base/src/frontend/*"]
}
```

- [ ] **Step 8: 更新 root `tsconfig.json` paths**

将：
```json
"paths": {
  "moyan-mfw-core": ["./packages/core/dist"],
  "moyan-mfw-base-backend": ["./packages/base-backend/dist"],
  "moyan-mfw-base-frontend": ["./packages/base-frontend/dist"],
  "moyan-mfw-base-api": ["./packages/base-api/dist"],
  "moyan-shared-dict": ["./packages/shared-dict/dist/esm"]
}
```

改为：
```json
"paths": {
  "moyan-mfw-core": ["./packages/core/dist"],
  "moyan-base/backend": ["./packages/base/dist/backend/src"],
  "moyan-base/frontend": ["./packages/base/src/frontend/index.ts"],
  "moyan-mfw-base-api": ["./packages/base-api/dist"],
  "moyan-shared-dict": ["./packages/shared-dict/dist/esm"]
}
```

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "refactor: update all import paths from moyan-base-backend/moyan-mfw-base-frontend to moyan-base/backend and moyan-base/frontend"
```

---

### Task 8: 删除旧包目录

**Files:**
- Delete: `packages/base-backend/` (整个目录)
- Delete: `packages/base-frontend/` (整个目录)

- [ ] **Step 1: 删除旧包目录**

```powershell
Remove-Item -Recurse -Force packages/base-backend
Remove-Item -Recurse -Force packages/base-frontend
```

- [ ] **Step 2: 运行 `pnpm install` 确认无残留引用**

```bash
pnpm install
```

Expected: 安装成功，无错误。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "chore: remove old packages/base-backend and packages/base-frontend directories"
```

---

### Task 9: ESLint v9 统一迁移

**Files:**
- Create: `packages/base/eslint.config.mjs`
- Create: `backend/eslint.config.mjs`
- Delete: `packages/base-backend/.eslintrc.js` (已在 Task 8 删除)
- Delete: `backend/.eslintrc.js` (如存在)
- Modify: `eslint.config.mjs` (root) — 更新硬编码路径

- [ ] **Step 1: 创建 `packages/base/eslint.config.mjs`**

```typescript
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.tsbuildinfo'],
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/backend/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.backend.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/frontend/**/*.ts', 'src/frontend/**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.frontend.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
```

- [ ] **Step 2: 创建 `backend/eslint.config.mjs`**

```typescript
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.tsbuildinfo'],
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
```

- [ ] **Step 3: 删除 `backend/.eslintrc.js`**（如存在）

```powershell
if (Test-Path backend/.eslintrc.js) { Remove-Item backend/.eslintrc.js }
```

- [ ] **Step 4: 更新 root `eslint.config.mjs` 中的硬编码路径**

将 `packages/base-frontend/src/components/**/*.tsx` 改为 `packages/base/src/frontend/components/**/*.tsx`：

将第 63 行的：
```javascript
files: ['packages/base-frontend/src/components/**/*.tsx', 'packages/base-frontend/src/components/**/index.ts'],
```

改为：
```javascript
files: ['packages/base/src/frontend/components/**/*.tsx', 'packages/base/src/frontend/components/**/index.ts'],
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: migrate ESLint to v9 flat config for base and backend packages"
```

---

### Task 10: 完整验证 + 类型检查

**Files:**
- N/A (验证步骤)

- [ ] **Step 1: 运行 `pnpm install`**

```bash
pnpm install
```

Expected: 安装成功

- [ ] **Step 2: 运行 `pnpm run build`**

```bash
pnpm run build
```

Expected: 所有包构建成功。如果 base-backend 的构建有路径问题，需修复 nest-cli.json 中的 sourceRoot 和 tsconfig.backend.json 中的路径。

- [ ] **Step 3: 运行类型检查**

```bash
pnpm run typecheck
```

Expected: 所有类型检查通过。如果有 import 路径遗漏，修复后重新运行。

- [ ] **Step 4: 检查残留引用**

```bash
grep -rn "moyan-base-backend\|moyan-mfw-base-frontend" --include="*.ts" --include="*.vue" --include="*.mts" --include="*.mjs" --include="*.json" . --exclude-dir=node_modules --exclude-dir=dist --exclude=pnpm-lock.yaml --exclude="*.md"
```

Expected: 无残留引用（spec/plan/docs 中的引用除外）

- [ ] **Step 5: 修复任何发现的问题并提交**

```bash
git add -A
git commit -m "fix: resolve remaining issues from dependency cleanup refactor"
```

---

### Task 11: 最终提交 + 合并准备

**Files:**
- N/A

- [ ] **Step 1: 确认所有验证通过**

```bash
pnpm install && pnpm run typecheck && pnpm run build
```

- [ ] **Step 2: 检查 git diff 确认变更范围合理**

```bash
git log --oneline refactor/dependency-cleanup ^main
```

- [ ] **Step 3: 最终提交（如有未提交的更改）**

```bash
git add -A
git commit -m "chore: complete dependency cleanup and base layer merge"
```
