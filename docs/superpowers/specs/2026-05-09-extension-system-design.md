# MFW 扩展功能包系统架构设计

## 概述

本文档定义 MFW 框架的扩展功能包（Extension Package）系统架构。扩展包类似平台插件，为框架提供可插拔的功能模块（如支付、账本、AI 助手、流程引擎等），实现前后端一体化的功能扩展。

***

## 1. 整体架构

### 1.1 存储与分发：混合模式

采用**两阶段混合模式**，兼顾开发效率与未来可演进性。

**阶段一（当前—开发实验期）**：扩展包内联于 monorepo

```
packages/
├── base-backend/                  # 后端基础设施（moyan-base-backend）
├── base-frontend/                 # 前端基础设施（moyan-mfw-base-frontend）
└── extensions/                    # 扩展包集合
    ├── extension-payment/         # moyan-extension-payment
    ├── extension-ledger/          # moyan-extension-ledger
    ├── extension-ai-assistant/    # moyan-extension-ai-assistant
    └── extension-workflow/        # moyan-extension-workflow
```

**阶段二（成熟后—发布 npm）**：扩展包迁至独立仓库发布为 npm 包

```bash
pnpm add moyan-extension-payment
pnpm add moyan-extension-ledger
```

**关键保障**：阶段一严格按独立包接口规范组织，阶段二只做物理迁移，零代码改动。

### 1.2 加载注册：声明式配置（方案 A）

业务应用通过声明式配置启用扩展包。扩展包的 NestJS Module 通过 `modules`（现有字段）注入，实体通过 `entities`（新增字段）注入，**权限位值由业务层在** **`permissions.config.ts`** **中集中分配**。

```typescript
// backend/src/main.ts
import { PaymentModule, PayOrder, PayRefund } from 'moyan-extension-payment/backend'
import { LedgerModule, LedgerEntry } from 'moyan-extension-ledger/backend'
import { permissionValueMap } from './permissions.config'

createBaseBackendApp({
  modules: [PaymentModule, LedgerModule],
  entities: [PayOrder, PayRefund, LedgerEntry],
  permissionValues: permissionValueMap,   // 集中权限配置（需扩展现有字段类型）
  hooks: {
    onDatabaseReady: async (ctx) => {
      await ctx.dataSource.runMigrations()
    }
  }
})
```

> **注意**：`entities` 字段需要在 `CreateBaseBackendAppOptions` 中新增，`permissionValues` 需从 `string[]` 扩展到 `string[] | Record<string, bigint>` 以支持显式位值映射。

### 1.3 扩展包形态：单包双入口

每个扩展包是一个 npm 包，通过 `package.json` 的 `exports` 同时暴露前后端入口。

```jsonc
{
  "name": "moyan-extension-payment",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./backend": "./src/backend/index.ts",
    "./frontend": "./src/frontend/index.ts",
    "./shared": "./src/shared/index.ts"
  },
  "peerDependencies": {
    "moyan-base-backend": "workspace:*",
    "moyan-mfw-base-frontend": "workspace:*"
  }
}
```

***

## 2. 扩展包实现方案

### 2.1 标准目录结构

```
moyan-extension-payment/
├── package.json
├── tsconfig.json
├── README.md                       # 必选：文档
├── extension.json                  # 元信息清单
│
├── src/
│   ├── index.ts                    # 顶层导出
│   │
│   ├── backend/                    # ====== 服务端 ======
│   │   ├── index.ts                # 导出：Module、hooks、权限节点
│   │   ├── payment.module.ts       # NestJS 动态模块
│   │   ├── payment.controller.ts   # API 控制器
│   │   ├── payment.service.ts      # 业务逻辑
│   │   ├── entities/               # TypeORM 实体
│   │   └── dto/                    # 请求/响应 DTO
│   │
│   ├── frontend/                   # ====== 客户端 ======
│   │   ├── index.ts                # 导出：routes、扩展插槽
│   │   ├── views/                  # 页面（definePageConfig 注册路由）
│   │   ├── components/             # UI 组件
│   │   ├── composables/            # 组合式函数
│   │   └── stores/                 # Pinia stores
│   │
│   └── shared/                     # ====== 共享 ======
│       ├── types.ts                # 前后端通信接口类型
│       └── constants.ts            # 共享常量
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### 2.2 服务端组件设计

**权限模型说明**：MFW 权限系统分为两层——

- **`permCode`**（权限编码）：页面/API 级标识，按树结构自动组装，如 `pc_root:ext:payment:order`
- **`permissionValue`**（权限位值）：每个 permCode 对应的位运算值，由 `buildPerValue()` 按全局权限名数组索引计算

扩展包只声明 `permCode` 节点（在 `extension.json` 中），**位值由业务层统一在** **`permissions.config.ts`** **中分配**。

**扩展包后端入口**：导出 NestJS 模块、TypeORM 实体、生命周期钩子。

```typescript
// src/backend/index.ts
export { PaymentModule } from './payment.module'
export { PayOrder, PayRefund } from './entities'

export class PaymentExtension implements IExtensionLifecycle {
  async onInstall(ctx)   { /* 建表、初始化数据 */ }
  async onEnable(ctx)    { /* 注册事件监听、启动定时任务 */ }
  async onDisable(ctx)   { /* 注销事件监听、暂停任务 */ }
  async onUpgrade(f, t, ctx) { /* 数据迁移 */ }
  async onDowngrade(f, t, ctx) { /* 反向迁移 */ }
  async onUninstall(ctx) { /* 清理数据 */ }
}

export const paymentLifecycle = new PaymentExtension()
```

**API 控制器**：使用 `permCode` 进行权限检查。

```typescript
// src/backend/payment.controller.ts
@Controller('payment/orders')           // 全局前缀 /api/ext 由主框架统一加
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get()
  @RequirePermission('payment:order:view')
  @ApiPaginatedResponse(OrderDto)
  async findAll(@Query() query: OrderQueryDto, @PaginationX() pagination: PaginationX) {
    return this.service.findAll(query, pagination)
  }

  @Post()
  @RequirePermission('payment:order:create')
  async create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto)
  }
}
```

**API 路径规范**：`/api/ext/{功能名}/{资源}`

### 2.3 客户端组件设计

**扩展包前端入口**：扩展包在自己的 `src/frontend/` 内用 `import.meta.glob` 扫描 views，调用 `buildRoutesFromConfigs()` 预构建为 `RouteRecordRaw[]` 数组导出。消费方通过 `createBaseAdminApp` 的 `extraRoutes`（现有字段）接收。

```typescript
// src/frontend/index.ts
import { buildRoutesFromConfigs } from 'moyan-mfw-base-frontend'

// 扫描扩展包自身的 views 目录，预构建路由
const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

export const paymentRoutes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 })
```

**页面注册**：使用 `definePageConfig()` 注册路由和菜单。

```typescript
// src/frontend/views/order/index.ts
import { definePageConfig } from 'moyan-mfw-base-frontend'
import OrderList from './Index.vue'

export default definePageConfig({
  page: OrderList,               // 必填：Vue 组件
  path: 'orders',                // 必填：相对路径
  name: '支付订单',               // 必填：菜单名称
  icon: 'Money',                 // 可选：菜单图标
  auth: true,                    // 可选：是否需要认证
  order: 10,                     // 可选：菜单排序
  // permissionValue 由业务层在 permissions.config.ts 中为 'payment:order:view' 分配
  // definePageConfig 支持直接传入 permissionValue
  permissionValue: 0x0100_0001n,  // 与业务层 permissions.config.ts 中 payment:order:view 的值一致
})
```

**模块分组**：通过 `defineModuleConfig` 在父级目录创建菜单分组。

```typescript
// src/frontend/views/index.ts
import { defineModuleConfig } from 'moyan-mfw-base-frontend'

export default defineModuleConfig({
  type: 'module',
  name: '支付管理',
  icon: 'Money',
  order: 20,
})
```

**前端路由前缀**：扩展包页面路由统一在 `packages/extensions/` 的 `src/frontend/views/` 目录下组织，实际 URL 路径由 `definePageConfig.path` 决定。建议统一使用 `ext/{功能}/` 前缀目录结构。

**业务应用集成**：

```typescript
// frontend/src/main.ts
import { paymentRoutes } from 'moyan-extension-payment/frontend'

createBaseAdminApp({
  extraRoutes: [...paymentRoutes],    // 通过现有 extraRoutes 字段注入
})
```

> **注意**：扩展包的前端路由构建在扩展包自身模块中完成（`import.meta.glob` 的路径作用域是当前包），消费方只需 import 预构建好的 `RouteRecordRaw[]` 数组。

### 2.4 扩展包配置体系

#### 核心原则：扩展包暴露节点 → 业务层统一分配值

```
扩展包 A                      扩展包 B（第三方）
  │                              │
  │ 暴露 "我需要付款、退款"        │ 暴露 "我需要记账"
  │ (只声明标识符，不指定值)        │
  │                              │
  └──────────┬───────────────────┘
             ↓
     业务层统一配置（开发者掌控）
     ┌─────────────────────────────────┐
     │ payment:pay  → 0x0100_0001n     │  ← 开发者分配，确保不冲突
     │ payment:refund → 0x0100_0002n   │
     │ ledger:write → 0x0200_0001n     │
     └─────────────────────────────────┘
             ↓
        框架校验 & 注册
        (遗漏 → 启动报错；冲突 → 启动报错)
```

#### 扩展包：只声明 `permCode` 节点（不分配值）

**`extension.json`**：

```json
{
  "name": "moyan-extension-payment",
  "version": "0.1.0",
  "displayName": "支付管理",
  "description": "提供支付订单管理、退款处理等功能",
  "permCodeNodes": [
    { "permCode": "payment:order",   "permName": "支付订单",   "nodeType": "PAGE", "group": "支付管理" },
    { "permCode": "payment:order:view",  "permName": "查看支付订单", "nodeType": "TAG", "group": "支付管理" },
    { "permCode": "payment:order:create","permName": "创建支付订单", "nodeType": "TAG", "group": "支付管理" },
    { "permCode": "payment:order:delete","permName": "删除支付订单", "nodeType": "TAG", "group": "支付管理" },
    { "permCode": "payment:refund",  "permName": "退款管理",   "nodeType": "PAGE", "group": "退款管理" },
    { "permCode": "payment:refund:apply",  "permName": "申请退款", "nodeType": "TAG", "group": "退款管理" },
    { "permCode": "payment:refund:approve","permName": "审批退款", "nodeType": "TAG", "group": "退款管理" }
  ],
  "requiredExtensions": [],
  "optionalExtensions": ["moyan-extension-ledger"],
  "appTypes": ["*"],
  "minFrameworkVersion": "1.0.0"
}
```

> **`permCodeNodes`** **是扩展包唯一声明的权限信息**。其中 `permCode` 只定义标识符路径，**不分配位值**。位值由业务层统一分配。

#### 业务层：统一分配权限位值

开发者在一个集中的配置文件中，为所有扩展包声明的权限节点分配位值：

```typescript
// backend/src/permissions.config.ts
export const permissionValueMap: Record<string, bigint> = {
  // ======== 支付扩展包 ========
  'payment:order:view':   0x0100_0001n,
  'payment:order:create': 0x0100_0002n,
  'payment:order:delete': 0x0100_0004n,
  'payment:refund:apply':  0x0100_0008n,
  'payment:refund:approve':0x0100_0010n,

  // ======== 账本扩展包 ========
  'ledger:entry:view':    0x0200_0001n,
  'ledger:entry:create':  0x0200_0002n,
  'ledger:entry:approve': 0x0200_0004n,
}
```

#### 框架校验：启动时三重检查

```typescript
// base-backend 内部校验逻辑（启动时自动执行）
function validateExtensionPermissions(
  allExtensions: ExtensionManifest[],     // 所有扩展包的 extension.json 内容
  permissionValueMap: Record<string, bigint>,
) {
  // 1. 收集所有扩展包声明的 permCode
  const declaredPermCodes = new Set<string>()
  for (const ext of allExtensions) {
    for (const node of ext.permCodeNodes) {
      declaredPermCodes.add(node.permCode)
    }
  }

  // 2. 检查：每个扩展包声明的节点是否都分配了值
  for (const permCode of declaredPermCodes) {
    if (!(permCode in permissionValueMap)) {
      throw new Error(`权限节点 "${permCode}" 未在 permissions.config.ts 中分配位值`)
    }
  }

  // 3. 检查：位值是否有冲突（不同节点分配到相同位值）
  const valueToPermCode = new Map<bigint, string>()
  for (const [permCode, value] of Object.entries(permissionValueMap)) {
    const existing = valueToPermCode.get(value)
    if (existing) {
      throw new Error(
        `位值冲突：${existing} 和 ${permCode} 被分配了相同的位值 0x${value.toString(16)}`
      )
    }
    valueToPermCode.set(value, permCode)
  }
}
```

#### 冲突场景与解决方案

| 场景                                                   | 表现           | 框架行为                        |
| ---------------------------------------------------- | ------------ | --------------------------- |
| 扩展 A 声明 `payment:view`，扩展 B 也声明 `payment:view`       | 同一个 permCode | 业务层只需分配一个值（业务层决定：合并 or 重命名） |
| 扩展 A 的 `payment:view` 和扩展 B 的 `ledger:view` 被分配到相同位值 | 不同节点相同值      | 框架**报错**阻止启动                |
| 扩展包声明了节点，业务层忘记分配                                     | 遗漏           | 框架**报错**列出未分配节点             |
| 第三方扩展包声明的节点名与内置扩展包冲突                                 | permCode 同名  | 框架**警告**，业务层决定如何处理          |

#### 注入到框架

```typescript
// backend/src/main.ts
import { permissionValueMap } from './permissions.config'

createBaseBackendApp({
  permissionValues: permissionValueMap,   // 按现有字段传入（需适度扩展类型）
  // ...
})
```

***

## 3. 开发规范

### 3.1 命名规范

| 范畴            | 规范                               | 示例                                               |
| ------------- | -------------------------------- | ------------------------------------------------ |
| npm 包名        | `moyan-extension-{功能}`           | `moyan-extension-payment`                        |
| 包内目录          | `extension-{功能}/`                | `extension-payment/`                             |
| NestJS 模块     | 大驼峰 + `Module`                   | `PaymentModule`                                  |
| NestJS 控制器    | 大驼峰 + `Controller`               | `PaymentController`                              |
| NestJS 服务     | 大驼峰 + `Service`                  | `PaymentService`                                 |
| TypeORM 实体    | 大驼峰，功能做前缀                        | `PayOrder`, `PayRefund`                          |
| 数据库表名         | `ext_{功能}_{表}`                   | `ext_pay_orders`                                 |
| 数据库迁移文件       | `{timestamp}-ext-{功能}-{描述}.ts`   | `1716000001000-ext-payment-add-refund-status.ts` |
| Vue 页面        | kebab-case 目录                    | `views/order/index.ts`                           |
| 前端路由路径        | `ext/{功能}/`                      | `/ext/payment/orders`                            |
| 权限编码 permCode | `{功能}:{模块}:{操作}`                 | `payment:order:view`                             |
| 事件名           | `{功能}.{动作}`                      | `payment.completed`                              |
| API 路径        | `{功能}/{资源}`（全局前缀 `/api/ext` 统一加） | `payment/orders`                                 |

### 3.2 接口契约定义

- `extension.json` 为扩展包自描述文件的必选项
- 扩展包只能依赖 `moyan-base-backend` / `moyan-mfw-base-frontend`（向上依赖）
- 扩展包之间禁止直接 import（禁止横向依赖），通信走事件总线/服务注入
- 扩展包禁止依赖业务应用代码（禁止向下依赖）
- `shared/types.ts` 的类型变更是破坏性变更的判断依据

### 3.3 依赖管理策略

| 依赖类型               | 内容                                                        |
| ------------------ | --------------------------------------------------------- |
| `peerDependencies` | `moyan-base-backend`、`moyan-mfw-base-frontend`、NestJS、Vue |
| `dependencies`     | 扩展包专属的库（如支付宝 SDK）                                         |

### 3.4 版本控制方案

语义化版本，每个扩展包独立演进：

```
MAJOR.MINOR.PATCH

MAJOR: 不兼容的 API 变更（实体字段删除、API 路径变更）
MINOR: 向后兼容的新功能（新增实体/API/权限节点）
PATCH: 向后兼容的 bug 修复
```

***

## 4. 生命周期管理

### 4.1 状态机

```
        onInstall()       onEnable()
 [未安装] ──────→ [已安装] ──────→ [已启用]
                     ↑   │              │
                     │   │ onDisable()  │ onUpgrade()
                     │   ↓              ↓
                     │  [已禁用]    [运行中 v1→v2]
                     │   │              │
                     │   │              │ onDowngrade()
        onUninstall()│   │              │
                     │   ↓              ↓
                     └──[已卸载]    [回滚完成]
```

### 4.2 生命周期钩子接口

```typescript
// 扩展 MFW 现有 AppContext，增加扩展包自身配置
import type { AppContext } from 'moyan-base-backend'

export interface ExtensionLifecycleContext extends AppContext {
  extensionConfig: Record<string, any>    // 扩展包自定义配置
  extensionVersion: string                // 当前安装版本
}

export interface IExtensionLifecycle {
  onInstall?(ctx: ExtensionLifecycleContext): Promise<void>
  onEnable?(ctx: ExtensionLifecycleContext): Promise<void>
  onDisable?(ctx: ExtensionLifecycleContext): Promise<void>
  onUpgrade?(fromVersion: string, toVersion: string, ctx: ExtensionLifecycleContext): Promise<void>
  onDowngrade?(fromVersion: string, toVersion: string, ctx: ExtensionLifecycleContext): Promise<void>
  onUninstall?(ctx: ExtensionLifecycleContext): Promise<void>
}
```

**事件总线注册时机**：扩时包应在 `onEnable` 中注册事件监听，在 `onDisable` 中注销，防止未启用的扩展包仍响应事件。

```typescript
class PaymentExtension implements IExtensionLifecycle {
  async onEnable(ctx: ExtensionLifecycleContext) {
    const eventBus = ctx.getService<IEventBusAdapter>('EVENT_BUS')
    eventBus.on('order.created', this.onOrderCreated)
  }
  async onDisable(ctx: ExtensionLifecycleContext) {
    const eventBus = ctx.getService<IEventBusAdapter>('EVENT_BUS')
    eventBus.off('order.created', this.onOrderCreated)
  }
}
```

### 4.3 升级与回滚策略

| 场景     | 策略                                         |
| ------ | ------------------------------------------ |
| 向前兼容升级 | `onUpgrade` 执行增量迁移                         |
| 不兼容升级  | `onUpgrade` 执行完整迁移脚本，框架记录快照版本              |
| 降级/回滚  | `onDowngrade` 执行反向脚本；未提供则拒绝降级              |
| 升级失败   | 框架捕获异常 → 自动调用 `onDowngrade` 回滚             |
| 回滚也失败  | 标记 `status='error'` + 阻止启动 + 写入 audit\_log |

### 4.4 阶段一操作映射

| 操作    | 做法                               |
| ----- | -------------------------------- |
| 安装    | 放入 `packages/extensions/` + 声明配置 |
| 启用/禁用 | 注释/取消注释配置行 + 重启                  |
| 升级    | 改 `package.json` 版本号             |
| 卸载    | 删除配置 + `pnpm remove` + 手动清理数据    |

***

## 5. 与主框架集成方式

### 5.1 通信协议：事件总线 + 服务注入

**接口抽象**：

```typescript
export interface IEventBusAdapter {
  emit<T = any>(event: string, payload: T): void | Promise<void>
  on<T = any>(event: string, handler: (payload: T) => void): void
  off<T = any>(event: string, handler: (payload: T) => void): void
}
```

**适配器模式**：支持 `emitter` / `redis` / `custom` 三种适配器，通过配置切换。

```typescript
// 配置式切换适配器
createBaseBackendApp({
  eventBus: { adapter: 'emitter' },   // 开发/单实例
  // eventBus: { adapter: 'redis' },  // 多实例部署
  // eventBus: { adapter: 'custom', customAdapter: RabbitMQAdapter },
})
```

**使用场景分工**：

| 场景        | 方式               |
| --------- | ---------------- |
| 需要回执/实时查询 | 服务注入（类型安全、调用链清晰） |
| 通知类/一对多   | 事件总线（完全解耦）       |

**服务注入示例（可选依赖）**：

```typescript
@Injectable()
export class PaymentService {
  constructor(
    @Optional() @Inject('LEDGER_SERVICE') private ledger?: ILedgerService,
  ) {}

  async onPaymentSuccess(data: any) {
    await this.ledger?.createEntry(data)  // 账本包未装时安全跳过
  }
}
```

### 5.2 权限控制

**核心流程**：扩展包声明 `permCode` 节点 → 业务层分配位值 → 框架校验 → 前端/后端消费。

```
extension.json                     permissions.config.ts
  ┌──────────────────┐              ┌────────────────────────┐
  │ permCodeNodes:   │   声明      │ permissionValueMap:    │  分配
  │  payment:order:view          │  payment:order:view      │
  │  payment:order:create        │   → 0x0100_0001n         │
  │  payment:order:delete        │  payment:order:create    │
  │  payment:refund:apply        │   → 0x0100_0002n         │
  │  payment:refund:approve      │  payment:order:delete    │
  └──────────────────┘            │   → 0x0100_0004n        │
              │                   └───────────┬─────────────┘
              │                               │
              └───────────┬───────────────────┘
                          ↓
                  框架 validateExtensionPermissions()
                  1. 漏分配 → 报错
                  2. 位值冲突 → 报错
                          ↓
                  注册到 sys_permissions 表
                  
                  前端 definePageConfig({ permissionValue: 0x0100_0001n })
                  后端 @RequirePermission('payment:order:view')
```

**前端路由级权限**：`definePageConfig` 直接传入业务层分配的 `permissionValue`。

```typescript
definePageConfig({
  page: OrderList,
  path: 'orders',
  name: '支付订单',
  permissionValue: 0x0100_0001n,  // 与 permissions.config.ts 一致
})
```

**前端组件级权限**：通过路由 `meta.permissionValue` 进行按钮控制。

```typescript
const route = useRoute()
const pagePermValue = BigInt(route.meta.permissionValue as string)
// <el-button v-if="(pagePermValue & 0x0100_0004n) !== 0n">删除</el-button>
```

**后端 API 权限**：`@RequirePermission` 传入 `permCode`。

```typescript
@RequirePermission('payment:order:view')
@Get()
async findAll() { ... }
```

### 5.3 资源共享

- 数据库连接：继承 `Base` 实体，共享同一 DataSource
- Redis：通过事件总线 Redis 适配器共享
- 前端组件库（Element Plus）：由 `base-frontend` 全局注册
- 主题/布局：通过 `base-frontend` 的路由系统自动继承

***

## 6. 测试与质量保障

### 6.1 测试层级

```
tests/
├── unit/              # 纯逻辑：service、工具函数
├── integration/       # NestJS Test.createTestingModule
└── e2e/               # Playwright（可选）
```

### 6.2 关键测试场景

- **权限校验**：无权限 → 403，有权限 → 200
- **生命周期**：`onInstall` 建表验证、`onUpgrade` 迁移验证、失败自动回滚验证
- **事件总线**：emit 后订阅者正确触发
- **数据库**：实体索引验证、N+1 检测

### 6.3 CI 质量门禁

```yaml
checks:
  - pnpm lint
  - pnpm typecheck
  - pnpm test:unit          # 覆盖率 > 80%
  - pnpm test:integration
  - pnpm build
  - permission-check        # 权限节点完整性校验
  - dep-check               # 禁止横向依赖校验
```

### 6.4 性能指标

| 指标           | 阈值        |
| ------------ | --------- |
| API 响应时间 P99 | < 200ms   |
| 前端打包增量       | 懒加载，不影响首屏 |

### 6.5 开发者自检清单

- [ ] `extension.json` 完整（名称、版本、权限节点、依赖声明）
- [ ] 所有权限节点已在 README.md 文档化
- [ ] 实体继承 `Base`（软删除 + 审计字段）
- [ ] API 使用 `@ApiPaginatedResponse` 装饰器
- [ ] 删除操作有 `ElMessageBox.confirm` + `{ hintSuccess: true }`
- [ ] 前端弹窗放 `components/` 而非 `views/`
- [ ] 不依赖其他扩展包的内部实现
- [ ] `package.json` exports 双入口正确

***

## 7. 文档规范

每个扩展包必须在 `README.md` 中提供以下内容：

### 7.1 必选内容

```markdown
# moyan-extension-{功能}

## 概述
简要描述扩展包的功能和用途。

## 安装

\`\`\`bash
pnpm add moyan-extension-{功能}
\`\`\`

## 配置

### 注册扩展包模块

\`\`\`typescript
// backend/src/main.ts
import { {Feature}Module, {Feature}Entity } from 'moyan-extension-{功能}/backend'

createBaseBackendApp({
  modules: [{Feature}Module],
  entities: [{Feature}Entity],
})
\`\`\`

### 分配权限位值

在 `backend/src/permissions.config.ts` 中为扩展包的权限节点分配位值：

\`\`\`typescript
export const permissionValueMap = {
  // {功能} 扩展包
  '{feature}:{module}:view':   0x0100_0001n,
  '{feature}:{module}:create': 0x0100_0002n,
  '{feature}:{module}:delete': 0x0100_0004n,
  '{feature}:{module}:export': 0x0100_0008n,
}
\`\`\`

### 注册前端路由

\`\`\`typescript
// frontend/src/main.ts
import { {feature}Routes } from 'moyan-extension-{功能}/frontend'

createBaseAdminApp({
  extraRoutes: [...{feature}Routes],
})
\`\`\`

## 权限节点

| permCode | 名称 | 类型 | 说明 |
|----------|------|------|------|
| `{feature}:{module}:view` | 查看 | TAG | 查看资源列表 |
| `{feature}:{module}:create` | 创建 | TAG | 新增资源 |
| `{feature}:{module}:delete` | 删除 | TAG | 删除资源 |

> 以上节点由扩展包声明，位值由业务层在 `permissions.config.ts` 中统一分配。

## API 接口

| 方法 | 路径 | 说明 | 所需权限 |
|------|------|------|---------|
| GET | `/api/ext/{功能}/res` | 分页查询 | `{feature}:{module}:view` |
| POST | `/api/ext/{功能}/res` | 创建资源 | `{feature}:{module}:create` |
| DELETE | `/api/ext/{功能}/res/:id` | 删除资源 | `{feature}:{module}:delete` |

## 事件

| 事件名 | 触发时机 | 载荷 |
|--------|---------|------|
| `{功能}.completed` | 操作完成时 | `{ id: string }` |

## 依赖

| 依赖包 | 类型 | 说明 |
|--------|------|------|
| moyan-base-backend | peer | 框架基础 |
| moyan-extension-ledger | optional | 记账联动 |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 0.1.0 | 2026-05-09 | 初始版本 |
```

### 7.2 `extension.json` 规范

```json
{
  "name": "moyan-extension-{功能}",
  "version": "0.1.0",
  "displayName": "中文名称",
  "description": "功能描述",
  "permCodeNodes": [
    { "permCode": "{功能}:{模块}:view",   "permName": "查看", "nodeType": "TAG", "group": "XX管理" },
    { "permCode": "{功能}:{模块}:create", "permName": "创建", "nodeType": "TAG", "group": "XX管理" },
    { "permCode": "{功能}:{模块}:delete", "permName": "删除", "nodeType": "TAG", "group": "XX管理" }
  ],
  "requiredExtensions": [],
  "optionalExtensions": [],
  "appTypes": ["*"],
  "minFrameworkVersion": "1.0.0"
}
```

> **注意**：`permCodeNodes` 只声明权限标识符，**不包含位值**。位值由业务层在 `permissions.config.ts` 中统一分配。

***

## 附录：设计决策汇总

| 维度      | 决策                                                                  |
| ------- | ------------------------------------------------------------------- |
| 存储分发    | 混合模式（阶段一 monorepo 内联，阶段二 独立 npm）                                    |
| 加载注册    | 复刑现有 `modules`/`entities`/`permissionValues`/`extraRoutes` 字段，声明式注入 |
| 包形态     | 单包双入口（`exports` 分离前后端）                                              |
| npm 命名  | `moyan-extension-{功能}` 扁平命名                                         |
| 跨包通信    | 事件总线 + 服务注入组合                                                       |
| 事件总线    | 接口抽象 + 适配器模式（emitter/redis/custom），在 onEnable/onDisable 中注册/注销      |
| 权限控制    | 扩展包声明 permCode 节点 → 业务层统一分配位值 → 框架校验（遗漏/冲突均报错）                      |
| 生命周期    | 状态机：安装/启用/禁用/升级/降级/卸载                                               |
| 生命周期上下文 | 复用现有 `AppContext`，扩展 `ExtensionLifecycleContext`                    |
| 前端路由    | 扩展包内 `buildRoutesFromConfigs()` 预构建，通过 `extraRoutes` 注入             |
| 实体注入    | `CreateBaseBackendAppOptions` 新增 `entities` 字段                      |
| 数据库迁移   | 文件命名 `{timestamp}-ext-{功能}-{描述}.ts` 避免跨包冲突                          |
| 版本控制    | 语义化版本，独立演进                                                          |

