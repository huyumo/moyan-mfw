# MFW 扩展编写指南

> 本指南基于 `packages/extensions/extension-ad` 的实际实现编写，每章均包含可运行的代码示例。

---

## 目录

- [第 1 章：概述与架构](#第-1-章概述与架构)
- [第 2 章：快速开始](#第-2-章快速开始)
- [第 3 章：目录结构规范](#第-3-章目录结构规范)
- [第 4 章：Shared 层编写规范](#第-4-章shared-层编写规范)
- [第 5 章：Backend 层编写规范](#第-5-章backend-层编写规范)
- [第 6 章：Frontend 层编写规范](#第-6-章frontend-层编写规范)
- [第 7 章：路由与权限](#第-7-章路由与权限)
- [第 8 章：构建工作流](#第-8-章构建工作流)
- [第 9 章：Checklist](#第-9-章checklist)

---

## 第 1 章：概述与架构

### 1.1 扩展定位

MFW 扩展是框架的**插件化单元**，每个扩展独立拥有完整的三段式架构：

```
extension-xxx/
├── src/
│   ├── backend/     → NestJS 应用（@internal/xxx-backend）
│   ├── frontend/    → Vue3 + Vite 应用（@internal/xxx-frontend）
│   └── shared/      → 纯 TypeScript 类型（@internal/xxx-shared）
├── database/migrations/
```

**设计原则**：

- **松耦合**：扩展之间通过 `requiredExtensions` / `optionalExtensions` 声明依赖
- **三层导出**：`./backend`、`./frontend`、`./shared` 分别对应不同消费场景
- **简洁启动**：`createExtensionBackendApp({ name, module })` 只需最少参数即可启动

### 1.2 与 base 包的关系

扩展依赖 `moyan-mfw-base` 的三层导出：

```typescript
// 后端：启动应用、装饰器、工具函数
import { createExtensionBackendApp, AuthGuard, RequirePermission } from 'moyan-mfw-base/backend'

// 前端：组件、路由构建、应用创建
import { createExtensionFrontendApp, buildExtensionRoutes, MfwPageWrapper } from 'moyan-mfw-base/frontend'

// 共享：类型定义、字典装饰器、常量
import { DictMeta, DictEntry, StatusDict, Base, toDescription } from 'moyan-mfw-base/shared'
```

**依赖方向图**：

```
                    ┌─────────────────┐
                    │  moyan-mfw-base │
                    │  (三层导出)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ backend  │  │ frontend │  │  shared  │
        │ (NestJS) │  │ (Vue3)   │  │  (TS)    │
        └──────────┘  └──────────┘  └──────────┘
              ▲              ▲              ▲
              └──────────────┴──────────────┘
                             │
                    ┌────────▼────────┐
                    │  extension-xxx  │
                    │  (聚合包)        │
                    └─────────────────┘
```

---

## 第 2 章：快速开始

### 2.1 完整 5 步流程

#### 步骤 1：安装 CLI 工具

```bash
pnpm add -g moyan-mfw-cli
```

**预期输出**：
```
added 1 package in 2s
```

#### 步骤 2：创建扩展项目

```bash
mfw create extension my-ext
```

**预期输出**：
```
✅ 创建扩展项目: extension-my-ext
📁 目录结构:
  extension-my-ext/
  ├── src/
  │   ├── backend/
  │   ├── frontend/
  │   └── shared/
  ├── database/migrations/
  └── package.json
```

#### 步骤 3：进入目录并安装依赖

```bash
cd extension-my-ext && pnpm install
```

**预期输出**：
```
... (pnpm install 输出)
Done in 3.5s
```

#### 步骤 4：启动后端开发服务器

```bash
pnpm dev:backend
```

**预期输出**：
```
[NestApplication] Nest application successfully started on http://localhost:3002
[Extension] ✅ my-ext v0.1.0 清单校验通过
```

#### 步骤 5：启动前端开发服务器（新终端）

```bash
pnpm dev:frontend
```

**预期输出**：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 2.2 验证安装成功

访问 `http://localhost:5173` 应能看到扩展的前端页面。

---

## 第 3 章：目录结构规范

### 3.1 完整目录树（以 extension-ad 为例）

```
extension-ad/
├── package.json                          # 聚合包配置（workspace 协调）
├── tsconfig.json                         # 根 TS 配置
│
├── src/
│   ├── index.ts                          # 聚合入口（re-export）
│   │
│   ├── backend/                          # 【必选】NestJS 后端
│   │   ├── package.json                  #   @internal/ad-backend
│   │   ├── tsconfig.json                 #   后端 TS 配置
│   │   ├── nest-cli.json                 #   NestJS CLI 配置
│   │   ├── .env                          #   环境变量
│   │   └── src/
│   │       ├── main.ts                   #     启动入口（createExtensionBackendApp）
│   │       ├── index.ts                  #     模块导出桶
│   │       ├── api-response.ts           #     统一响应工具
│   │       ├── ad.module.ts              #     根模块
│   │       ├── controller/               #     控制器层
│   │       │   ├── ad.controller.ts
│   │       │   └── ad-placement.controller.ts
│   │       ├── service/                  #     服务层
│   │       │   ├── ad.service.ts
│   │       │   └── ad-placement.service.ts
│   │       ├── entities/                 #     实体层
│   │       │   ├── index.ts
│   │       │   ├── ad.entity.ts
│   │       │   └── ad-placement.entity.ts
│   │       └── dto/                      #     数据传输对象
│   │           ├── index.ts
│   │           ├── create-ad.dto.ts
│   │           ├── update-ad.dto.ts
│   │           ├── query-ad.dto.ts
│   │           ├── batch-update-sort.dto.ts
│   │           └── res/                  #       响应 DTO
│   │               ├── ad-response.dto.ts
│   │               └── ad-placement-response.dto.ts
│   │
│   ├── frontend/                         # 【必选】Vue3 前端
│   │   ├── package.json                  #   @internal/ad-frontend
│   │   ├── tsconfig.json                 #   前端 TS 配置
│   │   ├── vite.config.mts               #   Vite 配置
│   │   ├── index.html                    #   HTML 入口
│   │   ├── api.build.cjs                 #   moyan-api 生成配置
│   │   └── src/
│   │       ├── main.ts                   #     启动入口（createExtensionFrontendApp）
│   │       ├── index.ts                  #     路由导出（buildExtensionRoutes）
│   │       ├── env.d.ts                  #     环境类型声明
│   │       ├── apis/                     #     【自动生成】API 调用代码
│   │       │   └── ad/
│   │       │       ├── index.ts
│   │       │       └── schemas.ts
│   │       ├── views/                    #     页面组件（路由级）
│   │       │   ├── index.ts              #       路由扫描入口
│   │       │   └── placement/            #       广告位管理页
│   │       │           ├── Index.vue
│   │       │           └── index.ts      #         definePageConfig
│   │       └── components/               #     可复用组件（非路由级）
│   │           ├── ad-card/              #       广告卡片
│   │           │   └── Index.vue
│   │           ├── ad-form/              #       广告表单
│   │           │   └── Index.vue
│   │           ├── ad-placement-card/    #       广告位卡片
│   │           │   └── Index.vue
│   │           ├── ad-placement-detail/  #       广告位详情
│   │           │   └── Index.vue
│   │           └── ad-placement-form/    #       广告位表单
│   │               └── Index.vue
│   │
│   └── shared/                           # 【必选】纯 TypeScript 类型
│       ├── package.json                  #   @internal/ad-shared
│       ├── tsconfig.json                 #   Shared TS 配置
│       └── src/
│           ├── index.ts                  #     桶导出
│           ├── constants.ts              #     常量定义
│           ├── dict.ts                   #     字典定义
│           ├── types.ts                  #     接口类型
│           ├── paths.ts                  #     路由路径常量
│           └── permission-values.ts      #     权限标签声明
│
└── database/
    └── migrations/                       # 【可选】数据库迁移
        └── 20260516143000-ad-media.ts
```

### 3.2 文件职责表

| 路径 | 必选 | 职责 |
|------|------|------|
| `package.json` | ✅ | workspace 协调脚本、exports 映射 |
| `src/backend/src/main.ts` | ✅ | 后端启动入口，调用 `createExtensionBackendApp` |
| `src/backend/src/*.module.ts` | ✅ | NestJS 模块定义 |
| `src/backend/src/controller/*.ts` | ✅ | HTTP 请求处理 |
| `src/backend/src/service/*.ts` | ✅ | 业务逻辑 |
| `src/backend/src/entities/*.ts` | ✅ | TypeORM 实体 |
| `src/backend/src/dto/*.ts` | ✅ | 请求/响应数据传输对象 |
| `src/frontend/src/main.ts` | ✅ | 前端启动入口，调用 `createExtensionFrontendApp` |
| `src/frontend/src/index.ts` | ✅ | 路由构建，使用 `buildExtensionRoutes` |
| `src/frontend/src/views/**/index.ts` | ✅ | 页面配置（definePageConfig） |
| `src/frontend/src/components/**/Index.vue` | ✅ | 可复用组件（Mfw 命名） |
| `src/frontend/api.build.cjs` | ✅ | moyan-api 生成配置 |
| `src/shared/src/constants.ts` | ✅ | 前后端共用常量 |
| `src/shared/src/dict.ts` | ✅ | 字典定义（DictMeta + DictEntry） |
| `src/shared/src/types.ts` | ✅ | 接口类型定义 |
| `src/shared/src/paths.ts` | ✅ | 路由路径常量 |
| `src/shared/src/permission-values.ts` | ✅ | 自定义权限标签 |
| `database/migrations/*.ts` | ❌ | 数据库迁移脚本 |

---

## 第 4 章：Shared 层编写规范

### 5.1 概述

Shared 层是**纯 TypeScript 类型包**，不依赖任何运行时框架。它被 backend 和 frontend 同时 import，负责：

- 定义前后端共用的接口类型
- 声明业务常量
- 注册字典（DictMeta）
- 声明自定义权限标签
- 集中管理路由路径

### 5.2 五个必选模块

#### 5.2.1 constants.ts — 常量定义

**职责**：定义前后端共用的枚举/常量。

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 共享常量定义
 * @description 前后端共用的链接类型常量
 */

export const LINK_TYPE = {
  NONE: 'none',
  MINIAPP: 'miniapp',
  INTERNAL: 'internal',
  EXTERNAL: 'external',
} as const

export type LinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE]

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  none: '不跳转',
  miniapp: '小程序跳转',
  internal: 'App内部跳转',
  external: '外部链接跳转',
}
```

**规范要点**：

- 使用 `as const` 断言确保类型推导
- 导出值类型（`type LinkType`）供其他模块使用
- 同时导出标签映射（`LABELS`）供前端展示

#### 5.2.2 dict.ts — 字典定义

**职责**：使用 `moyan-mfw-base/shared` 的字典装饰器注册业务字典。

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 广告管理扩展包字典定义
 * @description 使用 moyan-mfw-base/shared 装饰器定义扩展包专属字典，供前后端共用
 */
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

@DictMeta({ key: 'ad_link_type', label: '广告跳转类型', module: '广告管理' })
export class AdLinkTypeDict {
  @DictEntry({ label: '小程序跳转',   type: 'primary' })  static MINIAPP  = 'miniapp'
  @DictEntry({ label: 'App内部跳转',  type: 'success' })  static INTERNAL = 'internal'
  @DictEntry({ label: '外部链接跳转', type: 'warning' })  static EXTERNAL = 'external'
}
```

**规范要点**：

- 使用 `@DictMeta` 声明字典元信息（key、label、module）
- 使用 `@DictEntry` 声明每个字典项（label、type 用于前端渲染）
- 字典项使用 `static` 属性，值为实际枚举值
- **禁止**在组件中内联定义 STATUS 常量（应使用 `moyan-shared-dict` 或 `StatusDict`）

#### 5.2.3 types.ts — 接口类型

**职责**：定义前后端通信的数据结构接口。

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 共享类型定义
 * @description 前后端共用的数据结构类型
 */

import type { LinkType } from './constants'

export interface AdPlacementTypeItem {
  id: string
  name: string
  code: string
  width: number
  height: number
  description?: string
  status: number
  sortOrder: number
  createdAt: string
  updateAt?: string
}

export interface AdPlacementItem {
  id: string
  name: string
  code: string
  placementTypeId: string
  placementType?: AdPlacementTypeItem
  description?: string
  status: number
  sortOrder: number
  createdAt: string
  updateAt?: string
}

export interface AdItem {
  id: string
  placementId: string
  placement?: AdPlacementItem
  title: string
  imageUrl: string
  linkType: LinkType
  linkUrl?: string
  miniAppId?: string
  miniAppPath?: string
  internalRoute?: string
  startTime?: string
  endTime?: string
  status: number
  sortOrder: number
  createdAt: string
  updateAt?: string
}
```

**规范要点**：

- 使用 `interface` 而非 `type` 定义复杂对象
- 引用 constants.ts 中的类型（如 `LinkType`）
- 可选字段使用 `?` 标记
- 时间字段统一使用 `string` 类型（ISO 8601 格式）

#### 5.2.4 paths.ts — 路由路径常量

**职责**：集中定义扩展包所有路由路径，方便跨页面跳转和业务层自定义前缀。

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 扩展包路由路径常量
 * @description 集中定义扩展包所有路由路径，方便业务层自定义前缀和跨页面跳转
 */
export const AD_PATHS = {
  PLACEMENT: '/ext/ad/placement',
} as const
```

**规范要点**：

- 使用 `as const` 确保字面量类型
- 路径与 Manifest 中的 `routePrefix` 保持一致
- 支持业务层通过环境变量覆盖前缀（如需要）

#### 5.2.5 permission-values.ts — 权限标签

**职责**：声明扩展包使用的自定义权限标签（超出框架内置标签的部分）。

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 广告扩展包自定义权限标签
 * @description 声明本扩展包使用的权限标签，供业务层统一收集注入
 *
 * 位值分配规则（append-only）：
 *   权限标签按业务层收集的去重顺序依次分配位值，已分配的标签永不回收。
 *   新增标签追加到列表末尾 → 新 bitPosition → 已有角色数据不受影响。
 */
export const AD_EXTENSION_PERMISSION_VALUES: readonly string[] = [
  // 当前使用的标签均在框架内置列表中：
  // - DEFAULT_PERMISSION_VALUES: '添加', '编辑', '删除'
  // - EXTENSION_PERMISSION_VALUES: '发布'
  // 暂无扩展包独有的自定义标签，待业务需要时追加
];

export type AdExtensionPermissionName = (typeof AD_EXTENSION_PERMISSION_VALUES)[number];
```

**规范要点**：

- 使用 `readonly string[]` 确保不可变
- 导出联合类型供类型约束
- **append-only** 规则：新标签追加到末尾，不删除或修改已有标签
- 框架内置标签：`'添加'`、`'编辑'`、`'删除'`、`'发布'`

### 5.3 index.ts 桶导出模式

**实际代码（extension-ad）**：

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
export { AD_EXTENSION_PERMISSION_VALUES } from './permission-values'
export type { AdExtensionPermissionName } from './permission-values'
```

**规范要点**：

- 统一从各模块 re-export
- 类型使用 `export type`，值使用 `export`
- 外部只需 `import { ... } from 'moyan-mfw-extension-ad/shared'` 即可

---

## 第 5 章：Backend 层编写规范

### 6.1 NestJS 分层架构

```
backend/src/
├── main.ts              # 启动入口
├── *.module.ts          # 模块定义（依赖注入容器）
├── controller/          # 控制器层（HTTP 请求处理）
├── service/             # 服务层（业务逻辑）
├── entities/            # 实体层（数据库映射）
└── dto/                 # 数据传输对象
    ├── *.dto.ts         #   请求 DTO
    └── res/             #   响应 DTO
```

**分层职责**：

| 层 | 职责 | 依赖方向 |
|----|------|----------|
| Controller | HTTP 请求解析、参数校验、调用 Service | → Service |
| Service | 业务逻辑、数据库操作 | → Entity / Repository |
| Entity | 数据库表结构映射 | ← 无依赖 |
| DTO | 请求/响应数据结构定义 | ← 无依赖 |

### 6.2 Entity 继承 Base 实体

所有实体必须继承 `Base` 类（提供软删除、时间戳等基础字段）：

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 广告内容实体
 * @description 定义广告位中的具体广告内容
 */

import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { Base, ImageResourceDto, MediaResourceDto } from 'moyan-mfw-base/backend'
import { toDescription, StatusDict } from 'moyan-mfw-base/shared'
import { AdPlacement } from './ad-placement.entity'

@Entity('ext_ad_contents')
export class Ad extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'char', length: 36, comment: '广告位 ID' })
  placementId: string

  @ManyToOne(() => AdPlacement, (p) => p.ads)
  @JoinColumn({ name: 'placementId' })
  placement: AdPlacement

  @Column({ type: 'varchar', length: 128, comment: '广告标题' })
  title: string

  @Column({
    type: 'enum',
    enum: ['image', 'video'],
    default: 'image',
    comment: '媒体类型'
  })
  mediaType: 'image' | 'video'

  @Column({
    type: 'json',
    nullable: true,
    comment: '媒体资源（图片或视频）'
  })
  media: ImageResourceDto | MediaResourceDto

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '跳转链接' })
  linkUrl: string

  @Column({ type: 'varchar', length: 32, comment: '跳转类型: none | miniapp | internal | external' })
  @Index()
  linkType: string

  @Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
  @Index()
  status: number

  @Column({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' })
  sortOrder: number
}
```

**规范要点**：

- 继承 `Base` 类（自动包含 `id`、`createdAt`、`updatedAt`、`deleteAt` 等字段）
- 表名使用 `ext_` 前缀（避免与其他扩展冲突）
- 使用 `toDescription(StatusDict)` 自动生成字段注释
- 关联关系使用 `@ManyToOne` / `@JoinColumn`

### 6.3 DTO 分 request/response 两组

DTO 目录按用途分为两组：

```
dto/
├── create-ad.dto.ts          # 创建请求
├── update-ad.dto.ts          # 更新请求
├── query-ad.dto.ts           # 查询请求
├── batch-update-sort.dto.ts  # 特殊操作请求
└── res/                      # 响应 DTO
    ├── ad-response.dto.ts
    └── ad-placement-response.dto.ts
```

**规范要点**：

- 请求 DTO 使用 class-validator 装饰器进行校验
- 响应 DTO 使用 `@ApiResponse` 装饰器与 Swagger 文档关联
- 复杂查询条件使用 `PaginationX + WhereBuilder`（禁止手动 `repository.find()` 分页）

### 6.4 Controller 使用 base:backend API

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 广告内容控制器
 * @description 处理广告内容相关 HTTP 请求
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { AuthGuard, RequirePermission, ApiPaginatedResponse } from 'moyan-mfw-base/backend'
import { ApiResponseUtil } from '../api-response'
import { AdService } from '../service/ad.service'
import { CreateAdDto, UpdateAdDto, QueryAdDto, BatchUpdateSortDto, AdResponseDto } from '../dto'

@ApiTags('ad-content', '广告内容相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('ad-contents')
export class AdController {
  constructor(private service: AdService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建广告内容', description: '在指定广告位下创建新的广告内容' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['添加'] })
  async create(@Body() dto: CreateAdDto) {
    const result = await this.service.create(dto)
    return ApiResponseUtil.success(result, '创建成功')
  }

  @Get()
  @ApiOperation({ summary: '查询广告内容列表', description: '分页查询广告内容列表' })
  @ApiPaginatedResponse(AdResponseDto)
  @RequirePermission({ permCode: '*:ext:ad:*' })
  async findAll(@Query() query: QueryAdDto) {
    const result = await this.service.findAll(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除广告内容' })
  @ApiParam({ name: 'id', description: '广告 ID' })
  @RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id)
    return ApiResponseUtil.success(null, '删除成功')
  }
}
```

**关键规范**：

1. **Swagger 装饰器必须从 `moyan-mfw-core` 导入**（ESLint 强制规则）
2. **禁止使用 `@Request()` / `@Req()` / `@Response()` / `@Res()`**（应使用 `@User() user: UserDto`）
3. **权限控制使用 `@RequirePermission`**（而非手动校验）
4. **统一响应使用 `ApiResponseUtil.success()`**

### 6.5 Module 定义

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 广告管理完整模块
 * @description CoreModule + Controller，提供完整的 HTTP API
 */

import { Module } from '@nestjs/common'
import { AdPlacementController } from './controller/ad-placement.controller'
import { AdController } from './controller/ad.controller'
import { RouterModule } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Ad, AdPlacement } from './entities'
import { AdPlacementService, AdService } from './service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AdPlacement, Ad]),
    RouterModule.register([{ path: 'ext/ad', module: AdModule }]),
  ],
  controllers: [AdPlacementController, AdController],
  providers: [AdPlacementService, AdService],
  exports: [AdPlacementService, AdService],
})
export class AdModule { }
```

**规范要点**：

- 使用 `TypeOrmModule.forFeature()` 注册实体
- 使用 `RouterModule.register()` 声明路由前缀（与 Manifest 的 `routePrefix` 一致）
- 导出 Service 供其他模块使用

### 6.6 启动入口

**实际代码（extension-ad）**：

```typescript
/**
 * @fileoverview 广告扩展包后端自启动入口
 * @description 独立运行扩展包后端，不依赖业务层
 */
import 'reflect-metadata'
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'
import { AdModule, AdPlacement, Ad } from './index'

async function bootstrap() {
  const result = await createExtensionBackendApp({
    name: '广告管理',
    module: AdModule,
    entities: [AdPlacement, Ad],
  })

  await result.listen(3002)
}

bootstrap()
```

**规范要点**：

- 必须导入 `'reflect-metadata'`（NestJS 要求）
- 使用 `createExtensionBackendApp` 而非直接 `NestFactory.create`
- `name` 为 kebab-case 简名，框架自动推导路由前缀 `/ext/{name}`
- 传入 `entities` 数组以注册数据库实体

---

## 第 6 章：Frontend 层编写规范

### 7.1 views/ vs components/ 分工

| 目录 | 用途 | 命名规则 | 路由级别 |
|------|------|----------|----------|
| `views/` | 页面组件（路由级） | 任意名称 | ✅ 是 |
| `components/` | 可复用组件（非路由级） | **Mfw 前缀** | ❌ 否 |

**强制规则**：`components/` 下的 Vue 组件必须使用 `Mfw` 前缀命名（如 `MfwAdCard`），这是 ESLint 自定义规则的硬性要求。

**实际代码（extension-ad）**：

```vue
<!-- components/ad-card/Index.vue -->
<script setup lang="ts">
defineOptions({ name: 'MfwAdCard' })
// ...
</script>
```

### 7.2 组件目录结构

每个组件一个目录，主文件名为 `Index.vue`：

```
components/
├── ad-card/
│   └── Index.vue          # MfwAdCard
├── ad-form/
│   └── Index.vue          # MfwAdForm
├── ad-placement-card/
│   └── Index.vue          # MfwAdPlacementCard
├── ad-placement-detail/
│   └── Index.vue          # MfwAdPlacementDetail
└── ad-placement-form/
    └── Index.vue          # MfwAdPlacementForm
```

### 7.3 页面配置（definePageConfig）

**实际代码（extension-ad）**：

```typescript
// views/placement/index.ts
import { definePageConfig } from 'moyan-mfw-base/frontend'
import PlacementList from './Index.vue'

export default definePageConfig({
  page: PlacementList,
  path: 'placement',
  name: '广告位管理',
  icon: 'CollectionTag',
  auth: true,
  order: 1,
  permCode:'ext:ad:placement',
  permissions: ['添加', '编辑', '删除'],
})
```

**参数说明**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | `Component` | 页面组件引用 |
| `path` | `string` | 路由路径（相对路径） |
| `name` | `string` | 页面名称（中文） |
| `icon` | `string` | 菜单图标（Element Plus Icon 名称） |
| `auth` | `boolean` | 是否需要登录 |
| `order` | `number` | 菜单排序 |
| `permCode` | `string` | 权限编码前缀 |
| `permissions` | `string[]` | 该页面需要的权限标签 |

### 7.4 路由构建（buildExtensionRoutes）

**实际代码（extension-ad）**：

```typescript
// src/frontend/src/index.ts
import { buildExtensionRoutes } from 'moyan-mfw-base/frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

export const adRoutes = buildExtensionRoutes(allConfigs, 'ad', {
  namespaceName: '广告管理',
})
```

**工作原理**：

1. `import.meta.glob` 扫描 `views/` 下所有 `index.ts` 文件
2. `buildExtensionRoutes` 将扫描结果转换为 Vue Router 路由数组
3. 路由自动挂载到 `/ext/ad` 前缀下

### 7.5 应用创建（createExtensionFrontendApp）

**实际代码（extension-ad）**：

```typescript
// src/frontend/src/main.ts
import 'moyan-mfw-base/frontend/styles/base-admin.scss'
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'
import { adRoutes } from './index'

const app = createExtensionFrontendApp({
  name: '广告管理',
  routes: adRoutes,
})

app.mount('#app')
```

**规范要点**：

- 必须导入基础样式 `base-admin.scss`
- 传入路由数组和扩展名称
- 挂载到 `#app` DOM 节点

### 7.6 api.build.cjs 配置

**实际代码（extension-ad）**：

```javascript
// api.build.cjs
const ApisdkCreator = require('moyan-api/dist/main.js').ApisdkCreator
const Program = require('moyan-api/dist/program.js').Program

const configs = [
  {
    jsonurl: 'http://localhost:3000/api-docs/ad-extension-json',
    output: './src/apis',
    dirname: 'ad',
  },
]

const create = async () => {
  for (let i = 0; i < configs.length; i++) {
    await new ApisdkCreator(new Program(configs[i])).create()
  }
}

create()
```

**规范要点**：

- `jsonurl` 指向后端 Swagger JSON 端点
- `output` 指定生成目录（必须是 `src/apis`）
- `dirname` 指定子目录名
- **禁止手动修改生成的代码**

### 7.7 页面组件示例

**实际代码（extension-ad）**：

```vue
<!--
/**
 * @fileoverview 广告位管理列表页
 * @description 卡片展示广告位，支持轮播预览广告效果
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" data-testid="placement-create-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新建广告位
      </el-button>
    </template>
    <MfwCardListPage
      ref="cardListPage"
      :search-template="searchTemplate"
      :load-data="loadData"
      render-mode="card"
      empty-text="暂无广告位"
    >
      <template #card-item="{ item }">
        <MfwAdPlacementCard
          :placement="item"
          :ads="item.ads || []"
          :ad-count="item.adCount || 0"
          @manage-ads="handleManageAds(item)"
          @edit="handleEdit(item)"
          @delete="handleDelete(item)"
        />
      </template>
    </MfwCardListPage>
    <MfwAdPlacementDetail ref="detailRef" @close="cardListPage?.refresh()" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwCardListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import type { MfwCardListPageInstance } from 'moyan-mfw-base/frontend'
import {
  ApiAdPlacementFindAll,
  ApiAdPlacementUpdate,
  ApiAdPlacementDelete,
} from '../../apis/ad'
import { StatusDict } from 'moyan-mfw-base/shared'
import MfwAdPlacementForm from '../../components/ad-placement-form/Index.vue'
import MfwAdPlacementDetail from '../../components/ad-placement-detail/Index.vue'
import MfwAdPlacementCard from '../../components/ad-placement-card/Index.vue'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementList' })

const cardListPage = ref<MfwCardListPageInstance>()
const detailRef = ref<InstanceType<typeof MfwAdPlacementDetail>>()

const searchTemplate = [
  {
    key: 'name',
    label: '名称',
    type: 'input' as const,
    testId: 'placement-search-name',
    placeholder: '请输入名称',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    testId: 'placement-search-status',
    placeholder: '请选择状态',
    elProps: {
      options: [
        { label: '启用', value: STATUS.ENABLED },
        { label: '禁用', value: STATUS.DISABLED },
      ],
    },
  },
]

const loadData = async (params: Record<string, unknown>) => {
  return await new ApiAdPlacementFindAll({ query: params as any })
}

const handleAdd = () => {
  MfwPopup.open({
    title: '新建广告位',
    type: 'dialog',
    component: MfwAdPlacementForm,
    popupProps: { width: 550 },
    on: { confirm: cardListPage.value?.refresh },
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiAdPlacementDelete({ params: { id: row.id } }, { hintSuccess: true })
  cardListPage.value?.refresh()
}
</script>
```

**关键规范**：

1. **使用 `StatusDict` 而非内联常量**
2. **删除操作必须使用 `ElMessageBox.confirm` + `{ hintSuccess: true }`**
3. **弹窗使用 `MfwPopup.open()` 而非 `emit('confirm')`**
4. **组件导入使用 `../../components/xxx/Index.vue` 路径**

---

## 第 7 章：路由与权限

### 8.1 definePageConfig 权限配置

页面级别的权限在 `definePageConfig` 中声明：

```typescript
export default definePageConfig({
  // ...
  permCode: 'ext:ad:placement',
  permissions: ['添加', '编辑', '删除'],
})
```

- `permCode`：该页面资源的权限编码前缀
- `permissions`：该页面需要的权限标签列表（与 `permission-values.ts` 中声明的标签对应）

### 8.2 v-permission 指令（前端按钮级权限）

**实际代码（extension-ad）**：

```vue
<template>
  <el-button
    v-permission="{ value: ['编辑'] }"
    @click="handleEdit"
  >
    编辑
  </el-button>
  <el-button
    v-permission="{ value: ['删除'] }"
    type="danger"
    @click="handleDelete"
  >
    删除
  </el-button>
</template>
```

**工作原理**：

- `v-permission` 接收 `{ value: string[] }` 参数
- 当前用户不具备指定权限时，按钮自动隐藏（`v-if` 语义）
- 权限标签来自 `permission-values.ts` 和框架内置标签

### 8.3 @RequirePermission 装饰器（后端接口级权限）

**实际代码（extension-ad）**：

```typescript
@Post()
@RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['添加'] })
async create(@Body() dto: CreateAdDto) { /* ... */ }

@Get()
@RequirePermission({ permCode: '*:ext:ad:*' })
async findAll(@Query() query: QueryAdDto) { /* ... */ }

@Delete(':id')
@RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['删除'] })
async delete(@Param('id', ParseUUIDPipe) id: string) { /* ... */ }
```

**参数说明**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `permCode` | `string` | 权限编码（支持通配符 `*`） |
| `permissionValue` | `string[]` | 需要的权限标签（可选，不传则仅校验资源访问权） |

**通配符规则**：

- `'*:ext:ad:*'` 匹配所有 `ad` 命名空间下的权限
- `'ad:placement:view'` 精确匹配单个权限

### 8.4 权限编码规则

权限编码采用三级结构：`{namespace}:{resource}:{action}`

```
ad:placement:view      → 广告位：查看
ad:placement:create    → 广告位：创建
ad:placement:update    → 广告位：编辑
ad:placement:delete    → 广告位：删除
ad:content:view        → 广告内容：查看
ad:content:create      → 广告内容：创建
...
```

**约束**：

- `namespace` 必须与 Manifest 的 `routePrefix` 对应（去掉 `/ext/` 前缀）
- `resource` 使用小写英文+连字符
- `action` 使用标准动词：`view` / `create` / `update` / `delete` / `publish`

---

## 第 8 章：构建工作流

### 9.1 Build 顺序

扩展包的构建必须遵循严格的依赖顺序：

```
shared → backend → frontend
```

**原因**：

- `backend` 依赖 `shared` 的类型定义
- `frontend` 依赖 `shared` 的类型定义和 `backend` 的 API 定义（moyan-api 生成）

**实际 scripts（extension-ad/package.json）**：

```json
{
  "scripts": {
    "build:shared": "pnpm --filter @internal/ad-shared build",
    "build:backend": "pnpm --filter moyan-mfw-base run build:shared && pnpm --filter moyan-mfw-base run build:backend && pnpm --filter @internal/ad-backend build",
    "build:frontend": "pnpm --filter @internal/ad-frontend build",
    "build": "pnpm run build:shared && pnpm run build:backend && pnpm run build:frontend"
  }
}
```

### 9.2 Dev 模式热重载

```bash
# 后端（监听 3002 端口，支持 NestJS 热重载）
pnpm dev:backend

# 前端（监听 5173 端口，Vite HMR）
pnpm dev:frontend
```

### 9.3 moyan-api 生成流程

1. 启动后端 dev server（`pnpm dev:backend`）
2. 运行 API 生成：

```bash
# 方式一：直接执行配置文件
node api.build.cjs

# 方式二：使用 npm script（需在 package.json 中配置）
pnpm generate:api
```

3. 生成的代码位于 `src/apis/` 目录：

```
src/apis/
└── ad/
    ├── index.ts        # API 调用类
    └── schemas.ts      # 类型定义
```

**重要**：`apis/` 目录下的代码**禁止手动修改**，任何变更都应通过重新生成实现。

### 9.4 typecheck 命令

```bash
# 检查所有层
pnpm typecheck

# 分别检查各层
pnpm typecheck:shared
pnpm typecheck:backend
pnpm typecheck:frontend
```

**硬性要求**：所有 `.ts` 文件必须通过 `tsc --noEmit` 类型验证，零错误是发布前提。

---

## 第 9 章：Checklist

### 发布前检查清单（15 项）

#### ✅ 结构完整性（5 项）

- [ ] **1. 三段式目录完整**：`src/backend/`、`src/frontend/`、`src/shared/` 均存在且非空
- [ ] **2. Shared 五模块齐全**：`constants.ts`、`dict.ts`、`types.ts`、`paths.ts`、`permission-values.ts` 均存在
- [ ] **3. exports 配置正确**：`package.json` 中 `./backend`、`./frontend`、`./shared` 三条导出路径正确
- [ ] **4. Manifest 字段完整**：所有必填字段已填写，`routePrefix` 以 `/ext/` 开头
- [ ] **5. 聚合入口存在**：根目录 `src/index.ts` 正确 re-export 各层

#### ✅ 代码规范（5 项）

- [ ] **6. Entity 继承 Base**：所有实体类继承 `moyan-mfw-base/backend` 的 `Base` 类
- [ ] **7. Controller 使用 base API**：使用 `AuthGuard`、`RequirePermission`、`ApiResponseUtil` 等
- [ ] **8. 组件 Mfw 命名**：`components/` 下所有组件使用 `Mfw` 前缀（如 `MfwAdCard`）
- [ ] **9. 页面 definePageConfig**：`views/` 下每个页面都有对应的 `index.ts` 配置
- [ ] **10. Swagger 装饰器来源正确**：从 `moyan-mfw-core` 导入（非 `@nestjs/swagger` 直接导入）

#### ✅ 安全性（3 项）

- [ ] **11. 删除接口有确认框**：前端删除操作使用 `ElMessageBox.confirm`
- [ ] **12. 删除接口 hintSuccess**：API 调用传入 `{ hintSuccess: true }`
- [ ] **13. 无硬编码密钥**：代码中不包含任何密钥、密码、Token 等敏感信息

#### ✅ 文档与测试（2 项）

- [ ] **14. JSDoc 注释完整**：每个文件都有 `@fileoverview` + `@description`
- [ ] **15. 类型检查零错误**：运行 `pnpm typecheck` 确认无 TypeScript 错误

---

## 附录：常用命令速查

| 命令 | 说明 |
|------|------|
| `mfw create extension <name>` | 创建新扩展项目 |
| `mfw create business <name>` | 创建新业务项目（后端+前端+共享层） |
| `pnpm install` | 安装依赖 |
| `pnpm dev:backend` | 启动后端开发服务器 |
| `pnpm dev:frontend` | 启动前端开发服务器 |
| `pnpm build` | 构建所有层（shared → backend → frontend） |
| `pnpm typecheck` | 全量类型检查 |
| `node api.build.cjs` | 生成 API 调用代码 |
| `pnpm gen:module` | 生成后端 NestJS 模块骨架 |
| `pnpm gen:page` | 生成前端页面骨架 |
| `pnpm gen:component` | 生成前端组件骨架 |
