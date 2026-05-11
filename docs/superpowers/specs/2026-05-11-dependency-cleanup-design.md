# 依赖重构 & Base 层合并设计

## 背景

当前 moyan-mfw monorepo 存在严重的依赖管理问题：

1. **版本分裂**：同一依赖在多个包中使用不同版本（如 `vue` 从 `^3.4.15` 到 `^3.5.30`，`eslint` 从 `^8.42.0` 到 `^9.38.0`）
2. **重复声明**：`base-backend` 在 `dependencies` 和 `peerDependencies` 中重复声明相同的 NestJS 依赖；`extension-ad` 在 `devDependencies` 和 `peerDependencies` 中重复声明
3. **ESLint 版本断裂**：root 使用 ESLint v9 + flat config，base-backend/backend 使用 ESLint v8 + `.eslintrc.js`
4. **架构不一致**：`extension-ad` 采用多导出入口模式（`./backend`、`./frontend`、`./shared`），而 base 层拆分为两个独立包

## 目标

1. 合并 `base-backend` + `base-frontend` → `moyan-base`，与 `extension-ad` 架构风格统一
2. 使用 pnpm `catalog:` 协议统一全项目依赖版本
3. 清理重复的依赖声明
4. 统一 ESLint 到 v9 + flat config
5. 业务层（`backend/`、`frontend/`）保持分离，仅通过 catalog 统一依赖版本

## 方案

### 1. 合并 Base 层

#### 目标结构

```
packages/base/                    ← 新目录，替代 packages/base-backend + packages/base-frontend
  src/
    backend/                      ← 原 base-backend/src 内容
      common/
      config/
      database/
      modules/
      types/
      utils/
      app.module.ts
      create-base-backend-app.ts
      create-extension-backend-app.ts
      index.ts
      main.ts
    frontend/                     ← 原 base-frontend/src 内容
      apis/
      components/
      index.ts
    shared/                       ← 新增，跨前后端共享代码
      index.ts
  tests/                          ← 原 base-backend/tests
  package.json
  tsconfig.json                   ← 基础共享配置
  tsconfig.backend.json           ← 后端构建配置 (CJS)
  tsconfig.frontend.json          ← 前端构建配置 (ESM)
  vite.config.ts                  ← 前端构建配置
  nest-cli.json                   ← 后端构建配置
  jest.config.ts                  ← 后端测试配置
  eslint.config.mjs               ← ESLint v9 flat config
```

#### package.json 设计

**关键决策：不设置顶层 `"type"` 字段**

原因：若设为 `"module"`，Node.js 会将所有 `.js` 文件视为 ESM，但后端 NestJS CLI 输出的是 CJS 代码（使用 `require`/`exports`），会导致解析失败。不设 `"type"` 时，`.js` 默认 CJS，`.mjs` 默认 ESM，完美兼容双格式输出。这与 `@nestjs/common` 等主流包的做法一致。

```jsonc
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

**peerDependencies 中包含 Vue 生态的说明**：

Vue 相关依赖（`vue`, `vue-router`, `element-plus`, `pinia`）放入 `peerDependencies` 是因为 base-frontend 的运行时需要它们。对于纯后端消费者（如 `backend`），这些 peer 依赖不会被使用，pnpm 会发出警告但不会阻止安装。这是 base 层合并的核心架构权衡，可接受的代价是：
- 后端消费者需要安装 Vue peer 依赖（实际项目中 `backend` 包已经间接依赖了 `moyan-base/frontend` 的路径，因为 `extension-ad` 同时使用了前后端）
- 或者通过 `pnpm.peerDependencyRules.allowedVersions` 抑制无关警告

#### CJS/ESM 混合处理策略

- **不设顶层 `type`**：`.js` 默认 CJS，`.mjs` 默认 ESM
- **后端输出**：通过 `nest-cli.json` 配置输出到 `dist/backend/`，NestJS CLI 默认输出 CJS（`.js` 文件）
- **前端输出**：通过 `vite.config.ts` 配置输出到 `dist/frontend/`，Vite 输出 ESM（`.mjs` 文件）和 CJS 兼容（`.js` 文件）
- **条件导出**：`exports` 中后端 `default` → `.js`（CJS），前端 `import` → `.mjs`（ESM）、`require` → `.js`（CJS 兼容）

#### nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src/backend",
  "compilerOptions": {
    "deleteOutDir": true,
    "outDir": "dist/backend",
    "tsConfigPath": "tsconfig.backend.json"
  }
}
```

#### tsconfig.backend.json

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
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": ["src/backend/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### tsconfig.frontend.json

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
    "jsx": "preserve",
    "jsxImportSource": "vue"
  },
  "include": ["src/frontend/**/*.ts", "src/frontend/**/*.vue", "src/shared/**/*.ts"]
}
```

#### jest.config.ts 路径映射更新

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/backend/$1',
  '^@common/(.*)$': '<rootDir>/src/backend/common/$1',
  '^@config/(.*)$': '<rootDir>/src/backend/config/$1',
  '^@modules/(.*)$': '<rootDir>/src/backend/modules/$1',
  '^@database/(.*)$': '<rootDir>/src/backend/database/$1',
  // ... 其他映射从 src/ 改为 src/backend/
}
```

#### Import 路径迁移映射

| 旧路径 | 新路径 |
|---|---|
| `moyan-base-backend` | `moyan-base/backend` |
| `moyan-mfw-base-frontend` | `moyan-base/frontend` |

### 2. pnpm catalog 统一版本

在 `pnpm-workspace.yaml` 中定义 `catalog`：

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

**注意**：`catalog:` 会将 `@nestjs/common` 的 peer 依赖范围从 `^10.0.0` 收紧到 `^10.4.22`。这是一个隐含的破坏性变更：使用 `@nestjs/common@10.0.x` 的外部消费者将不满足 peer 要求。当前项目内部所有包都使用 `10.4.x+`，因此不影响内部。如果未来发布 npm，需在 CHANGELOG 中注明此版本要求变更。

### 3. 各包依赖清理

#### `backend/package.json`

- `dependencies` 中所有版本号改为 `catalog:`
- 移除 `eslint`、`@typescript-eslint/*`、`eslint-config-prettier`、`eslint-plugin-prettier`（由 root ESLint 配置覆盖）
- `import` 路径从 `moyan-base-backend` → `moyan-base/backend`

#### `frontend/package.json`

- 所有版本号改为 `catalog:`
- `import` 路径从 `moyan-mfw-base-frontend` → `moyan-base/frontend`

#### `extension-ad/package.json`

- `peerDependencies` 版本号改为 `catalog:`
- `devDependencies` 中移除与 `peerDependencies` 重复的包（`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/typeorm`, `class-transformer`, `class-validator`, `reflect-metadata`, `rxjs`, `typeorm`, `vue`, `vue-router`）
- 保留 `devDependencies` 中开发时需要的工具（`@nestjs/cli`, `@element-plus/icons-vue`, `element-plus`, `moyan-api`, `moyan-mfw-base-frontend`, `sass`, `vite`, `vue-tsc`, `tsx`, `@types/node`, `@vitejs/plugin-vue`）
- `import` 路径从 `moyan-base-backend` → `moyan-base/backend`，`moyan-mfw-base-frontend` → `moyan-base/frontend`
- `extension-ad/vite.config.mts` 中的 alias 路径更新：`'moyan-mfw-base-frontend': resolve(import.meta.dirname, '../../base-frontend/src')` → `'moyan-base/frontend': resolve(import.meta.dirname, '../../base/src/frontend')`

#### `business-dict/package.json` / `shared-dict/package.json`

- 版本号改为 `catalog:`

#### `root package.json`

- `devDependencies` 版本号改为 `catalog:`
- 移除 `pnpm.overrides`（已通过 catalog 统一 `reflect-metadata` 版本）
- 移除 `@nestjs/cli`（已移至 base 包的 devDependencies）
- 移除 `typeorm`（只在后端包使用）
- 移除 `@vitejs/plugin-vue-jsx`（已在前端包 devDependencies）
- **保留** `vue-eslint-parser`（ESLint v9 flat config 中 `eslint-plugin-vue` 仍需要它作为自定义 parser）
- 移除 `eslint-plugin-jsdoc`（如无特殊需求）

### 4. ESLint v9 统一迁移

#### 策略

- root `eslint.config.mjs` 作为全局配置
- `base`、`backend` 创建各自的 `eslint.config.mjs`，继承 root 配置
- 删除所有 `.eslintrc.js` 文件
- root `eslint.config.mjs` 中硬编码的路径 `packages/base-frontend/` 需改为 `packages/base/src/frontend/`

#### base/eslint.config.mjs

```typescript
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/backend/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.backend.json',
      },
    },
  },
  {
    files: ['src/frontend/**/*.ts', 'src/frontend/**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.frontend.json',
      },
    },
  },
);
```

#### backend/eslint.config.mjs

```typescript
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
);
```

### 5. pnpm-workspace.yaml 更新

```yaml
packages:
  - packages/base           # 替代 packages/base-backend + packages/base-frontend
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
  # ... (见上方完整定义)
```

删除 `packages/base-backend` 和 `packages/base-frontend` 目录。

### 6. 迁移执行顺序

以下步骤**必须按顺序执行**，不可并行：

1. **创建 feature 分支** `refactor/dependency-cleanup`
2. **建立 catalog**：在 `pnpm-workspace.yaml` 中添加 `catalog` 字段
3. **各包版本号改为 `catalog:`**：此时 base-backend 和 base-frontend 仍独立存在，只改版本号
4. **运行 `pnpm install` 验证**：确保 catalog 生效
5. **合并 base 层**：创建 `packages/base/`，迁移代码和配置
6. **更新所有 import 路径**：`moyan-base-backend` → `moyan-base/backend`，`moyan-mfw-base-frontend` → `moyan-base/frontend`
7. **更新 pnpm-workspace.yaml**：将 `packages/base-backend` 和 `packages/base-frontend` 替换为 `packages/base`
8. **删除旧包目录**：`packages/base-backend/` 和 `packages/base-frontend/`
9. **ESLint v9 迁移**：删除 `.eslintrc.js`，创建 `eslint.config.mjs`
10. **运行完整验证**：`pnpm install` + `pnpm run typecheck` + `pnpm run build`
11. **提交并创建 PR**

### 7. 回滚方案

- 在开始迁移前，在当前主干上打 tag `pre-dependency-cleanup`
- 如果迁移失败，通过 `git reset --hard pre-dependency-cleanup` 回退
- 或直接删除 feature 分支，回到主干

## 验证清单

1. `pnpm install` 成功，无 peer 依赖警告
2. `pnpm run typecheck` 通过
3. `pnpm run build` 通过
4. `pnpm run dev:frontend` 启动正常
5. `pnpm run dev:backend` 启动正常
6. `pnpm -r lint` 在所有包上运行正常
7. 所有 import 路径已更新（`moyan-base-backend` → `moyan-base/backend`，`moyan-mfw-base-frontend` → `moyan-base/frontend`）
8. `moyan-base` 包的 `./backend`、`./frontend`、`./shared` 导出入口均可正常解析
9. `extension-ad/vite.config.mts` 中的 alias 路径已更新
10. root `eslint.config.mjs` 中的硬编码路径已更新

## 风险与缓解

| 风险 | 严重程度 | 缓解措施 |
|---|---|---|
| CJS/ESM 混合导致构建失败 | 🔴 高 | 不设顶层 `"type"`，后端 `.js` 默认 CJS，前端 `.mjs` 默认 ESM |
| import 路径迁移遗漏 | 🟡 中 | 全局搜索 `moyan-base-backend` 和 `moyan-mfw-base-frontend`，确保全部替换 |
| catalog 版本不兼容 | 🟡 中 | 优先选择各包当前使用的最高版本，降低不兼容风险 |
| ESLint 迁移引入新规则 | 🟡 中 | 使用 `eslint-config-prettier` 关闭格式相关规则，保持与 prettier 一致 |
| catalog 收紧 peer 依赖范围 | 🟡 中 | 记录为破坏性变更，npm 发布时在 CHANGELOG 注明 |
| Vue peer 依赖对后端消费者的警告 | 🟢 低 | pnpm 仅警告不阻止；可通过 `peerDependencyRules.allowedVersions` 抑制 |
| Jest 在无 `"type"` 包中的 ESM 兼容性 | 🟢 低 | 当前 base-backend 已在 CJS 模式下运行 Jest，合并后无变化 |
