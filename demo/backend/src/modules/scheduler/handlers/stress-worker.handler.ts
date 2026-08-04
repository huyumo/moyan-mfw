/**
 * @fileoverview 压测工作处理器
 * @description 压力测试专用：按 payload.sleepMs 异步睡眠模拟业务负载，
 * 不逐条输出日志避免日志风暴干扰压测指标（日志落库由调度器日志表承担）
 */

import { Injectable } from '@nestjs/common'
import { TaskRegistry, type ScheduledTaskHandler, type TaskExecutionContext } from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'

@Injectable()
export class StressWorkerHandler implements ScheduledTaskHandler {
  readonly taskCode = 'stress.worker'
  readonly taskName = '压测工作任务'
  readonly taskType = TaskTypeDict.DELAY
  readonly defaultTimeoutSeconds = 10
  readonly description = '压测专用：按 payload.sleepMs 睡眠模拟业务负载'

  constructor(private readonly registry: TaskRegistry) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext) {
    const sleepMs = Math.min(ctx.payload?.sleepMs ?? 50, 5_000)
    // 模拟业务耗时（可被 payload.sleepMs 覆盖）
    await new Promise((resolve) => setTimeout(resolve, sleepMs))
    return { summary: `stress done in ${sleepMs}ms`, data: { sleepMs } }
  }
}
