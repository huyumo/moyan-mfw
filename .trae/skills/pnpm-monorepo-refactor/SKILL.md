---
name: "pnpm-monorepo-refactor"
description: "Refactor pnpm monorepo dependencies: catalog version unification, package merge with sub-path exports, CJS/ESM dual output, package renaming, and dependency cleanup. Invoke when restructuring pnpm workspace packages or unifying dependency versions."
---

# pnpm Monorepo 依赖重构经验胶囊

> 源自 `moyan-mfw` 项目的一次完整依赖重构：合并 base 层、统一 catalog、包重命名、shared-dict 合并、ESLint 迁移。

---

## 一、依赖版本统一：catalog 协议

### 1.1 在 `pnpm-workspace.yaml` 中定义 catalog

```yaml
catalog:
  vue: "^3.5.30"
  "@nestjs/common": "^10.4.22"
  typescript: "^5.7.3"
  # ... 所有共享依赖
```

### 1.2 子包引用

```json
{
  "peerDependencies": {
    "@nestjs/common": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

### 关键规则

- catalog 定义后，子包不再写死版本号
- 版本号优先选**各包中当前最高版本**，降低兼容性风险
- catalog 会**收紧** peerDependencies 版本范围（如 `^10.0.0` → `^10.4.22`），需在 CHANGELOG 中注明

---

## 二、多包合并为单包 + 子路径导出

### 2.1 合并模式

将多个独立包（如 `base-backend` + `base-frontend`）合并为一个包，通过 `exports` 字段提供子路径入口：

```
packages/base/
  src/
    backend/     ← 原独立后端包源码
    frontend/    ← 原独立前端包源码
    shared/      ← 新整合的共享代码
  dist/
    backend/     ← CJS 编译产物
    frontend/    ← ESM/Vite 编译产物
    shared/      ← CJS 编译产物
  package.json
```

### 2.2 package.json exports 配置

```json
{
  "name": "moyan-mfw-base",
  "exports": {
    "./backend": {
      "types": "./dist/backend/index.d.ts",
      "require": "./dist/backend/index.js"
    },
    "./frontend": {
      "types": "./dist/frontend/index.d.ts",
      "import": "./dist/frontend/index.mjs",
      "require": "./dist/frontend/index.js"
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "require": "./dist/shared/index.js"
    }
  }
}
```

### 2.3 ⚠️ 关键：不设顶层 `"type"` 字段

- 若设 `"type": "module"`，Node.js 将 `.js` 文件视为 ESM，但 NestJS 输出 CJS，导致 `require()` 失败
- **不设 `"type"`**：`.js` 默认 CJS，`.mjs` 默认 ESM，完美兼容双格式输出

### 2.4 拆分为多个 tsconfig

| 文件 | 用途 | module | outDir |
|---|---|---|---|
| `tsconfig.json` | 基础共享配置（decorators, target 等） | - | - |
| `tsconfig.backend.json` | 后端 CJS 构建 | `commonjs` | `dist/backend` |
| `tsconfig.frontend.json` | 前端 ESM 类型 | `ESNext` | `dist/frontend` |
| `tsconfig.shared.json` | 共享代码 CJS 构建 | `commonjs` | `dist/shared` |
| `tsconfig.test.json` | 后端测试类型检查 | `commonjs` | - |

### 2.5 构建顺序

```json
{
  "scripts": {
    "build": "pnpm run build:shared && pnpm run build:frontend && pnpm run build:backend",
    "build:shared": "tsc -p tsconfig.shared.json",
    "build:frontend": "vite build",
    "build:backend": "tsc -p tsconfig.backend.json && tsc-alias -p tsconfig.backend.alias.json"
  }
}
```

---

## 三、CJS 路径别名运行时问题 🔴 关键

### 3.1 问题本质

`tsconfig.json` 中的 `paths` 别名（如 `"@/*": ["src/backend/*"]`）在 `module: "commonjs"` 编译后**不会被转换为相对路径**。Node.js 运行时无法解析 `require("@/common")`。

### 3.2 解决方案：tsc-alias

```bash
pnpm add -D tsc-alias
tsc -p tsconfig.backend.json          # 先编译
tsc-alias -p tsconfig.backend.alias.json  # 后转换路径别名
```

### 3.3 ⚠️ 关键反模式：tsc-alias 会错误改写包名引用

若 tsconfig 的 `paths` 中包含 workspace 包名引用（如 `"moyan-mfw-base/shared": ["dist/shared"]`），tsc-alias 会将其转为错误的相对路径（如 `require("../../../..")`）。

**解决方案：为 tsc-alias 创建独立 tsconfig，只包含需转换的 `@/*` 路径，排除包名引用。**

```json
// tsconfig.backend.alias.json — 仅用于 tsc-alias
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/backend/*"],
      "@common/*": ["src/backend/common/*"]
      // 注意：不包含 "moyan-mfw-base/shared" 等包名引用
    }
  },
  "include": ["dist/backend/**/*.js"]
}
```

### 3.4 验证方法

编译后检查 dist 文件：

```bash
# 确认 @/ 全部转为相对路径
grep -r 'require("@/' dist/backend/   # 应为空

# 确认包名引用未被改写
grep -r 'require("moyan-mfw-base/shared")' dist/backend/  # 应存在
grep -r 'require("\.\./\.\./\.\.")' dist/backend/  # 应为空（无纯.路径引用）
```

---

## 四、包重命名操作清单

重命名包时，必须按以下顺序操作：

### 4.1 修改清单

| 步骤 | 文件范围 | 操作 |
|---|---|---|
| `package.json` 的 `"name"` | 每包的 package.json | 改为新名 |
| `dependencies`/`devDependencies`/`peerDependencies` | 所有 package.json | 旧包名 → 新包名 |
| 源码 import 语句 | 所有 `.ts`/`.vue`/`.mts` 文件 | `from 'old-name'` → `from 'new-name'` |
| tsconfig paths 映射 | 所有 `tsconfig*.json` | 更新 paths 和指向路径 |
| vite.config alias | 所有 `vite.config.*` | 更新 alias |
| `pnpm-workspace.yaml` | `packages:` 列表 | 如有目录变动则更新 |
| 根 `tsconfig.json` paths | 根 tsconfig | 更新 paths |

### 4.2 验证

```bash
# 搜索残留旧包名
grep -rn "old-package-name" --include="*.ts" --include="*.vue" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=docs .
# 应为空（docs 和 pnpm-lock.yaml 除外）
```

---

## 五、循环依赖处理

### 5.1 问题模式

```
moyan-mfw-base → moyan-mfw-business-dict → moyan-mfw-base/shared
```

### 5.2 解决方案

- 检查循环中哪一方的依赖是**不必要的**（如 base 声明了 business-dict 但实际未使用）
- 移除不必要的一方依赖
- pnpm 会在 `pnpm install` 时报告循环依赖警告

---

## 六、pnpm 严格依赖隔离问题

### 6.1 现象

tsc 编译时出现 TS2742/TS2345 错误，提示 `@nestjs/common` 有两个不同实例导致类型不兼容。

### 6.2 根因

pnpm 严格模式下，同一包的不同 peer hash 可能导致多个实例。库包声明 `peerDependencies` 时，消费方的依赖版本与库的 devDependencies 版本可能不同。

### 6.3 缓解

- 不影响运行时（运行时通过 `require` 解析正确）
- 编译时通过 `&` 操作符让 tsc-alias 在 tsc 失败后依然执行
- 或用 `skipLibCheck: true` 跳过库类型检查

---

## 七、Vite 构建库包时的 external 配置

### 7.1 问题

Vite/Rollup 构建库包时，若某个 import（如 `from 'moyan-mfw-base/shared'`）指向的是 CJS 模块，Rollup 可能无法正确 tree-shake 命名导出。

### 7.2 解决方案

在 vite.config 中将内部子路径导出也加入 external：

```typescript
rollupOptions: {
  external: [
    'vue', 'vue-router', 'pinia', 'axios',
    'element-plus', '@element-plus/icons-vue',
    'moyan-mfw-base/shared',  // ← 关键：内部子路径也 external
  ],
}
```

### 7.3 消费方 vite.config 的 alias

```typescript
resolve: {
  alias: {
    'moyan-mfw-base/frontend': resolve(__dirname, '../packages/base/src/frontend'),
    'moyan-mfw-base/shared': resolve(__dirname, '../packages/base/src/shared/index.ts'),
  },
}
```

---

## 八、经验法则速查

| 场景 | 法则 |
|---|---|
| 统一依赖版本 | 用 `catalog:` 协议，选最高版本 |
| 合并包 | 不设 `"type"`，拆分 tsconfig，独立构建 |
| CJS paths 别名 | tsc-alias + 独立 alias 专用 tsconfig（排除包名引用） |
| 包重命名 | 全局搜索替换 + tsconfig/vite 路径更新 |
| 循环依赖 | 移除不必要的依赖方 |
| Vite 库包 | 内部子路径也加入 external |
| peer 类型冲突 | `skipLibCheck: true`，不影响运行时 |
| ESLint 迁移 v9 | 创建 flat config，删除 `.eslintrc.js` |
| 验证完整性 | `pnpm install && pnpm run typecheck && pnpm run build` |

---

## 九、完整验证流水线

```bash
# 1. 安装
pnpm install

# 2. 类型检查
pnpm run typecheck

# 3. 构建
pnpm run build

# 4. 搜索残留旧引用
grep -rn "old-name" --include="*.ts" --include="*.vue" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=dist .

# 5. 运行时验证
node -e "require('new-package-name/backend')"  # 应无错误

# 6. 启动服务
pnpm run dev:frontend  # Vite 开发服务器
pnpm --filter xxxx start:prod  # 后端生产模式
```

---

## 十、常见错误与修复

| 错误 | 原因 | 修复 |
|---|---|---|
| `Cannot find module '@/common'` | CJS paths 别名未转换 | 添加 tsc-alias |
| `require("../../../..")` | tsc-alias 错误改写了包名引用 | 为 alias 创建独立 tsconfig |
| `TS5110: module must be Node16` | `moduleResolution: "node16"` 不允许 `module: "commonjs"` | 回退为 `moduleResolution: "node"` |
| `"toItems" is not exported` | Rollup 无法从 CJS 模块提取命名导出 | 加入 external |
| `TS6059: File is not under rootDir` | paths 指向了 rootDir 外的源码 | paths 指向编译产物（dist）而非源码 |
| 循环依赖警告 | 不必要的互相依赖 | 移除不必要的一方 |
