/**
 * @fileoverview 任务派发 SPI 接口
 * @description 定义到期任务的派发方式契约
 */

import type { ScheduledTaskHandler } from '../../interfaces/task-handler.interface'

/**
 * 任务派发 SPI
 * @description 默认实现为 EventEmitterDispatcher（F1 本地快速路径）
 * 可替换为 RedisDispatcher(F2 BullMQ) / RabbitMqDispatcher(F3)
 */
export interface ITaskDispatcher {
  /**
   * 派发任务执行
   * @param handler 任务处理器
   * @param ctx 执行上下文
   * @returns 本地实现返回执行结果；远程实现返回 void（结果通过 onResult 回调）
   */
  dispatch(handler: ScheduledTaskHandler, ctx: import('../../interfaces/task-handler.interface').TaskExecutionContext): Promise<import('../../interfaces/task-handler.interface').TaskExecutionResult | void>

  /**
   * 注册结果回调（远程实现 F2/F3 用；本地 F1 走快速路径不用）
   * @param callback 结果回调函数
   */
  onResult(callback: (instanceId: string, result: import('../../interfaces/task-handler.interface').TaskExecutionResult | null, error?: Error) => void): void
}

// 避免循环引用：ScheduledTaskHandler 类型在 task-handler.interface 中定义
export type { ScheduledTaskHandler }
