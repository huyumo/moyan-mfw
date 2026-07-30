/**
 * @fileoverview 订单超时自动取消处理器
 * @description DELAY 类型任务，接收订单延迟实例，到期后检查并取消未支付订单
 *
 * 工作流程：
 *   1. 创建订单时 → ScheduledTaskService.createDelayInstance('order.auto.cancel', executeAt=now+5min, entityId=orderId)
 *   2. 5分钟后引擎触发 → 本 handler.execute() 被调用
 *   3. handler 检查订单状态：仍为 PENDING 则取消，已支付则跳过
 *
 * 关键设计：
 *   - taskType = DELAY（每笔订单一个独立延迟实例，精确到秒级）
 *   - payload 携带 orderNo 便于日志追踪
 *   - entityId = orderId 用于查询订单
 *   - 执行时再次校验状态（幂等性：即使延迟任务被重复触发也不会误取消已支付订单）
 */

import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import {
  TaskRegistry,
  type ScheduledTaskHandler,
  type TaskExecutionContext,
} from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'
import { DemoOrder, OrderStatusDict } from '../entities/demo-order.entity'

/** 订单超时时间（秒）—— 5分钟 */
const ORDER_TIMEOUT_SECONDS = 5 * 60

@Injectable()
export class OrderAutoCancelHandler implements ScheduledTaskHandler {
  private readonly logger = new Logger(OrderAutoCancelHandler.name)

  readonly taskCode = 'order.auto.cancel'
  readonly taskName = '订单超时自动取消'
  readonly taskType = TaskTypeDict.DELAY
  readonly defaultTimeoutSeconds = 30
  readonly description = '延迟任务：订单创建5分钟后检查，未支付则自动取消'

  constructor(
    private readonly registry: TaskRegistry,
    @InjectRepository(DemoOrder)
    private readonly orderRepo: Repository<DemoOrder>,
  ) {
    this.registry.register(this)
  }

  /**
   * 创建延迟实例时使用的超时秒数（供外部调用方参考）
   */
  get timeoutSeconds(): number {
    return ORDER_TIMEOUT_SECONDS
  }

  async execute(ctx: TaskExecutionContext) {
    const orderId = ctx.entityId
    const orderNo = ctx.payload?.orderNo ?? '未知'

    if (!orderId) {
      this.logger.warn(`[订单取消] 缺少 entityId（orderId），跳过`)
      return { summary: '缺少 orderId，跳过' }
    }

    this.logger.log(`[订单取消] 检查订单: orderNo=${orderNo}, orderId=${orderId}`)

    // ── 核心：幂等性检查 ──
    // 查询订单当前状态，仅在 PENDING 时取消
    const order = await this.orderRepo.findOne({ where: { id: orderId } })

    if (!order) {
      this.logger.warn(`[订单取消] 订单不存在: orderId=${orderId}`)
      return { summary: `订单不存在: ${orderId}` }
    }

    if (order.status === OrderStatusDict.PAID) {
      this.logger.log(`[订单取消] 订单已支付，跳过取消: orderNo=${orderNo}`)
      return { summary: `订单已支付，跳过: ${orderNo}` }
    }

    if (order.status === OrderStatusDict.CANCELLED) {
      this.logger.log(`[订单取消] 订单已取消，跳过: orderNo=${orderNo}`)
      return { summary: `订单已取消，跳过: ${orderNo}` }
    }

    // ── 执行取消 ──
    order.status = OrderStatusDict.CANCELLED
    order.cancelledAt = new Date()
    order.cancelReason = '超时未支付，系统自动取消'
    await this.orderRepo.save(order)

    this.logger.log(`[订单取消] 订单已取消: orderNo=${orderNo}, amount=${order.amount}`)
    return {
      summary: `订单 ${orderNo} 已超时取消`,
      data: { orderNo, amount: order.amount, cancelledAt: order.cancelledAt.toISOString() },
    }
  }
}
