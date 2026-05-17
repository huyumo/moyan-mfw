# 架构说明

> 本文档描述 MFW 扩展的运行时架构，包括后端加载流程、前端路由注册、共享层数据流和依赖关系。

---

## 目录

- [整体架构概览](#整体架构概览)
- [后端加载流程](#后端加载流程)
- [前端路由注册](#前端路由注册)
- [共享层数据流](#共享层数据流)
- [扩展与 base 包的依赖方向图](#扩展与-base-包的依赖方向图)
- [运行时交互时序](#运行时交互时序)

---

## 整体架构概览

### 三段式架构

MFW 扩展采用**三段式分层架构**，每个扩展独立包含后端、前端、共享三层：

```
┌─────────────────────────────────────────────────────────────┐
│                    extension-ad (聚合包)                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   backend   │  │  frontend   │  │   shared    │         │
│  │  (NestJS)   │  │   (Vue3)    │  │    (TS)     │         │
│  │             │  │             │  │             │         │
│  │ • main.ts   │  │ • main.ts   │  │ • constants │         │
│  │ • module    │  │ • index.ts  │  │ • dict      │         │
│  │ • controller│  │ • views/    │  │ • types     │         │
│  │ • service   │  │ • components│  │ • paths     │         │
│  │ • entity    │  │ • apis/     │  │ • permission│         │
│  │ • dto       │  │             │  │             │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    moyan-mfw-base                            │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   backend   │  │  frontend   │  │   shared    │         │
│  │             │  │             │  │             │         │
│  │ • createExt │  │ • createExt │  │ • DictMeta  │         │
│  │ • AuthGuard │  │ • buildRoute│  │ • DictEntry │         │
│  │ • Require   │  │ • Mfw*      │  │ • StatusDict│         │
│  │ • Base      │  │ • definePage│  │ • Base      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**设计原则**：

1. **单向依赖**：扩展 → base，禁止反向依赖
2. **层间隔离**：backend/frontend 仅通过 shared 通信类型信息
3. **独立可运行**：每层可独立启动（dev 模式）

---

## 后端加载流程

### 完整启动链路

```
用户执行: pnpm dev:backend
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Node.js 加载 src/backend/src/main.ts                  │
│                                                          │
│    import 'reflect-metadata'                              │
│    import { createExtensionBackendApp } from 'moyan-mfw-base/backend' │
│    import { AdModule, AdPlacement, Ad } from './index'   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. 调用 createExtensionBackendApp(options)               │
│                                                          │
│    options = {                                           │
│      name: 'ad',          // kebab-case 简名（必选）     │
│      module: AdModule,    // NestJS 根模块（必选）       │
│      entities: [AdPlacement, Ad], // TypeORM 实体（可选）│
│    }                                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. 自动构建配置                                          │
│                                                          │
│    • routePrefix = `/ext/${name}` → `/ext/ad`            │
│    • displayName = toPascalCase(name) → "Ad"            │
│    • Swagger 分组自动配置                                │
│    • CORS 跨域已启用                                     │
│                                                          │
│    输出: [Extension] 🚀 启动扩展: Ad                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. 调用 createBaseBackendApp()                          │
│                                                          │
│    内部流程：                                             │
│    a. 创建 NestJS Application 实例                       │
│    b. 注册全局模块 (ConfigModule, TypeOrmModule...)      │
│    c. 注册扩展模块 (AdModule)                            │
│    d. 配置 Swagger 文档                                  │
│    e. 注册全局管道 (ValidationPipe)                      │
│    f. 注册全局过滤器 (AllExceptionsFilter)              │
│    g. 注册全局拦截器 (LoggingInterceptor)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 5. result.listen(3002)                                   │
│                                                          │
│    输出:                                                  │
│    [NestApplication] Nest application successfully       │
│    started on http://localhost:3002                      │
│                                                          │
│    可访问:                                                │
│    - http://localhost:3002/api-docs/sys → Swagger UI    │
│    - http://localhost:3002/ext/ad/* → Extension API      │
└─────────────────────────────────────────────────────────┘
```

### 关键代码路径

**入口文件** ([main.ts](../../../packages/extensions/extension-ad/src/backend/src/main.ts))：

```typescript
import { NestFactory } from '@nestjs/core'
import { AdModule } from './ad.module'
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'

async function bootstrap() {
  const app = await createExtensionBackendApp({
    name: 'ad',
    module: AdModule,
    entities: [AdPlacement, Ad],
  })

  await app.listen(3002)
}

bootstrap()
```

`createExtensionBackendApp` 内部自动完成：
- 路由前缀推导（`/ext/ad`）
- displayName 推导（`Ad`）
- Swagger 分组配置
- CORS 启用

### 后端请求处理流水线

```
HTTP Request
    │
    ▼
┌─────────────┐
│    CORS     │ ← 跨域校验
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  AuthGuard  │ ← JWT Token 解析与验证
└──────┬──────┘
       │
       ▼
┌─────────────┐
│PermissionGuard│ ← RBAC + Bitwise 权限校验
│(@RequirePerm)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ValidationPipe│ ← DTO 自动校验 (class-validator)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│LoggingInter-│ ← 请求日志记录
│    ceptor   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │ ← 业务路由处理
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Service  │ ← 业务逻辑执行
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ AuditInter- │ ← 操作审计记录
│   ceptor    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│TransformInter│ ← 统一响应格式包装
│   ceptor    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ AllException│ ← 全局异常处理
│   Filter    │
└──────┬──────┘
       │
       ▼
HTTP Response
```

---

## 前端路由注册

### 完整注册流程

```
用户执行: pnpm dev:frontend
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Vite 加载 src/frontend/src/main.ts                    │
│                                                          │
│    import 'moyan-mfw-base/frontend/styles/base-admin.scss'│
│    import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend' │
│    import { adRoutes } from './index'                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. 加载 src/frontend/src/index.ts                        │
│                                                          │
│    import { buildExtensionRoutes } from 'moyan-mfw-base/frontend' │
│                                                          │
│    const allConfigs = import.meta.glob(                  │
│      './views/**/index.{ts,tsx}',                        │
│      { eager: true, import: 'default' }                  │
│    )                                                     │
│                                                          │
│    export const adRoutes = buildExtensionRoutes(          │
│      allConfigs, 'ad', { namespaceName: '广告管理' }     │
│    )                                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. import.meta.glob 静态扫描                              │
│                                                          │
│    扫描结果（eager 模式，构建时确定）：                     │
│    {                                                      │
│      './views/placement/index.ts': {                     │
│        page: PlacementList,                              │
│        path: 'placement',                                │
│        name: '广告位管理',                                │
│        permissions: ['添加', '编辑', '删除'],            │
│        // ...                                            │
│      }                                                   │
│    }                                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 4. buildExtensionRoutes() 构建 Vue Router 配置           │
│                                                          │
│    输入: allConfigs + namespace + options                 │
│    输出: RouteRecordRaw[]                                 │
│                                                          │
│    生成的路由结构：                                        │
│    [                                                      │
│      {                                                    │
│        path: '/ext/ad/placement',                         │
│        name: 'ad-placement',                             │
│        component: PlacementList,                          │
│        meta: {                                           │
│          auth: true,                                      │
│          permCode: 'ext:ad:placement',                   │
│          permissions: ['添加', '编辑', '删除'],          │
│        },                                                │
│      },                                                  │
│      // ... 更多路由                                      │
│    ]                                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 5. createExtensionFrontendApp() 创建 Vue 应用            │
│                                                          │
│    内部流程：                                             │
│    a. 创建 Vue App 实例                                  │
│    b. 安装 Element Plus                                  │
│    c. 安装 Vue Router (使用步骤4的路由配置)              │
│    d. 安装 Pinia Store                                   │
│    e. 注册全局组件 (MfwPageWrapper, MfwDictFormat...)   │
│    f. 注册自定义指令 (v-permission)                      │
│    g. 导入基础样式                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 6. app.mount('#app')                                     │
│                                                          │
│    输出:                                                  │
│    VITE v5.x.x ready in xxx ms                           │
│                                                          │
│    ➜  Local: http://localhost:5173/                     │
│                                                          │
│    可访问:                                                │
│    - http://localhost:5173/ext/ad/placement              │
└─────────────────────────────────────────────────────────┘
```

### 关键代码路径

**路由构建** ([index.ts](../../../packages/extensions/extension-ad/src/frontend/src/index.ts))：

```typescript
import { buildExtensionRoutes } from 'moyan-mfw-base/frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

export const adRoutes = buildExtensionRoutes(allConfigs, 'ad', {
  namespaceName: '广告管理',
})
```

**页面配置** ([views/placement/index.ts](../../../packages/extensions/extension-ad/src/frontend/src/views/placement/index.ts))：

```typescript
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

**应用创建** ([main.ts](../../../packages/extensions/extension-ad/src/frontend/src/main.ts))：

```typescript
import 'moyan-mfw-base/frontend/styles/base-admin.scss'
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'
import { adRoutes } from './index'

const app = createExtensionFrontendApp({
  name: '广告管理',
  routes: adRoutes,
})

app.mount('#app')
```

### 路由扫描机制

`import.meta.glob` 是 Vite 的**静态分析功能**，在构建时确定文件列表：

```javascript
// 开发模式：基于文件系统实时扫描
const modules = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,      // 立即加载（非懒加载）
  import: 'default', // 只导入 default export
})

// 生产模式：构建时生成映射表
// 结果类似于：
{
  './views/placement/index.ts': () => import('./views/placement/index.ts'),
}
```

**目录约定**：

```
views/
├── index.ts              # 不参与路由（仅作为 glob 匹配的根）
├── placement/
│   ├── Index.vue         # 页面组件
│   └── index.ts          # 页面配置 → 生成路由 /ext/ad/placement
└── content/
    ├── Index.vue
    └── index.ts          # → 生成路由 /ext/ad/content
```

---

## 共享层数据流

### 数据流向

Shared 层是前后端之间的**类型桥梁**，数据流如下：

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   backend   │         │   shared    │         │  frontend   │
│             │         │             │         │             │
│  Entity     │ ──────> │  types.ts   │ <────── │  API 调用   │
│  (数据库映射)│  类型定义 │  (接口声明) │  类型消费 │  (响应处理) │
│             │         │             │         │             │
│  Service    │ <────── │ constants.ts│ ──────> │  表单验证   │
│  (业务逻辑)  │  常量引用 │  (常量值)  │  常量引用 │  (下拉选项) │
│             │         │             │         │             │
│  Controller │ <────── │   dict.ts   │ ──────> │  字典渲染   │
│  (API 响应)  │  字典注册 │  (字典定义) │  字典消费 │  (标签展示) │
│             │         │             │         │             │
│  main.ts    │ <────── │ permission- │ ──────> │  权限控制   │
│  (权限注入)  │  标签收集 │  values.ts │  标签声明 │  (按钮显隐) │
└─────────────┘         └─────────────┘         └─────────────┘
```

### 具体示例：LinkType 数据流

#### 1. Shared 层定义（[constants.ts](../../../packages/extensions/extension-ad/src/shared/src/constants.ts)）

```typescript
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

#### 2. Backend 层使用（[types.ts](../../../packages/extensions/extension-ad/src/shared/src/types.ts)）

```typescript
import type { LinkType } from './constants'

export interface AdItem {
  // ...
  linkType: LinkType  // 使用 shared 定义的类型
  linkUrl?: string
  // ...
}
```

Entity 使用该类型进行字段约束：

```typescript
@Column({ type: 'varchar', length: 32, comment: '跳转类型' })
@Index()
linkType: string  // 数据库存储为 string，但语义受 LinkType 约束
```

#### 3. Frontend 层使用（组件中）

```vue
<template>
  <el-select v-model="form.linkType" placeholder="请选择跳转类型">
    <el-option
      v-for="(label, value) in LINK_TYPE_LABELS"
      :key="value"
      :label="label"
      :value="value"
    />
  </el-select>
</template>

<script setup lang="ts">
import { LINK_TYPE, LINK_TYPE_LABELS } from 'moyan-mfw-extension-ad/shared'
</script>
```

### 编译时 vs 运行时

| 场景 | Shared 层作用 |
|------|--------------|
| **编译时** | TypeScript 类型检查，确保前后端接口一致 |
| **运行时（Backend）** | 提供常量值、字典元数据、权限标签列表 |
| **运行时（Frontend）** | 提供常量值、字典枚举、类型守卫 |

**关键点**：Shared 层被打包进 backend 和 frontend 的产物中，**不会产生独立的运行时包**。

---

## 扩展与 base 包的依赖方向图

### 严格单向依赖

```
                    ┌─────────────────────────────────┐
                    │        moyan-mfw-base            │
                    │      (框架核心 - 无外部依赖)      │
                    │                                 │
                    │  exports:                        │
                    │  ├── ./backend  (NestJS 工厂)    │
                    │  ├── ./frontend (Vue 组件/工具)  │
                    │  └── ./shared   (类型/装饰器)    │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────┼───────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │ extension-A  │  │ extension-B  │  │ extension-C  │
           │              │  │              │  │              │
           │ depends:     │  │ depends:     │  │ depends:     │
           │ • base       │  │ • base       │  │ • base       │
           │ • B (optional│  │ • A (required│  │ • base only  │
           └──────────────┘  └──────────────┘  └──────────────┘
```

### 依赖规则

| 规则 | 说明 | 示例 |
|------|------|------|
| ✅ 允许 | Extension → Base | `import { Base } from 'moyan-mfw-base/backend'` |
| ✅ 允许 | Extension → Extension（声明式） | `requiredExtensions: ['ext-B']` |
| ❌ 禁止 | Base → Extension | 框架不能反向依赖扩展 |
| ❌ 禁止 | 循环依赖 | A → B → A |

### 包导出映射

扩展包的 `package.json` 通过 `exports` 字段实现三层导出：

```json
{
  "name": "moyan-mfw-extension-ad",
  "exports": {
    "./backend": {
      "require": "./src/backend/dist/index.js",
      "types": "./src/backend/dist/index.d.ts"
    },
    "./frontend": {
      "import": "./src/frontend/dist/index.mjs",
      "require": "./src/frontend/dist/index.js",
      "types": "./src/frontend/dist/index.d.ts"
    },
    "./shared": {
      "import": "./src/shared/dist/index.js",
      "require": "./src/shared/dist/index.js",
      "types": "./src/shared/dist/index.d.ts"
    }
  }
}
```

**消费者使用方式**：

```typescript
// 业务层后端
import { AdModule } from 'moyan-mfw-extension-ad/backend'

// 业务层前端
import { adRoutes } from 'moyan-mfw-extension-ad/frontend'

// 任意层（类型/常量）
import { LinkType, AD_PATHS } from 'moyan-mfw-extension-ad/shared'
```

---

## 运行时交互时序

### 典型场景：用户查看广告列表

```
时间轴 →

[浏览器]                    [Frontend]                  [Backend]                    [Database]
  │                           │                           │                             │
  │  1. 访问 /ext/ad/placement│                           │                             │
  │ ─────────────────────────>│                           │                             │
  │                           │                           │                             │
  │                           │  2. Vue Router 匹配路由    │                             │
  │                           │  权限校验 (v-permission)   │                             │
  │                           │                           │                             │
  │                           │  3. 渲染 PlacementList     │                             │
  │                           │  触发 loadData()           │                             │
  │                           │                           │                             │
  │                           │  4. API 调用               │                             │
  │                           │  GET /ext/ad/placements    │                             │
  │                           │ ──────────────────────────>│                             │
  │                           │                           │                             │
  │                           │                           │  5. AuthGuard 验证 JWT      │
  │                           │                           │  6. PermissionGuard 校验    │
  │                           │                           │  7. ValidationPipe 校验     │
  │                           │                           │                             │
  │                           │                           │  8. Service.findAll()       │
  │                           │                           │ ──────────────────────────>│
  │                           │                           │                             │
  │                           │                           │  9. SQL 查询               │
  │                           │                           │  SELECT * FROM ext_ad_...  │
  │                           │                           │<──────────────────────────│
  │                           │                           │                             │
  │                           │                           │ 10. 返回分页数据            │
  │                           │<──────────────────────────│                             │
  │                           │                           │                             │
  │  11. 更新视图（卡片列表）  │                           │                             │
  │<──────────────────────────│                           │                             │
  │                           │                           │                             │
  │  12. 用户点击"删除"按钮    │                           │                             │
  │ ─────────────────────────>│                           │                             │
  │                           │  13. ElMessageBox.confirm  │                             │
  │  14. 确认删除              │                           │                             │
  │ ─────────────────────────>│                           │                             │
  │                           │                           │                             │
  │                           │  15. DELETE /ext/ad/:id    │                             │
  │                           │ ──────────────────────────>│                             │
  │                           │                           │  16. soft delete (deleteAt) │
  │                           │<──────────────────────────│                             │
  │                           │  17. 刷新列表              │                             │
  │  18. 更新视图              │                           │                             │
  │<──────────────────────────│                           │                             │
```

### Dev 模式热重载流程

```
[开发者修改代码]
       │
       ▼
[Vite HMR / NestJS Watch]
       │
       ├─→ Frontend: 重新编译该模块 → WebSocket 通知浏览器 → 局部更新 DOM
       │
       └─→ Backend: 重新编译 TypeScript → 重启 NestJS 服务（或热替换）
              │
              └─→ Swagger 文档自动更新
```

---

## 总结

### 架构优势

1. **松耦合**：扩展间通过 `requiredExtensions` 声明依赖，无硬编码耦合
2. **类型安全**：Shared 层确保前后端接口一致性
3. **独立开发**：每层可独立启动，降低开发门槛
4. **统一规范**：Base 包封装通用逻辑，避免重复代码
5. **可测试性**：清晰的分层便于单元测试和集成测试

### 排查问题指南

| 问题现象 | 可能原因 | 排查方向 |
|----------|----------|----------|
| 启动报错 `缺少模块` | NestJS 模块未注册 | 检查 `main.ts` 中 `module` 参数是否正确 |
| API 路由无法访问 | routePrefix 不正确 | 框架自动推导 `/ext/{name}`，检查 name 参数 |
| 前端路由 404 | views 目录结构不符合约定 | 检查 `index.ts` 是否存在且导出 default |
| API 调用 404 | 后端 Controller 路由未注册 | 检查 Module 中 RouterModule 配置 |
| 类型检查失败 | Shared 层类型不同步 | 重新 build shared 并重启前后端 |
