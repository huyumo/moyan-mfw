# MFW 扩展编写规范 & CLI 脚手架 & NPM 发布准备 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付 P0 阶段的三大产物：扩展编写规范文档、moyan-mfw-cli 脚手架（create extension 命令）、NPM 发布配置

**Architecture:** Monorepo 内嵌 CLI 包（packages/cli/），基于 Commander+Inquirer+Handlebars 构建专业级脚手架；文档体系位于 docs/extensions/；发布配置散布于根目录和各包 package.json

**Tech Stack:** TypeScript, Node.js 20+, Commander, Inquirer, Handlebars, Chalk, pnpm workspace, ESM

**Spec:** [2026-05-17-mfw-extension-cli-design.md](../specs/2026-05-17-mfw-extension-cli-design.md)

**Status:** v2 — 审查修复完成（C1/C2/C3/C4/I2/I3/I5/I7/M1/M2/C6 全部修复）

---

## Task 2b: Extension-ad 包元信息补全

**目标：** 为 extension-ad 补充发布元字段（Spec 3.1 要求）

**Files:**
- Modify: `packages/extensions/extension-ad/package.json`

- [ ] **Step 1: 补充发布元字段**

在 extension-ad 的 package.json 中添加（不修改已有字段）：

```jsonc
{
  // ... 已有字段保持不变 ...
  "license": "MIT",
  "keywords": ["moyan", "mfw", "extension", "ad", "广告管理"],
  "files": [
    "src/backend/dist",
    "src/frontend/dist",
    "src/shared/dist",
    "database/migrations",
    "README.md",
    "LICENSE"
  ]
}
```

> 注意：当前 extension-ad 无 `private` 字段（等价于可发布），无需修改。

- [ ] **Step 2: Commit**

```bash
git add packages/extensions/extension-ad/package.json
git commit -m "chore(extension-ad): add publish metadata"
```

---

## Task 1: NPM 发布基础配置

**目标：** 创建 .npmrc、CHANGELOG.md、LICENSE，为后续发布做准备

**Files:**
- Create: `.npmrc`
- Create: `CHANGELOG.md`
- Create: `LICENSE`

- [ ] **Step 1: 创建 .npmrc**

```npmrc
# moyan-mfw 发布配置（个人/开源包，无 scope）
# =========================================

engine-strict=true
always_include_source_maps=true
tag=latest
```

- [ ] **Step 2: 创建 CHANGELOG.md**

遵循 Keep a Changelog 1.1.0 格式：

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup

## [1.0.0] - 2026-05-17

### Added
- Initial release of moyan-mfw-base framework
- Extension system with three-layer architecture (backend/frontend/shared)
- Example extension: extension-ad (广告管理)
- moyan-mfw-cli scaffolding tool
```

- [ ] **Step 3: 创建 LICENSE（MIT）**

标准 MIT License 文本，版权年份 2026。

- [ ] **Step 4: Commit**

```bash
git add .npmrc CHANGELOG.md LICENSE
git commit -m "chore: add npm publish configuration (.npmrc, CHANGELOG, LICENSE)"
```

---

## Task 2: Base 包元信息补全

**目标：** 为 moyan-mfw-base 补充发布所需的 license/repository/keywords/files 字段

**Files:**
- Modify: `packages/base/package.json`

- [ ] **Step 1: 补充发布元字段**

在 `packages/base/package.json` 中添加以下字段（不修改已有字段）：

```jsonc
{
  // ... 已有字段保持不变 ...
  "license": "MIT",
  "keywords": ["moyan", "mfw", "admin", "framework", "nestjs", "vue3"],
  "files": [
    "src/backend/dist",
    "src/frontend/dist",
    "src/shared/dist",
    "README.md",
    "LICENSE"
  ]
}
```

> 注意：不添加 `repository` 和 `homepage`（需要实际 git remote URL）

- [ ] **Step 2: 运行 typecheck 确认零错误**

Run: `pnpm typecheck:base-backend && pnpm typecheck:base-frontend && pnpm typecheck:base-shared`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/package.json
git commit -m "chore(base): add publish metadata (license, keywords, files)"
```

---

## Task 3: 修复 base 包前缀剥离逻辑

**目标：** 同步修复 create-extension-backend-app.ts 中的包名前缀（设计文档问题 #1）

**Files:**
- Modify: `packages/base/src/backend/src/create-extension-backend-app.ts:70`

- [ ] **Step 1: 修改前缀剥离逻辑**

将第 70 行：
```typescript
const shortName = options.manifest.name.replace('moyan-extension-', '')
```
改为：
```typescript
const shortName = options.manifest.name.replace('moyan-mfw-extension-', '')
```

- [ ] **Step 2: 运行 typecheck 确认**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/src/backend/src/create-extension-backend-app.ts
git commit -m "fix(base): update extension name prefix to moyan-mfw-extension-*"
```

---

## Task 4: 根 package.json scripts 补全

**目标：** 新增 CLI 开发/构建/publish 相关 scripts

**Files:**
- Modify: `package.json`（根目录）

- [ ] **Step 1: 添加 CLI 与发布 scripts**

在根 `package.json` 的 `scripts` 中追加：

```jsonc
{
  "scripts": {
    // ... 已有 scripts 保持不变 ...

    "dev:cli": "pnpm --filter moyan-mfw-cli dev",
    "build:cli": "pnpm --filter moyan-mfw-cli build",
    "publish:base": "cd packages/base && npm publish --access public",
    "publish:cli": "cd packages/cli && npm publish --access public",
    "publish:all": "pnpm run publish:base && pnpm run publish:cli"
  }
}
```

> 注意：version:bump/changelog/release 等 CLI 依赖的命令暂不加（P2 阶段再加）

- [ ] **Step 2: 将 cli 包加入 pnpm-workspace.yaml 的 packages 列表确认**

检查 `pnpm-workspace.yaml` 中是否包含 `packages/cli/*` 或通配 `packages/*` 能覆盖到。当前已有 `packages/*` glob，无需修改。

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add CLI dev/build/publish scripts"
```

---

## Task 5: CLI 包骨架初始化

**目标：** 创建 packages/cli/ 目录结构和基础配置文件

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/bin/mfw.js`
- Create: `packages/cli/src/index.ts`

- [ ] **Step 1: 创建 CLI package.json**

```json
{
  "name": "moyan-mfw-cli",
  "version": "0.1.0",
  "description": "MFW framework CLI — extension scaffolding, validation, and publishing tools",
  "type": "module",
  "bin": {
    "mfw": "./bin/mfw.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "bin/",
    "dist/",
    "README.md",
    "LICENSE"
  ],
  "private": false,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "handlebars": "^4.7.8",
    "semver": "^7.6.0",
    "glob": "^10.3.0",
    "execa": "^9.3.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.7.3",
    "@types/inquirer": "^9.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
```

> **C1 修复说明**：CLI 特有依赖（commander/inquirer/chalk/handlebars 等）不在项目 catalog 中，使用显式版本号。catalog 中已有的依赖（tsx/tsup/typescript）继续使用 `catalog:`。
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 创建 bin/mfw.js（ESM 入口）**

```javascript
#!/usr/bin/env node
import('./dist/index.js')
```

- [ ] **Step 4: 创建 src/index.ts（Commander program 骨架）**

```typescript
#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'

const program = new Command()

program
  .name('mfw')
  .description('Moyan MFW Framework CLI')
  .version('0.1.0')

program.command('create').description('Create a new extension or resource').action(() => {
  console.log(chalk.yellow('create command coming soon'))
})

program.command('generate').description('Generate code within an extension').action(() => {
  console.log(chalk.yellow('generate command coming soon'))
})

program.command('validate').description('Validate an extension package').action(() => {
  console.log(chalk.yellow('validate command coming soon'))
})

program.command('version').description('Version management utilities').action(() => {
  console.log(chalk.yellow('version command coming soon'))
})

program.parse()
```

- [ ] **Step 9: 安装依赖并测试 create 命令**

Run:
```bash
cd packages/cli && pnpm install
pnpm run dev
```

新终端测试（Windows PowerShell）：
```bash
# 方式一：直接运行 bin 入口
node packages/cli/bin/mfw.js --help

# 方式二：使用 pnpm exec
cd packages/cli
pnpm exec mfw --help

# 测试创建扩展包
pnpm exec mfw create extension test-ext --force
```
预期 1：`--help` 输出包含 `mfw create extension <name>` 子命令
预期 2：在 `packages/extensions/extension-test-ext/` 下生成完整的扩展包骨架（约 30 个文件）

- [ ] **Step 10: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): initialize moyan-mfw-cli package with commander skeleton"
```

---

## Task 6: CLI create extension 命令实现

**目标：** 实现 `mfw create extension <name>` 交互式命令，生成完整扩展包骨架

**Files:**
- Create: `packages/cli/src/commands/create.ts`
- Create: `packages/cli/src/utils/template.ts`
- Create: `packages/cli/src/utils/fs.ts`
- Create: `packages/cli/src/templates/extension/package.json.hbs`
- Create: `packages/cli/src/templates/extension/tsconfig.json.hbs`
- Create: `packages/cli/src/templates/extension/extension.json.hbs`
- Create: `packages/cli/src/templates/extension/README.md.hbs`
- Create: `packages/cli/src/templates/extension/shared/package.json.hbs`
- Create: `packages/cli/src/templates/extension/shared/tsconfig.json.hbs`
- Create: `packages/cli/src/templates/extension/shared/src/index.ts.hbs`
- Create: `packages/cli/src/templates/extension/shared/src/constants.ts.hbs`
- Create: `packages/cli/src/templates/extension/shared/src/dict.ts.hbs`
- Create: `packages/cli/src/templates/extension/shared/src/types.ts.hbs`
- Create: `packages/cli/src/templates/extension/shared/src/paths.ts.hbs`
- Create: `packages/cli/src/templates/extension/shared/src/permission-values.ts.hbs`
- Create: `packages/cli/src/templates/extension/backend/package.json.hbs`
- Create: `packages/cli/src/templates/extension/backend/tsconfig.json.hbs`
- Create: `packages/cli/src/templates/extension/backend/nest-cli.json.hbs`
- Create: `packages/cli/src/templates/extension/backend/.env.hbs`
- Create: `packages/cli/src/templates/extension/backend/src/main.ts.hbs`
- Create: `packages/cli/src/templates/extension/backend/src/index.ts.hbs`
- Create: `packages/cli/src/templates/extension/backend/src/app.module.ts.hbs`
- Create: `packages/cli/src/templates/extension/frontend/package.json.hbs`
- Create: `packages/cli/src/templates/extension/frontend/tsconfig.json.hbs`
- Create: `packages/cli/src/templates/extension/frontend/vite.config.mts.hbs`
- Create: `packages/cli/src/templates/extension/frontend/index.html.hbs`
- Create: `packages/cli/src/templates/extension/frontend/api.build.cjs.hbs`
- Create: `packages/cli/src/templates/extension/frontend/src/main.ts.hbs`
- Create: `packages/cli/src/templates/extension/frontend/src/index.ts.hbs`
- Create: `packages/cli/src/templates/extension/frontend/src/env.d.ts.hbs`
- Modify: `packages/cli/src/index.ts`（注册 create 子命令）

- [ ] **Step 1: 创建工具函数 fs.ts**

文件：`packages/cli/src/utils/fs.ts`

```typescript
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 2: 创建模板渲染引擎 template.ts**

文件：`packages/cli/src/utils/template.ts`

```typescript
import Handlebars from 'handlebars'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

interface TemplateVars {
  [key: string]: unknown
}

Handlebars.registerHelper('pascalCase', (str: string) =>
  str.replace(/(^\w|-\w)/g, (c) => c.slice(-1).toUpperCase()),
)

Handlebars.registerHelper('camelCase', (str: string) =>
  str.replace(/-(\w)/g, (_, c) => c.toUpperCase()),
)

export async function renderTemplate(
  templatePath: string,
  vars: TemplateVars,
): Promise<string> {
  const source = await fs.readFile(templatePath, 'utf-8')
  const compiled = Handlebars.compile(source)
  return compiled(vars)
}

export async function renderTemplateToDir(
  templateDir: string,
  outputDir: string,
  vars: TemplateVars,
): Promise<void> {
  const files = await getAllFiles(templateDir)
  for (const file of files) {
    const relative = path.relative(templateDir, file)
    if (!relative.endsWith('.hbs')) continue

    const outputName = relative.replace(/\.hbs$/, '')
    const outputPath = path.join(outputDir, outputName)
    const content = await renderTemplate(file, vars)
    await writeFile(outputPath, content)
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await getAllFiles(fullPath)))
    } else {
      results.push(fullPath)
    }
  }
  return results
}
```

注意：renderTemplateToDir 使用了 Step 1 创建的 writeFile。

- [ ] **Step 3: 创建核心模板文件（顶层 + shared 层）**

基于 extension-ad 实际结构创建以下模板（关键模板内容示例，其余见完整代码）：

**package.json.hbs**（扩展包顶层）：
```json
{
  "name": "moyan-mfw-extension-{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "private": true,
  "type": "module",
  "exports": {
    "./backend": { "require": "./src/backend/dist/index.js", "types": "./src/backend/dist/index.d.ts" },
    "./backend/*": { "require": "./src/backend/dist/*", "types": "./src/backend/dist/*.d.ts" },
    "./frontend": { "import": "./src/frontend/dist/index.mjs", "require": "./src/frontend/dist/index.js", "types": "./src/frontend/dist/index.d.ts" },
    "./frontend/*": { "import": "./src/frontend/dist/*", "require": "./src/frontend/dist/*", "types": "./src/frontend/dist/*.d.ts" },
    "./shared": { "import": "./src/shared/dist/index.js", "require": "./src/shared/dist/index.js", "types": "./src/shared/dist/index.d.ts" },
    "./shared/*": { "import": "./src/shared/dist/*", "require": "./src/shared/dist/*", "types": "./src/shared/dist/*.d.ts" }
  },
  "typesVersions": {
    "*": {
      "*": ["./src/*/dist/*.d.ts", "./src/*/dist/index.d.ts"]
    }
  },
  "scripts": {
    "build:shared": "pnpm --filter @internal/{{name}}-shared build",
    "build:backend": "pnpm --filter moyan-mfw-base run build:shared && pnpm --filter moyan-mfw-base run build:backend && pnpm --filter @internal/{{name}}-backend build",
    "build:frontend": "pnpm --filter @internal/{{name}}-frontend build",
    "build": "pnpm run build:shared && pnpm run build:backend && pnpm run build:frontend",
    "dev:backend": "pnpm --filter @internal/{{name}}-backend dev",
    "dev:frontend": "pnpm --filter @internal/{{name}}-frontend dev",
    "typecheck:shared": "pnpm --filter @internal/{{name}}-shared typecheck",
    "typecheck:backend": "pnpm --filter @internal/{{name}}-backend typecheck",
    "typecheck:frontend": "pnpm --filter @internal/{{name}}-frontend typecheck",
    "typecheck": "pnpm run typecheck:shared && pnpm run typecheck:backend && pnpm run typecheck:frontend"
  },
  "devDependencies": {
    "@internal/{{name}}-backend": "workspace:*",
    "@internal/{{name}}-frontend": "workspace:*",
    "@internal/{{name}}-shared": "workspace:*",
    "moyan-mfw-base": "workspace:*",
    "typescript": "catalog:"
  }
}
```

**extension.json.hbs**：
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

**shared/src/constants.ts.hbs**：
```typescript
/**
 * @fileoverview {{displayName}}常量定义
 */

export const {{pascalCase name}}_CONSTANTS = {
  // TODO: 添加业务常量
} as const
```

**shared/src/dict.ts.hbs**：
```typescript
/**
 * @fileoverview {{DisplayName}}字典定义
 */
import { DictMeta } from 'moyan-mfw-base/shared'

export const {{pascalCase name}}_DICTS: DictMeta[] = [
  // TODO: 添加字典定义
]
```

**shared/src/types.ts.hbs**、**paths.ts.hbs**、**permission-values.ts.hbs**、**index.ts.hbs** 类似模式。

- [ ] **Step 4: 创建 backend 层模板**

关键模板：

**backend/src/main.ts.hbs**（基于 extension-ad 实际代码，使用内联 manifest）：
```typescript
/**
 * @fileoverview {{DisplayName}}扩展包后端独立启动入口
 */
import { NestFactory } from '@nestjs/core'
import { {{pascalCase name}}Module } from './{{name}}.module'
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'

const manifest = {
  name: '{{name}}',
  version: '{{version}}',
  displayName: '{{displayName}}',
  description: '{{description}}',
  routePrefix: '{{routePrefix}}',
  permCodeNodes: [],
}

async function bootstrap() {
  const app = await createExtensionBackendApp({
    manifest,
    name: '{{name}}',
    module: {{pascalCase name}}Module,
  })
  await app.listen(process.env.PORT ?? 3001)
}

bootstrap().catch((err) => {
  console.error('[{{pascalCase name}}] 启动失败:', err)
  process.exit(1)
})
```

**backend/src/{name}.module.ts.hbs**：
```typescript
import { Module } from '@nestjs/common'

@Module({})
export class {{pascalCase name}}Module {}
```

**backend/.env.hbs**：
```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=moyan_{{name}}
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=change-me-{{name}}-jwt-secret
JWT_EXPIRES_IN=7d
PORT=3001
```

**backend/nest-cli.json.hbs**：
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: 创建 frontend 层模板**

关键模板：

**frontend/vite.config.mts.hbs**（基于 extension-ad 实际结构，变量化 name 替换 ad）：
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moyan-mfw-base/frontend/styles': resolve(__dirname, '../../../../base/src/frontend/src/styles'),
      'moyan-mfw-base/frontend': resolve(__dirname, '../../../../base/src/frontend/src/index.ts'),
      'moyan-mfw-base/shared': resolve(__dirname, '../../../../base/src/shared/src/index.ts'),
      'moyan-mfw-extension-{{name}}/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    outDir: '../../dist/frontend',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'element-plus', '@element-plus/icons-vue', 'moyan-mfw-base/frontend', 'moyan-mfw-base/shared'],
      output: {
        exports: 'named',
      },
    },
  },
});
```

**frontend/src/main.ts.hbs**（基于 extension-ad 实际代码）：
```typescript
/**
 * @fileoverview {{DisplayName}}扩展包前端自启动入口
 */
import 'moyan-mfw-base/frontend/styles/base-admin.scss'
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'
import { {{pascalCase name}}Routes } from './index'

const app = createExtensionFrontendApp({
  name: '{{displayName}}',
  routes: {{pascalCase name}}Routes,
})

app.mount('#app')
```

**frontend/src/index.ts.hbs**（基于 extension-ad 实际代码，使用 buildExtensionRoutes）：
```typescript
/**
 * @fileoverview {{DisplayName}}扩展包前端入口
 * @description 扫描自身 views 目录构建路由数组
 */
import { buildExtensionRoutes } from 'moyan-mfw-base/frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

export const {{pascalCase name}}Routes = buildExtensionRoutes(allConfigs, '{{name}}', {
  namespaceName: '{{displayName}}',
})
```

**frontend/api.build.cjs.hbs**：
```javascript
// @ts-check
const { defineConfig } = require('moyan-api/config')

module.exports = defineConfig({
  backendUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  outputDir: './src/apis',
  namespace: '{{name}}',
})
```

**frontend/index.html.hbs**：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{displayName}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: 创建 database 目录占位**

在输出时创建 `database/migrations/.gitkeep` 空文件（确保目录被 git 跟踪）。

- [ ] **Step 7: 实现 create.ts 命令逻辑**

文件：`packages/cli/src/commands/create.ts`

核心流程：
1. 解析 `<name>` 参数（kebab-case 校验）
2. 使用 Inquirer 交互收集 displayName、description、routePrefix、hasBackend、hasFrontend、hasShared
3. 校验 routePrefix 以 `/ext/` 开头
4. 计算输出路径（默认 `packages/extensions/extension-{name}`）
5. 检查目录是否存在（--force 覆盖）
6. 调用 `renderTemplateToDir()` 渲染所有模板
7. 输出 Post-create Steps 提示
8. 彩色输出成功信息

```typescript
import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fs from 'node:fs'
import { exists, ensureDir, writeFile } from '../utils/fs.js'
import { renderTemplateToDir } from '../utils/template.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface CreateOptions {
  template?: string
  dir?: string
  force?: boolean
}

interface Answers {
  displayName: string
  description: string
  routePrefix: string
  hasBackend: boolean
  hasFrontend: boolean
  hasShared: boolean
}

export const createCommand = new Command('extension')
  .description('Create a new MFW extension package')
  .argument('<name>', 'Extension name in kebab-case (e.g., "ad", "blog")')
  .option('-t, --template <name>', 'Template to use', 'default')
  .option('-d, --dir <path>', 'Output directory', 'packages/extensions')
  .option('-f, --force', 'Force overwrite existing directory', false)
  .action(async (name: string, opts: CreateOptions) => {
    // 1. 校验 name 格式
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      console.error(chalk.red(`Invalid name "${name}". Must be kebab-case.`))
      process.exit(1)
    }

    const className = name.replace(/(^\w|-\w)/g, (c) => c.slice(-1).toUpperCase())
    const targetDir = path.resolve(opts.dir!, `extension-${name}`)

    if (await exists(targetDir)) {
      if (!opts.force) {
        console.error(chalk.red(`Directory already exists: ${targetDir}\nUse --force to overwrite.`))
        process.exit(1)
      }
    }

    // 2. 交互收集变量
    const answers = await inquirer.prompt<Answers>([
      { name: 'displayName', message: '显示名称:', default: className },
      { name: 'description', message: '描述:', default: '' },
      { name: 'routePrefix', message: '路由前缀:', default: `/ext/${name}` },
      { name: 'hasBackend', message: '需要后端模块?', type: 'confirm', default: true },
      { name: 'hasFrontend', message: '需要前端页面?', type: 'confirm', default: true },
      { name: 'hasShared', message: '需要共享层?', type: 'confirm', default: true },
    ])

    // 3. 校验 routePrefix
    if (!answers.routePrefix.startsWith('/ext/')) {
      console.error(chalk.red(`routePrefix must start with "/ext/", got: "${answers.routePrefix}"`))
      process.exit(1)
    }

    // 4. 准备模板变量
    const vars = {
      name,
      displayName: answers.displayName,
      description: answers.description,
      routePrefix: answers.routePrefix,
      permPrefix: name,
      className,
      packageName: `moyan-mfw-extension-${name}`,
      hasBackend: answers.hasBackend,
      hasFrontend: answers.hasFrontend,
      hasShared: answers.hasShared,
      version: '0.1.0',
      year: new Date().getFullYear(),
    }

    // 5. 渲染模板（使用 Handlebars {{#if}} 条件块控制层生成）
    const templateDir = path.resolve(__dirname, '../templates/extension')
    console.log(chalk.blue(`\n🔨 Generating extension "${name}" at ${targetDir}...`))

    await renderTemplateToDir(templateDir, targetDir, vars)

    // 6. 删除未选择的层目录
    if (!vars.hasBackend) {
      await fs.rm(path.join(targetDir, 'src/backend'), { recursive: true, force: true })
    }
    if (!vars.hasFrontend) {
      await fs.rm(path.join(targetDir, 'src/frontend'), { recursive: true, force: true })
    }
    if (!vars.hasShared) {
      await fs.rm(path.join(targetDir, 'src/shared'), { recursive: true, force: true })
    }

    // 7. 创建 database/migrations 占位
    await ensureDir(path.join(targetDir, 'database/migrations'))
    await writeFile(path.join(targetDir, 'database/migrations', '.gitkeep'), '')

    // 8. 输出结果
    console.log(chalk.green('\n✅ Done!'))
    console.log(`\n${chalk.bold('📋 后续集成步骤:')}`)
    console.log(`   1. cd ${path.relative(process.cwd(), targetDir)} && pnpm install`)
    console.log('   2. 根 package.json → scripts.build 中添加构建命令')
    console.log('   3. 根 package.json → scripts.typecheck 中添加子包引用')
    console.log('   4. （如需后端）注册扩展 Module 到应用入口')
    console.log(chalk.gray('\n💡 P2 阶段将提供 mfw integrate <name> 自动完成步骤 2-4'))
  })
```

- [ ] **Step 8: 注册 create 命令到主程序**

修改 `packages/cli/src/index.ts`，导入并使用 createCommand：

```typescript
import { Command } from 'commander'
import chalk from 'chalk'
import { createCommand } from './commands/create.js'

const program = new Command()

program
  .name('mfw')
  .description('Moyan MFW Framework CLI')
  .version('0.1.0')

const createCmd = new Command('create').description('Create a new extension or resource')
createCmd.addCommand(createCommand)

program.addCommand(createCmd)
// ... 其他命令保持 placeholder

program.parse()
```

- [ ] **Step 9: 安装依赖并测试 create 命令**

Run:
```bash
cd packages/cli && pnpm install
pnpm run dev
```

新终端测试：
```bash
npx mfw create extension test-ext --force
```
预期：在 `packages/extensions/extension-test-ext/` 下生成完整的扩展包骨架（约 30 个文件）。

- [ ] **Step 10: 运行 typecheck**

Run: `cd packages/cli && pnpm run typecheck`
Expected: PASS（零错误）

- [ ] **Step 11: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): implement create extension command with full scaffolding"
```

---

## Task 7: 扩展编写规范文档

**目标：** 创建 docs/extensions/ 完整文档体系

**Files:**
- Create: `docs/extensions/README.md`
- Create: `docs/extensions/writing-guide.md`
- Create: `docs/extensions/manifest-spec.md`
- Create: `docs/extensions/architecture.md`
- Create: `docs/extensions/reference/anti-patterns.md`

- [ ] **Step 1: 创建 README.md（导航入口）**

简要总览 + 快速开始 + 文档索引链接。

- [ ] **Step 2: 创建 writing-guide.md（核心文档，10 章）**

基于 extension-ad 实例分析，覆盖：
1. 概述与架构图（三段式 + base 包关系）
2. 快速开始（`mfw create extension my-ext` → 3 步跑通）
3. 目录结构规范（每个文件职责表）
4. Manifest 规范（extension.json 字段表）
5. Shared 层编写（5 个模块的职责与示例代码）
6. Backend 层编写（NestJS 分层规则 + base API 用法）
7. Frontend 层编写（views/components/apis 分工 + Mfw 命名）
8. 路由与权限（definePageConfig / v-permission / @RequirePermission）
9. 构建工作流（build 顺序 / dev 模式 / moyan-api）
10. Checklist（发布前 15 项检查）

每章必须包含**实际代码片段**（从 extension-ad 中提取），不能只有文字描述。

- [ ] **Step 3: 创建 manifest-spec.md**

extension.json 完整 JSON Schema 定义 + 每个字段说明 + 与 `ExtensionManifest` TypeScript 接口的映射关系。

- [ ] **Step 4: 创建 architecture.md**

扩展运行时架构图（文本形式）：
- 加载流程：extension.json → createExtensionBackendApp → validateManifest → NestJS bootstrap
- 前端路由注册：buildExtensionRoutes → import.meta.glob → Vue Router
- 共享层数据流：constants/dict/types → backend import + frontend import

- [ ] **Step 5: 创建 anti-patterns.md**

基于项目 `.trae/rules/redline.md` 和 `.trae/rules/guide.md` 提取扩展开发反模式清单：
- ❌ 手动写 apis 目录代码
- ❌ 组件放 views/ 内
- ❌ 内联 STATUS 常量
- ❌ 使用 @Request() 装饰器
- ❌ 删除接口缺 ElMessageBox.confirm
- 等等

- [ ] **Step 6: Commit**

```bash
git add docs/extensions/
git commit -m "docs: add extension writing guide and specification documents"
```

---

## Task 8: 全量 typecheck 验证

**目标：** 确保所有改动通过项目级类型检查

- [ ] **Step 1: 运行完整 typecheck**

Run: `pnpm typecheck`
Expected: PASS（零错误，红线规则要求）

- [ ] **Step 2: 如有错误，逐个修复后重新运行**

直到 `pnpm typecheck` 输出全部通过。

---

## 任务依赖关系图

```
Task 1 (.npmrc/CHANGELOG/LICENSE)     ← 无依赖，可最先执行
Task 2 (base 元信息)                  ← 无依赖
Task 3 (前缀修复)                     ← 无依赖
Task 4 (根 scripts)                   ← 无依赖（但 Task 5 完成后需确认 dev:cli 可用）
Task 5 (CLI 骨架)                     ← 无依赖
Task 6 (create extension 命令)        ← 依赖 Task 5
Task 7 (规范文档)                      ← 无依赖
Task 8 (全量 typecheck)               ← 依赖 Task 2,3,6,7 全部完成
```

建议执行顺序：**Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8**
