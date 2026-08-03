/**
 * @fileoverview SPI 注入 token 常量
 * @description 用于 NestJS 依赖注入的 token 标识
 */

export const SCHEDULER_TASK_STORAGE = Symbol.for('MOYAN:MFW:SCHEDULER_TASK_STORAGE')
export const SCHEDULER_DISTRIBUTED_LOCK = Symbol.for('MOYAN:MFW:SCHEDULER_DISTRIBUTED_LOCK')
export const SCHEDULER_TASK_DISPATCHER = Symbol.for('MOYAN:MFW:SCHEDULER_TASK_DISPATCHER')
export const SCHEDULER_RUNTIME_NOTIFY = Symbol.for('MOYAN:MFW:SCHEDULER_RUNTIME_NOTIFY')

/** 调度器模块配置选项 */
export interface SchedulerModuleOptions {
  /** 哈希分片数，默认1（单实例） */
  shardCount?: number
  /** IDistributedLock 实现类 */
  lockImpl?: any
  /** ITaskDispatcher 实现类 */
  dispatcherImpl?: any
  /** IRuntimeNotify 实现类 */
  notifyImpl?: any
  /** ITaskStorage 实现类（默认 TypeOrmStorage） */
  storageImpl?: any
  /** 长任务池并发上限，默认10 */
  longPoolMax?: number
  /** 短任务池并发上限，默认30 */
  shortPoolMax?: number
  /** 全局默认最大重试次数，默认3（handler 可通过 maxRetry 属性覆盖） */
  maxRetry?: number
  /** 全局默认退避策略（handler 可通过 backoffStrategy 属性覆盖） */
  backoffStrategy?: import('../../interfaces/task-handler.interface').BackoffStrategy
  /** 预加载窗口大小（毫秒），默认60000 */
  preloadWindowMs?: number
  /** 预加载重载间隔（毫秒），默认60000 */
  reloadIntervalMs?: number
  /** 引擎 tick 精度（毫秒），默认200 */
  tickIntervalMs?: number
  /** 归档轮触发间隔（毫秒），默认60000 */
  archiveIntervalMs?: number
}
