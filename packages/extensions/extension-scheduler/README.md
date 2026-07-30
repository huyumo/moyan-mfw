# moyan-mfw-extension-scheduler

MFW 分布式定时任务管理扩展包 — 作为 `moyan-mfw-base` 的官方扩展，提供通用型、可插拔、分布式安全的定时任务管理能力。

支持 **Cron 周期任务** + **延迟任务** 两种模式，内置分层时间轮调度引擎、失败重试（自定义退避策略）、崩溃恢复、优雅停机，以及四类可插拔 SPI（存储/锁/派发/通知）。

---

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [任务模式](#任务模式)
- [注册业务任务处理器](#注册业务任务处理器)
- [创建延迟任务](#创建延迟任务)
- [失败重试机制](#失败重试机制)
- [模块配置选项](#模块配置选项)
- [Admin API](#admin-api)
- [前端集成](#前端集成)
- [四类 SPI](#四类-spi)
- [自定义适配器开发](#自定义适配器开发)
- [数据库表](#数据库表)
- [字典枚举](#字典枚举)
- [架构概览](#架构概览)

---

## 安装

```bash
pnpm add moyan-mfw-base moyan-mfw-extension-scheduler
```

> 依赖要求：Node.js >= 20.0.0，moyan-mfw-base >= 1.0.0

---

## 快速开始

### 后端集成

```typescript
// backend/src/main.ts
import { createBaseBackendApp } from 'moyan-mfw-base/backend'
import { SCHEDULER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-scheduler/backend'

const app = await createBaseBackendApp({
  name: '我的应用',
  modules: [AppModule],
  permissionValues: [...SCHEDULER_EXTENSION_PERMISSION_VALUES],
})
await app.listen(3000)
```

```typescript
// backend/src/app.modules.ts
import { SchedulerModule } from 'moyan-mfw-extension-scheduler/backend'

@Module({
  imports: [
    SchedulerModule.forRoot({
      shardCount: 1, // 哈希分片数 = 部署实例数
    }),
  ],
})
export class AppModule {}
```

### 前端集成

```typescript
// frontend/src/main.ts
import { registerPermissionValues } from 'moyan-mfw-base/frontend'
import { SCHEDULER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-scheduler/shared'

registerPermissionValues([...SCHEDULER_EXTENSION_PERMISSION_VALUES])
```

```typescript
// frontend/src/menu-trees.ts
import { MfwScheduledTaskPage } from 'moyan-mfw-extension-scheduler/frontend'

// 在菜单树中添加：
{
  path: 'scheduled-task',
  name: '定时任务管理',
  icon: 'Clock',
  permissions: ['编辑', '执行'],
  component: MfwScheduledTaskPage,
}
```

---

## 任务模式

| 模式 | 字典值 | 说明 | 适用场景 |
|------|--------|------|---------|
| Cron 周期任务 | `TaskTypeDict.CRON` (1) | 按 Cron 表达式或固定间隔周期执行 | 数据清理、报表生成、心跳检测 |
| 延迟任务 | `TaskTypeDict.DELAY` (2) | 指定精确执行时间，每笔一个独立实例 | 订单超时取消、支付回调重试、预约提醒 |

### Cron 表达式格式

使用 6 段秒级 Cron（`cron` npm 包）：

```
秒 分 时 日 月 周
0  */1  *  *  *  *    // 每分钟
0  0   *  *  *  *     // 每小时
*/30  *  *  *  *  *    // 每30秒
```

---

## 注册业务任务处理器

业务方实现 `ScheduledTaskHandler` 接口，在构造函数中通过 `TaskRegistry.register(this)` 自注册：

```typescript
import { Injectable, Logger } from '@nestjs/common'
import {
  TaskRegistry,
  type ScheduledTaskHandler,
  type TaskExecutionContext,
  type TaskExecutionResult,
} from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'

@Injectable()
export class OrderTimeoutScanHandler implements ScheduledTaskHandler {
  private readonly logger = new Logger(OrderTimeoutScanHandler.name)

  readonly taskCode = 'order.timeout.scan'
  readonly taskName = '订单超时自动取消'
  readonly taskType = TaskTypeDict.CRON        // Cron 周期任务
  readonly defaultIntervalSeconds = 60          // 每60秒执行一次
  readonly defaultTimeoutSeconds = 120          // 超时120秒
  readonly description = '扫描并取消超时未支付的订单'

  constructor(private readonly registry: TaskRegistry) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult> {
    this.logger.log(`开始扫描超时订单... triggeredAt=${ctx.triggeredAt.toISOString()}`)
    // 业务逻辑...
    const cancelled = 12
    return { summary: `取消${cancelled}笔超时订单`, data: { cancelled } }
  }
}
```

### ScheduledTaskHandler 接口

```typescript
interface ScheduledTaskHandler {
  /** 任务编码（唯一标识） */
  readonly taskCode: string
  /** 任务名称 */
  readonly taskName: string
  /** 任务类型：TaskTypeDict.CRON | TaskTypeDict.DELAY */
  readonly taskType: number
  /** 默认6段cron表达式，与 defaultIntervalSeconds 二选一 */
  readonly defaultCron?: string
  /** 默认固定间隔秒数，与 defaultCron 二选一 */
  readonly defaultIntervalSeconds?: number
  /** 默认超时秒数 */
  readonly defaultTimeoutSeconds?: number
  /** 重启后是否补偿执行（默认false） */
  readonly catchUpOnRestart?: boolean
  /** 任务描述 */
  readonly description?: string

  // ── 重试配置（handler 级别，覆盖全局默认） ──
  /** 最大重试次数（0=不重试，默认使用全局配置） */
  readonly maxRetry?: number
  /** 退避策略（默认使用全局配置） */
  readonly backoffStrategy?: BackoffStrategy

  /** 执行任务 */
  execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult | void>
}
```

### TaskExecutionContext 执行上下文

```typescript
interface TaskExecutionContext {
  taskCode: string              // 任务编码
  logId: string                 // 执行日志ID
  instanceId?: string           // 延迟实例ID（DELAY类型）
  entityId?: string             // 业务实体ID（DELAY类型）
  payload?: Record<string, any> // 延迟实例携带的业务数据
  triggeredAt: Date             // 触发时间
  triggerType: number           // 触发方式（TaskTriggerTypeDict.AUTO | MANUAL）
  logger: Logger                // NestJS 日志记录器
  signal?: AbortSignal          // 超时取消信号
  retryCount: number            // 当前重试次数（0=首次执行）
  maxRetry: number              // 最大重试次数
}
```

---

## 创建延迟任务

通过 `ScheduledTaskService` 创建延迟实例，引擎会在指定时间自动加载并执行：

```typescript
import { Injectable } from '@nestjs/common'
import { ScheduledTaskService } from 'moyan-mfw-extension-scheduler/backend'

@Injectable()
export class OrderService {
  constructor(private readonly schedulerService: ScheduledTaskService) {}

  async createOrder(order: Order) {
    // 创建订单后，5分钟后触发超时取消
    const instance = await this.schedulerService.createDelayInstance(
      'order.auto.cancel',                        // taskCode（需与 handler 的 taskCode 一致）
      new Date(Date.now() + 5 * 60 * 1000),        // 应执行时间
      order.id,                                     // entityId（业务实体ID）
      { orderNo: order.orderNo, amount: order.amount }, // payload（业务数据）
    )
    // instance.id 可用于后续取消或查询
    return instance
  }
}
```

### 手动触发任务

```typescript
// 立即创建一个 PENDING 实例（executeAt = now）
const instance = await this.schedulerService.triggerTask('payment.callback', {
  orderId: 'ORD123',
  amount: 99.9,
})
```

### ScheduledTaskService 完整方法

| 方法 | 说明 |
|------|------|
| `listTasks()` | 查询所有任务定义 |
| `getTaskDetail(taskCode)` | 查询单个任务定义 |
| `updateTask(taskCode, fields)` | 更新任务运行时配置 |
| `triggerTask(taskCode, payload?)` | 手动触发任务（创建立即执行实例） |
| `createDelayInstance(taskCode, executeAt, entityId?, payload?)` | 创建延迟任务实例 |
| `cancelInstance(id)` | 取消待执行的延迟实例 |
| `getInstance(id)` | 查询实例详情 |
| `listInstances(filters)` | 分页查询实例列表 |
| `listLogs(filters)` | 分页查询执行日志 |
| `getLogDetail(id)` | 查询日志详情 |

---

## 失败重试机制

任务执行抛出异常时，引擎自动按退避策略创建重试实例。重试配置支持 **handler 级别** 和 **全局默认** 两个层级。

### 退避策略（BackoffStrategy）

```typescript
type BackoffStrategy =
  | { type: 'fixed'; delays: number[] }                              // 固定序列
  | { type: 'exponential'; base: number; max: number; multiplier?: number } // 指数退避
  | { type: 'linear'; interval: number; increment: number }         // 线性递增
  | { type: 'none' }                                                // 不重试
```

### 示例1：支付回调递增重试（1→5→30→60→120→300 秒）

```typescript
@Injectable()
export class PaymentCallbackHandler implements ScheduledTaskHandler {
  readonly taskCode = 'payment.callback'
  readonly taskName = '支付回调通知'
  readonly taskType = TaskTypeDict.DELAY

  // 重试配置：5次重试，固定序列递增
  readonly maxRetry = 5
  readonly backoffStrategy: BackoffStrategy = {
    type: 'fixed',
    delays: [1_000, 5_000, 30_000, 60_000, 120_000, 300_000],
    //         1s    5s    30s    60s    120s    300s
  }

  async execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult> {
    // ctx.retryCount 可感知当前是第几次重试
    const attempt = ctx.retryCount + 1
    const success = await this.callPaymentGateway(ctx.entityId!)
    if (!success) {
      throw new Error(`支付回调失败（第${attempt}次）`) // 抛错 → 触发重试
    }
    return { summary: `支付回调成功（第${attempt}次尝试）` }
  }
}
```

### 示例2：指数退避

```typescript
readonly backoffStrategy: BackoffStrategy = {
  type: 'exponential',
  base: 10_000,       // 首次重试：10秒
  multiplier: 2,       // 每次翻倍：10s → 20s → 40s → 80s → 160s
  max: 3_600_000,     // 上限：1小时
}
```

### 示例3：线性递增

```typescript
readonly backoffStrategy: BackoffStrategy = {
  type: 'linear',
  interval: 30_000,    // 首次重试：30秒
  increment: 30_000,   // 每次加30秒：30s → 60s → 90s → 120s → 150s
}
```

### 全局默认重试配置

未在 handler 上声明的，回退到 `forRoot` 全局配置：

```typescript
SchedulerModule.forRoot({
  maxRetry: 3,
  backoffStrategy: {
    type: 'exponential',
    base: 60_000,
    multiplier: 2,
    max: 3_600_000,
  },
})
```

### 重试流程

```
任务执行 → 抛出异常 → BatchArchiverService 归档
  → 检查 retryCount < maxRetry？
    → 是：按 backoffStrategy 计算延迟时间 → 创建新 PENDING 实例（retryCount+1）→ 引擎到点重新执行
    → 否：放弃重试，记录最终失败状态
```

---

## 模块配置选项

```typescript
interface SchedulerModuleOptions {
  /** 哈希分片数，默认1（单实例）。多实例部署时设为实例数 */
  shardCount?: number

  // ── SPI 实现（默认零依赖，按需替换） ──
  /** IDistributedLock 实现类，默认 DbLock */
  lockImpl?: any
  /** ITaskDispatcher 实现类，默认 EventEmitterDispatcher */
  dispatcherImpl?: any
  /** IRuntimeNotify 实现类，默认 PollingNotify */
  notifyImpl?: any
  /** ITaskStorage 实现类，默认 TypeOrmStorage */
  storageImpl?: any

  // ── 并发控制 ──
  /** 长任务池并发上限，默认10（timeout > 30s 的任务） */
  longPoolMax?: number
  /** 短任务池并发上限，默认30（timeout <= 30s 的任务） */
  shortPoolMax?: number

  // ── 重试配置（全局默认，handler 可覆盖） ──
  /** 全局默认最大重试次数，默认3 */
  maxRetry?: number
  /** 全局默认退避策略，默认指数退避 60s→120s→240s */
  backoffStrategy?: BackoffStrategy

  // ── 引擎调度参数 ──
  /** 预加载窗口大小（毫秒），默认60000 */
  preloadWindowMs?: number
  /** 预加载重载间隔（毫秒），默认60000 */
  reloadIntervalMs?: number
  /** 引擎 tick 精度（毫秒），默认200 */
  tickIntervalMs?: number
  /** 归档轮触发间隔（毫秒），默认60000 */
  archiveIntervalMs?: number
}
```

### 完整配置示例

```typescript
SchedulerModule.forRoot({
  // 分布式
  shardCount: 2,

  // 并发
  longPoolMax: 10,
  shortPoolMax: 30,

  // 重试
  maxRetry: 5,
  backoffStrategy: {
    type: 'fixed',
    delays: [1_000, 5_000, 30_000, 60_000, 120_000],
  },

  // 引擎参数
  preloadWindowMs: 60_000,
  reloadIntervalMs: 60_000,
  tickIntervalMs: 200,
  archiveIntervalMs: 60_000,

  // 自定义 SPI（可选）
  // lockImpl: RedisLock,
  // notifyImpl: RedisPubSubNotify,
})
```

---

## Admin API

所有 API 路由前缀：`/api/ext/scheduler`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/tasks` | 查询任务定义列表 | 无（登录即可） |
| GET | `/tasks/:taskCode` | 查询任务定义详情 | 无 |
| PUT | `/tasks/:taskCode` | 更新任务配置 | `编辑` |
| POST | `/tasks/:taskCode/trigger` | 手动触发任务 | `执行` |
| GET | `/instances` | 分页查询延迟实例 | 无 |
| POST | `/instances/:id/cancel` | 取消延迟实例 | `编辑` |
| GET | `/logs` | 分页查询执行日志 | 无 |
| GET | `/logs/:id` | 查询日志详情 | 无 |

### API 示例

```bash
# 查询任务定义
curl http://localhost:3000/api/ext/scheduler/tasks \
  -H "Authorization: Bearer <token>"

# 手动触发任务
curl -X POST http://localhost:3000/api/ext/scheduler/tasks/demo.cron.hello/trigger \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"payload":{"key":"value"}}'

# 查询执行日志
curl "http://localhost:3000/api/ext/scheduler/logs?taskCode=payment.callback&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"

# 取消延迟实例
curl -X POST http://localhost:3000/api/ext/scheduler/instances/<instanceId>/cancel \
  -H "Authorization: Bearer <token>"
```

---

## 前端集成

### 三视图管理页面

扩展包导出 `MfwScheduledTaskPage` 组件，提供三个 Tab 视图：

| Tab | 内容 | 操作 |
|-----|------|------|
| 任务定义 | 任务定义列表（名称/编码/类型/调度方式/启用/上次/下次/状态） | 配置(编辑)、手动执行 |
| 延迟实例 | 延迟任务实例列表（编码/实体ID/应执行时间/状态/重试次数） | 取消 |
| 执行日志 | 派发日志列表（名称/触发方式/状态/开始时间/耗时/错误） | 查看详情 |

### 前端 API 调用类

后端运行后可通过 `api.build.cjs` 从 Swagger 自动生成 API SDK。手动使用：

```typescript
import {
  ApiSchedulerListTasks,
  ApiSchedulerTriggerTask,
  ApiSchedulerListInstances,
  ApiSchedulerCancelInstance,
  ApiSchedulerListLogs,
  ApiSchedulerGetLog,
  ApiSchedulerUpdateTask,
  ApiSchedulerGetTask,
} from 'moyan-mfw-extension-scheduler/frontend'

// 查询任务定义
const result = await new ApiSchedulerListTasks({})

// 手动触发任务
await new ApiSchedulerTriggerTask({ params: { taskCode: 'demo.cron.hello' } })

// 查询日志
const logs = await new ApiSchedulerListLogs({ query: { page: 1, pageSize: 10, taskCode: 'payment.callback' } })
```

---

## 四类 SPI

扩展包通过四类 SPI 实现可插拔架构。默认实现零外部依赖，使用者可按需替换：

| SPI | 默认实现 | 职责 | 替换场景 |
|-----|---------|------|---------|
| `ITaskStorage` | TypeOrmStorage | 任务定义/实例/日志持久化 + 查询（含批量认领、批量归档） | 自定义存储 |
| `IDistributedLock` | DbLock | 多实例执行互斥 | Redis 分布式锁 |
| `ITaskDispatcher` | EventEmitterDispatcher | 到期任务的派发方式（本地快速路径） | RabbitMQ 远程派发 |
| `IRuntimeNotify` | PollingNotify | 运行时新增任务的即时通知 | Redis PubSub 即时通知 |

### SPI 接口定义

**IDistributedLock**

```typescript
interface IDistributedLock {
  tryLock(resource: string, ttlSeconds: number): Promise<string | null>
  unlock(resource: string, token: string): Promise<boolean>
}
```

**ITaskDispatcher**

```typescript
interface ITaskDispatcher {
  dispatch(handler: ScheduledTaskHandler, ctx: TaskExecutionContext): Promise<TaskExecutionResult | void>
  onResult(callback: (instanceId: string, result: TaskExecutionResult | null, error?: Error) => void): void
}
```

**IRuntimeNotify**

```typescript
interface IRuntimeNotify {
  notifyTaskScheduled(taskCode: string, executeAt: Date): Promise<void>
  onScheduled(callback: (taskCode: string, executeAt: Date) => void): void
}
```

**ITaskStorage** — 完整接口含任务定义 CRUD、实例批量认领/归档、日志批量创建、孤儿清理、分页查询等，详见 `src/backend/src/spi/interfaces/task-storage.interface.ts`。

---

## 自定义适配器开发

使用者按需实现 SPI 接口，通过 `forRoot` 注入。以下是 Redis 适配器示例：

### Redis 分布式锁

```typescript
import { Injectable } from '@nestjs/common'
import { createClient, type RedisClientType } from 'redis'
import type { IDistributedLock } from 'moyan-mfw-extension-scheduler/backend'

@Injectable()
export class RedisLock implements IDistributedLock {
  private client: RedisClientType

  private readonly UNLOCK_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `

  async onModuleInit() {
    this.client = createClient({ url: 'redis://localhost:6379' }) as RedisClientType
    await this.client.connect()
  }

  async tryLock(resource: string, ttlSeconds: number): Promise<string | null> {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const result = await this.client.set(`scheduler:lock:${resource}`, token, {
      NX: true,
      EX: ttlSeconds,
    })
    return result === 'OK' ? token : null
  }

  async unlock(resource: string, token: string): Promise<boolean> {
    const result = await this.client.eval(this.UNLOCK_SCRIPT, {
      keys: [`scheduler:lock:${resource}`],
      arguments: [token],
    })
    return result === 1
  }
}
```

### Redis PubSub 即时通知

```typescript
import { Injectable } from '@nestjs/common'
import { createClient, type RedisClientType } from 'redis'
import type { IRuntimeNotify } from 'moyan-mfw-extension-scheduler/backend'

const CHANNEL = 'scheduler:notify'

@Injectable()
export class RedisPubSubNotify implements IRuntimeNotify {
  private publisher: RedisClientType
  private subscriber: RedisClientType
  private callbacks: Array<(taskCode: string, executeAt: Date) => void> = []

  async onModuleInit() {
    this.publisher = createClient({ url: 'redis://localhost:6379' }) as RedisClientType
    this.subscriber = createClient({ url: 'redis://localhost:6379' }) as RedisClientType
    await this.publisher.connect()
    await this.subscriber.connect()

    // 订阅通知频道（需独立连接）
    await this.subscriber.subscribe(CHANNEL, (message: string) => {
      const { taskCode, executeAt } = JSON.parse(message)
      for (const cb of this.callbacks) {
        cb(taskCode, new Date(executeAt))
      }
    })
  }

  async notifyTaskScheduled(taskCode: string, executeAt: Date): Promise<void> {
    await this.publisher.publish(CHANNEL, JSON.stringify({
      taskCode,
      executeAt: executeAt.toISOString(),
    }))
  }

  onScheduled(callback: (taskCode: string, executeAt: Date) => void): void {
    this.callbacks.push(callback)
  }
}
```

### 注入自定义适配器

```typescript
SchedulerModule.forRoot({
  shardCount: 2,
  lockImpl: RedisLock,            // 替换默认 DbLock
  notifyImpl: RedisPubSubNotify,  // 替换默认 PollingNotify
  // dispatcherImpl: RabbitMqDispatcher,  // 替换默认 EventEmitterDispatcher
})
```

> SPI 接口定义详见 `src/backend/src/spi/interfaces/` 目录。

---

## 数据库表

扩展包创建 3 张表（均使用 `ext_scheduler_` 前缀），开发模式下 TypeORM `synchronize` 自动建表，生产环境通过迁移脚本建表。

### ext_scheduler_task（任务定义）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) PK | 主键 |
| taskCode | VARCHAR(128) UNIQUE | 任务编码 |
| taskName | VARCHAR(128) | 任务名称 |
| taskType | TINYINT | 任务类型（1=Cron 2=延迟） |
| cronExpression | VARCHAR(128) | Cron 表达式 |
| intervalSeconds | INT | 固定间隔秒数 |
| enabled | BOOLEAN | 是否启用 |
| timeoutSeconds | INT | 超时秒数 |
| description | TEXT | 任务描述 |
| catchUpOnRestart | BOOLEAN | 重启补偿 |
| lastRunAt | DATETIME | 上次执行时间 |
| nextRunAt | DATETIME | 下次执行时间 |
| lastRunStatus | TINYINT | 上次执行状态 |
| lastErrorMessage | TEXT | 上次错误信息 |

### ext_scheduler_task_instance（延迟任务实例）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) PK | 主键 |
| taskCode | VARCHAR(128) | 任务编码 |
| entityId | VARCHAR(128) | 业务实体ID |
| payload | JSON | 业务数据 |
| executeAt | DATETIME | 应执行时间 |
| status | TINYINT | 实例状态 |
| startedAt | DATETIME | 开始执行时间 |
| finishedAt | DATETIME | 完成时间 |
| retryCount | INT | 重试次数 |
| errorMessage | TEXT | 错误信息 |
| errorStack | TEXT | 错误堆栈 |
| executor | VARCHAR(64) | 执行实例标识 |

核心索引：
- `idx_task_instance_scan (status, executeAt)` — 预加载扫描索引
- `idx_task_instance_archive (executor, status)` — 归档批量更新索引

### ext_scheduler_task_log（执行日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) PK | 主键 |
| taskCode | VARCHAR(128) | 任务编码 |
| taskName | VARCHAR(128) | 任务名称 |
| instanceId | VARCHAR(36) | 延迟实例ID |
| status | TINYINT | 执行状态 |
| triggerType | TINYINT | 触发方式 |
| startedAt | DATETIME | 开始时间 |
| finishedAt | DATETIME | 完成时间 |
| durationMs | INT | 耗时毫秒 |
| executor | VARCHAR(64) | 执行实例标识 |
| errorMessage | TEXT | 错误信息 |
| errorStack | TEXT | 错误堆栈 |
| result | JSON | 执行结果摘要 |

---

## 字典枚举

从 `moyan-mfw-extension-scheduler/shared` 导入：

### TaskTypeDict — 任务类型

| 值 | 标签 |
|----|------|
| `CRON = 1` | Cron 定时 |
| `DELAY = 2` | 延迟任务 |

### TaskInstanceStatusDict — 实例状态

| 值 | 标签 |
|----|------|
| `PENDING = 1` | 待执行 |
| `RUNNING = 2` | 执行中 |
| `SUCCESS = 3` | 已成功 |
| `FAILED = 4` | 已失败 |
| `CANCELLED = 5` | 已取消 |
| `TIMEOUT = 6` | 已超时 |
| `TIMEOUT_ORPHAN = 7` | 未归档（崩溃残留） |

### TaskRunStatusDict — 执行状态

| 值 | 标签 |
|----|------|
| `RUNNING = 1` | 执行中 |
| `SUCCESS = 2` | 成功 |
| `FAILED = 3` | 失败 |
| `TIMEOUT = 4` | 超时 |
| `SKIPPED = 5` | 跳过 |

### TaskTriggerTypeDict — 触发方式

| 值 | 标签 |
|----|------|
| `AUTO = 1` | 自动 |
| `MANUAL = 2` | 手动 |

---

## 架构概览

### 调度引擎核心链路

```
正向调度链：
  DB → 预加载(分片+认领) → 分钟轮 → 秒轮 → 派发 → 执行池 → 结果缓冲

归档落库链：
  归档轮(60s) → 批量归档(分组UPDATE) → 失败重试 → 批量INSERT日志
```

### 关键工程决策

| 决策 | 说明 |
|------|------|
| 认领前移 | 批量认领在预加载阶段完成（1 UPDATE + 1 SELECT），秒轮路径零 DB |
| 长短双池 | 长任务(maxConcurrency=10) + 短任务(maxConcurrency=30)，async 信号量控制 |
| F1 快速路径 | 本地实现下结果直写缓冲池，绕过事件层，零开销 |
| flush 兜底 | OnModuleDestroy 时强制 flush 缓冲落库；崩溃残留靠启动孤儿清理 |

### 性能预期

| 配置 | 稳态吞吐 | 说明 |
|------|---------|------|
| 默认（F1 本地 + InProcess） | ~1000-2000/s | handler 执行占 DB 连接池 |
| F3 RabbitMQ + N 消费者 | N × 1000/s | 调度器只认领+publish，消费者横向扩展 |

### 状态更新策略

| 操作 | 策略 | 理由 |
|------|------|------|
| 认领 (claim) | 批量 (1 UPDATE + 1 SELECT / 周期) | 从 N 次降到 2 次 DB 交互 |
| 结果归档 | 批量 (分组 UPDATE / 分钟) | 缓冲到分钟级再落库 |
| 孤儿清理 | 批量 (启动时 1 次) | 一次清理所有 RUNNING 孤儿 |

---

## 权限

| 权限标签 | 说明 |
|---------|------|
| `执行` | 手动触发任务（扩展包自定义） |
| `查看` | 查看任务/实例/日志（框架内置） |
| `编辑` | 编辑任务配置/取消实例（框架内置） |
| `删除` | 删除任务（框架内置） |

---

## License

MIT
