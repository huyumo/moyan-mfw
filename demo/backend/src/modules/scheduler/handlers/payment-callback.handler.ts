/**
 * @fileoverview 支付回调通知处理器
 * @description 经典的支付回调重试场景：1→5→30→60→120→300 秒递增重试
 *
 * 业务场景：
 *   用户支付成功后，第三方支付网关需要回调通知业务系统。
 *   网络抖动、服务端宕机等导致回调失败时，需要按递增间隔重试。
 *
 * 重试序列：1s → 5s → 30s → 60s → 120s → 300s（共5次重试，总耗时约 8.6 分钟）
 *
 * 测试方式：
 *   # 创建支付回调任务（立即触发，首次执行会模拟失败→触发重试序列）
 *   curl -X POST http://localhost:3000/api/demo/orders/:id/pay \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 查看重试实例（可以看到 retryCount 递增的 PENDING 实例）
 *   curl "http://localhost:3000/api/ext/scheduler/instances?taskCode=payment.callback" \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 查看执行日志（可以看到每次失败 + 最终成功/放弃的记录）
 *   curl "http://localhost:3000/api/ext/scheduler/logs?taskCode=payment.callback" \
 *     -H "Authorization: Bearer <token>"
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

/** 模拟回调成功率：前3次失败，第4次起成功 */
const SIMULATE_FAIL_UNTIL_RETRY = 3

@Injectable()
export class PaymentCallbackHandler implements ScheduledTaskHandler {
  private readonly logger = new Logger(PaymentCallbackHandler.name)

  readonly taskCode = 'payment.callback'
  readonly taskName = '支付回调通知'
  readonly taskType = TaskTypeDict.DELAY
  readonly defaultTimeoutSeconds = 10
  readonly description = '支付回调递增重试：1→5→30→60→120→300 秒，共5次重试'

  // ── 重试配置 ──
  /** 最大重试次数：5（加上首次执行 = 6 次尝试机会） */
  readonly maxRetry = 5

  /** 退避策略：固定序列 1→5→30→60→120→300 秒 */
  readonly backoffStrategy: BackoffStrategy = {
    type: 'fixed',
    delays: [
      1_000,    // 第1次重试：1秒后
      5_000,    // 第2次重试：5秒后
      30_000,   // 第3次重试：30秒后
      60_000,   // 第4次重试：60秒后
      120_000,  // 第5次重试：120秒后
      300_000,  // 第6次重试（超出 maxRetry=5 不会触发，留作扩展）
    ],
  }

  constructor(private readonly registry: TaskRegistry) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext): Promise<TaskExecutionResult> {
    const orderId = ctx.entityId ?? 'unknown'
    const orderNo = ctx.payload?.orderNo ?? 'unknown'
    const attempt = ctx.retryCount + 1

    this.logger.log(
      `[支付回调] 第${attempt}次尝试: orderNo=${orderNo}, retryCount=${ctx.retryCount}/${ctx.maxRetry}`,
    )

    // ── 模拟回调业务逻辑 ──
    // 前3次模拟失败，第4次起模拟成功
    if (ctx.retryCount < SIMULATE_FAIL_UNTIL_RETRY) {
      this.logger.warn(`[支付回调] 第${attempt}次失败: 网络超时（模拟）`)
      // 抛错 → 引擎捕获 → BatchArchiverService 创建重试实例
      throw new Error(`支付回调失败（第${attempt}次）：模拟网络超时`)
    }

    // ── 回调成功 ──
    this.logger.log(`[支付回调] 第${attempt}次成功: orderNo=${orderNo}`)
    return {
      summary: `支付回调成功（第${attempt}次尝试）`,
      data: {
        orderNo,
        orderId,
        attempts: attempt,
        retryCount: ctx.retryCount,
      },
    }
  }
}
