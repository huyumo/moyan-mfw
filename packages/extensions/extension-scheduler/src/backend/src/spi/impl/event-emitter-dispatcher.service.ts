/**
 * @fileoverview 默认任务派发实现（EventEmitterDispatcher / F1 本地快速路径）
 * @description dispatch 直接 await handler.execute(ctx)，结果直写 ResultBufferPool（绕过事件层，零开销）
 * onResult 不注册回调（本地路径不需要）
 */

import { Injectable } from '@nestjs/common'
import { ITaskDispatcher } from '../interfaces'
import type { ScheduledTaskHandler, TaskExecutionContext, TaskExecutionResult } from '../../interfaces/task-handler.interface'

@Injectable()
export class EventEmitterDispatcher implements ITaskDispatcher {
  /**
   * 派发任务执行（F1 本地快速路径）
   * @description 直接调用 handler.execute，结果返回给调用方
   * 调用方（SchedulerEngineService）负责将结果写入 ResultBufferPool
   */
  async dispatch(handler: ScheduledTaskHandler, ctx: TaskExecutionContext): Promise<TaskExecutionResult | void> {
    return handler.execute(ctx)
  }

  /**
   * 注册结果回调
   * @description 本地快速路径不需要回调，结果通过 dispatch 返回值直接获取
   */
  onResult(_callback: (instanceId: string, result: TaskExecutionResult | null, error?: Error) => void): void {
    // 本地快速路径：不注册回调
  }
}
