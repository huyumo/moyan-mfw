/**
 * @fileoverview 延迟任务示例处理器
 * @description DELAY 类型示例，供手动触发测试
 */

import { Injectable, Logger } from '@nestjs/common'
import { TaskRegistry, type ScheduledTaskHandler, type TaskExecutionContext } from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'

@Injectable()
export class DemoDelayTaskHandler implements ScheduledTaskHandler {
  private readonly logger = new Logger(DemoDelayTaskHandler.name)

  readonly taskCode = 'demo.delay.greeting'
  readonly taskName = '示例延迟任务'
  readonly taskType = TaskTypeDict.DELAY
  readonly defaultTimeoutSeconds = 10
  readonly description = '延迟任务示例，通过API创建延迟实例触发'

  constructor(private readonly registry: TaskRegistry) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext) {
    const payload = ctx.payload || {}
    this.logger.log(`[示例延迟任务] 执行中... entityId=${ctx.entityId}, payload=${JSON.stringify(payload)}`)

    // 模拟业务逻辑
    const greeting = payload.greeting || 'Hello'
    const target = payload.target || 'World'
    const result = { summary: `${greeting}, ${target}!`, data: { greeting, target } }

    this.logger.log(`[示例延迟任务] 执行完成: ${result.summary}`)
    return result
  }
}
