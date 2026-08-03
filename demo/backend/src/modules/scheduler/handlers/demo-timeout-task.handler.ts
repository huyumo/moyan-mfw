/**
 * @fileoverview 超时验证示例处理器
 * @description 演示 timeoutSeconds 配置生效：execute 阻塞 10 秒，
 * 若任务配置的 timeoutSeconds < 10，将被引擎标记为执行超时失败
 */

import { Injectable, Logger } from '@nestjs/common'
import { TaskRegistry, type ScheduledTaskHandler, type TaskExecutionContext } from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'

@Injectable()
export class DemoTimeoutTaskHandler implements ScheduledTaskHandler {
  private readonly logger = new Logger(DemoTimeoutTaskHandler.name)

  readonly taskCode = 'demo.timeout.test'
  readonly taskName = '超时测试任务'
  readonly taskType = TaskTypeDict.DELAY
  readonly defaultTimeoutSeconds = 30
  readonly description = '超时验证：execute 阻塞10秒，配置 timeoutSeconds<10 应超时失败'

  constructor(private readonly registry: TaskRegistry) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext) {
    this.logger.log(`[超时测试] 开始执行... retryCount=${ctx.retryCount}`)
    // 模拟慢业务：阻塞 10 秒，超过配置的 1 秒超时
    await new Promise((resolve) => setTimeout(resolve, 10_000))
    this.logger.log(`[超时测试] 执行完成（除非 timeoutSeconds>10，否则不应走到这里）`)
    return { summary: '超时测试完成', data: { retryCount: ctx.retryCount } }
  }
}
