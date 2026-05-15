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
```

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
    "build": "pnpm run /^build:.*/",
    "build:shared": "pnpm --filter @internal/base-shared build",
    "build:frontend": "pnpm --filter @internal/base-frontend build",
    "build:backend": "pnpm --filter @internal/base-backend build",
    "build:publish": "pnpm run build && pnpm run convert:aliases",
    "convert:aliases": "tsc-alias -p tsconfig.publish.json",
    "dev:backend": "pnpm --filter @internal/base-backend dev",
    "dev:frontend": "pnpm --filter @internal/base-frontend dev",
    "prepublishOnly": "pnpm run build:publish",
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
    "build": "tsc && tsc-alias",
    "dev": "nest start --watch"
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
    "tsc-alias": "catalog:",
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
    "build": "vite build && tsc --emitDeclarationOnly",
    "dev": "vite"
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
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js"
    },
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
    "build": "pnpm run /^build:.*/",
    "build:shared": "pnpm --filter @internal/ad-shared build",
    "build:frontend": "pnpm --filter @internal/ad-frontend build",
    "build:backend": "pnpm --filter @internal/ad-backend build",
    "build:publish": "pnpm run build && pnpm run convert:aliases",
    "convert:aliases": "tsc-alias -p tsconfig.publish.json",
    "dev:backend": "pnpm --filter @internal/ad-backend dev",
    "dev:frontend": "pnpm --filter @internal/ad-frontend dev",
    "prepublishOnly": "pnpm run build:publish"
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
    "build": "tsc && tsc-alias",
    "dev": "nest start --watch"
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
    "tsc-alias": "catalog:",
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
    "build": "vite build && tsc --emitDeclarationOnly",
    "dev": "vite",
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

### 5. `packages/base/tsconfig.publish.json` — npm 发布转换

```jsonc
{
  "extends": "./src/shared/tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "baseUrl": ".",
    "paths": {
      "@internal/base-shared": ["./dist/shared/index.js"],
      "@internal/base-backend": ["./dist/backend/index.js"],
      "@internal/base-frontend": ["./dist/frontend/index.js"]
    }
  },
  "include": ["./dist/**/*.js"]
}
```

### 6. extension-ad 子包的 tsconfig 参照 base

extension-ad 的三个 tsconfig 结构与 base 相同，要点：

- 各自继承 `../../../../tsconfig.base.json`
- backend: CJS / node 解析，`outDir: "../../dist/backend"`
- frontend: ESNext / bundler 解析，`outDir: "../../dist/frontend"`
- shared: CJS / node 解析，`outDir: "../../dist/shared"`

### 7. `packages/extensions/extension-ad/tsconfig.publish.json`

```jsonc
{
  "extends": "./src/shared/tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "baseUrl": ".",
    "paths": {
      "@internal/base-backend": ["moyan-mfw-base/backend"],
      "@internal/base-frontend": ["moyan-mfw-base/frontend"],
      "@internal/base-shared": ["moyan-mfw-base/shared"],
      "@internal/ad-shared": ["../shared/index.js"]
    }
  },
  "include": ["./dist/**/*.js"]
}
```

### 关键设计解释

1. **`tsconfig.publish.json` 的 paths 不指向文件而是指向裸包名/路径**：tsc-alias 读取 paths 后，将 `require('@internal/base-backend')` 直接替换为 `require('moyan-mfw-base/backend')`。这利用了 tsc-alias 的字符串替换机制——它不校验目标是否存在，只做文本替换。

2. **`@internal/ad-shared` → `../shared/index.js`**：扩展包内部自己的 shared 引用在发布后应转为相对路径（因为 shared 在同一 npm 包的 dist 目录下），而非继续使用 `@internal`（消费者环境无此包）。

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

阶段 3：tsc-alias 转换（prepublishOnly）
  tsc-alias -p tsconfig.publish.json
  @internal/base-backend → moyan-mfw-base/backend
  @internal/base-shared  → moyan-mfw-base/shared
  @internal/ad-shared    → ../shared/index.js（包内相对路径）

阶段 4：npm 消费者
  npm i moyan-mfw-extension-ad moyan-mfw-base
  require('moyan-mfw-base/backend') → exports 字段 → dist/backend/index.js ✅
```

## import 语句变更清单

### 需批量替换（约 40 处）

| 来源文件 | 原 import | 改为 |
|----------|----------|------|
| base backend → shared (~7) | `'moyan-mfw-base/shared'` | `'@internal/base-shared'` |
| extension-ad backend → base/backend (~20) | `'moyan-mfw-base/backend'` | `'@internal/base-backend'` |
| extension-ad frontend → base/frontend (~25) | `'moyan-mfw-base/frontend'` | `'@internal/base-frontend'` |
| extension-ad → base/shared (~10) | `'moyan-mfw-base/shared'` | `'@internal/base-shared'` |
| extension-ad 内部 → 自身 shared (~5) | `'../../shared/...'` | `'@internal/ad-shared'` |

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
| `packages/extensions/extension-ad/tsconfig.vue.json` | 前端配置并入子包 tsconfig |

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

## 待确认设计决策

以下两处在方案 B 中采用 `@internal/*` 统一引用，若需调整可在实现阶段修改：

1. **base 的 backend → 自身 shared**（~7 处 entity 的 `toDescription` / `StatusDict` 等）：当前方案改为 `@internal/base-shared`，tsc-alias 发布时转为 `moyan-mfw-base/shared`
2. **extension-ad 的 backend/frontend → 自身 shared**（~5 处 `LINK_TYPE` / `AD_PATHS`）：当前方案改为 `@internal/ad-shared`，tsc-alias 发布时转为 `../shared/index.js`（包内相对路径）

若希望减少源码变更，可以保留包内引用为相对路径——相对路径在 workspace 内部和发布产物中语义一致，无需 tsc-alias 额外处理。代价是引用方式不统一（外部用 `@internal/xxx`，内部用 `../../../shared`）。
