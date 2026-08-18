# moyan-mfw-extension-ledger

MFW 通用借贷记账管理扩展包。基于「纯异步入账 + 同步预占 + SPI 可扩展」架构，支持多实例、高并发、大数据量，补齐单体账本的并发/扩展/可靠性短板。

## 核心特性

- **纯异步入账**：制单即返回，余额入账全部经队列消费，制单 TPS ≥ 1000/实例
- **同步预占防超支**：制单事务内单条原子条件 UPDATE（`WHERE balance >= amt`），无并发超支风险
- **CAS Fencing**：两段式认领（claim_token）+ 末位 CAS，杜绝并发双入账
- **KEY 分区**：流水表 KEY(account_id) 64 分区，用户跨月查询单分区命中
- **SPI 全可替换**：存储/锁/队列/通知/字段校验 5 个扩展点，默认实现零外部依赖（单实例），多实例切 Redis
- **业务扩展字段索引化**：bizExtMappings 映射到预留索引位（extCol1~4），制单/查询均走索引
- **对账能力内置**：恒等式校验 + 增量修复（原子写调整分录），对接 extension-scheduler 定时调度
- **业务层极简接入**：懒开户（ensureAccount）、一行式制单（createBizTransfer）、审核流模板（LedgerWithdrawService，提现全流程 6 方法覆盖）、读侧类型化（TransferView/AccountView/WithdrawView）、查询聚合（sumTransfers + holder 维度）——业务层无需写任何账本 SQL

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [后端集成详解](#后端集成详解)
  - [LedgerModule.forRoot() 配置参考](#ledgermoduleforroot-配置参考)
  - [权限配置](#权限配置)
  - [数据库迁移](#数据库迁移)
- [前端集成详解](#前端集成详解)
  - [页面注册](#页面注册)
  - [业务类型扩展元数据（前端本地覆盖）](#业务类型扩展元数据前端本地覆盖)
  - [动态下拉/级联选项加载器](#动态下拉级联选项加载器)
- [Admin API 参考](#admin-api-参考)
- [SPI 接口文档](#spi-接口文档)
  - [ILedgerStorage](#iledgerstorage)
  - [ILedgerLock](#iledgerlock)
  - [ILedgerQueue](#iledgerqueue)
  - [ILedgerNotifier](#iledgernotifier)
  - [ILedgerFieldExtension](#iledgerfieldextension)
  - [SPI 默认实现与可选实现对照表](#spi-默认实现与可选实现对照表)
- [业务服务参考](#业务服务参考)
- [共享类型参考](#共享类型参考)
- [实体字段参考](#实体字段参考)
- [字典/枚举值表](#字典枚举值表)
- [实例演示](#实例演示)
- [部署硬约束](#部署硬约束)
- [架构概览](#架构概览)
- [状态机](#状态机post_status)
- [XACK 协议](#xack-协议消息可靠性)
- [容量与性能](#容量与性能)
- [License](#license)

---

## 安装

```bash
pnpm add moyan-mfw-extension-ledger
```

该包提供三个入口点：

```typescript
import { LedgerModule } from 'moyan-mfw-extension-ledger/backend'   // 后端 NestJS 模块
import { MfwLedgerPage } from 'moyan-mfw-extension-ledger/frontend' // 前端 Vue 页面
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared' // 共享类型/权限
```

---

## 快速开始

### 后端 3 步集成

**第 1 步：注册模块 + 权限**

```typescript
// backend/src/main.ts
import { createBaseBackendApp } from 'moyan-mfw-base/backend'
import { LedgerModule } from 'moyan-mfw-extension-ledger/backend'
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'

await createBaseBackendApp({
  modules: [
    LedgerModule.forRoot({
      // 业务注册白名单
      accountTags: ['default', 'merchant', 'user'],
      bizTypes: ['order_pay', 'refund', 'recharge'],
      // 消费并发
      consumerConcurrency: 10,
    }),
  ],
  // 注册扩展包权限标签（审核/冲正/对账）
  permissionValues: [...LEDGER_EXTENSION_PERMISSION_VALUES],
})
```

**第 2 步：引入数据库迁移**

```typescript
// backend/src/data-source.ts
import { CreateLedgerTables20260814000000 } from 'moyan-mfw-extension-ledger/database/migrations/20260814000000-create-ledger-tables'
import { AddTransferExtColumns20260814010000 } from 'moyan-mfw-extension-ledger/database/migrations/20260814010000-add-transfer-ext-columns'
import { AddEntryCurrency20260814020000 } from 'moyan-mfw-extension-ledger/database/migrations/20260814020000-add-entry-currency'

export const migrations = [
  // ...你的其他迁移
  CreateLedgerTables20260814000000,
  AddTransferExtColumns20260814010000,
  AddEntryCurrency20260814020000,
]
```

然后执行迁移：

```bash
pnpm migration:run
```

**第 3 步：验证**

启动后端服务，访问 Swagger 文档，应看到以下 API 分组：
- `ledger-account` - 账本管理
- `ledger-transfer` - 交易单管理
- `ledger-entry` - 分录流水
- `ledger-reconcile` - 对账管理
- `ledger-meta` - 业务类型元数据

### 前端 2 步集成

**第 1 步：注册权限 + 页面路由**

```typescript
// frontend/src/main.ts
import { createBaseAdminApp } from 'moyan-mfw-base/frontend'
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'
import { registerPermissionValues } from 'moyan-mfw-base/frontend'

// 注册扩展包权限标签
registerPermissionValues([...LEDGER_EXTENSION_PERMISSION_VALUES])
```

```typescript
// frontend/src/menu-trees.ts
import { MfwLedgerPage } from 'moyan-mfw-extension-ledger/frontend'

// 在菜单树中添加：
{
  path: "ledger",
  name: "借贷记账管理",
  icon: "Wallet",
  permCode: "ext:ledger",
  permissions: ["审核", "冲正", "对账"],
  component: MfwLedgerPage,
}
```

**第 2 步：（可选）注册动态选项加载器**

如果你的业务类型元数据中使用了 `optionsSource` 动态选项：

```typescript
// frontend/src/main.ts
import { registerSearchOptionLoader } from 'moyan-mfw-extension-ledger/frontend'

registerSearchOptionLoader('campaigns', async () => {
  // 调用业务 API 获取下拉选项
  const res = await fetch('/api/demo/campaigns', { /* ... */ })
  const data = await res.json()
  return data.items.map(c => ({ value: c.id, label: c.name }))
})
```

---

## 后端集成详解

### LedgerModule.forRoot() 配置参考

```typescript
LedgerModule.forRoot(options: LedgerModuleOptions): DynamicModule
```

#### SPI 实现替换

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `accountEntity` | `any` | `DefaultLedgerAccount` | 账户实体类（继承 `LedgerAccountBase`）。扩展字段时注入子类 |
| `storageImpl` | `any` | `TypeOrmLedgerStorage` | `ILedgerStorage` 实现类。分库分表自定义扩展位 |
| `lockImpl` | `any` | `DbLock` | `ILedgerLock` 实现类。默认 MySQL GET_LOCK；可换 `RedisLock` |
| `queueImpl` | `any` | `InProcessQueue` | `ILedgerQueue` 实现类。默认进程内（仅单实例）；多实例须 `RedisStreamQueue` |
| `notifierImpl` | `any` | `EventNotifier` | `ILedgerNotifier` 实现类。默认进程内 EventEmitter；可换 `RedisNotifier` Pub/Sub |
| `fieldExtensionImpl` | `any` | `DefaultFieldExtension` | `ILedgerFieldExtension` 实现类。默认空校验 |

#### 业务注册白名单

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `accountTags` | `string[]` | `undefined` | 注册的账户标签白名单。未注册的 tag 制单时拒绝；变更需重启 |
| `bizTypes` | `string[]` | `undefined` | 注册的业务类型白名单。未注册的 bizType 制单时拒绝 |

#### 业务扩展字段映射

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `bizExtMappings` | `Record<string, Record<string, string>>` | `undefined` | 业务扩展字段 -> 预留索引位映射（bizType 维度）。制单传 `extFields` 时按映射写入 `extCol1~4`，查询走索引。未映射字段制单报错 |
| `bizTypeMetas` | `Record<string, BizTypeMetaConfig>` | `undefined` | 业务类型展示元数据。经 `GET /api/ext/ledger/biz-types` 下发前端，驱动列表动态列/搜索项/制单表单/详情字段 |

**`bizExtMappings` 示例：**

```typescript
bizExtMappings: {
  recharge:     { channel: 'extCol1', outTradeNo: 'extCol2' },
  promo_reward: { promoterId: 'extCol1', campaignId: 'extCol2', region: 'extCol3' },
  task_reward:  { taskId: 'extCol1' },
  exchange:     { goodsId: 'extCol1', storeId: 'extCol2' },
}
```

**`BizTypeMetaConfig` 字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `label` | `string` | 是 | 业务类型展示名 |
| `search` | `SearchField[]` | 否 | 扩展搜索项（key 须与 bizExtMappings 键一致） |
| `columns` | `ColumnField[]` | 否 | 扩展列表列（从交易单 extFields 语义对象取值） |
| `detail` | `DetailField[]` | 否 | 详情扩展字段渲染配置（缺省回退用 search） |

**`SearchField` 字段说明：**

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `key` | `string` | - | 语义字段名（须与 bizExtMappings 键一致） |
| `label` | `string` | - | 搜索项标签 |
| `type` | `'input' \| 'select' \| 'cascader'` | `'input'` | 搜索控件类型 |
| `options` | `{ value, label, children? }[]` | - | select 静态选项 |
| `optionsSource` | `string` | - | 动态选项来源 key（前端 `registerSearchOptionLoader` 注册加载器） |
| `valueMode` | `'last' \| 'join'` | `'last'` | cascader 选中值提交模式：`last`=取末级 value；`join`=各级 `/` 连接 |
| `matchMode` | `'exact' \| 'prefix'` | `'exact'` | 查询匹配方式：`exact`=等值；`prefix`=前缀匹配（`LIKE 'value%'`，仍走索引） |

**`ColumnField` 字段说明：**

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `prop` | `string` | - | 列字段名（须与 bizExtMappings 键一致） |
| `label` | `string` | - | 列标题 |
| `width` | `number` | - | 列宽（px） |
| `cp` | `boolean` | `false` | 是否可复制 |

**`DetailField` 字段说明：**

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `key` | `string` | - | 字段名 |
| `label` | `string` | - | 字段标签 |
| `span` | `1 \| 2` | `1` | 占列：`1`=半行（1行2列）；`2`=独占一行（1行1列） |

#### 消费参数

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `consumerEnabled` | `boolean` | `true` | 是否启动消费者。纯 API 模式可关 |
| `consumerConcurrency` | `number` | `10` | 消费信号量并发上限 |
| `maxRetry` | `number` | `3` | 最大重试次数 |
| `retryBackoffMs` | `number` | `1000` | 退避基准毫秒（指数退避 `backoff * 2^retryCount`） |

#### 兜底扫描参数

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `scavengeEnabled` | `boolean` | `true` | 兜底扫描是否启用（可靠性关键路径，关闭需本文档警告） |
| `scavengeIntervalMs` | `number` | `30000` | 兜底扫描周期毫秒 |
| `orphanTimeoutMs` | `number` | `600000` (10min) | 孤儿单超时毫秒（POSTING 超时重置，须 ≥ 入账事务 p99） |
| `enqueueTimeoutMs` | `number` | `120000` (2min) | 入队超时阈值毫秒（PENDING 超时补发） |
| `repushThrottleMs` | `number` | `300000` (5min) | 同单重推最小间隔毫秒（last_push_at 节流） |

#### 归档参数

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `activeWindowDays` | `number` | `90` | 在线表活跃窗口天数（归档 cutoff = now - activeWindowDays） |
| `archiveBatchSize` | `number` | `1000` | 归档每批行数 |

#### 限额参数

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `maxTargetsPerTransfer` | `number` | `100` | 最大单笔收款方数量 |
| `maxAmountPerTransfer` | `string` | `'1000000000000000'` (1e15) | 单笔金额上限（最小单位） |

### 权限配置

本扩展包声明 3 个自定义权限标签：

| 权限标签 | 说明 |
|---|---|
| `审核` | 审核交易单（通过/驳回）、人工重推、批量重推、取消 |
| `冲正` | 发起全额冲正 |
| `对账` | 触发对账与修复 |

> **注意**：制单权限使用框架内置「添加」标签，导出使用内置「导出」标签，无需额外声明。

```typescript
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'

// 注入到 createBaseBackendApp
createBaseBackendApp({
  permissionValues: [...LEDGER_EXTENSION_PERMISSION_VALUES],
  // ...
})
```

#### ⚠ HTTP 端点权限语义（当前版本）

当前版本各 HTTP 端点的权限声明如下（与 `@RequirePermission` 的框架权限方案存在已知缺陷有关，详见后文"待办"）：

| 端点 | 当前权限 |
|---|---|
| `POST /transfers`（制单）、`POST /accounts`（开户） | `@SkipPermission` / 无装饰器——**任何已登录用户可调用**（登录即放行） |
| `GET /transfers`、`GET /accounts`、`GET /entries` 及详情 | `@SkipPermission`——已登录可读 |
| `POST /transfers/audit`、`PUT /repost`、`PUT /batch-repost`、`PUT /cancel` | 声明 `审核` |
| `POST /transfers/reverse` | 声明 `冲正` |
| `POST /reconcile`、`GET /reports`、`GET /account/:id`、`PUT /fix/:id` | 声明 `对账` |
| `GET /entries/export` | 声明 `导出` |

> **限制（重要）**：基础框架的 `@RequirePermission` 权限方案存在缺陷（如无装饰器端点被 `PermissionGuard` 直接放行、权限值声明方式待重构），**当前版本不依赖 HTTP 端点的权限声明做安全边界**。安全建议：
> 1. 业务代码请优先走**服务层**（`LedgerAccountService` / `LedgerTransferService` / `LedgerWithdrawService`，进程内 DI，无 HTTP 暴露面）；
> 2. 如需对外暴露 HTTP 端点，请在网关/路由层自行鉴权，或等待 `moyan-mfw-base` 权限方案重构后本扩展包升级补齐。

### 数据库迁移

本扩展包提供 3 个迁移文件：

| 迁移文件 | 说明 |
|---|---|
| `20260814000000-create-ledger-tables.ts` | 建表：账户表、交易单表、分录表（KEY 分区 64）、归档表（RANGE 月分区）、对账报告表 |
| `20260814010000-add-transfer-ext-columns.ts` | 交易单表新增 extCol1~4 预留索引位列 + 索引 |
| `20260814020000-add-entry-currency.ts` | 分录表新增 currency 列 |
| `20260818000000-backfill-open-account-entry-currency.ts` | 回填历史开户合成单分录的 currency（存量 NULL → 交易单币种） |

**引入方式：**

```typescript
// backend/src/data-source.ts
import { CreateLedgerTables20260814000000 } from 'moyan-mfw-extension-ledger/database/migrations/20260814000000-create-ledger-tables'
import { AddTransferExtColumns20260814010000 } from 'moyan-mfw-extension-ledger/database/migrations/20260814010000-add-transfer-ext-columns'
import { AddEntryCurrency20260814020000 } from 'moyan-mfw-extension-ledger/database/migrations/20260814020000-add-entry-currency'
import { BackfillOpenAccountEntryCurrency20260818000000 } from 'moyan-mfw-extension-ledger/database/migrations/20260818000000-backfill-open-account-entry-currency'

export const migrations = [
  CreateLedgerTables20260814000000,
  AddTransferExtColumns20260814010000,
  AddEntryCurrency20260814020000,
  BackfillOpenAccountEntryCurrency20260818000000,
]
```

**环境要求：**

- MySQL 8+（KEY 分区、CHECK 约束、XAUTOCLAIM 需 Redis ≥ 6.2）
- TypeORM 连接配置须包含 `supportBigNumbers: true` 和 `bigNumberStrings: true`

---

## 前端集成详解

### 页面注册

```typescript
// frontend/src/menu-trees.ts
import { MfwLedgerPage } from 'moyan-mfw-extension-ledger/frontend'

// 在菜单树的某个分组下添加：
{
  path: "ledger",
  name: "借贷记账管理",
  icon: "Wallet",
  permCode: "ext:ledger",
  permissions: ["审核", "冲正", "对账"],  // 对应 LEDGER_EXTENSION_PERMISSION_VALUES
  component: MfwLedgerPage,
}
```

`MfwLedgerPage` 是一个完整的 Vue 3 页面组件，内置 4 个 Tab 页：
- **交易单管理**：制单、审核、冲正、重推、取消、分页查询（含转出方账户ID、入账状态、业务类型及扩展字段筛选）、扩展字段筛选；详情展示收款方明细（账户ID 可点击复制）
- **分录流水**：按账户 + 时间范围分页查询、导出（强制时间范围，单次最多 31 天）；分录详情展示**对方账户**（同交易单另一侧：对方账户ID/方向/符号金额），出账方分录的"变更前/变更后余额"相同时标注"预占已扣"（预占模型下出账方余额在制单时已扣减，入账时仅释放占用）
- **账户管理**：开户、分页列表（支持账户ID/持有者ID/标签筛选）、详情
- **对账管理**：手动触发全量对账、单账户对账、增量修复、对账报告分页（无差异报告自动标记"已处理"，applyFix 修复后相关报告联动置为已处理）

### 业务类型扩展元数据（前端本地覆盖）

默认情况下，业务类型元数据由后端 `forRoot({ bizTypeMetas })` 配置，经 `GET /api/ext/ledger/biz-types` 下发前端，前端零配置。

如需前端本地覆盖（覆盖服务端下发值），使用 `registerBizTypeExtMeta`：

```typescript
import { registerBizTypeExtMeta } from 'moyan-mfw-extension-ledger/frontend'

registerBizTypeExtMeta({
  order_pay: {
    label: '订单支付',
    search: [{ key: 'orderNo', label: '订单号' }],
    columns: [{ prop: 'orderNo', label: '订单号', width: 150, cp: true }],
    detail: [{ key: 'orderNo', label: '订单号', span: 2 }],
  },
})
```

**`BizTypeExtFieldMeta` 类型：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | `string` | 业务类型展示名 |
| `search` | `BizTypeSearchField[]` | 扩展搜索项 |
| `columns` | `{ prop: string; label: string; width?: number; cp?: boolean }[]` | 扩展列表列 |
| `detail` | `{ key: string; label: string; span?: 1 \| 2 }[]` | 详情扩展字段渲染配置 |

### 动态下拉/级联选项加载器

当 `bizTypeMetas` 的 `search[].optionsSource` 声明了动态选项来源时，前端需注册加载器：

```typescript
import { registerSearchOptionLoader } from 'moyan-mfw-extension-ledger/frontend'
import { useAuthStore } from 'moyan-mfw-base/frontend'

// 注册推广活动下拉选项（对应 optionsSource: 'campaigns'）
registerSearchOptionLoader('campaigns', async () => {
  const auth = useAuthStore()
  const res = await fetch('/api/demo/campaigns', {
    headers: { Authorization: `Bearer ${auth.token}` },
  }).then(r => r.json())
  return res.data.items.map(c => ({ value: c.id, label: `${c.name}（${c.id}）` }))
})

// 注册省市区级联选项（对应 optionsSource: 'regions'）
registerSearchOptionLoader('regions', async () => {
  const auth = useAuthStore()
  const res = await fetch('/api/demo/regions', {
    headers: { Authorization: `Bearer ${auth.token}` },
  }).then(r => r.json())
  return res.data.items  // 树形结构：{ value, label, children?: [...] }
})
```

**`SelectOptionItem` 类型：**

```typescript
interface SelectOptionItem {
  value: string | number
  label: string
  children?: SelectOptionItem[]  // cascader 子选项
}
```

**级联任意级筛选说明：**

使用 `matchMode: 'prefix'` 配合前缀兼容编码（如 `33` -> `3301` -> `330106`），选省/市也能筛出区县数据。定长码（`330000`）非前缀链，可改 `valueMode: 'join'` 存全路径 `330000/330100/330106` 配合 prefix 实现同样效果。

---

## Admin API 参考

所有 API 前缀为 `/api/ext/ledger`，需 Bearer Token 认证。

### 账户管理（3 个接口）

#### POST /accounts - 开户（幂等）

**权限**：无（SkipPermission）

**请求体**（`OpenAccountDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `holderId` | `string` | 是 | 持有者 ID |
| `holderType` | `string` | 否 | 持有者表名，默认 `system` |
| `tag` | `string` | 否 | 账户标签，默认 `default`（须在 accountTags 白名单中） |
| `currency` | `string` | 否 | 币种，默认 `CNY` |
| `initialBalance` | `string` | 否 | 初始余额（最小单位字符串，须为正整数；同步入账） |
| `sysAccountKey` | `string` | 否 | 系统账号 key |
| `extra` | `Record<string, unknown>` | 否 | 扩展附录（经字段扩展 SPI 校验） |

**幂等规则**：`holderId + holderType + tag + currency` 命中返回已有账户。

#### GET /accounts - 账户分页列表

**权限**：无（SkipPermission）

**查询参数**（`QueryAccountDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | 否 | 账户 ID（精确筛选） |
| `holderId` | `string` | 否 | 持有者 ID |
| `tag` | `string` | 否 | 账户标签 |
| `currency` | `string` | 否 | 币种 |
| `page` | `number` | 否 | 页码，默认 1 |
| `pageSize` | `number` | 否 | 每页条数，默认 20 |

#### GET /accounts/:id - 账户详情

**权限**：无（SkipPermission）

**路径参数**：`id` - 账户 ID

---

### 交易单管理（8 个接口）

#### POST /transfers - 制单

**权限**：无（SkipPermission，使用内置「添加」权限控制）

**请求体**（`CreateTransferDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `bizRef` | `string` | 是 | 业务幂等键（同 bizRef+bizType 重复制单返回已有单） |
| `bizType` | `string` | 是 | 业务类型（须在 bizTypes 白名单中） |
| `fromAccount` | `string` | 是 | 转出方账户 ID |
| `toAccounts` | `TransferTargetDto[]` | 是 | 收款方明细（1~100 个） |
| `amount` | `string` | 是 | 流动总金额（最小单位字符串，须等于 Σ toAccounts.amount） |
| `currency` | `string` | 是 | 币种 |
| `needReview` | `boolean` | 是 | 是否需要审核（true: 制单后冻结待审；false: 直接预占入队） |
| `associatedOrder` | `string` | 否 | 关联业务单号 |
| `description` | `string` | 否 | 备注 |
| `extra` | `Record<string, unknown>` | 否 | 扩展附录（经字段扩展 SPI 校验） |
| `extFields` | `Record<string, string>` | 否 | 扩展筛选字段（语义键值，经 bizExtMappings 映射写预留索引位） |

**`TransferTargetDto` 字段：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `account` | `string` | 是 | 收款方账户 ID |
| `amount` | `string` | 是 | 转入金额（最小单位字符串，须为正整数） |

#### POST /transfers/audit - 审核

**权限**：`审核`

**请求体**（`AuditTransferDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `transferNo` | `string` | 是 | 交易单号 |
| `auditStatus` | `1 \| 2` | 是 | 1=通过 2=驳回 |
| `auditNotes` | `string` | 否 | 审核备注 |

#### POST /transfers/reverse - 全额冲正

**权限**：`冲正`

**请求体**（`ReverseTransferDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `originalTransferNo` | `string` | 是 | 被冲正的原交易单号（须 POSTED 且未冲正过） |
| `bizRef` | `string` | 是 | 冲正单业务幂等键 |
| `bizType` | `string` | 是 | 业务类型 |
| `description` | `string` | 否 | 备注 |
| `extra` | `Record<string, unknown>` | 否 | 扩展附录 |

> **限制**：当前版本冲正**仅支持一对一原单**（`toAccounts` 单收款方），一对多原单（ONE_TO_MANY）冲正只反向首个收款方、其余金额不还原，会破坏账户恒等式——业务侧请勿对一对多单发起冲正；一对多冲正（逐收款方生成冲正单）排期待办。

#### PUT /transfers/repost/:transferNo - 人工重推

**权限**：`审核`

**路径参数**：`transferNo` - 交易单号

将 FAILED/CANCELLED 状态的单重置为 PENDING + 重置 retry_count/next_retry_at/claim_token。

#### PUT /transfers/batch-repost - 批量重推

**权限**：`审核`

**请求体**（`BatchRepostDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `transferNos` | `string[]` | 是 | 交易单号列表（≤1000） |

#### PUT /transfers/cancel/:transferNo - 取消

**权限**：`审核`

**路径参数**：`transferNo` - 交易单号

取消交易单（按 hold_type 回滚预占）。

#### GET /transfers - 交易单分页

**权限**：无（SkipPermission）

**查询参数**（`QueryTransferDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `postStatus` | `string` | 否 | 入账状态（可逗号分隔多个，如 `4,5`） |
| `auditStatus` | `number` | 否 | 审核状态 |
| `bizType` | `string` | 否 | 业务类型 |
| `fromAccountId` | `string` | 否 | 转出方账户 ID |
| `extFields` | `string` | 否 | 业务扩展字段等值筛选（JSON 字符串，须配 bizType；如 `{"promoterId":"P888"}`） |
| `startDate` | `Date` | 否 | 起始时间 |
| `endDate` | `Date` | 否 | 结束时间 |
| `page` | `number` | 否 | 页码，默认 1 |
| `pageSize` | `number` | 否 | 每页条数，默认 20 |

#### GET /transfers/:transferNo - 交易单详情

**权限**：无（SkipPermission）

**路径参数**：`transferNo` - 交易单号

---

### 分录流水（2 个接口）

#### GET /entries - 流水分页查询

**权限**：无（SkipPermission）

**查询参数**（`QueryEntryDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `accountId` | `string` | 否 | 账户 ID（必带以单分区裁剪） |
| `transferNo` | `string` | 否 | 交易单号 |
| `direction` | `number` | 否 | 借贷方向 1=借 2=贷 |
| `startDate` | `string` | 否 | 起始时间（ISO 日期字符串） |
| `endDate` | `string` | 否 | 结束时间（ISO 日期字符串） |
| `page` | `number` | 否 | 页码，默认 1 |
| `pageSize` | `number` | 否 | 每页条数，默认 20 |

#### GET /entries/export - 流水导出

**权限**：`导出`

**查询参数**：同 `QueryEntryDto`，但 `startDate` / `endDate` **强制必填**，单次最多 31 天。

---

### 对账管理（4 个接口）

#### POST /reconcile - 手动触发全量对账

**权限**：`对账`

**请求体**（`ReconcileTriggerDto`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `accountIds` | `string[]` | 否 | 指定账户 ID 列表（不传则全量） |

**响应**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `reportId` | `string` | 对账报告 ID |
| `totalAccounts` | `number` | 检查账户总数 |
| `diffCount` | `number` | 差异账户数 |

#### GET /reconcile/reports - 对账报告分页

**权限**：`对账`

**查询参数**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `status` | `number` | 否 | 状态：1=差异待处理 2=已处理 |
| `page` | `number` | 否 | 页码，默认 1 |
| `pageSize` | `number` | 否 | 每页条数，默认 20 |

**报告状态语义**：
- 无差异（diffCount=0）的报告自动置为 `2=已处理`（无需人工处理）；
- 有差异（diffCount>0）的报告为 `1=差异待处理`，待人工 applyFix；
- 对某账户执行 `PUT /reconcile/fix/:accountId` 修复成功后，包含该账户差异的待处理报告自动联动置为 `2=已处理`。

**触发方式（triggerType）**：`1=手动触发`（HTTP 手动触发或 runAll() 无参调用）、`2=外部调度`（定时任务调用 `runAll('scheduler')`）。

#### GET /reconcile/account/:accountId - 单账户对账

**权限**：`对账`

**路径参数**：`accountId` - 账户 ID

**响应**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `balanced` | `boolean` | 是否平衡 |
| `diff` | `string` | 差异金额（`'0'` 表示平衡） |

#### PUT /reconcile/fix/:accountId - 增量修复

**权限**：`对账`

**路径参数**：`accountId` - 账户 ID

**响应**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `fixed` | `boolean` | 是否已修复 |
| `diff` | `string` | 修复后差异（`'0'` 表示已修复） |

修复策略：先锁账户行 -> 重读 Σ -> UPDATE balance + INSERT 调整分录原子执行 -> 复验。

---

### 业务类型元数据（1 个接口）

#### GET /biz-types - 业务类型展示元数据

**权限**：无（SkipPermission）

**响应**：`Record<string, BizTypeMetaConfig>` - 返回 `forRoot({ bizTypeMetas })` 配置的元数据。

---

## SPI 接口文档

本扩展包提供 5 个 SPI（Service Provider Interface）扩展点，全部使用 `Symbol.for()` token 注入，可在 `forRoot()` 中替换默认实现。

### ILedgerStorage

存储适配器接口。全部原子 SQL 下沉于此；并发正确性靠单条条件 UPDATE（CAS）保证。

**Token**：`LEDGER_STORAGE`（`Symbol.for('MOYAN:MFW:LEDGER_STORAGE')`）

**默认实现**：`TypeOrmLedgerStorage`

#### 账户操作

##### openAccount(input, manager?)

开户（幂等：holderId+holderType+tag+currency 命中返回已有）；初始余额同步入账。

| 参数 | 类型 | 说明 |
|---|---|---|
| `input` | `OpenAccountInput` | 开户入参（见下表） |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<any>` - 账户实体

**`OpenAccountInput` 字段：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `holderId` | `string` | 是 | 持有者 ID |
| `holderType` | `string` | 否 | 持有者表名 |
| `tag` | `string` | 否 | 账户标签 |
| `currency` | `string` | 否 | 币种 |
| `initialBalance` | `AmountString` | 否 | 初始余额（最小单位字符串，同步入账，禁负数） |
| `sysAccountKey` | `string` | 否 | 系统账号 key |
| `extra` | `Record<string, unknown>` | 否 | 扩展字段 |

##### getAccount(accountId, manager?)

查账户。

| 参数 | 类型 | 说明 |
|---|---|---|
| `accountId` | `string` | 账户 ID |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<any | null>`

##### findAccount(holderId, holderType, tag, currency, manager?)

按 holder + tag + currency 查账户。

| 参数 | 类型 | 说明 |
|---|---|---|
| `holderId` | `string` | 持有者 ID |
| `holderType` | `string` | 持有者表名 |
| `tag` | `string` | 账户标签 |
| `currency` | `string` | 币种 |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<any | null>`

#### 制单（同步事务：插单 + 预占）

##### createTransferWithReserve(input, maker?, manager?)

制单（幂等 + 预占）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `input` | `CreateTransferInput` | 制单入参（见[共享类型参考](#共享类型参考)） |
| `maker` | `{ id?: string; text?: string }?` | 制单人 |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<{ transfer: any; created: boolean }>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `transfer` | `any` | 交易单实体 |
| `created` | `boolean` | `false` 表示 bizRef 命中返回已有单 |

#### 审核

##### audit(input, auditor?, manager?)

审核通过（NOT_READY->PENDING 单条原子写）；驳回（解冻+REJECTED）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `input` | `AuditTransferInput` | 审核入参 |
| `auditor` | `{ id?: string; text?: string }?` | 审核人 |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<{ affected: number; action: 'approved' | 'rejected' }>`

#### 冲正

##### createReversal(input, maker?, manager?)

创建冲正单（原单须 POSTED 且未冲正；唯一索引防双冲正）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `input` | `ReverseTransferInput` | 冲正入参 |
| `maker` | `{ id?: string; text?: string }?` | 制单人 |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<{ transfer: any; created: boolean }>`

#### 消费入账协议（CAS Fencing）

##### claimForPosting(transferNo, claimToken, manager?)

认领（PENDING->POSTING + claim_token + claim_at，影响 0 行=已被处理）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `claimToken` | `string` | 认领令牌 |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<ClaimResult>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `affected` | `number` | 影响行数：1=认领成功；0=已被处理/他人认领/不存在（须 XACK 跳过） |
| `transfer` | `any?` | 认领到的交易单（affected=1 时有值） |

##### postTransfer(transferNo, claimToken, manager?)

执行入账事务（账户按 id 排序锁序防死锁 + 末位 claim_token CAS）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `claimToken` | `string` | 认领令牌（末位 CAS 校验） |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<PostResult>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `success` | `boolean` | `true`=入账成功（已 POSTED）；`false`=fencing 失败（已被接管，须放弃） |
| `error` | `string?` | 错误信息（`success=false` 且非 fencing 时） |

##### revertToPending(transferNo, claimToken, retryCount, nextRetryAt, error, manager?)

失败回退（POSTING->PENDING + retryCount+1 + nextRetryAt 退避）。带 claim_token 条件，影响 0 行=已被接管->直接放弃。

| 参数 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `claimToken` | `string` | 认领令牌 |
| `retryCount` | `number` | 当前重试次数 |
| `nextRetryAt` | `Date` | 下次重试时间 |
| `error` | `string` | 错误信息 |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<{ affected: number }>` - `affected=0` 表示已被接管（不重试、不重入队）

##### markFailed(transferNo, claimToken, error, manager?)

标记 FAILED（重试耗尽）。

**返回**：`Promise<{ affected: number }>`

##### markEnqueued(transferNo, manager?)

标记入队时间（last_push_at）。

**返回**：`Promise<void>`

#### 取消（按 hold_type 分桶回滚预占）

##### cancel(transferNo, operator?, manager?)

取消（FAILED->CANCELLED + 按 hold_type 回滚预占）；0 行告警。

**返回**：`Promise<{ affected: number; reserveAffected: number }>`

##### repost(transferNo, manager?)

人工重推（FAILED/CANCELLED->PENDING + 重置 retry_count/next_retry_at/claim_token）。

**返回**：`Promise<{ affected: number }>`

##### batchRepost(transferNos, manager?)

批量重推（≤1000）。

**返回**：`Promise<{ affected: number }>`

#### 兜底扫描

##### scavenge(now, enqueueTimeoutMs, orphanTimeoutMs, repushThrottleMs, limit, manager?)

扫描需要补发/重置的单（PENDING 入队超时 + POSTING 孤儿）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `now` | `Date` | 当前时间 |
| `enqueueTimeoutMs` | `number` | 入队超时阈值 |
| `orphanTimeoutMs` | `number` | 孤儿超时阈值 |
| `repushThrottleMs` | `number` | 重推节流间隔 |
| `limit` | `number` | 扫描上限 |
| `manager` | `EntityManager?` | 可选事务管理器 |

**返回**：`Promise<ScavenigeResult>`

| 字段 | 类型 | 说明 |
|---|---|---|
| `pendingTimeout` | `ScavengeItem[]` | 需补发的 PENDING 超时单 |
| `orphans` | `ScavengeItem[]` | 需重置的 POSTING 孤儿单 |

**`ScavengeItem` 字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `reason` | `'pending_timeout' \| 'orphan'` | 原因：`pending_timeout`=入队超时补发；`orphan`=POSTING 孤儿重置 |

##### resetOrphans(transferNos, manager?)

孤儿重置（POSTING->PENDING + claim_token=NULL，条件 claim_at < 超时）。

**返回**：`Promise<{ affected: number }>`

#### 查询

##### getTransfer(transferNo, manager?)

查交易单。**返回**：`Promise<any | null>`

##### findTransferByBizRef(bizRef, bizType, manager?)

按幂等键查交易单。**返回**：`Promise<any | null>`

##### queryEntries(filter, manager?)

流水分页（必带 account_id，单分区裁剪）。

**`EntryQueryFilter` 字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `accountId` | `string?` | 账户 ID |
| `transferNo` | `string?` | 交易单号 |
| `direction` | `number?` | 借贷方向 1=借 2=贷 |
| `startDate` | `Date?` | 起始时间（必填以利用分区/索引） |
| `endDate` | `Date?` | 结束时间 |
| `page` | `number?` | 页码 |
| `pageSize` | `number?` | 每页条数 |

**返回**：`Promise<{ items: any[]; total: number }>`

##### queryTransfers(filter, manager?)

交易单分页。

**`TransferQueryFilter` 字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `postStatus` | `number \| number[]?` | 入账状态 |
| `auditStatus` | `number \| number[]?` | 审核状态 |
| `bizType` | `string?` | 业务类型 |
| `fromAccountId` | `string?` | 转出方账户 ID |
| `startDate` | `Date?` | 起始时间 |
| `endDate` | `Date?` | 结束时间 |
| `extFields` | `Record<string, string>?` | 业务扩展字段等值筛选（须配合 bizType，走预留索引位） |
| `page` | `number?` | 页码 |
| `pageSize` | `number?` | 每页条数 |

**返回**：`Promise<{ items: any[]; total: number }>`

##### queryAccounts(filter, manager?)

账户分页。

**`AccountQueryFilter` 字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `holderId` | `string?` | 持有者 ID |
| `tag` | `string?` | 账户标签 |
| `currency` | `string?` | 币种 |
| `page` | `number?` | 页码 |
| `pageSize` | `number?` | 每页条数 |

**返回**：`Promise<{ items: any[]; total: number }>`

##### queryReports(filter, manager?)

对账报告分页。

| 参数字段 | 类型 | 说明 |
|---|---|---|
| `status` | `number?` | 状态 |
| `page` | `number?` | 页码 |
| `pageSize` | `number?` | 每页条数 |

**返回**：`Promise<{ items: any[]; total: number }>`

#### 对账

##### computeReconcileDiffs(accountIds?, manager?)

计算账户恒等式差异：`Σ(signed_amount)` vs `(balance + frozen + pendingOut)`。

> **恒等式定义（重要）**：对账按**账户**校验 `balance + frozen + pendingOut ≡ Σ(signed_amount)`（全状态机成立），**不校验全局借贷平衡（Σ 借方 = Σ 贷方）**。原因：开户初始余额（注资/期初封装）只写一条 DEBIT 分录、无对手方（如系统资金户 1e14 注资），全局 dr=cr 天然不成立属设计如此。使用方做对账/审计时请按账户口径，勿用全局借贷平衡校验。

**返回**：`Promise<{ totalAccounts: number; diffs: ReconcileDiffItem[] }>`

**`ReconcileDiffItem` 字段：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `accountId` | `string` | 账户 ID |
| `balance` | `string` | 可用余额 |
| `frozen` | `string` | 冻结金额 |
| `pendingOut` | `string` | 在途预占 |
| `entrySum` | `string` | 分录求和 |
| `diff` | `string` | 差异金额 |

##### applyFix(accountId, operator?, manager?)

增量修复（先锁账户行 -> 重读 Σ -> UPDATE balance + INSERT 调整分录原子执行 -> 复验）。

**返回**：`Promise<{ fixed: boolean; diff: string }>`

#### 归档（copy-then-delete + 水印，默认 no-op 由业务方调度）

##### archiveEntries(before, batchSize?, manager?)

归档分录（created < cutoff 且 updated < cutoff；copy-then-delete 幂等；游标水印分批）。

**返回**：`Promise<{ archived: number; hasMore: boolean }>`

##### archiveTransfers(before, batchSize?, manager?)

联动归档交易单（分录归档完成后调用）。

> **限制（审计）**：当前版本对终态交易单（POSTED/FAILED/CANCELLED/REJECTED）执行**直接 DELETE**，**无归档副本表**（与分录归档 copy-then-delete 到 `ext_ledger_entry_archive` 不一致）。归档窗口（默认 90 天）内不触发；如需审计追溯完整性，建议保持默认关闭归档或等待二期增加 `ext_ledger_transfer_archive`（copy-then-delete）。

**返回**：`Promise<{ archived: number; hasMore: boolean }>`

---

### ILedgerLock

分布式锁 SPI 接口。用途：对账/修复账户级锁、兜底扫描选主。

**Token**：`LEDGER_LOCK`（`Symbol.for('MOYAN:MFW:LEDGER_LOCK')`）

**默认实现**：`DbLock`（MySQL GET_LOCK）

**可选实现**：`RedisLock`（包装 base `IRedisOnlyService.tryLock`）

> **注意**：ledger 无业务 CAS 互斥（不像 scheduler），必须实现真正的锁（GET_LOCK 或 Redis SET NX）。

#### tryLock(resource, ttlSeconds)

尝试加锁。

| 参数 | 类型 | 说明 |
|---|---|---|
| `resource` | `string` | 锁资源 key |
| `ttlSeconds` | `number` | 锁租约秒数 |

**返回**：`Promise<string | null>` - 成功返回 token（释放用）；失败返回 `null`

#### unlock(resource, token)

释放锁（令牌校验）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `resource` | `string` | 锁资源 key |
| `token` | `string` | tryLock 返回的 token |

**返回**：`Promise<boolean>` - `true`=释放成功；`false`=令牌不匹配或已过期

---

### ILedgerQueue

消息队列 SPI 接口。默认 InProcessQueue（进程内，仅单实例）；可换 RedisStreamQueue（消费组 + XAUTOCLAIM）。消息只含 transferNo（DB 是真相源），消费时从 DB 加载交易单。

**Token**：`LEDGER_QUEUE`（`Symbol.for('MOYAN:MFW:LEDGER_QUEUE')`）

**默认实现**：`InProcessQueue`

**可选实现**：`RedisStreamQueue`

**XACK 协议**：
- 所有不处理路径（skip/已 POSTED/他人处理中/FAILED/不存在）一律 XACK
- 失败路径：先 XACK 原消息再 ZADD 延迟队列（防 PEL 影子消息风暴）

#### enqueue(transferNo, delayMs?)

入队。

| 参数 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `delayMs` | `number?` | 延迟毫秒（退避重试用，0=立即） |

**返回**：`Promise<void>`

#### startConsumer(consumerId, concurrency, handler)

启动消费者。

| 参数 | 类型 | 说明 |
|---|---|---|
| `consumerId` | `string` | 消费者标识（实例级，如 `hostname-pid-random`） |
| `concurrency` | `number` | 并发上限 |
| `handler` | `QueueMessageHandler` | 消息处理回调（异常由调用方分类处理） |

**返回**：`Promise<void>`

**`QueueMessageHandler` 类型：**

```typescript
type QueueMessageHandler = (transferNo: string, messageId: string) => Promise<void>
```

#### stopConsumer()

停止消费者（优雅停机：停止拉取，已处理的消息完成）。

**返回**：`Promise<void>`

#### ack(messageId)

确认消息处理完成（XACK）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `messageId` | `string` | 消息 ID（Redis Stream 条目 ID；InProcessQueue 可为 transferNo） |

**返回**：`Promise<void>`

#### nackAndRequeue(messageId, transferNo, delayMs)

消息处理失败的重试入队（先 XACK 原消息，再延迟重入队）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `messageId` | `string` | 原消息 ID |
| `transferNo` | `string` | 交易单号 |
| `delayMs` | `number` | 延迟毫秒 |

**返回**：`Promise<void>`

#### length()

队列长度（积压监控）。

**返回**：`Promise<number>`

---

### ILedgerNotifier

事件通知 SPI 接口。默认 EventNotifier（进程内 EventEmitter）；可换 RedisNotifier（Pub/Sub）。通知是旁路语义，丢失不影响一致性（对账兜底）。监听器异常旁路隔离：单个监听器抛异常不影响主流程，仅记录日志。

**Token**：`LEDGER_NOTIFIER`（`Symbol.for('MOYAN:MFW:LEDGER_NOTIFIER')`）

**默认实现**：`EventNotifier`

**可选实现**：`RedisNotifier`

#### 事件类型

**`TransferPostedEvent`（记账完成事件）：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `fromAccountId` | `string` | 转出方账户 ID |
| `toAccounts` | `{ account: string; amount: string }[]` | 收款方明细 |
| `amount` | `string` | 流动总金额 |
| `currency` | `string` | 币种 |
| `postedAt` | `Date` | 入账时间 |

**`TransferFailedEvent`（记账失败事件）：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `retryCount` | `number` | 重试次数 |
| `error` | `string` | 错误信息 |
| `failedAt` | `Date` | 失败时间 |

**`ReconcileDiffEvent`（对账差异事件）：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `reportId` | `string` | 对账报告 ID |
| `diffCount` | `number` | 差异账户数 |
| `diffs` | `{ accountId: string; diff: string }[]` | 差异明细 |
| `triggeredAt` | `Date` | 触发时间 |

#### LedgerEventListener 接口

业务方只需实现关心的方法：

```typescript
interface LedgerEventListener {
  onTransferPosted?(event: TransferPostedEvent): Promise<void> | void
  onTransferFailed?(event: TransferFailedEvent): Promise<void> | void
  onReconcileDiff?(event: ReconcileDiffEvent): Promise<void> | void
}
```

#### 方法

##### registerListener(listener)

注册监听器（业务方集成）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `listener` | `LedgerEventListener` | 事件监听器 |

##### emitTransferPosted(event)

触发记账完成事件。**返回**：`Promise<void>`

##### emitTransferFailed(event)

触发记账失败事件。**返回**：`Promise<void>`

##### emitReconcileDiff(event)

触发对账差异事件。**返回**：`Promise<void>`

---

### ILedgerFieldExtension

字段扩展校验 SPI 接口。extra JSON 列的 schema 校验钩子；默认 DefaultFieldExtension（空校验）。

**Token**：`LEDGER_FIELD_EXTENSION`（`Symbol.for('MOYAN:MFW:LEDGER_FIELD_EXTENSION')`）

**默认实现**：`DefaultFieldExtension`

#### validateAccountExtra(tag, extra)

校验账户扩展字段。

| 参数 | 类型 | 说明 |
|---|---|---|
| `tag` | `string` | 账户标签 |
| `extra` | `Record<string, unknown> \| null` | 扩展字段 |

**抛错**：校验失败抛错。

#### validateTransferExtra(bizType, extra)

校验交易单扩展字段。

| 参数 | 类型 | 说明 |
|---|---|---|
| `bizType` | `string` | 业务类型 |
| `extra` | `Record<string, unknown> \| null` | 扩展字段 |

**抛错**：校验失败抛错。

---

### SPI 默认实现与可选实现对照表

| SPI | Token | 默认实现 | 可选实现 | 扩展场景 |
|---|---|---|---|---|
| `ILedgerStorage` | `LEDGER_STORAGE` | `TypeOrmLedgerStorage` | 自定义 | 分库分表、换存储引擎 |
| `ILedgerLock` | `LEDGER_LOCK` | `DbLock`（GET_LOCK） | `RedisLock` | 高并发分布式锁 |
| `ILedgerQueue` | `LEDGER_QUEUE` | `InProcessQueue`（单实例） | `RedisStreamQueue` | 多实例削峰队列 |
| `ILedgerNotifier` | `LEDGER_NOTIFIER` | `EventNotifier`（进程内） | `RedisNotifier`（Pub/Sub） | 跨实例事件广播 |
| `ILedgerFieldExtension` | `LEDGER_FIELD_EXTENSION` | `DefaultFieldExtension`（空校验） | 自定义 | extra JSON schema 校验 |

**替换方式：**

```typescript
LedgerModule.forRoot({
  storageImpl: MyCustomStorage,
  lockImpl: RedisLock,
  queueImpl: RedisStreamQueue,
  notifierImpl: RedisNotifier,
  fieldExtensionImpl: MyFieldExtension,
})
```

---

## 业务服务参考

`LedgerModule` 导出 4 个业务服务，业务层直接注入使用。

### LedgerAccountService

#### openAccount(input: OpenAccountInput)

开户（幂等 + 并发安全：唯一键冲突自动重查返回）；tag 注册制校验 + 扩展字段校验。

#### ensureAccount(input: HolderRef & { extra? })

懒开户：账户不存在则开（余额 0），存在返回已有。记账前调用无需关心开户流程（幂等、并发安全）。

#### ensureSystemAccounts(accounts: Array<HolderRef & { extra? }>)

批量系统户初始化（幂等；`onModuleInit` 调用一次即可）。

#### getAccount(accountId: string)

查账户。

#### findAccount(holderId: string, holderType?: string, tag?: string, currency?: string)

按 holder + tag + currency 查账户。默认值：`holderType='system'`, `tag='default'`, `currency='CNY'`。

**返回**：`Promise<AccountView | null>`

#### getBalance(holderId, holderType?, tag?, currency?)

查可用余额（不存在返回 `'0'`；最小单位字符串）。

#### getAccountSnapshot(holderId, holderType?, tag?, currency?)

账户快照（不存在返回 null）。

#### queryAccounts(filter: AccountQueryFilter)

账户分页查询。

### LedgerTransferService

#### createTransfer(input: CreateTransferInput, maker?: { id?: string; text?: string })

制单（幂等 by bizRef；免审入队，需审冻结）。

**返回**：`Promise<{ transfer: TransferView; created: boolean }>`

#### createBizTransfer(input: CreateBizTransferInput, maker?)

一行式制单：账户用 holder 三元组定位（`from`/`to`），内部懒开户，无需先查账户 ID。

```typescript
const { transfer, created } = await transferService.createBizTransfer({
  bizRef: `order-${orderNo}`,
  bizType: 'order_pay',
  from: { holderId: 'u-1', holderType: 'user', tag: 'user' },
  to: { holderId: 'm-1', holderType: 'merchant', tag: 'merchant' },
  amount: '2000',               // 20.00 元（最小单位）
  extFields: { channel: 'wechat' },
})
```

#### audit(input: AuditTransferInput, auditor?: { id?: string; text?: string })

审核（approved 入队 / rejected 解冻）。

**返回**：`Promise<{ affected: number; action: 'approved' | 'rejected' }>`

#### reverse(input: ReverseTransferInput, maker?: { id?: string; text?: string })

全额冲正。

**返回**：`Promise<{ transfer: TransferView; created: boolean }>`

#### repost(transferNo: string)

人工重推。

**返回**：`Promise<{ affected: number }>`

#### batchRepost(transferNos: string[])

批量重推（≤1000）。

**返回**：`Promise<{ affected: number }>`

#### cancel(transferNo: string, operator?: { id?: string; text?: string })

取消（按 hold_type 回滚预占）。

**返回**：`Promise<{ affected: number; reserveAffected: number }>`

#### getTransfer(transferNo: string)

查交易单。**返回**：`Promise<TransferView | null>`

#### findByBizRef(bizRef: string, bizType: string)

按幂等键查交易单。**返回**：`Promise<TransferView | null>`

#### findByExtField(bizType: string, field: string, value: string)

按业务扩展字段定位（如按外部单号查提现单；须 bizType + bizExtMappings 已配置）。**返回**：`Promise<TransferView | null>`

#### queryTransfers(filter: TransferQueryFilter)

交易单分页查询。**返回**：`Promise<{ items: TransferView[]; total: number }>`

filter 支持 `fromAccountType`（转出账户主体类型）、`fromAccountHolderIds`（主体 ID 集合）、`postStatusExclude`（排除状态）。

#### sumTransfers(filter: TransferQueryFilter)

交易单聚合（COUNT + SUM(amount)），过滤条件与 queryTransfers 一致。**返回**：`Promise<{ totalCount: number; totalAmount: AmountString }>`

#### queryEntries(filter: EntryQueryFilter)

流水分页查询。

### LedgerWithdrawService（审核流模板）

两段式审核业务（提现/打款/退款）全流程模板：预占（冻结待审）→ 审核通过/驳回 → 按外部单号定位 → 分页查询 → 汇总。业务语义（读侧状态映射、字段映射、成功口径）内置，`bizType`/字段名/文案可配置复用。

配置（`LedgerModuleOptions.withdraw`，全部可选）：

| 配置 | 默认值 | 说明 |
|---|---|---|
| `bizType` | `'withdraw'` | 审核流业务类型（须在 bizTypes 白名单） |
| `externalNoField` | `'wxTransferNo'` | 外部单号语义字段名（须在 bizExtMappings[bizType] 声明） |
| `typeField` | `'withdrawType'` | 类型语义字段名（须在 bizExtMappings[bizType] 声明） |
| `statusTexts` | `{1:'处理中',2:'成功',3:'失败'}` | 读侧状态文案 |

```typescript
// 业务层完整用法（提现场景）——6 个方法覆盖全生命周期
const { transferNo } = await withdrawService.reserve({
  bizRef: 'W1001',                       // 提现单 ID（幂等键）
  from: { holderId: 'u-1', holderType: 'user', tag: 'user' },
  to: { holderId: 'system', holderType: 'system', tag: 'funding' },
  amount: '3000',
  wxTransferNo: '20260818001',           // 微信 out_batch_no → extCol1
  withdrawType: 'balance',               // → extCol2
})
await withdrawService.approve('W1001', { id: 'op', text: '操作员' })   // 通过（入队入账）
await withdrawService.reject('W1001', '重复申请', { id: 'op', text: '操作员' })  // 驳回（解冻）
await withdrawService.findByExternalNo('20260818001')  // 微信回调定位 → WithdrawView | null
await withdrawService.queryWithdrawals({ fromHolderType: 'user', status: 2, page: 1, pageSize: 20 })
await withdrawService.sumWithdrawn({ fromHolderType: 'user' })
// → { totalCount, withdrawn（成功金额，最小单位）, pendingCount（处理中笔数） }
```

读侧状态映射：1=处理中（NOT_READY/PENDING/POSTING）、2=成功（POSTED+APPROVED）、3=失败（FAILED/CANCELLED/REJECTED）；返回项透传 `rawPostStatus`/`rawAuditStatus` 供业务层扩展。字段映射：`id=bizRef`、`externalNo`=外部单号、`transferredAt=auditTime`、`failReason=auditNotes`。`endDate` 为纯日期时按当天全天（含边界）处理。

### LedgerReconcileService

#### runAll(triggerBy?: string)

全量对账（lock 'ledger:reconcile' 300s；计算差异，持久化报告，触发差异事件）。

**返回**：`Promise<{ reportId: string; totalAccounts: number; diffCount: number }>`

#### runAccount(accountId: string)

单账户对账。

**返回**：`Promise<{ balanced: boolean; diff: string }>`

#### queryReports(filter: { status?: number; page?: number; pageSize?: number })

对账报告分页。

#### applyFix(accountId: string, operator?: { id?: string; text?: string })

增量修复。

**返回**：`Promise<{ fixed: boolean; diff: string }>`

---

## 共享类型参考

以下类型从 `moyan-mfw-extension-ledger/shared` 导入，前后端共用。

### AmountString

```typescript
type AmountString = string
```

金额类型：始终以字符串传输（bigint 最小单位，如人民币分），避免 JS Number 精度丢失（>2^53）。

### TransferTargetItem

| 字段 | 类型 | 说明 |
|---|---|---|
| `account` | `string` | 收款方账户 ID |
| `amount` | `AmountString` | 转入金额（最小单位字符串） |

### LedgerAccountBrief

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 账户 ID |
| `holderId` | `string` | 持有者 ID |
| `holderType` | `string` | 持有者表名 |
| `tag` | `string` | 账户标签 |
| `currency` | `string` | 币种 |
| `balance` | `AmountString` | 可用余额 |
| `frozen` | `AmountString` | 冻结金额 |
| `pendingOut` | `AmountString` | 在途预占金额 |

### CreateTransferInput

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `bizRef` | `string` | 是 | 业务幂等键（同 bizRef+bizType 重复制单返回已有单） |
| `bizType` | `string` | 是 | 业务类型（与 bizRef 组合构成幂等键） |
| `fromAccount` | `string` | 是 | 转出方账户 ID |
| `toAccounts` | `TransferTargetItem[]` | 是 | 收款方明细（1对1 时单元素数组） |
| `amount` | `AmountString` | 是 | 流动总金额（须等于 Σ toAccounts.amount） |
| `currency` | `string` | 是 | 币种（须与 from/to 账户币种一致） |
| `needReview` | `boolean` | 是 | 是否需要审核（true: 制单后冻结待审；false: 直接预占入队） |
| `associatedOrder` | `string` | 否 | 关联业务单号（审计用） |
| `description` | `string` | 否 | 备注 |
| `makerId` | `string` | 否 | 制单人 ID |
| `makerText` | `string` | 否 | 制单人名称 |
| `extra` | `Record<string, unknown>` | 否 | 扩展附录（JSON，经字段扩展 SPI 校验） |
| `extFields` | `Record<string, string>` | 否 | 扩展筛选字段（语义键值，经 bizExtMappings 映射写预留索引位） |

### AuditTransferInput

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `transferNo` | `string` | 是 | 交易单号 |
| `auditStatus` | `1 \| 2` | 是 | 1=通过 2=驳回 |
| `auditNotes` | `string` | 否 | 审核备注 |
| `auditorId` | `string` | 否 | 审核人 ID |
| `auditorText` | `string` | 否 | 审核人名称 |

### ReverseTransferInput

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `originalTransferNo` | `string` | 是 | 被冲正的原交易单号（须 POSTED 且未被冲正过） |
| `bizRef` | `string` | 是 | 冲正单的业务幂等键 |
| `bizType` | `string` | 是 | 业务类型 |
| `description` | `string` | 否 | 备注 |
| `makerId` | `string` | 否 | 制单人 ID |
| `makerText` | `string` | 否 | 制单人名称 |
| `extra` | `Record<string, unknown>` | 否 | 扩展附录 |

### HolderRef（账户定位）

| 字段 | 类型 | 说明 |
|---|---|---|
| `holderId` | `string` | 持有者 ID |
| `holderType` | `string` | 主体类型（默认 `'system'`） |
| `tag` | `string` | 账户标签（默认 `'default'`） |
| `currency` | `string` | 币种（默认 `'CNY'`） |

`createBizTransfer` / `LedgerWithdrawService` 等高层 API 用 holder 三元组定位账户，内部懒开户。

### TransferView（交易单视图）

| 字段 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` | 交易单号 |
| `bizRef` / `bizType` | `string` | 幂等键组合 |
| `fromAccountId` | `string` | 转出账户 ID |
| `toAccounts` | `TransferTargetItem[]` | 收款方明细 |
| `amount` | `AmountString` | 流动总金额（最小单位） |
| `currency` | `string` | 币种 |
| `needReview` | `boolean` | 是否需审 |
| `auditStatus` / `postStatus` | `number` | 审核/入账状态（字典值） |
| `auditTime` / `auditNotes` | `Date \| null` / `string \| null` | 审核信息 |
| `makerId` / `makerText` / `auditorId` / `auditorText` | `string \| null` | 操作人 |
| `retryCount` | `number` | 重试次数 |
| `createdAt` | `Date` | 创建时间 |
| `reversedFromTransferNo` | `string \| null` | 冲正关联 |
| `extFields` | `Record<string, string>` | 业务扩展字段（预留索引位语义化） |

所有查询/制单返回均为 TransferView（不再 any）；extCol1~4 物理列已翻译为 `extFields` 语义对象。

### AccountView（账户视图）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 账户 ID |
| `sysAccountKey` | `string \| null` | 系统账户键 |
| `holderId` / `holderType` / `tag` / `currency` | `string` | 账户定位 |
| `balance` / `frozen` / `pendingOut` | `AmountString` | 余额/冻结/在途 |
| `totalIncome` / `totalOutcome` | `AmountString` | 累计收支 |
| `extra` | `Record<string, unknown> \| null` | 扩展数据 |
| `createdAt` | `Date` | 创建时间 |

### EntryView（分录视图）

流水分页返回项：`id` / `accountId` / `entryNo` / `transferNo` / `direction`（1借2贷）/ `signedAmount` / `balanceBefore` / `balanceAfter` / `extra` / `createdAt` / `currency?`。

### WithdrawView（审核流交易视图）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 业务幂等键（bizRef，提现单 ID） |
| `holderId` | `string` | 提现方主体 ID |
| `amount` | `AmountString` | 金额（最小单位） |
| `status` | `1 \| 2 \| 3` | 读侧状态（处理中/成功/失败） |
| `statusText` | `string` | 状态文案（配置或默认） |
| `externalNo` | `string \| null` | 外部单号（微信 out_batch_no） |
| `withdrawType` | `string \| null` | 类型字段值 |
| `createdAt` | `Date` | 申请时间 |
| `transferredAt` | `Date \| null` | 到账时间（auditTime） |
| `failReason` | `string \| null` | 失败原因（auditNotes） |
| `rawPostStatus` / `rawAuditStatus` | `number` | 原始账本状态（透传） |

---

## 共享工具参考

### amountToYuan(amount: AmountString | number | bigint): string

最小单位金额 → 元展示（2 位小数，BigInt 除 100 避免浮点误差）。`amountToYuan('123456') === '1234.56'`

### buildCompositeBizRef(parts: (string | number)[]): string

多维度业务幂等键 MD5 摘要（32 位 hex，适配 bizRef varchar(64)）。如分润键 `buildCompositeBizRef([orderId, 'm', merchantId, referrerType])`。

---

## 实体字段参考

### LedgerAccountBase（账户基类）

继承 `Base`（软删，含 `createdAt`/`updateAt`/`deleteAt`）。唯一约束：`(holderId, holderType, tag, currency)`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` (UUID) | 主键 ID |
| `sysAccountKey` | `string \| null` | 系统账号 key |
| `holderId` | `string` | 持有者 ID（索引） |
| `holderType` | `string` | 持有者表名（默认 `system`） |
| `tag` | `string` | 账户类型标签（索引，默认 `default`） |
| `currency` | `string` (char 4) | 币种（索引，默认 `CNY`） |
| `balance` | `string` (bigint) | 可用余额 |
| `frozen` | `string` (bigint) | 审核冻结金额 |
| `pendingOut` | `string` (bigint) | 在途预占金额 |
| `totalIncome` | `string` (bigint) | 累计转入 |
| `totalOutcome` | `string` (bigint) | 累计转出 |
| `extra` | `Record<string, unknown> \| null` (JSON) | 扩展附录 |

**字段扩展**：继承 `LedgerAccountBase` 添加强类型列，通过 `forRoot({ accountEntity })` 注入。

```typescript
import { LedgerAccountBase } from 'moyan-mfw-extension-ledger/backend'
import { Entity, Column } from 'typeorm'

@Entity('ext_ledger_account')
export class MerchantAccount extends LedgerAccountBase {
  @Column({ type: 'bigint', default: 0 }) creditLimit: string
}
```

> 扩展方新增列须自带 migration：`ALTER TABLE ext_ledger_account ADD COLUMN creditLimit BIGINT DEFAULT 0`

### LedgerTransfer（交易单）

不分区，全主键/唯一键点查。幂等键：`(bizRef, bizType)`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `transferNo` | `string` (PK) | 交易单号（日期前缀 + nanoid） |
| `bizRef` | `string` | 业务幂等键 |
| `bizType` | `string` | 业务类型 |
| `fromAccountId` | `string` | 转出方账户 ID（索引） |
| `toAccounts` | `{ account: string; amount: string }[]` (JSON) | 收款方明细（最多 100 个） |
| `amount` | `string` (bigint) | 流动总金额 |
| `currency` | `string` (char 4) | 币种（索引） |
| `transferMode` | `number` | 转账模式 1=一对一 2=一对多（索引） |
| `needReview` | `boolean` | 是否需要审核（索引） |
| `holdType` | `number` | 占用类型 1=预占在途 2=审核冻结 |
| `auditStatus` | `number` | 审核状态 1=待审核 2=通过 3=驳回（索引） |
| `postStatus` | `number` | 入账状态（索引，组合 postStatus+createdAt） |
| `associatedOrder` | `string \| null` | 关联业务单号 |
| `orderTable` | `string \| null` | 关联业务表名 |
| `retryCount` | `number` | 重试次数 |
| `claimToken` | `string \| null` | 认领令牌 |
| `claimAt` | `Date \| null` | 认领时间 |
| `nextRetryAt` | `Date \| null` | 下次重试时间 |
| `lastPushAt` | `Date \| null` | 上次入队时间 |
| `lastError` | `string \| null` | 上次错误信息 |
| `reversedFromTransferNo` | `string \| null` | 冲正关联原单号（唯一索引防双冲正） |
| `description` | `string \| null` | 描述/备注 |
| `makerId` | `string \| null` | 制单人 ID |
| `makerText` | `string \| null` | 制单人名称 |
| `auditorId` | `string \| null` | 审核人 ID |
| `auditorText` | `string \| null` | 审核人名称 |
| `auditTime` | `Date \| null` | 审核时间 |
| `auditNotes` | `string \| null` | 审核备注 |
| `extra` | `Record<string, unknown> \| null` (JSON) | 扩展附录 |
| `extCol1` | `string \| null` | 业务扩展索引位 1（索引） |
| `extCol2` | `string \| null` | 业务扩展索引位 2（索引） |
| `extCol3` | `string \| null` | 业务扩展索引位 3（索引） |
| `extCol4` | `string \| null` | 业务扩展索引位 4（索引） |

### LedgerEntry（分录/流水）

**不继承 Base**（流水落账后不可变）。KEY(account_id) 64 分区。复合主键 `(id, accountId)`。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` (bigint, PK 首列) | 自增 ID |
| `accountId` | `string` (PK 第二列) | 账户 ID（分区键） |
| `entryNo` | `string` | 分录单号（transferNo + D/C 序号） |
| `transferNo` | `string` | 关联交易单号（索引） |
| `direction` | `number` | 借贷方向 1=借 2=贷 |
| `signedAmount` | `string` (bigint) | 符号金额（借为正、贷为负） |
| `balanceBefore` | `string \| null` (bigint) | 变更前余额 |
| `balanceAfter` | `string \| null` (bigint) | 变更后余额 |
| `currency` | `string \| null` (char 4) | 币种 |
| `extra` | `Record<string, unknown> \| null` (JSON) | 扩展附录 |
| `createdAt` | `Date` | 创建时间（DB 时钟，索引） |

### LedgerReconcileReport（对账报告）

继承 `Base`（软删）。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` (UUID, PK) | 主键 ID |
| `triggerType` | `number` | 触发方式 1=手动 2=外部调度（索引） |
| `triggerBy` | `string \| null` | 触发人 ID |
| `totalAccounts` | `number` | 检查账户总数 |
| `diffCount` | `number` | 差异账户数 |
| `diffs` | `ReconcileDiffItem[] \| null` (JSON) | 差异明细 |
| `status` | `number` | 状态 1=差异待处理 2=已处理（索引） |
| `operatorId` | `string \| null` | 操作人 |
| `notes` | `string \| null` | 备注 |

---

## 字典/枚举值表

### DirectionDict（借贷方向）

| 值 | 标签 | 说明 |
|---|---|---|
| 1 | 借 | 借方（资金流入，signed_amount 为正） |
| 2 | 贷 | 贷方（资金流出，signed_amount 为负） |

### AuditStatusDict（审核状态）

| 值 | 标签 | 说明 |
|---|---|---|
| 1 | 待审核 | 需审单制单后，资金冻结在 frozen |
| 2 | 审核通过 | 转为 PENDING 入队 |
| 3 | 已驳回 | 解冻，终态 |

### PostStatusDict（入账状态）

| 值 | 标签 | 说明 |
|---|---|---|
| 1 | 待审核 | 需审单制单后，不入队，等待审核（免审单无此状态） |
| 2 | 待入账 | 已入队或待入队 |
| 3 | 入账中 | 已认领，claim_token 标记执行者 |
| 4 | 已入账 | 终态 |
| 5 | 入账失败 | 终态，重试耗尽，预占保留待人工处置 |
| 6 | 已取消 | 终态，已回滚预占 |
| 7 | 已驳回 | 终态，审核驳回，已解冻 |

### HoldTypeDict（占用类型）

| 值 | 标签 | 说明 |
|---|---|---|
| 1 | 预占在途 | 免审单制单后转入 pending_out |
| 2 | 审核冻结 | 需审单制单后转入 frozen |

### TransferModeDict（转账模式）

| 值 | 标签 | 说明 |
|---|---|---|
| 1 | 一对一 | 一对一转账 |
| 2 | 一对多 | 一对多转账（最多 100 个收款方） |

---

## 实例演示

以下示例基于 `demo/backend/src/modules/ledger-demo/` 项目，完整覆盖全部 SPI 的替换与调用。

### 场景一：订单钱包（CNY 法币）

**1. 模块装配（最小配置）：**

```typescript
import { Module } from '@nestjs/common'
import { LedgerModule } from 'moyan-mfw-extension-ledger/backend'

@Module({
  imports: [
    LedgerModule.forRoot({
      accountTags: ['default', 'merchant', 'user'],
      bizTypes: ['order_pay', 'refund', 'recharge'],
      consumerConcurrency: 10,
    }),
  ],
})
export class AppModule {}
```

**2. 开户（商家 + 用户，初始余额同步入账）：**

```typescript
import { Injectable } from '@nestjs/common'
import { LedgerAccountService } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class WalletService {
  constructor(private readonly accountService: LedgerAccountService) {}

  async setup() {
    // 商家钱包初始 100000.00 元（10000000 分）
    const merchant = await this.accountService.openAccount({
      holderId: 'merchant-001',
      holderType: 'merchant',
      tag: 'merchant',
      currency: 'CNY',
      initialBalance: '10000000',
      extra: { merchantNo: 'M1001', merchantName: '示例商家' },
    })

    // 用户钱包初始 50000.00 元（幂等：重复调用返回已有账户）
    const user = await this.accountService.openAccount({
      holderId: 'user-001',
      holderType: 'user',
      tag: 'user',
      currency: 'CNY',
      initialBalance: '5000000',
      extra: { userName: '演示用户' },
    })

    return { merchant, user }
  }
}
```

**3. 免审制单（用户 -> 商家支付）：**

```typescript
async payOrder(orderNo: string, amount: string) {
  const from = await this.accountService.findAccount('user-001', 'user', 'user', 'CNY')
  const to = await this.accountService.findAccount('merchant-001', 'merchant', 'merchant', 'CNY')

  const result = await this.transferService.createTransfer(
    {
      bizRef: `order-${orderNo}`,
      bizType: 'order_pay',
      fromAccount: from.id,
      toAccounts: [{ account: to.id, amount }],  // 2000 = 20.00 元
      amount,
      currency: 'CNY',
      needReview: false,   // 免审：直接预占入队
      associatedOrder: orderNo,
      extra: { orderNo },
    },
    { id: 'operator-001', text: '操作员' },
  )
  return result  // { transfer, created }
}
```

**4. 需审制单 + 审核（冻结 -> 入队）：**

```typescript
// 创建需审单：资金冻结 frozen，不入队
const result = await this.transferService.createTransfer({
  bizRef: `review-order-A2001`,
  bizType: 'order_pay',
  fromAccount: from.id,
  toAccounts: [{ account: to.id, amount: '3000' }],
  amount: '3000',
  currency: 'CNY',
  needReview: true,    // 需审：资金冻结在 frozen
  extra: { orderNo: 'A2001' },
})

// 审核（NOT_READY -> PENDING 入队入账）
await this.transferService.audit({
  transferNo: result.transfer.transferNo,
  auditStatus: 1,       // 1=通过
  auditNotes: '审核通过',
  auditorId: 'auditor-001',
  auditorText: '审核员',
})
```

**5. 退款（商家 -> 用户）：**

```typescript
await this.transferService.createTransfer({
  bizRef: `refund-A1001`,
  bizType: 'refund',
  fromAccount: merchant.id,
  toAccounts: [{ account: user.id, amount: '500' }],
  amount: '500',
  currency: 'CNY',
  needReview: false,
  extra: { orderNo: 'A1001', reason: '七天无理由' },
})
```

### 场景二：积分系统（ITG 积分，多交易类型扩展字段）

**1. 配置 bizExtMappings + bizTypeMetas：**

```typescript
LedgerModule.forRoot({
  accountTags: ['default', 'user', 'system'],
  bizTypes: ['recharge', 'exchange', 'promo_reward', 'task_reward'],

  // 业务扩展字段 -> 预留索引位映射（不同交易类型字段不同，映射到固定 4 个索引位）
  bizExtMappings: {
    recharge:     { channel: 'extCol1', outTradeNo: 'extCol2' },
    promo_reward: { promoterId: 'extCol1', campaignId: 'extCol2', region: 'extCol3' },
    task_reward:  { taskId: 'extCol1' },
    exchange:     { goodsId: 'extCol1', storeId: 'extCol2' },
  },

  // 业务类型展示元数据（经 GET /api/ext/ledger/biz-types 下发前端）
  bizTypeMetas: {
    recharge: {
      label: '充值',
      search: [
        {
          key: 'channel', label: '渠道', type: 'select',
          options: [
            { value: 'wechat', label: '微信' },
            { value: 'alipay', label: '支付宝' },
            { value: 'bank', label: '银行' },
          ],
        },
        { key: 'outTradeNo', label: '外部支付单号' },
      ],
      columns: [
        { prop: 'channel', label: '渠道', width: 100 },
        { prop: 'outTradeNo', label: '外部支付单号', width: 180, cp: true },
      ],
      detail: [
        { key: 'channel', label: '渠道', span: 1 },
        { key: 'outTradeNo', label: '外部支付单号', span: 2 },
      ],
    },
    promo_reward: {
      label: '推广奖励',
      search: [
        { key: 'promoterId', label: '推广人ID' },
        { key: 'campaignId', label: '活动ID', type: 'select', optionsSource: 'campaigns' },
        { key: 'region', label: '推广区域', type: 'cascader', optionsSource: 'regions', matchMode: 'prefix' },
      ],
      columns: [
        { prop: 'promoterId', label: '推广人ID', width: 130, cp: true },
        { prop: 'campaignId', label: '活动ID', width: 130, cp: true },
        { prop: 'region', label: '推广区域', width: 130, cp: true },
      ],
      detail: [
        { key: 'promoterId', label: '推广人ID', span: 1 },
        { key: 'campaignId', label: '活动ID', span: 1 },
        { key: 'region', label: '推广区域', span: 2 },
      ],
    },
    // ... exchange, task_reward 配置类似
  },
})
```

**2. 初始化积分账户（发行库 1 亿 + 用户 0 + 回购池 0）：**

```typescript
const user = await this.accountService.openAccount({
  holderId: 'points-user-001', holderType: 'user', tag: 'user', currency: 'ITG',
})
const issuer = await this.accountService.openAccount({
  holderId: 'points-issuer', holderType: 'system', tag: 'system', currency: 'ITG',
  initialBalance: '100000000',  // 1 亿发行上限
})
const recycle = await this.accountService.openAccount({
  holderId: 'points-recycle', holderType: 'system', tag: 'system', currency: 'ITG',
})
```

**3. 充值（B 发行库 -> A 用户，extFields 写入预留索引位）：**

```typescript
await this.transferService.createTransfer({
  bizRef: `recharge-${bizRef}`,
  bizType: 'recharge',
  fromAccount: issuer.id,
  toAccounts: [{ account: user.id, amount: '1000' }],
  amount: '1000',
  currency: 'ITG',
  needReview: false,
  extra: { channel: 'wechat', outTradeNo: 'PAY20260814001' },       // 校验 + 快照
  extFields: { channel: 'wechat', outTradeNo: 'PAY20260814001' },   // 映射写 extCol1/extCol2
})
```

**4. 按扩展字段查交易单（走预留索引位）：**

```typescript
// 等价 SQL: WHERE bizType='recharge' AND ext_col1='wechat'
const result = await this.storage.queryTransfers({
  bizType: 'recharge',
  extFields: { channel: 'wechat' },
  page: 1,
  pageSize: 20,
})
```

### 场景三：SPI 替换实现

**1. 自定义 ILedgerFieldExtension（业务校验规则）：**

```typescript
import { Injectable } from '@nestjs/common'
import { ILedgerFieldExtension } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class DemoFieldExtension implements ILedgerFieldExtension {
  validateAccountExtra(tag: string, extra: Record<string, unknown> | null): void {
    if (tag === 'merchant') {
      if (!extra?.merchantNo) throw new Error('商家账户必须包含 merchantNo')
      if (!extra?.merchantName) throw new Error('商家账户必须包含 merchantName')
    }
    if (tag === 'user') {
      if (!extra?.userName) throw new Error('用户账户必须包含 userName')
    }
  }

  validateTransferExtra(bizType: string, extra: Record<string, unknown> | null): void {
    if (bizType === 'order_pay') {
      if (!extra?.orderNo) throw new Error('订单支付必须包含 orderNo')
    }
    if (bizType === 'refund') {
      if (!extra?.orderNo) throw new Error('退款必须包含 orderNo')
      if (!extra?.reason) throw new Error('退款必须包含 reason')
    }
  }
}

// 注入：forRoot({ fieldExtensionImpl: DemoFieldExtension })
```

**2. 自定义 ILedgerNotifier 监听器（注册事件监听）：**

```typescript
import { Injectable, OnModuleInit, Inject } from '@nestjs/common'
import {
  LEDGER_NOTIFIER, ILedgerNotifier, LedgerEventListener,
  TransferPostedEvent, TransferFailedEvent, ReconcileDiffEvent,
} from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class MyNotifyListener implements LedgerEventListener, OnModuleInit {
  private events: any[] = []

  constructor(@Inject(LEDGER_NOTIFIER) private readonly notifier: ILedgerNotifier) {}

  onModuleInit() {
    // 业务方注册监听器
    this.notifier.registerListener(this)
  }

  onTransferPosted(event: TransferPostedEvent) {
    console.log(`记账完成: ${event.transferNo}, 金额: ${event.amount}`)
    this.events.push({ type: 'posted', ...event })
    // 可触发下游业务（如通知、缓存更新等）
  }

  onTransferFailed(event: TransferFailedEvent) {
    console.error(`记账失败: ${event.transferNo}, 错误: ${event.error}`)
    this.events.push({ type: 'failed', ...event })
    // 可触发告警
  }

  onReconcileDiff(event: ReconcileDiffEvent) {
    console.warn(`对账差异: ${event.diffCount} 个账户`)
    this.events.push({ type: 'diff', ...event })
    // 可触发自动修复或人工通知
  }
}
```

**3. 自定义账户实体（继承 LedgerAccountBase + creditLimit 列）：**

```typescript
import { Entity, Column } from 'typeorm'
import { LedgerAccountBase } from 'moyan-mfw-extension-ledger/backend'

@Entity('ext_ledger_account', { synchronize: false })
export class DemoMerchantAccount extends LedgerAccountBase {
  @Column({ type: 'bigint', default: 0, comment: '信用额度' })
  creditLimit: string
}

// 注入：forRoot({ accountEntity: DemoMerchantAccount })
// 扩展方须自带 migration：
// ALTER TABLE ext_ledger_account ADD COLUMN creditLimit BIGINT DEFAULT 0
```

**4. SPI 直用（业务层注入 SPI token）：**

```typescript
import { Inject, Injectable } from '@nestjs/common'
import {
  LEDGER_QUEUE, LEDGER_LOCK, LEDGER_STORAGE, LEDGER_FIELD_EXTENSION,
  ILedgerQueue, ILedgerLock, ILedgerStorage, ILedgerFieldExtension,
} from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class MyBusinessService {
  constructor(
    @Inject(LEDGER_QUEUE) private readonly queue: ILedgerQueue,
    @Inject(LEDGER_LOCK) private readonly lock: ILedgerLock,
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_FIELD_EXTENSION) private readonly fieldExt: ILedgerFieldExtension,
  ) {}

  // 队列积压监控
  async queueStats() {
    return { length: await this.queue.length() }
  }

  // 业务互斥（如每日结算防重入）
  async dailySettle() {
    const token = await this.lock.tryLock('my:ledger:settle', 300)
    if (!token) throw new Error('结算任务正在执行中')
    try {
      // ... 结算逻辑
    } finally {
      await this.lock.unlock('my:ledger:settle', token)
    }
  }

  // 报表直查（跳过服务层）
  async report(accountId: string) {
    return this.storage.queryEntries({
      accountId,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(),
      page: 1,
      pageSize: 100,
    })
  }

  // 制单前前置校验
  validateBeforeCreate(bizType: string, extra: Record<string, unknown>) {
    this.fieldExt.validateTransferExtra(bizType, extra)
  }
}
```

### 场景四：对账 + 定时调度

**1. 手动触发对账：**

```typescript
import { LedgerReconcileService } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class MyService {
  constructor(private readonly reconcile: LedgerReconcileService) {}

  async runReconcile() {
    // 全量对账（内部自动走 LEDGER_LOCK 互斥；有差异时通知 diff 事件）
    const result = await this.reconcile.runAll('manual')
    // { reportId, totalAccounts, diffCount }

    // 单账户对账
    const accountResult = await this.reconcile.runAccount(accountId)
    // { balanced: boolean, diff: string }

    // 增量修复
    if (!accountResult.balanced) {
      await this.reconcile.applyFix(accountId, { id: 'admin', text: '管理员' })
    }
  }
}
```

**2. 对接 extension-scheduler 定时调度：**

```typescript
import { Injectable } from '@nestjs/common'
import { ScheduledTaskHandler } from 'moyan-mfw-extension-scheduler/backend'
import { LedgerReconcileService } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class LedgerDailyReconcileHandler implements ScheduledTaskHandler {
  taskCode = 'ledger-daily-reconcile'
  taskName = '账本每日对账'
  taskType = 'cron' as const
  defaultCron = '0 3 * * *'  // 每日 3 点

  constructor(private readonly reconcile: LedgerReconcileService) {}

  async execute() {
    await this.reconcile.runAll('scheduler')
  }
}
```

---

## 部署硬约束

| 约束 | 说明 |
|---|---|
| **多实例必须 RedisStreamQueue** | 进程内队列仅单实例有效；多实例下消息只在本实例消费 |
| **多实例必须 RedisLock** | DbLock(GET_LOCK) 跨连接互斥但性能有限；高并发用 RedisLock |
| **MySQL 8+** | KEY 分区、CHECK 约束、XAUTOCLAIM(Redis≥6.2) |
| **兜底扫描默认开启** | 可靠性关键路径（与 Stream MAXLEN 不可同关） |
| **driver=redis** | 多实例下 CacheModule 须配 redis 驱动，否则 getClient() 抛异常 |

---

## 架构概览

```
制单(同步事务) ──预占──> 入队 ──> 消费者(信号量并发) ──认领(CAS)──> 入账事务(末位CAS) ──> POSTED
                                  │
                                  ├─ 账务异常 ─> 回退PENDING(条件) + 退避重入队
                                  ├─ fencing失败 ─> 放弃(已被接管)
                                  └─ 重试耗尽 ─> FAILED + 通知(人工重推/取消)

兜底扫描(30s,选主) ─> PENDING超时补发 + POSTING孤儿(5min)重置重推
对账(能力,非调度) ─> 恒等式校验 + 增量修复(原子写调整分录) ─ 业务方对接 extension-scheduler 定时
```

**核心不变量**：`balance + frozen + pendingOut ≡ Σ(signed_amount)`（全状态机成立，已数学证明）

### 设计决策

| 决策 | 说明 |
|---|---|
| 纯异步执行 | 制单即返回，余额入账全部经队列消费 |
| 同步预占 | 制单事务内单条原子条件 UPDATE（`WHERE balance >= amt`），防超支 |
| 两段式审核 | 需审单预占进 frozen 待审；免审单预占进 pending_out 直接入队 |
| bigint 金额 | 统一最小单位；JSON 用字符串防 JS 精度丢失 |
| 仅全额冲正 | 借贷反向 + 关联原单；唯一索引防双冲正 |
| 对账零定时 | 包内只提供能力，定时调度由业务方对接 extension-scheduler |
| KEY 分区 | 流水表 KEY(account_id) 64 分区，用户跨月查询单分区命中 |

---

## 状态机（post_status）

```
制单免审 ─> PENDING(入队)
制单需审 ─> NOT_READY(不入队)
审核通过 ─> NOT_READY ─> PENDING(入队)   [单条原子写,防僵尸单]
审核驳回 ─> REJECTED(终态,解冻)
消费认领 ─> PENDING ─> POSTING(claim_token)
入账成功 ─> POSTED(末位CAS)
重试耗尽 ─> FAILED(终态,预占保留)
人工取消 ─> CANCELLED(终态,按hold_type回滚预占)
```

兜底扫描**只处理 PENDING(入队超时) 与 POSTING(孤儿)**，绝不碰 NOT_READY/REJECTED/FAILED/CANCELLED/POSTED。

---

## XACK 协议（消息可靠性）

- 所有不处理路径（已POSTED/他人处理中/FAILED/不存在）一律 XACK，杜绝 PEL 影子消息
- 失败路径：**先 XACK 原消息再 ZADD 延迟队列**（防影子风暴）
- 末位 fencing CAS：`UPDATE SET post_status=POSTED WHERE claim_token=:my_token`，0 行=已被接管->整体回滚

---

## 容量与性能

| 层 | 容量 |
|---|---|
| 在线 entry | 64 分区 × 千万级 = 数十亿行（90 天活跃窗口恒定） |
| 归档 entry | RANGE 月分区，总量无上限 |
| transfer | 单表点查，年 3.65 亿行；归档联动 |
| 吞吐 | 制单 ≥1000 TPS/实例；消费 700~2000 笔/s/实例；天花板=单机 MySQL 写吞吐 ≈ 日 1~2 亿笔 |

### 验收指标

| 维度 | 指标 | 目标 |
|---|---|---|
| 一致性 | 恒等式违反率/不超支/重复入账/双冲正 | 全部 0 |
| 性能 | 制单 P99<50ms；消费延迟 P99<1s；流水查询 P99<50ms | 压测 |
| 可用性 | 消息零丢失(兜底≤30s)；孤儿恢复 MTTR≤10min；Redis故障制单可用 | 故障注入 |

---

## License

MIT
