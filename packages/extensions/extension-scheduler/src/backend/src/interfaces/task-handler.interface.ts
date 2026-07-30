/**
 * @fileoverview 任务处理器接口
 * @description 业务方实现此接口定义具体的定时任务逻辑
 */

import type { Logger } from '@nestjs/common'

/**
 * 退避策略
 * @description 控制重试任务的下一次执行时间
 */
export type BackoffStrategy =
  | { type: 'fixed'; delays: number[] }        // 固定序列：delays[0]=1s, delays[1]=5s, ...
  | { type: 'exponential'; base: number; max: number; multiplier?: number } // 指数退避：base * multiplier^n，不超过 max
  | { type: 'linear'; interval: number; increment: number } // 线性退避：interval + increment * n
  | { type: 'none' }                           // 不重试

/**
 * 任务执行上下文
 */
export interface TaskExecutionContext {
  /** 任务编码 */
  taskCode: string
  /** 执行日志ID */
  logId: string
  /** 延迟实例ID（DELAY类型） */
  instanceId?: string
  /** 业务实体ID（DELAY类型） */
  entityId?: string
  /** 延迟实例携带的业务数据 */
  payload?: Record<string, any>
  /** 触发时间 */
  triggeredAt: Date
  /** 触发方式 */
  triggerType: number
  /** 日志记录器 */
  logger: Logger
  /** 超时取消信号 */
  signal?: AbortSignal
  /** 当前重试次数（0=首次执行，1=第一次重试，2=第二次重试...） */
  retryCount: number
  /** 最大重试次数 */
  maxRetry: number
}

/**
 * 任务执行结果
 */
export interface TaskExecutionResult {
  /** 执行摘要（如 "取消12笔超时订单"） */
  summary?: string
  /** 执行结果数据 */
  data?: Record<string, any>
}

/**
 * 定时任务处理器接口
 * @description 业务方实现此接口，在构造函数中通过 TaskRegistry.register(this) 自注册
 *
 * @example 基本用法
 * ```typescript
 * @Injectable()
 * export class OrderTimeoutScanHandler implements ScheduledTaskHandler {
 *   readonly taskCode = "order.timeout.scan";
 *   readonly taskName = "订单超时自动取消";
 *   readonly taskType = TaskTypeDict.CRON;
 *   readonly defaultIntervalSeconds = 60;
 *
 *   constructor(private readonly registry: TaskRegistry) {
 *     this.registry.register(this);
 *   }
 *
 *   async execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult> {
 *     // 业务逻辑...
 *     return { summary: `取消${n}笔超时订单` };
 *   }
 * }
 * ```
 *
 * @example 自定义重试策略（支付回调：1→5→30→60→120→300 秒）
 * ```typescript
 * @Injectable()
 * export class PaymentCallbackHandler implements ScheduledTaskHandler {
 *   readonly taskCode = "payment.callback";
 *   readonly taskName = "支付回调通知";
 *   readonly taskType = TaskTypeDict.DELAY;
 *   readonly maxRetry = 5;
 *   readonly backoffStrategy: BackoffStrategy = {
 *     type: 'fixed',
 *     delays: [1_000, 5_000, 30_000, 60_000, 120_000, 300_000], // 1→5→30→60→120→300 秒
 *   };
 *
 *   async execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult> {
 *     // ctx.retryCount 可感知当前是第几次重试
 *     const success = await this.callPaymentGateway(ctx.entityId!);
 *     if (!success) throw new Error('回调失败'); // 抛错 → 触发重试
 *     return { summary: '回调成功' };
 *   }
 * }
 * ```
 */
export interface ScheduledTaskHandler {
  /** 任务编码（唯一标识） */
  readonly taskCode: string
  /** 任务名称 */
  readonly taskName: string
  /** 任务类型：CRON | DELAY */
  readonly taskType: number
  /** 默认6段cron（如 "0 *\/1 * * * *" = 每分钟），与 defaultIntervalSeconds 二选一 */
  readonly defaultCron?: string
  /** 默认固定间隔秒数（与 defaultCron 二选一） */
  readonly defaultIntervalSeconds?: number
  /** 默认超时秒数 */
  readonly defaultTimeoutSeconds?: number
  /** 重启后补偿执行（默认false） */
  readonly catchUpOnRestart?: boolean
  /** 任务描述 */
  readonly description?: string

  // ── 重试配置（handler 级别，覆盖全局默认） ──

  /** 最大重试次数（0=不重试，默认使用全局配置） */
  readonly maxRetry?: number
  /** 退避策略（默认使用全局配置的指数退避） */
  readonly backoffStrategy?: BackoffStrategy

  /** 执行任务 */
  execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult | void>
}
