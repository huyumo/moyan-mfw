/**
 * @fileoverview 立即执行任务示例处理器
 * @description 演示 DELAY 类型任务的立即执行模式：
 * 通过 createDelayInstance(taskCode, new Date()) 创建即执行（0 延迟）；
 * 执行失败后与普通延时任务行为一致，按 backoffStrategy 递增重试
 */

import { Injectable, Logger } from '@nestjs/common'
import {
  TaskRegistry,
  type ScheduledTaskHandler,
  type TaskExecutionContext,
  type TaskExecutionResult,
  type BackoffStrategy,
} from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'

/** 模拟失败次数：前2次失败（触发重试），第3次起成功 */
const SIMULATE_FAIL_UNTIL_RETRY = 2

@Injectable()
export class DemoImmediateTaskHandler implements ScheduledTaskHandler {
  private readonly logger = new Logger(DemoImmediateTaskHandler.name)

  readonly taskCode = 'demo.immediate.hello'
  readonly taskName = '立即执行任务示例'
  readonly taskType = TaskTypeDict.DELAY
  readonly defaultTimeoutSeconds = 10
  readonly description = '立即执行模式示例：创建即执行，失败后按 2s→5s 递增重试'

  // ── 重试配置：最多重试2次（加上首次执行共3次尝试机会） ──
  readonly maxRetry = 2
  readonly backoffStrategy: BackoffStrategy = {
    type: 'fixed',
    delays: [2_000, 5_000],
  }

  constructor(private readonly registry: TaskRegistry) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult> {
    const payload = ctx.payload || {}
    const attempt = ctx.retryCount + 1
    this.logger.log(
      `[立即执行示例] 第${attempt}次尝试: retryCount=${ctx.retryCount}/${ctx.maxRetry}, payload=${JSON.stringify(payload)}`,
    )

    // 模拟业务：前2次失败（触发重试），第3次起成功
    if (ctx.retryCount < SIMULATE_FAIL_UNTIL_RETRY) {
      this.logger.warn(`[立即执行示例] 第${attempt}次失败: 模拟网络抖动`)
      throw new Error(`立即执行任务失败（第${attempt}次）：模拟网络抖动`)
    }

    this.logger.log(`[立即执行示例] 第${attempt}次成功`)
    return {
      summary: `立即执行任务成功（第${attempt}次尝试）`,
      data: { attempt, retryCount: ctx.retryCount, payload },
    }
  }
}
