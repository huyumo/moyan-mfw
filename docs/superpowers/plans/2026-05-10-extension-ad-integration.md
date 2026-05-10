# extension-ad 集成改造实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `extension-ad` 扩展包从"仅能在 workspace 内运行的演示代码"改造为符合 MFW 扩展包设计规约的"可独立开发、可 npm 发布、可被业务层声明式集成"的扩展包。

**Architecture:** 三 Phase 分步改造。Phase 1 修复 P0 后端入口与 DTO；Phase 2 重构前端 API 层与字典体系；Phase 3 补齐路由构建、发布配置与业务层集成。每 Phase 独立可验证。

**Tech Stack:** TypeScript, NestJS, TypeORM, Vue 3, Vite, pnpm workspace, moyan-api, moyan-shared-dict

**前置依赖（框架层先行变更，不在本计划范围内）：**
- `base-backend`: `createExtensionBackendApp()`、`createBaseBackendApp({ extensions })`、`entities` 外部注入通道、`permissionValues` 支持 `Record<string, bigint>`
- `base-frontend`: `createExtensionFrontendApp()`、`createBaseAdminApp({ extensions })`、`buildRoutesFromConfigs` 支持 path 前缀过滤

---

## Phase 1：P0 后端入口 + DTO 导出 + 后端校验

### Task 1.1：改造 `backend/index.ts` — 拆分 CoreModule + 导出 DTO

**Files:**
- Modify: `packages/extensions/extension-ad/src/backend/index.ts`

- [ ] **Step 1: 重写 backend/index.ts 导出内容**

```typescript
/**
 * @fileoverview 广告扩展包后端入口
 * @description 导出 CoreModule（仅 Service+Entity）、完整 AdModule、实体、DTO
 */

export { AdCoreModule } from './ad-core.module'
export { AdModule, AdModule as default } from './ad.module'
export { AdPlacementType, AdPlacement, Ad } from './entities'
export { AdPlacementTypeService, AdPlacementService, AdService } from './service'
export {
  CreateAdPlacementTypeDto, UpdateAdPlacementTypeDto, QueryAdPlacementTypeDto,
  CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto,
  CreateAdDto, UpdateAdDto, QueryAdDto,
} from './dto'
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 1.2：新建 `ad-core.module.ts` — 仅 Service + Entity 的模块

**Files:**
- Create: `packages/extensions/extension-ad/src/backend/ad-core.module.ts`

- [ ] **Step 1: 创建 CoreModule（不含 Controller）**

```typescript
/**
 * @fileoverview 广告管理核心模块（无 HTTP 暴露）
 * @description 仅提供服务与实体注册，供业务层内部消费。不注册 Controller。
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdPlacementType } from './entities/ad-placement-type.entity'
import { AdPlacement } from './entities/ad-placement.entity'
import { Ad } from './entities/ad.entity'
import { AdPlacementTypeService } from './service/ad-placement-type.service'
import { AdPlacementService } from './service/ad-placement.service'
import { AdService } from './service/ad.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AdPlacementType, AdPlacement, Ad]),
  ],
  providers: [AdPlacementTypeService, AdPlacementService, AdService],
  exports: [AdPlacementTypeService, AdPlacementService, AdService],
})
export class AdCoreModule {}
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 1.3：改造 `ad.module.ts` — 依赖 CoreModule + 附加 Controller

**Files:**
- Modify: `packages/extensions/extension-ad/src/backend/ad.module.ts`

- [ ] **Step 1: 重构为 CoreModule + Controller 组合**

```typescript
/**
 * @fileoverview 广告管理完整模块
 * @description CoreModule + Controller，提供完整的 HTTP API
 */

import { Module } from '@nestjs/common'
import { AdCoreModule } from './ad-core.module'
import { AdPlacementTypeController } from './controller/ad-placement-type.controller'
import { AdPlacementController } from './controller/ad-placement.controller'
import { AdController } from './controller/ad.controller'

@Module({
  imports: [AdCoreModule],
  controllers: [AdPlacementTypeController, AdPlacementController, AdController],
  exports: [AdCoreModule],
})
export class AdModule {}
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 1.4：DTO linkType 白名单校验

**Files:**
- Modify: `packages/extensions/extension-ad/src/backend/dto/create-ad.dto.ts`
- Modify: `packages/extensions/extension-ad/src/backend/dto/update-ad.dto.ts`

- [ ] **Step 1: create-ad.dto.ts 增加 @IsIn**

在 import 中增加 `IsIn`，修改 `linkType` 字段：

```typescript
import { IsIn } from 'class-validator'

@ApiProperty({ description: '跳转类型', enum: ['miniapp', 'internal', 'external'], example: 'miniapp' })
@IsNotEmpty({ message: '跳转类型不能为空' })
@IsString()
@IsIn(['miniapp', 'internal', 'external'], { message: '跳转类型只能是 miniapp / internal / external' })
linkType: string
```

- [ ] **Step 2: update-ad.dto.ts 同步修改**

同样的 `linkType` 字段增加 `@IsIn` 装饰器。

- [ ] **Step 3: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 1.5：Service 删除操作增加关联数据保护

**Files:**
- Modify: `packages/extensions/extension-ad/src/backend/service/ad-placement-type.service.ts`
- Modify: `packages/extensions/extension-ad/src/backend/service/ad-placement.service.ts`

- [ ] **Step 1: ad-placement-type.service.ts delete 增加子数据检查**

在 `AdPlacementTypeService` 文件中增加 import：
```typescript
import { AdPlacement } from '../entities/ad-placement.entity'
```

修改 `delete` 方法：
```typescript
async delete(id: string): Promise<void> {
  const entity = await this.findById(id)
  const childCount = await this.dataSource
    .getRepository(AdPlacement)
    .count({ where: { placementTypeId: id } })
  if (childCount > 0) {
    throw new ConflictException(`该类型下有 ${childCount} 个广告位，请先删除关联广告位`)
  }
  await this.typeRepo.softDelete(entity.id)
}
```

- [ ] **Step 2: ad-placement.service.ts delete 增加子数据检查**

在 `AdPlacementService` 文件中增加 import：
```typescript
import { Ad } from '../entities/ad.entity'
```

修改 `delete` 方法：
```typescript
async delete(id: string): Promise<void> {
  const entity = await this.findById(id)
  const childCount = await this.dataSource
    .getRepository(Ad)
    .count({ where: { placementId: id } })
  if (childCount > 0) {
    throw new ConflictException(`该广告位下有 ${childCount} 条广告内容，请先删除关联广告内容`)
  }
  await this.placementRepo.softDelete(entity.id)
}
```

- [ ] **Step 3: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit Phase 1**

```bash
git add -A
git commit -m "feat(extension-ad): P0 - DTO 导出 + CoreModule 拆分 + linkType 校验 + 删除保护"
```

---

## Phase 2：前端 API 层 + 字典体系

### Task 2.1：新增 `shared/dict.ts` — 扩展包字典定义

**Files:**
- Create: `packages/extensions/extension-ad/src/shared/dict.ts`

- [ ] **Step 1: 创建字典文件**

```typescript
/**
 * @fileoverview 广告管理扩展包字典定义
 * @description 使用 moyan-shared-dict 装饰器定义扩展包专属字典，供前后端共用
 */
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'ad_link_type', label: '广告跳转类型', module: '广告管理' })
export class AdLinkTypeDict {
  @DictEntry({ label: '小程序跳转',   type: 'primary' })  static MINIAPP  = 'miniapp'
  @DictEntry({ label: 'App内部跳转',  type: 'success' })  static INTERNAL = 'internal'
  @DictEntry({ label: '外部链接跳转',  type: 'warning' })  static EXTERNAL = 'external'
}
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 2.2：新增 `shared/paths.ts` — 路由路径常量

**Files:**
- Create: `packages/extensions/extension-ad/src/shared/paths.ts`

- [ ] **Step 1: 创建路径常量文件**

```typescript
/**
 * @fileoverview 扩展包路由路径常量
 * @description 集中定义扩展包所有路由路径，方便业务层自定义前缀和跨页面跳转
 */
export const AD_PATHS = {
  TYPE:      '/ext/ad/type',
  PLACEMENT: '/ext/ad/placement',
  CONTENT:   '/ext/ad/content',
} as const
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 2.3：改造 `shared/index.ts` — 导出 dict + paths

**Files:**
- Modify: `packages/extensions/extension-ad/src/shared/index.ts`

- [ ] **Step 1: 增加导出**

```typescript
/**
 * @fileoverview 共享类型定义
 * @description 前后端通信接口类型与常量
 */

export type { LinkType } from './constants'
export { LINK_TYPE, LINK_TYPE_LABELS } from './constants'
export type { AdPlacementTypeItem, AdPlacementItem, AdItem } from './types'
export { AdLinkTypeDict } from './dict'
export { AD_PATHS } from './paths'
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 2.4：删除 `frontend/api.ts`

**Files:**
- Delete: `packages/extensions/extension-ad/src/frontend/api.ts`

- [ ] **Step 1: 删除手写 API 文件**

```bash
rm packages/extensions/extension-ad/src/frontend/api.ts
```

### Task 2.5：新增 `frontend/apis/index.ts` — API re-export 占位

**Files:**
- Create: `packages/extensions/extension-ad/src/frontend/apis/index.ts`

- [ ] **Step 1: 创建占位文件（API 生成代码在 Phase 5 产生）**

```typescript
/**
 * @fileoverview 广告扩展包前端 API 层
 * @description 由 moyan-api 从 Swagger JSON 自动生成，禁止手动修改。
 * 生成命令：pnpm api:build
 */

// 以下由 moyan-api 生成，请运行 pnpm api:build 后替换
export {}
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 2.6：改造 3 个 views/ — AdApi → ApiXxx + STATUS → StatusDict

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/views/type/Index.vue`
- Modify: `packages/extensions/extension-ad/src/frontend/views/placement/Index.vue`
- Modify: `packages/extensions/extension-ad/src/frontend/views/ad/Index.vue`

- [ ] **Step 1: 改造 type/Index.vue**

替换 import：
```typescript
// 删除：
import { AdApi } from '../../api'

// 替换为（Phase 5 API 生成后的实际路径）：
import { ApiAdPlacementTypeFindAll, ApiAdPlacementTypeCreate, ApiAdPlacementTypeUpdate, ApiAdPlacementTypeDelete } from '../../apis'
```

替换 STATUS 常量：
```typescript
// 删除：
const STATUS = { ENABLED: 1, DISABLED: 0 } as const

// 替换为：
import { StatusDict } from 'moyan-shared-dict'
const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
```

替换 API 调用方式（示例）：
```typescript
// 旧：
const res = await AdApi.getTypes(params)
return res.data?.data

// 新：
const api = new ApiAdPlacementTypeFindAll()
api.hintSuccess = true
const res = await api.call(params)
return res.data?.data
```

替换 handleDelete 中的 API 调用：
```typescript
// 旧：
await AdApi.deleteType(row.id)

// 新：
await new ApiAdPlacementTypeDelete().call(row.id)
```

替换 handleAdd / handleEdit 中的 API 调用同样改为 ApiXxx 模式。

- [ ] **Step 2: 改造 placement/Index.vue**

同 Step 1 模式，替换为 `ApiAdPlacementFindAll` / `ApiAdPlacementCreate` / `ApiAdPlacementUpdate` / `ApiAdPlacementDelete`。

硬编码路径替换：
```typescript
// 旧：
router.push('/ext/ad/content?placementId=' + row.id)

// 新：
import { AD_PATHS } from '../../shared/paths'
router.push(`${AD_PATHS.CONTENT}?placementId=${row.id}`)
```

- [ ] **Step 3: 改造 ad/Index.vue**

同 Step 1 模式，替换为 `ApiAdFindAll` / `ApiAdCreate` / `ApiAdUpdate` / `ApiAdDelete`。

- [ ] **Step 4: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors（API 类在 Phase 5 生成前会有 import 报错，确认其他部分无错误即可）

### Task 2.7：改造 3 个 components/ — AdApi → ApiXxx

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/components/ad-form/Index.vue`
- Modify: `packages/extensions/extension-ad/src/frontend/components/ad-placement-form/Index.vue`
- Modify: `packages/extensions/extension-ad/src/frontend/components/ad-placement-type-form/Index.vue`

- [ ] **Step 1: 改造 ad-form/Index.vue**

```typescript
// 删除：import { AdApi } from '../../api'
// 替换为：
import { ApiAdCreate, ApiAdUpdate, ApiAdPlacementFindAll } from '../../apis'

// onMounted 中：
// 旧：const list = res.data?.data?.data || []
// 新：const list = res.data?.data || []
```

- [ ] **Step 2: 改造 ad-placement-form/Index.vue**

```typescript
// 替换 import：
import { ApiAdPlacementCreate, ApiAdPlacementUpdate, ApiAdPlacementTypeFindAll } from '../../apis'

// onMounted 中同理调整
```

- [ ] **Step 3: 改造 ad-placement-type-form/Index.vue**

```typescript
// 替换 import：
import { ApiAdPlacementTypeCreate, ApiAdPlacementTypeUpdate } from '../../apis'
```

- [ ] **Step 4: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors（API 类 import 暂时 pending）

- [ ] **Step 5: Commit Phase 2**

```bash
git add -A
git commit -m "feat(extension-ad): P1 - 字典体系 + 路径常量 + API 层重构（moyan-api 预备）"
```

---

## Phase 3：路由构建 + 发布配置 + 业务层集成

### Task 3.1：改造 `frontend/index.ts` — 路由拆分

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/index.ts`

- [ ] **Step 1: 重写路由出口**

```typescript
/**
 * @fileoverview 广告扩展包前端入口
 * @description 扫描自身 views 目录构建路由数组。按页面拆分导出，支持业务层选择性引入。
 */
import { buildRoutesFromConfigs } from 'moyan-mfw-base-frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

const allRoutes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 })

export const adTypeRoutes = allRoutes.filter(r => r.path?.startsWith('type'))
export const adPlacementRoutes = allRoutes.filter(r => r.path?.startsWith('placement'))
export const adContentRoutes = allRoutes.filter(r => r.path?.startsWith('content'))

export const adRoutes = allRoutes
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

### Task 3.2：新增 `frontend/main.ts` — 自启动入口

**Files:**
- Create: `packages/extensions/extension-ad/src/frontend/main.ts`

- [ ] **Step 1: 创建独立前端入口**

```typescript
/**
 * @fileoverview 广告扩展包前端自启动入口
 * @description 独立运行扩展包前端，不依赖业务层
 */
import { createExtensionFrontendApp } from 'moyan-mfw-base-frontend'
import { adRoutes } from './index'

const app = createExtensionFrontendApp({
  name: '广告管理',
  routes: adRoutes,
})

app.mount('#app')
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors（`createExtensionFrontendApp` 为框架层未来 API）

### Task 3.3：新增 `backend/main.ts` — 自启动入口

**Files:**
- Create: `packages/extensions/extension-ad/src/backend/main.ts`

- [ ] **Step 1: 创建独立后端入口**

```typescript
/**
 * @fileoverview 广告扩展包后端自启动入口
 * @description 独立运行扩展包后端，不依赖业务层
 */
import { createExtensionBackendApp } from 'moyan-base-backend'
import { AdModule, AdPlacementType, AdPlacement, Ad } from './index'
import extensionManifest from '../extension.json'

const bootstrap = async () => {
  const { app } = await createExtensionBackendApp({
    manifest: extensionManifest,
    name: '广告管理',
    module: AdModule,
    entities: [AdPlacementType, AdPlacement, Ad],
  })

  await app.listen(3002)
  console.log('[Extension-AD] 后端启动: http://localhost:3002')
}

bootstrap()
```

- [ ] **Step 2: 验证编译**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors（`createExtensionBackendApp` 为框架层未来 API）

### Task 3.4：改造 `package.json` — scripts + files

**Files:**
- Modify: `packages/extensions/extension-ad/package.json`

- [ ] **Step 1: 更新 peerDependencies 版本策略 + scripts + files**

```jsonc
{
  "name": "moyan-extension-ad",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./backend": "./src/backend/index.ts",
    "./frontend": "./src/frontend/index.ts",
    "./shared": "./src/shared/index.ts"
  },
  "scripts": {
    "dev:backend": "tsx src/backend/main.ts",
    "dev:frontend": "vite",
    "api:build": "node api.build.cjs",
    "build:routes": "node scripts/build-routes.mjs",
    "build": "tsc",
    "prepublishOnly": "pnpm api:build && pnpm build:routes && pnpm build"
  },
  "files": [
    "dist",
    "migrations",
    "extension.json",
    "src/frontend/apis",
    "src/frontend/routes.gen.ts"
  ],
  "peerDependencies": {
    "moyan-base-backend": "workspace:^",
    "moyan-mfw-base-frontend": "workspace:^",
    "moyan-shared-dict": "workspace:^",
    "vue-router": "^4.0"
  }
}
```

### Task 3.5：改造 `extension.json` — 补充元信息

**Files:**
- Modify: `packages/extensions/extension-ad/extension.json`

- [ ] **Step 1: 增加 routePrefix + provides**

在现有 JSON 基础上增加：
```jsonc
{
  // ... 现有字段保留
  "routePrefix": "/ext/ad",
  "provides": {
    "services": ["AdPlacementTypeService", "AdPlacementService", "AdService"],
    "dicts": ["AdLinkTypeDict"],
    "routes": ["adRoutes", "adTypeRoutes", "adPlacementRoutes", "adContentRoutes"],
    "entities": ["AdPlacementType", "AdPlacement", "Ad"]
  }
}
```

### Task 3.6：新增 `api.build.cjs` — API 生成配置

**Files:**
- Create: `packages/extensions/extension-ad/api.build.cjs`

- [ ] **Step 1: 创建 API 生成脚本**

```javascript
const ApisdkCreator = require('moyan-api/dist/main.js').ApisdkCreator
const Program = require('moyan-api/dist/program.js').Program

const configs = [
  {
    jsonurl: 'http://localhost:3002/api-docs-json',
    output: './src/frontend/apis',
    dirname: '.'
  },
]

const create = async () => {
  for (let i = 0; i < configs.length; i++) {
    await new ApisdkCreator(new Program(configs[i])).create()
  }
}

create()
```

### Task 3.7：新增 `scripts/build-routes.mjs` — 路由预构建

**Files:**
- Create: `packages/extensions/extension-ad/scripts/build-routes.mjs`

- [ ] **Step 1: 创建路由预构建脚本**

```javascript
/**
 * 路由预构建脚本
 * 扫描 src/frontend/views/ 生成 src/frontend/routes.gen.ts
 * 解决 import.meta.glob 在 npm 发布后不可用的问题
 */
import { glob } from 'glob'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { relative, dirname } from 'path'

const VIEWS_DIR = 'src/frontend/views'
const OUTPUT = 'src/frontend/routes.gen.ts'

const files = await glob(`${VIEWS_DIR}/**/index.ts`)

const imports = files.map((f, i) => {
  const relPath = relative(dirname(OUTPUT), f).replace(/\\/g, '/')
  const name = `route_${i}`
  return `import ${name} from '${relPath}'`
})

const routeList = files.map((_, i) => `route_${i}`).join(', ')

const content = `/**
 * @fileoverview 路由预构建产物
 * @description 由 scripts/build-routes.mjs 自动生成，禁止手动修改
 */

${imports.join('\n')}

export const routesFromConfig = [${routeList}]
`

if (!existsSync(dirname(OUTPUT))) mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, content)
console.log(`[build-routes] Generated ${OUTPUT} with ${files.length} routes`)
```

### Task 3.8：新增 `migrations/` — 数据库迁移

**Files:**
- Create: `packages/extensions/extension-ad/migrations/001-create-ad-tables.ts`

- [ ] **Step 1: 创建首个数据库迁移文件**

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateAdTables001 implements MigrationInterface {
  name = 'CreateAdTables001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'ext_ad_placement_types',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true, default: '(UUID())' },
        { name: 'name', type: 'varchar', length: '64' },
        { name: 'code', type: 'varchar', length: '64', isUnique: true },
        { name: 'width', type: 'int' },
        { name: 'height', type: 'int' },
        { name: 'description', type: 'varchar', length: '255', isNullable: true },
        { name: 'status', type: 'tinyint', default: 1 },
        { name: 'sortOrder', type: 'int', default: 0 },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updateAt', type: 'datetime', isNullable: true },
        { name: 'deleteAt', type: 'datetime', isNullable: true },
      ],
    }))

    await queryRunner.createTable(new Table({
      name: 'ext_ad_placements',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true, default: '(UUID())' },
        { name: 'name', type: 'varchar', length: '64' },
        { name: 'code', type: 'varchar', length: '64', isUnique: true },
        { name: 'placementTypeId', type: 'char', length: '36' },
        { name: 'description', type: 'varchar', length: '255', isNullable: true },
        { name: 'status', type: 'tinyint', default: 1 },
        { name: 'sortOrder', type: 'int', default: 0 },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updateAt', type: 'datetime', isNullable: true },
        { name: 'deleteAt', type: 'datetime', isNullable: true },
      ],
      foreignKeys: [
        { columnNames: ['placementTypeId'], referencedTableName: 'ext_ad_placement_types', referencedColumnNames: ['id'] },
      ],
    }))

    await queryRunner.createTable(new Table({
      name: 'ext_ad_contents',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true, default: '(UUID())' },
        { name: 'placementId', type: 'char', length: '36' },
        { name: 'title', type: 'varchar', length: '128' },
        { name: 'imageUrl', type: 'varchar', length: '500' },
        { name: 'linkUrl', type: 'varchar', length: '500', isNullable: true },
        { name: 'linkType', type: 'varchar', length: '32' },
        { name: 'miniAppId', type: 'varchar', length: '255', isNullable: true },
        { name: 'miniAppPath', type: 'varchar', length: '255', isNullable: true },
        { name: 'internalRoute', type: 'varchar', length: '255', isNullable: true },
        { name: 'startTime', type: 'datetime', isNullable: true },
        { name: 'endTime', type: 'datetime', isNullable: true },
        { name: 'status', type: 'tinyint', default: 1 },
        { name: 'sortOrder', type: 'int', default: 0 },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updateAt', type: 'datetime', isNullable: true },
        { name: 'deleteAt', type: 'datetime', isNullable: true },
      ],
      foreignKeys: [
        { columnNames: ['placementId'], referencedTableName: 'ext_ad_placements', referencedColumnNames: ['id'] },
      ],
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ext_ad_contents')
    await queryRunner.dropTable('ext_ad_placements')
    await queryRunner.dropTable('ext_ad_placement_types')
  }
}
```

### Task 3.9：业务层集成 — backend

**Files:**
- Modify: `backend/src/main.ts`

- [ ] **Step 1: 集成扩展包模块**

```typescript
import { AdModule } from 'moyan-extension-ad/backend'

const swaggerGroups: SwaggerGroupConfig[] = [
  { name: 'supplier', title: '供应商API文档', description: '供应商管理相关 API', include: [SupplierModule] },
  {
    name: 'ad-extension',
    title: '广告管理API文档',
    description: '广告位类型、广告位、广告内容管理 API',
    include: [AdModule],
  },
]

// createBaseBackendApp 中：
// extensions: [{ name: 'moyan-extension-ad' }]  // 框架层实现后启用
```

### Task 3.10：业务层集成 — frontend

**Files:**
- Modify: `frontend/src/main.ts`

- [ ] **Step 1: 引入扩展包路由**

```typescript
import { adTypeRoutes, adPlacementRoutes } from 'moyan-extension-ad/frontend'

createBaseAdminApp({
  title: '墨焱前端演示',
  routes: [...businessRoutes, ...adTypeRoutes, ...adPlacementRoutes],
  // extensions: [{ name: 'moyan-extension-ad', routePrefix: '/ads' }], // 框架层实现后启用
})
```

### Task 3.11：业务层集成 — business-dict

**Files:**
- Modify: `business-dict/src/index.ts`

- [ ] **Step 1: 注册扩展包字典**

```typescript
export * from './supplier'
export * from './permissions'
export { AdLinkTypeDict } from 'moyan-extension-ad/shared'
```

### Task 3.12：最终验证 + Commit

- [ ] **Step 1: 全量类型检查**

Run: `pnpm --filter moyan-extension-ad exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Commit Phase 3**

```bash
git add -A
git commit -m "feat(extension-ad): P2 - 路由构建 + 迁移 + 发布配置 + 业务层集成"
```

---

## 变更文件汇总

| # | 文件 | 操作 | Phase |
|---|------|------|-------|
| 1 | `extension-ad/src/backend/index.ts` | 修改 | P1 |
| 2 | `extension-ad/src/backend/ad-core.module.ts` | **新增** | P1 |
| 3 | `extension-ad/src/backend/ad.module.ts` | 修改 | P1 |
| 4 | `extension-ad/src/backend/dto/create-ad.dto.ts` | 修改 | P1 |
| 5 | `extension-ad/src/backend/dto/update-ad.dto.ts` | 修改 | P1 |
| 6 | `extension-ad/src/backend/service/ad-placement-type.service.ts` | 修改 | P1 |
| 7 | `extension-ad/src/backend/service/ad-placement.service.ts` | 修改 | P1 |
| 8 | `extension-ad/src/shared/dict.ts` | **新增** | P2 |
| 9 | `extension-ad/src/shared/paths.ts` | **新增** | P2 |
| 10 | `extension-ad/src/shared/index.ts` | 修改 | P2 |
| 11 | `extension-ad/src/frontend/api.ts` | **删除** | P2 |
| 12 | `extension-ad/src/frontend/apis/index.ts` | **新增** | P2 |
| 13 | `extension-ad/src/frontend/views/type/Index.vue` | 修改 | P2 |
| 14 | `extension-ad/src/frontend/views/placement/Index.vue` | 修改 | P2 |
| 15 | `extension-ad/src/frontend/views/ad/Index.vue` | 修改 | P2 |
| 16 | `extension-ad/src/frontend/components/ad-form/Index.vue` | 修改 | P2 |
| 17 | `extension-ad/src/frontend/components/ad-placement-form/Index.vue` | 修改 | P2 |
| 18 | `extension-ad/src/frontend/components/ad-placement-type-form/Index.vue` | 修改 | P2 |
| 19 | `extension-ad/src/frontend/index.ts` | 修改 | P3 |
| 20 | `extension-ad/src/frontend/main.ts` | **新增** | P3 |
| 21 | `extension-ad/src/backend/main.ts` | **新增** | P3 |
| 22 | `extension-ad/package.json` | 修改 | P3 |
| 23 | `extension-ad/extension.json` | 修改 | P3 |
| 24 | `extension-ad/api.build.cjs` | **新增** | P3 |
| 25 | `extension-ad/scripts/build-routes.mjs` | **新增** | P3 |
| 26 | `extension-ad/migrations/001-create-ad-tables.ts` | **新增** | P3 |
| 27 | `backend/src/main.ts` | 修改 | P3 |
| 28 | `frontend/src/main.ts` | 修改 | P3 |
| 29 | `business-dict/src/index.ts` | 修改 | P3 |

**总计：29 个文件**（13 新增 + 12 修改 + 1 删除 + 3 业务层修改）
