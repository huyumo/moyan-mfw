# 包目录结构重构：三层独立自治 + 根层统一导出

## 背景

当前 `packages/base` 和 `packages/extensions/extension-ad` 的构建配置存在严重的耦合问题：

1. **单一 package.json 强制三层共享依赖**：NestJS / TypeORM（后端）、Vue / Vite / ElementPlus（前端）全部混在一个 `dependencies` 和 `devDependencies` 中，导致 pnpm install 时所有三方库出现在所有编译上下文中
2. **tsconfig 交叉继承导致模块体系冲突**：
   - `tsconfig.shared.json` 继承 `tsconfig.backend.json`，被迫使用 CJS / `node` 模块解析，但实际上 shared 代码层是纯类型/常量，不应绑定后端模块体系
   - backend 要 CJS `moduleResolution: "node"`，frontend 要 ESNext `moduleResolution: "bundler"`，两者在同一层级配置中互相干扰
3. **路径映射混乱**：
   - 后端通过 `tsconfig.backend.json` 将 `moyan-mfw-base/shared` 映射到 `dist/shared`（已编译产物），测试中又映射到 `src/shared`（源码）
   - 前端通过 Vite 构建引用 shared 的 `.d.ts`
   - extension-ad 的 `tsconfig.json` 将 `moyan-mfw-base/backend` 映射到 `../../base/dist/backend`（编译产物），而 `moyan-mfw-base/frontend` 映射到 `../../base/src/frontend/index.ts`（源码）——不一致的判断标准
4. **已知缺陷需要后处理修补**：`scripts/fix-shared-imports.cjs` 的存在证明当前路径映射方案已不可靠——tsc-alias 错误地把 `'moyan-mfw-base/shared'` 转为深层相对路径，需要正则脚本逆向修正

## 目标

1. 前后端、共享层各自维护独立的 `package.json` + `tsconfig.json`，编译上下文彻底隔离
2. 通过 `@internal/*` 命名空间在 workspace 内部引用子包，利用 pnpm 标准模块解析
3. 构建时通过 `tsc-alias` 将 `@internal/*` 转换为 npm 消费者可解析的路径
4. 每个逻辑单元（base / extension-ad / 未来扩展包）对外仍是 **一个 npm 包**
5. 删除 `fix-shared-imports.cjs` 和 `tsconfig.backend.alias.json` 等人为补丁

## 方案：workspace 子包注册 + exports 子路径

### 核心原理

```
开发时（workspace 内）
  import from '@internal/base-backend'
  → pnpm workspace soft-link → node_modules/@internal/base-backend
  → 标准 JS 模块解析，零 tsconfig hack

构建时（npm publish 前）
  tsc 编译 → require('@internal/base-backend')  保留原样
  tsc-alias -p tsconfig.publish.json
  → require('moyan-mfw-base/backend')              转换为消费者路径

消费时（npm install）
  npm i moyan-mfw-extension-ad moyan-mfw-base
  Node.js → exports 字段 → dist/backend/index.js  标准 npm 行为
```

### 命名规范

| 层级 | 内部包名（`"private": true`） | npm 导出路径 |
|------|------------------------------|-------------|
| base backend | `@internal/base-backend` | `moyan-mfw-base/backend` |
| base frontend | `@internal/base-frontend` | `moyan-mfw-base/frontend` |
| base shared | `@internal/base-shared` | `moyan-mfw-base/shared` |
| ad backend | `@internal/ad-backend` | `moyan-mfw-extension-ad/backend` |
| ad frontend | `@internal/ad-frontend` | `moyan-mfw-extension-ad/frontend` |
| ad shared | `@internal/ad-shared` | `moyan-mfw-extension-ad/shared` |

## 目标目录结构

### packages/base

```
packages/base/
├── package.json                       # npm 包 "moyan-mfw-base"；exports + scripts
├── tsconfig.json                      # project references 指向 3 个子包
├── tsconfig.publish.json              # prepublishOnly：@internal → npm 路径转换
├── nest-cli.json                      # NestJS CLI sourceRoot: src/backend
├── vite.config.mts                    # Vite 构建配置
├── .npmignore
├── eslint.config.mjs
├── jest.config.ts
├── src/
│   ├── backend/                       # 后端代码（目录结构不变）
│   │   ├── package.json               # "@internal/base-backend": private
│   │   ├── tsconfig.json              # CJS, rootDir: ".", paths: "@/*":["./*"]
│   │   ├── index.ts
│   │   ├── app.module.ts
│   │   ├── create-base-backend-app.ts
│   │   ├── create-extension-backend-app.ts
│   │   ├── common/
│   │   ├── modules/
│   │   ├── config/
│   │   ├── database/
│   │   ├── types/
│   │   └── utils/
│   ├── frontend/                      # 前端代码（目录结构不变）
│   │   ├── package.json               # "@internal/base-frontend": private
│   │   ├── tsconfig.json              # ESNext/bundler, rootDir: "."
│   │   ├── index.ts
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   └── ...
│   └── shared/                        # 共享代码（目录结构不变）
│       ├── package.json               # "@internal/base-shared": private
│       ├── tsconfig.json              # 独立编译，CJS 输出
│       ├── index.ts
│       ├── core/
│       └── base/
├── dist/                              # 构建产物（npm publish 发布）
│   ├── backend/
│   ├── frontend/
│   └── shared/
├── tests/
└── migrations/
```

### packages/extensions/extension-ad

```
packages/extensions/extension-ad/
├── package.json                       # npm 包 "moyan-mfw-extension-ad"
├── tsconfig.json                      # project references
├── tsconfig.publish.json              # prepublishOnly 转换
├── extension.json
├── nest-cli.json
├── vite.config.mts
├── .npmignore
├── api.build.cjs
├── scripts/
│   └── build-routes.mjs
├── src/
│   ├── backend/
│   │   ├── package.json               # "@internal/ad-backend": private
│   │   ├── tsconfig.json
│   │   ├── index.ts
│   │   ├── ad.module.ts
│   │   ├── ad-core.module.ts
│   │   ├── controller/
│   │   ├── service/
│   │   ├── dto/
│   │   └── entities/
│   ├── frontend/
│   │   ├── package.json               # "@internal/ad-frontend": private
│   │   ├── tsconfig.json
│   │   ├── index.ts
│   │   ├── main.ts
│   │   ├── views/
│   │   ├── components/
│   │   └── apis/
│   └── shared/
│       ├── package.json               # "@internal/ad-shared": private
│       ├── tsconfig.json
│       ├── index.ts
│       ├── constants.ts
│       ├── types.ts
│       ├── dict.ts
│       ├── paths.ts
│       └── permission-values.ts
├── dist/
└── migrations/
```

## pnpm-workspace.yaml 变更

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

catalog:
  # 工具链（workspace 根已有，增加 tsc-alias）
  tsc-alias: ^1.8.17
  typescript: ^5.4.0
  # … 其余 catalog 条目不变 …
```

> **注意**：`tsc-alias` 必须加入 `pnpm-workspace.yaml` 的 `catalog` 块，否则聚合包的 `"tsc-alias": "catalog:"` 将导致 `pnpm install` 失败。
>
> **pnpm 版本兼容性**：`packages/base/src/backend` 等子包路径同时被 `packages/base` 的 glob 模式匹配。pnpm ≥ 8.0.0 会智能去重（不报错），但迁移后需在 `pnpm install` 输出中确认无 warning。当前项目 `engines.pnpm: ">=8.0.0"`，满足要求。

## 各层 package.json 设计

### 1. 根聚合包：`packages/base/package.json`

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

### 2. 后端子包：`packages/base/src/backend/package.json`

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

### 3. 前端子包：`packages/base/src/frontend/package.json`

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

### 4. 共享子包：`packages/base/src/shared/package.json`

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

### 5. extension-ad 根聚合包：`packages/extensions/extension-ad/package.json`

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

### 6. extension-ad 后端子包：`packages/extensions/extension-ad/src/backend/package.json`

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

### 7. extension-ad 前端子包：`packages/extensions/extension-ad/src/frontend/package.json`

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

> **api.build.cjs 兼容性**：`api:build` 和 `build:routes` 脚本的 `../../` 路径指向 extension-ad 根目录，cwd 从 `src/frontend/` 出发路径正确。但需确认 `api.build.cjs` 和 `build-routes.mjs` 内部的路径引用（如读写 `src/` 目录）在新 cwd 下仍然正确。迁移后运行 `pnpm --filter @internal/ad-frontend api:build` 验证。

### 8. extension-ad 共享子包：`packages/extensions/extension-ad/src/shared/package.json`

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

> **`.npmignore` 内容**：两个聚合包（`packages/base/` 和 `packages/extensions/extension-ad/`）需要 `.npmignore` 排除子包配置文件，防止 npm publish 时泄漏 `private: true` 的子包：
> ```
> src/backend/package.json
> src/backend/tsconfig.json
> src/frontend/package.json
> src/frontend/tsconfig.json
> src/shared/package.json
> src/shared/tsconfig.json
> src/
> tsconfig.publish.json
> tsconfig.json
> vite.config.mts
> nest-cli.json
> jest.config.ts
> eslint.config.mjs
> ```
> npm publish 以 `"files": ["dist/", "migrations/"]` 为主，`.npmignore` 作为额外安全保障。

## tsconfig 设计

### 设计原则

- 每个子包只继承 workspace 根 `tsconfig.base.json`，**不继承**其他子包的 tsconfig
- 删除 `tsconfig.shared.json`（不再需要从 backend 继承）
- 删除 `tsconfig.backend.alias.json`（不再需要两步编译）
- 删除 `tsconfig.build.json`（不再需要 NestJS 专用构建配置，统一用子包内的 tsconfig）
- `outDir` 指回根层 `dist/<layer>/`，便于 npm 发布

### 1. `packages/base/tsconfig.json` — Project References 入口

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

### 2. `packages/base/src/backend/tsconfig.json`

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

### 3. `packages/base/src/frontend/tsconfig.json`

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

### 4. `packages/base/src/shared/tsconfig.json`

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

> Shared 层不设置 `baseUrl` 和 `paths`，因为 shared 代码仅含纯类型/常量，不使用 `@/*` 别名引用。已通过 grep 确认 `src/shared/` 中无 `@/` 路径引用。

### 5. `packages/base/tsconfig.publish.json` — npm 发布转换

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

> **设计说明**：publish config **不继承**子包 tsconfig。tsc-alias 仅需要 `baseUrl` + `paths` + `include`，多余的 `composite`、`outDir`、`declarationMap` 等字段无意义且可能在未来工具链变更时产生副作用。

> **tsc-alias 工作方式说明**：tsc-alias 接收 `baseUrl` + `paths`，对 `include` 范围内的每个 `.js` 文件，将 `require('@internal/base-shared')` 替换为**相对于该文件位置**到 `paths` 目标值的相对路径。例如：
> - `dist/backend/index.js` 中的 `@internal/base-shared` → `../shared/index.js`
> - `dist/backend/modules/sys/user/entities/user.entity.js` 中的 → `../../shared/index.js`
>
> 这保证了不同嵌套深度的文件都能得到正确的相对路径。注意 base 包内仅 backend 引用 shared（entity 使用 `toDescription`、`StatusDict` 等），故 publish config 只需映射 `@internal/base-shared`。

### 6. extension-ad 子包的 tsconfig 参照 base

extension-ad 的三个 tsconfig 结构与 base 相同，要点：

- 各自继承 `../../../../../tsconfig.base.json`
- backend: CJS / node 解析，`outDir: "../../dist/backend"`
- frontend: ESNext / bundler 解析，`outDir: "../../dist/frontend"`
- shared: CJS / node 解析，`outDir: "../../dist/shared"`

### 7. `packages/extensions/extension-ad/tsconfig.publish.json`

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

> 与 base 的 publish config 相同设计：不继承子包 tsconfig。跨包引用使用裸 npm 模块名（tsc-alias 保留原样输出 `require('moyan-mfw-base/backend')`），包内引用使用相对路径 tsc-alias 自动计算。

### 关键设计解释

1. **跨包引用 → 裸模块路径**：tsc-alias 将 `require('@internal/base-backend')` 直接替换为 `require('moyan-mfw-base/backend')`。消费者安装 `moyan-mfw-base` 后，Node.js 通过 exports 字段解析到正确文件。

2. **包内引用 → 相对路径（由 tsc-alias 自动计算）**：包内 `@internal/*` 引用在 `tsconfig.publish.json` 的 paths 中使用 `baseUrl` 下的绝对路径如 `./dist/shared/index.js`，tsc-alias 自动计算每个文件到该目标的相对路径。base 和 extension-ad 的 publish config 均使用此模式。

## 导入路径转换流程

```
阶段 1：源码（dev）
  import { AuthGuard } from '@internal/base-backend'
  import { StatusDict } from '@internal/base-shared'
  import { LINK_TYPE } from '@internal/ad-shared'
  → pnpm workspace soft-link → 标准 JS 解析 ✅

阶段 2：tsc 编译
  各子包 tsc 按自己的 tsconfig 编译为 CJS
  产物中保留 require('@internal/base-backend') 原样 ✅

阶段 3：tsc-alias 转换（prepublishOnly → publish:build）
  tsc-alias -p tsconfig.publish.json
  @internal/base-backend → moyan-mfw-base/backend
  @internal/base-shared  → moyan-mfw-base/shared
  @internal/ad-shared    → ../shared/index.js（包内相对路径）

阶段 4：npm 消费者
  npm i moyan-mfw-extension-ad moyan-mfw-base
  require('moyan-mfw-base/backend') → exports 字段 → dist/backend/index.js ✅
```

## import 语句变更清单

### 需批量替换（共约 70 处）

实际 grep 统计结果（含每文件多次 import 的行级计数）：

| 来源文件 | 原 import | 改为 | 实际数量 |
|----------|----------|------|---------|
| base backend → shared | `'moyan-mfw-base/shared'` | **改为相对路径**（自动计算） | 7 文件 |
| base frontend → shared | `'moyan-mfw-base/shared'` | **改为相对路径**（自动计算） | 15 文件 |
| ad backend → base/backend（import） | `'moyan-mfw-base/backend'` | `'@internal/base-backend'` | 13 处 |
| ad backend → base/backend（require） | `require('moyan-mfw-base/backend')` | `require('@internal/base-backend')` | 1 处 |
| ad frontend → base/frontend（import） | `'moyan-mfw-base/frontend'` | `'@internal/base-frontend'` | 21 处 |
| ad frontend → base/frontend（side-effect） | `import 'moyan-mfw-base/frontend/...'` | `import '@internal/base-frontend/...'` | 1 处 |
| ad → base/shared | `'moyan-mfw-base/shared'` | `'@internal/base-shared'` | 8 处 |
| ad 内部 → 自身 shared | `'../../shared/xxx'` 相对路径 | `'@internal/ad-shared'` | 4 处 |

> **合计约 70 处**（7+15+13+1+21+1+8+4 = 70）。增量主要来自：
> - **base frontend 15 处 shared 引用**（初版未计入）
> - **ad frontend 22 处 frontend 引用**（初版估算 ~25，实际 22）
> - **require + side-effect import** 两种非标准模式（初版未区分）
>
> 其中 22 处 base 内部引用由 `migrate-shared-imports.mjs` 自动处理，剩余约 48 处 extension-ad 引用由 `migrate-internal-imports.mjs` 自动处理。

### 迁移脚本

为自动化上述替换，提供两个迁移脚本：

**脚本 1：`packages/base/scripts/migrate-shared-imports.mjs`**

将 base 包内 22 处 `moyan-mfw-base/shared` 替换为自动计算的相对路径。

```bash
node packages/base/scripts/migrate-shared-imports.mjs
```

脚本特性：
- 硬编码 22 个文件的精确清单（15 前端 + 7 后端）
- 对每个文件使用 `path.relative()` 自动计算到 `src/shared/` 的正确相对路径
- 逐文件输出"旧 import → 新 import"对比日志
- 文件不存在或无需修改时自动跳过

**脚本 2：`packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs`**

将 extension-ad 包内所有 `moyan-mfw-base/*` 和内部 `../../shared/xxx` 引用替换为 `@internal/*` 命名空间。

```bash
node packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs
```

脚本特性：
- 通配扫描 `src/` 目录下所有 `.ts` / `.vue` / `.mjs` 文件
- 6 条替换规则：import / require / side-effect 三种模式全覆盖
- 内部共享引用（`../shared/permission-values`、`../../../shared/paths`、`../../../shared/constants`）统一映射到 `@internal/ad-shared`（通过 shared/index.ts 的 re-export 确保可用）
- 正则已验证 9/9 测试用例通过

**建议执行顺序**：

```bash
# 第 1 步：先跑 base（相对路径替换）
node packages/base/scripts/migrate-shared-imports.mjs

# 第 2 步：再跑 extension-ad（@internal 替换）
node packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs

# 第 3 步：类型检查验证
pnpm --filter @internal/base-backend build
pnpm --filter @internal/ad-backend build
pnpm --filter @internal/base-frontend build
pnpm --filter @internal/ad-frontend build
```

### 无需修改

- **包内相对路径**（~500 条）：如 `../../../common/`、`../entities/`、`../dto`，相对路径基于文件系统距离，不依赖 tsconfig
- **`@/*` / `@common/*` 路径别名**（~20 条）：仅 tsconfig paths 从 `"src/backend/*"` 改为 `"./*"`，import 语句本身不变
- **第三方库导入**：`@nestjs/*`、`typeorm`、`vue` 等，不受影响

## 删除的文件

| 文件 | 原因 |
|------|------|
| `packages/base/tsconfig.shared.json` | 子包独立 tsconfig，不再需要单独 shared 配置 |
| `packages/base/tsconfig.backend.alias.json` | 不再需要两步 tsc→tsc-alias 流程 |
| `packages/base/tsconfig.test.json` | 测试配置并入 jest.config.ts |
| `packages/base/scripts/fix-shared-imports.cjs` | tsc-alias + publish config 直接生成正确路径 |
| `packages/extensions/extension-ad/tsconfig.build.json` | NestJS 构建用子包内 tsconfig |
| `packages/extensions/extension-ad/tsconfig.vue.json` | 保留精简版，仅供 IDE（Volar）使用，见下方说明 |

> **tsconfig.vue.json 保留说明**：当前 `tsconfig.vue.json` 含 `allowImportingTsExtensions: true`、`noEmit: true`、`declaration: false` 等 IDE 关键选项。子包前端 tsconfig 设置了 `composite: true`（project references），若直接用于 IDE 可能导致保存时尝试编译。因此保留一个精简的 `tsconfig.vue.json`（或通过子包 tsconfig 补充 `allowImportingTsExtensions: true`）专供 IDE / Volar 使用。

## nest-cli.json 调整

每个包的 `nest-cli.json` 的 `sourceRoot` 和 `tsConfigPath` 需要指向子包内的配置：

```jsonc
// packages/base/nest-cli.json
{
  "sourceRoot": "src/backend",
  "entryFile": "main",
  "compilerOptions": {
    "tsConfigPath": "src/backend/tsconfig.json",
    "deleteOutDir": true
  }
}

// packages/extensions/extension-ad/nest-cli.json
{
  "sourceRoot": "src/backend",
  "entryFile": "main",
  "compilerOptions": {
    "tsConfigPath": "src/backend/tsconfig.json",
    "deleteOutDir": true
  }
}
```

## 构建顺序保证

共享层依赖链：`@internal/base-shared`（零依赖）→ `@internal/base-backend` / `@internal/base-frontend` → 根聚合包。

构建脚本通过 pnpm `--filter` 确保顺序：
```bash
pnpm run build:shared  # 先编译 shared
pnpm run build:backend # dependency 已就绪
pnpm run build:frontend # dependency 已就绪
```

> **关于 cwd 和配置文件位置**：`pnpm --filter @internal/base-backend build` 执行时 cwd 为子包目录（如 `src/backend/`）。Vite 和 Nest CLI 默认在当前目录查找配置文件，因此子包的 `build`/`dev` 脚本均通过 `--config` 参数显式指向包根目录下的配置文件（如 `--config ../../vite.config.mts`）。配置文件（`vite.config.mts`、`nest-cli.json`）本身保留在包根目录，因为：
> - 它们可能被多个子包共享（如 npm 脚本直接调用）
> - 根目录视角的路径配置（`sourceRoot`、`outDir` 等）在根目录下更自然

## 已确认设计决策

### 决策 1：base 的 backend → 自身 shared（~7 处）

**采用相对路径**。这些 entity 文件使用 `import { toDescription, StatusDict } from '../../../../shared'` 保持相对路径。理由：
- 相对路径在 workspace 内部和 npm 发布产物中语义一致
- 无需 tsc-alias 额外转换步骤
- entity 文件与 shared 的物理距离固定，相对路径不会变化

### 决策 2：extension-ad 的 backend/frontend → 自身 shared（~5 处）

**采用 `@internal/ad-shared`** 统一引用。理由：
- 扩展包内部的 shared 引用同样用 `@internal/*` 命名空间，与引用 base 的方式一致
- tsc-alias 发布时通过 `tsconfig.publish.json` 转为包内相对路径（`./dist/shared/index.js` → tsc-alias 自动计算相对路径）

## tsconfig.base.json 规范

子包 tsconfig 继承的 `../../../../tsconfig.base.json` 即 workspace 根的 `tsconfig.base.json`，当前内容如下，**无需修改**：

```jsonc
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

> 根配置仅定义公共约束（target、strict、装饰器等），不包含 `module`/`moduleResolution`/`paths`/`outDir`/`rootDir`——这些由各子包自主决定。

## 配置文件迁移清单

### jest.config.ts 调整

当前 `jest.config.ts` 已更新为引用 `src/backend/tsconfig.json`（早期迁移已执行）。重构后需验证：

- 删除 `tsconfig.test.json`（子包 tsconfig 直接用于测试）
- ts-jest 自动读取子包 `tsconfig.json` 中的 `paths: {"@/*":["./*"]}`——`moduleNameMapper` 中的 `@/*` 映射可简化为仅依赖 tsconfig
- 测试文件（`tests/` 目录）中的 import 无需修改，因为测试本身不包含 `moyan-mfw-base/*` 或 `@internal/*` 引用
- `@internal/base-shared` 通过 pnpm workspace link + ts-jest paths 自动解析

```jsonc
// jest.config.ts 关键变更
{
  "transform": {
    "^.+\\.tsx?$": ["ts-jest", {
      "tsconfig": "src/backend/tsconfig.json",
      "types": ["jest", "node"]
    }]
  }
}
```

> **验证步骤**：迁移后运行 `pnpm --filter moyan-mfw-base test`，确认所有测试通过且无模块解析错误。

### vite.config.mts 调整

Vite 构建前端子包时，`outDir` 需要指向根层的 `dist/frontend/`：

```typescript
// vite.config.mts 关键变更
export default defineConfig({
  build: {
    outDir: '../../dist/frontend',
    // ...
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/frontend', import.meta.url))
    }
  }
})
```

## 迁移策略

### 迁移顺序（推荐）

1. **第一阶段：创建子包配置，不删除旧文件**
   - 在 `src/backend/`、`src/frontend/`、`src/shared/` 下创建新的 `package.json` + `tsconfig.json`
   - 更新 `pnpm-workspace.yaml` 注册子包路径
   - 运行 `pnpm install` 验证 workspace 解析正常

2. **第二阶段：逐包替换 import 语句**
   - base backend：替换 ~7 处 `moyan-mfw-base/shared` → **保留相对路径**
   - base frontend：检查是否需要替换（大概率无变更）
   - extension-ad backend：替换 ~20 处 → `@internal/base-backend`
   - extension-ad frontend：替换 ~25 处 → `@internal/base-frontend` + `@internal/base-shared`
   - extension-ad shared：替换 ~5 处包内引用 → `@internal/ad-shared`

3. **第三阶段：验证构建**
   - 运行 `pnpm run build` 确认所有子包编译通过
   - 运行 `pnpm run publish:build` 确认 tsc-alias 转换正确
   - 检查 `dist/` 产物中的 `require()` 路径

4. **第四阶段：清理旧文件**
   - 删除 5 个旧配置文件（见上文"删除的文件"）
   - 删除 `fix-shared-imports.cjs`
   - 更新根 package.json scripts 指向子包

### 现有消费者影响

#### 根 workspace 包 `frontend/`（5 处引用，4 个文件）

| 文件 | 引用 |
|------|------|
| `src/main.ts` | `import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend'` |
| `src/router.ts` | `import { buildRoutesFromConfigs } from 'moyan-mfw-base/frontend'` |
| `src/permissions.ts` | `import { createBusinessPageConfigFn } from 'moyan-mfw-base/frontend'` |
| `src/components/Layout/components/HeaderCommonActions.vue` | `from 'moyan-mfw-base/frontend/store/layout-store'`、`from 'moyan-mfw-base/frontend/composables'` |

**影响评估：零变更**。`frontend/tsconfig.json` 的 paths 映射指向 `../packages/base/src/frontend/` 源码，`vite.config.ts` 的别名同理——源码文件位置未变。pnpm workspace 协议 `"moyan-mfw-base": "workspace:*"` 继续解析到 `packages/base/`。**无需修改任何文件**。

> 验证步骤：迁移后运行 `pnpm --filter moyan-mfw-frontend dev`，确认 Vite 开发服务器正常启动。

#### 根 workspace 包 `backend/`（11 处引用，8 个文件）

| 文件 | 引用 |
|------|------|
| `src/main.ts` | `import { createBaseBackendApp, SwaggerGroupConfig } from 'moyan-mfw-base/backend'` |
| `src/database/run-seeds.ts` | `runSeeds` + `UserEntity` / `Role` / `Permission` 等 7 个 entity + `seedDicts` |
| `src/database/clear-database.ts` | `UserEntity` / `Role` / `Permission` / `AppType` / `App` / `AppMember` / `AuditLog` |
| `src/database/data-source.ts` | 同上 7 个 entity |
| `src/database/seeds/index.ts` | `export { runSeeds } from 'moyan-mfw-base/backend'` |
| `src/permissions.ts` | `import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend'` |
| `src/app-types.config.ts` | `import { AppTypeConfig } from 'moyan-mfw-base/backend'` |
| `src/modules/supplier/entities/supplier-member-profile.entity.ts` | `import { Base, AppMember } from 'moyan-mfw-base/backend'` |

**影响评估：零变更**。`backend/tsconfig.json` 无自定义 paths，Node.js CJS 模块解析通过 pnpm workspace link 自动找到 `packages/base/node_modules/`。依赖声明 `"moyan-mfw-base": "workspace:*"` 不变。**无需修改任何文件**。

> 验证步骤：迁移后运行 `pnpm --filter moyan-mfw-backend dev`，确认 NestJS 启动无模块解析错误。

#### 其他 workspace 包

| 包 | 引用 `moyan-mfw-base` | 影响 |
|----|----------------------|------|
| `examples/` | 间接（通过 `frontend/` 入口） | 零变更 |
| `docs/` | 无直接引用 | 零变更 |
| `component-demo/` | 无直接引用 | 零变更 |
| `business-dict/` | 作为 workspace 依赖被引用 | 零变更 |

#### CI/CD 变更清单

| 项目 | 当前命令 | 迁移后命令 |
|------|---------|-----------|
| base 后端构建 | `tsc -p tsconfig.backend.json` | `pnpm run build:backend` |
| base 前端构建 | `vite build`（根目录） | `pnpm run build:frontend` |
| extension-ad 构建 | `tsc -p tsconfig.build.json` | `pnpm run build:backend` / `pnpm run build:frontend` |
| npm 发布前 | `tsc -p tsconfig.backend.json` | `pnpm run publish:build` |
| 测试 | `jest --config jest.config.ts` | 不变（jest.config.ts 已更新） |

> CI 流程建议：在 `pnpm install` 后新增 `pnpm run build:shared` 确保共享层先编译，再执行各子包构建和测试。

#### npm 消费者影响

- **导入路径不变**：消费者仍使用 `moyan-mfw-base/backend`、`moyan-mfw-base/frontend`、`moyan-mfw-base/shared`
- **exports 字段保证**：聚合包的 `exports` 子路径映射到 `dist/` 产物，Node.js 原生解析
- **零感知升级**：消费者只需 `npm update moyan-mfw-base`，无需修改任何代码
