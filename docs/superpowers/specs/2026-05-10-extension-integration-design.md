# MFW 扩展包集成设计规约

> 生成时间：2026-05-10 | 基于 `extension-ad` 深度分析 + 头脑风暴决策

> **⚠️ 前置依赖**：下列框架 API 需在 `base-backend` / `base-frontend` 中先行实现后，本文档的扩展包改造才能完整生效：
> - `createExtensionBackendApp()` — 扩展包自启动入口
> - `createExtensionFrontendApp()` — 扩展包前端自启动入口
> - `createBaseBackendApp({ extensions })` — 业务层声明式加载扩展包
> - `createBaseAdminApp({ extensions })` — 业务层声明式加载扩展包前端
> - `buildRoutesFromConfigs` 支持 path 前缀过滤

---

## 1. 总体架构

### 1.1 核心定位

扩展包 = **特殊业务层**。有自己的启动入口，不依赖业务层即可独立开发和运行。底层引擎由 core（`base-backend` / `base-frontend`）统一提供。

```
┌──────────────────────────────────────────────────────────┐
│  base-backend / base-frontend （框架基础设施，不可修改）      │
│                                                          │
│  createBaseBackendApp()  ──→  业务层 backend/ 使用         │
│  createExtensionBackendApp()  ──→  扩展包使用              │
│  createBaseAdminApp()  ──→  业务层 frontend/ 使用          │
│  createExtensionFrontendApp()  ──→  扩展包使用             │
└──────────────────────────────────────────────────────────┘
         ▲                        ▲
         │                        │
    ┌────┴────┐            ┌──────┴──────┐
    │ backend/ │            │ extension-* │
    │ frontend/│            │ (自启动)     │
    │ (业务层) │            │             │
    └─────────┘            └─────────────┘
```

### 1.2 决策汇总

| # | 决策点 | 结论 |
|---|--------|------|
| 1 | 路由预构建 | 构建时生成 `routes.gen.ts`，开发期用 `import.meta.glob` |
| 2 | API 代码发布 | 随包发布，`api:build` 在 `prepublishOnly` 前执行 |
| 3 | 数据库迁移 | 扩展包自带 migration，框架编排执行 |
| 4 | Controller 路径 | 框架自动加 `ext/{ns}/` 前缀 |
| 5 | Service-Only 模式 | 导出 `CoreModule` + 完整 `Module`，业务层按需选择 |
| 6 | 版本号策略 | `workspace:^` → `pnpm publish` 自动转换 |
| 7 | 卸载清理 | 启动时警告 + CLI 手动清理 |
| 8 | permCode 冲突 | 启动时检测 → 拒绝启动 |
| 9 | synchronize 并发 | 生产禁用 synchronize，仅用 migration |
| 10 | dev 跨域 | `createExtensionBackendApp` 自动开启 CORS |
| 11 | 第三方安全 | 信任模型（与 npm 一致） |
| 12 | AuthGuard | 框架自动纳入全局守卫 |

---

## 2. 命名空间黄金法则

> **一条规则，覆盖 8 个维度。** 扩展包系统本质就是命名空间管理。

| 维度 | 规则 | 示例（`extension-ad`） |
|------|------|----------------------|
| 前端路由 | `ext/{ns}/resource` | `ext/ad/placement` |
| Controller 路径 | 框架自动加 `ext/{ns}/` | `/api/ext/ad/ad-placements` |
| permCode | `{ns}:resource:action` | `ad:placement:view` |
| Pinia store | `useExt{Ns}Store` | `useExtAdStore` |
| CSS class | `.ext-{ns}-component` | `.ext-ad-banner` |
| 数据库表 | `ext_{ns}_table` | `ext_ad_placements` |
| 事件名 | `{ns}.resource.action` | `ad.placement.created` |
| API 路径 | `/api/ext/{ns}/resource` | `/api/ext/ad/ad-placements` |

命名空间值 `{ns}` 取自 `extension.json` 的 `routePrefix`（默认 `/ext/ad` → ns=`ad`）。

业务层可通过 `extensionRouteMap` 覆盖默认值（见 3.3）。

---

## 3. 扩展包清单：extension.json

### 3.1 完整 Schema

```jsonc
{
  "name": "moyan-extension-ad",             // 必填：npm 包名
  "version": "0.1.0",                      // 必填：语义化版本
  "displayName": "广告管理",                 // 必填：展示名称
  "description": "提供广告位管理...",        // 必填：功能描述
  "routePrefix": "/ext/ad",                // 必填：路由/API 命名空间
  "permCodeNodes": [                       // 必填：权限节点声明
    { "permCode": "ad:placement:view",   "permName": "查看广告位",  "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:placement:create", "permName": "创建广告位",  "nodeType": "TAG", "group": "广告管理" }
  ],
  "requiredExtensions": [],                 // 硬依赖
  "optionalExtensions": [],                 // 软依赖
  "appTypes": ["*"],                        // 适用应用类型
  "minFrameworkVersion": "1.0.0",          // 最低框架版本
  "provides": {                             // 自描述：提供的资源
    "services": ["AdPlacementTypeService", "AdPlacementService", "AdService"],
    "dicts": ["AdLinkTypeDict"],
    "routes": ["adRoutes", "adTypeRoutes", "adPlacementRoutes", "adContentRoutes"],
    "entities": ["AdPlacementType", "AdPlacement", "Ad"]
  }
}
```

### 3.2 框架启动校验

`createExtensionBackendApp` / `createBaseBackendApp` 启动时执行：

```
1. 校验必填字段（name/version/displayName/description/routePrefix/permCodeNodes）
   → 缺字段 → 拒绝启动，输出缺失项

2. 校验 permCode 格式（必须匹配 {ns}:* 模式）
   → 不合规 → 拒绝启动，输出违规项

3. 校验多个扩展包间 permCode 冲突
   → 重复 → 拒绝启动，输出冲突详情

4. 校验 routePrefix 格式（必须 /ext/{ns} 模式）
   → 不合规 → 拒绝启动
```

校验规则：**全部拒绝启动**，不猜测意图。

### 3.3 业务层命名空间覆盖

```typescript
// frontend/src/main.ts
createBaseAdminApp({
  extensions: [
    {
      name: 'moyan-extension-ad',
      routePrefix: '/ads',  // ← 覆盖默认的 /ext/ad
    },
  ],
})
```

扩展包内部跳转通过 `useExtensionRoute()` composable 解析实际前缀，不能硬编码路径。

---

## 4. 扩展包目录结构

```
moyan-extension-ad/
├── package.json                 # exports: ./backend, ./frontend, ./shared
├── tsconfig.json
├── extension.json               # 元信息清单
├── api.build.cjs                # API 生成配置（从自身 Swagger 源生成）
├── README.md
│
├── migrations/                  # 数据库迁移（扩展包自带）
│   └── 001-create-ad-tables.ts
│
├── scripts/
│   └── build-routes.mjs         # 路由预构建脚本（npm 发布用）
│
├── src/
│   ├── index.ts                 # 顶层导出（extension.json 的 manifest）
│   │
│   ├── backend/
│   │   ├── index.ts             # 导出：CoreModule、AdModule、Entity、Service、DTO
│   │   ├── main.ts              # 扩展包自启动入口
│   │   ├── ad.module.ts         # 完整 Module（Core + Controller）
│   │   ├── ad-core.module.ts    # 核心 Module（仅 Service + Entity）
│   │   ├── controller/
│   │   ├── service/
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── frontend/
│   │   ├── index.ts             # 导出：adRoutes + 按页面拆分路由 + useExtensionRoute
│   │   ├── main.ts              # 扩展包前端自启动入口
│   │   ├── apis/                # moyan-api 生成（随包发布，禁止手动修改）
│   │   │   └── index.ts
│   │   ├── routes.gen.ts        # 路由预构建产物（自动生成）
│   │   ├── views/               # 页面组件 + definePageConfig
│   │   ├── components/          # UI 组件
│   │   └── composables/         # useExtensionRoute 等
│   │
│   └── shared/
│       ├── index.ts             # 导出：types、constants、dict、paths
│       ├── types.ts             # 前后端通信接口类型
│       ├── constants.ts         # 共享常量
│       ├── dict.ts              # @DictMeta/@DictEntry 字典定义
│       └── paths.ts             # 路由路径常量
│
└── tests/                       # (🟢 推迟)
```

---

## 5. 后端规格

### 5.1 自启动入口

```typescript
// src/backend/main.ts
import { createExtensionBackendApp } from 'moyan-base-backend'
import { AdModule, AdPlacementType, AdPlacement, Ad } from './index'
import extensionManifest from '../../extension.json'

createExtensionBackendApp({
  manifest: extensionManifest,
  name: '广告管理',
  module: AdModule,
  entities: [AdPlacementType, AdPlacement, Ad],
}).then(({ app }) => app.listen(3002))
```

`createExtensionBackendApp` 自动处理：
- NestJS + TypeORM 启动
- Swagger 分组注册
- 全局过滤器 / 拦截器 / ValidationPipe
- CORS（dev 环境自动开启）
- 权限节点注入
- extension.json 校验

### 5.2 双模块导出

```typescript
// src/backend/index.ts
export { AdCoreModule } from './ad-core.module'   // 仅 Service + Entity
export { AdModule, AdModule as default } from './ad.module'  // 完整
export { AdPlacementType, AdPlacement, Ad } from './entities'
export { AdPlacementTypeService, AdPlacementService, AdService } from './service'
export { CreateAdPlacementTypeDto, UpdateAdPlacementTypeDto, ... } from './dto'
```

### 5.3 业务层集成

```typescript
// backend/src/main.ts
createBaseBackendApp({
  extensions: [
    { name: 'moyan-extension-ad', routePrefix: '/ads' },
  ],
  permissionValueMap: {          // 业务层统一分配位值
    'ad:placement:view':   0x0100_0001n,
    'ad:placement:create': 0x0100_0002n,
    // ... 其他节点
  },
})
```

### 5.4 模块选择

```typescript
// 业务层 app.modules.ts
import { AdCoreModule, AdModule } from 'moyan-extension-ad/backend'

@Module({
  imports: [
    AdCoreModule,  // ← 只要 Service + Entity，不暴露 HTTP API
    // AdModule,   // ← 要完整 API，打开注释替换上面
  ],
})
```

---

## 6. 前端规格

### 6.1 自启动入口

```typescript
// src/frontend/main.ts
import { createExtensionFrontendApp } from 'moyan-mfw-base-frontend'
import { adRoutes } from './index'

createExtensionFrontendApp({
  name: '广告管理',
  routes: adRoutes,
}).then(app => app.mount('#app'))
```

### 6.2 路由拆分导出

```typescript
// src/frontend/index.ts
import { buildRoutesFromConfigs } from 'moyan-mfw-base-frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', { eager: true, import: 'default' })
const allRoutes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 })

// 按页面 path 前缀拆分（基于 definePageConfig.path 值匹配）
export const adTypeRoutes = allRoutes.filter(r => r.path?.startsWith('type'))
export const adPlacementRoutes = allRoutes.filter(r => r.path?.startsWith('placement'))
export const adContentRoutes = allRoutes.filter(r => r.path?.startsWith('content'))

// 向后兼容：全量
export const adRoutes = allRoutes
```

### 6.3 业务层集成

```typescript
// frontend/src/main.ts
import { adTypeRoutes, adPlacementRoutes } from 'moyan-extension-ad/frontend'
// adContentRoutes 不引入 → 业务层自己写广告内容页面

createBaseAdminApp({
  title: '墨焱前端演示',
  routes: [...businessRoutes, ...adTypeRoutes, ...adPlacementRoutes],
  extensions: [
    { name: 'moyan-extension-ad', routePrefix: '/ads' },
  ],
})
```

### 6.4 API 代码

```typescript
// src/frontend/apis/index.ts（moyan-api 生成，禁止手动修改）
// 生成源：扩展包自身的 Swagger JSON（http://localhost:3002/api-docs-json）

export class ApiAdPlacementTypeFindAll extends ApiCall<...> { ... }
export class ApiAdPlacementCreate extends ApiCall<...> { ... }
// ... 共 15 个 API 类
```

```typescript
// 扩展包内部 Vue 组件使用
import { ApiAdPlacementTypeFindAll } from '../../apis'

// 业务层自定义页面使用
import { ApiAdPlacementTypeFindAll } from 'moyan-extension-ad/frontend/apis'
```

### 6.5 API 构建命令

```javascript
// extension-ad/api.build.cjs
const configs = [
  {
    jsonurl: 'http://localhost:3002/api-docs-json',  // 扩展包自身端口
    output: './src/frontend/apis',
    dirname: '.'
  },
]
```

开发期：启动扩展包后端 → 跑 `pnpm api:build` → 重启前端。

---

## 7. 字典体系

### 7.1 扩展包定义字典

```typescript
// src/shared/dict.ts
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'ad_link_type', label: '广告跳转类型', module: '广告管理' })
export class AdLinkTypeDict {
  @DictEntry({ label: '小程序跳转',   type: 'primary' })  static MINIAPP  = 'miniapp'
  @DictEntry({ label: 'App内部跳转',  type: 'success' })  static INTERNAL = 'internal'
  @DictEntry({ label: '外部链接跳转',  type: 'warning' })  static EXTERNAL = 'external'
}
```

### 7.2 业务层消费

```typescript
// business-dict/src/index.ts
export * from './supplier'
export { AdLinkTypeDict } from 'moyan-extension-ad/shared'
```

---

## 8. 数据库迁移

### 8.1 扩展包自带迁移

```
moyan-extension-ad/
└── migrations/
    └── 001-create-ad-tables.ts
```

### 8.2 框架自动执行

`createBaseBackendApp` / `createExtensionBackendApp` 启动时：

```
1. 收集所有扩展包的 migrations/ 目录
2. 按时间戳排序
3. 依次执行 TypeORM runMigrations
```

生产环境：`synchronize: false`，仅通过 migration 管理表结构。

---

## 9. 权限体系

### 9.1 扩展包只声明 permCode 节点

```jsonc
// extension.json
"permCodeNodes": [
  { "permCode": "ad:placement:view", "permName": "查看广告位", "nodeType": "TAG" }
]
```

### 9.2 业务层分配位值

```typescript
// backend/src/permissions.config.ts
export const permissionValueMap = {
  'ad:placement:view':   0x0100_0001n,
  'ad:placement:create': 0x0100_0002n,
  // ...
}
```

### 9.3 启动时校验

- 每个扩展包声明的 permCode 必须都在 `permissionValueMap` 中有对应位值
- 不同 permCode 不得分配到相同位值
- 多个扩展包声明同名 permCode → 拒绝启动

---

## 10. 发布策略

### 10.1 peerDependencies

```jsonc
{
  "peerDependencies": {
    "moyan-base-backend": "workspace:^",       // publish → "^1.0.0"
    "moyan-mfw-base-frontend": "workspace:^",  // publish → "^1.0.0"
    "moyan-shared-dict": "workspace:^"
  }
}
```

### 10.2 发布前构建

```jsonc
{
  "scripts": {
    "api:build": "node api.build.cjs",
    "build:routes": "node scripts/build-routes.mjs",
    "prepublishOnly": "pnpm api:build && pnpm build:routes && pnpm build"
  },
  "files": [
    "dist",
    "migrations",
    "extension.json",
    "src/frontend/apis",
    "src/frontend/routes.gen.ts"
  ]
}
```

### 10.3 路由预构建脚本

```javascript
// scripts/build-routes.mjs
// 扫描 src/frontend/views/**/index.ts
// → 生成 src/frontend/routes.gen.ts
// → 包含所有 definePageConfig + 静态 import
```

---

## 11. 开发工作流

```
# 扩展包开发（完全独立，不依赖业务层）
cd packages/extensions/extension-ad

# 终端 1：后端
pnpm dev:backend         # → http://localhost:3002  /api-docs

# 终端 2：API 生成（DTO 变更后）
pnpm api:build

# 终端 3：前端
pnpm dev:frontend        # → http://localhost:5200

# 联调：前端 → 后端（CORS 自动开启）
```

```
# 业务层集成（一行配置）
# backend/src/main.ts → extensions: [{ name: 'moyan-extension-ad' }]
# frontend/src/main.ts → 同上 + routes: [...adTypeRoutes]
```

---

## 12. 文件变更清单

### 12.1 extension-ad 变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/backend/index.ts` | 修改 | 拆分 CoreModule + 导出 DTO |
| `src/backend/ad-core.module.ts` | **新增** | 仅 Service+Entity 的模块 |
| `src/backend/main.ts` | **新增** | 自启动入口 |
| `src/backend/service/*.service.ts` (3个) | 修改 | 删除保护 + linkType @IsIn |
| `src/backend/dto/create-ad.dto.ts` | 修改 | linkType @IsIn |
| `src/backend/dto/update-ad.dto.ts` | 修改 | linkType @IsIn |
| `src/frontend/index.ts` | 修改 | 路由拆分 + composable 导出 |
| `src/frontend/main.ts` | **新增** | 自启动入口 |
| `src/frontend/api.ts` | **删除** | 由 apis/ 替代 |
| `src/frontend/apis/index.ts` | **新增** | moyan-api 生成 |
| `src/frontend/routes.gen.ts` | **新增** | 预构建产物 |
| `src/frontend/views/**` (3个) | 修改 | AdApi→ApiXxx, STATUS→StatusDict |
| `src/frontend/components/**` (3个) | 修改 | AdApi→ApiXxx |
| `src/shared/dict.ts` | **新增** | 字典定义 |
| `src/shared/paths.ts` | **新增** | 路径常量 |
| `src/shared/index.ts` | 修改 | 导出 dict + paths |
| `api.build.cjs` | **新增** | API 生成配置 |
| `scripts/build-routes.mjs` | **新增** | 路由预构建 |
| `migrations/001-create-ad-tables.ts` | **新增** | 数据库迁移 |
| `package.json` | 修改 | scripts + files + workspace:^ |
| `extension.json` | 修改 | 补充 provides + routePrefix |

### 12.2 业务层变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/src/main.ts` | 修改 | 新增 Swagger 分组 + extensions 配置 |
| `frontend/src/main.ts` | 修改 | 引入扩展包路由 |
| `business-dict/src/index.ts` | 修改 | re-export 扩展包字典 |

---

## 13. 🟢 推迟项

以下问题当前阶段不处理，后续迭代补齐：

- E2E 测试策略 · HMR 支持 · i18n 扩展
- 多实例事件总线适配 · seed 数据初始化
- CLI 脚手架 · 扩展包注册中心
- bundle 体积分析 · 权限位值自动分配工具
