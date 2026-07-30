/**
 * @fileoverview 定时任务示例处理器
 * @description CRON 类型示例，每分钟执行，打印日志
 */

import { Injectable, Logger } from '@nestjs/common'
import { TaskRegistry, type ScheduledTaskHandler, type TaskExecutionContext } from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'

@Injectable()
export class DemoCronTaskHandler implements ScheduledTaskHandler {
  private readonly logger = new Logger(DemoCronTaskHandler.name)

  readonly taskCode = 'demo.cron.hello'
  readonly taskName = '示例Cron任务'
  readonly taskType = TaskTypeDict.CRON
  readonly defaultIntervalSeconds = 60
  readonly defaultTimeoutSeconds = 30
  readonly description = '每分钟执行一次的示例任务，打印日志'

  constructor(private readonly registry: TaskRegistry) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext) {
    this.logger.log(`[示例Cron任务] 执行中... triggeredAt=${ctx.triggeredAt.toISOString()}`)
    // 模拟业务逻辑
    const result = { summary: '示例Cron任务执行成功', data: { time: ctx.triggeredAt.toISOString() } }
    this.logger.log(`[示例Cron任务] 执行完成: ${result.summary}`)
    return result
  }
}
