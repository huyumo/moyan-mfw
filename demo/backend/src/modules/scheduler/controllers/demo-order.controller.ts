/**
 * @fileoverview 订单控制器
 * @description 演示"未支付订单5分钟自动取消"完整流程
 *
 * 测试流程：
 *   1. 登录获取 token
 *   2. 创建订单 → 自动注册5分钟后取消的延迟任务
 *   3. 查看订单状态（PENDING）
 *   4a. 等待5分钟 → 订单自动取消（CANCELLED）
 *   4b. 或主动支付 → 订单变为 PAID，延迟任务到点后跳过取消
 *
 * 测试命令：
 *   # 创建订单
 *   curl -X POST http://localhost:3000/api/demo/orders \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"productName":"iPhone 16 Pro","amount":9999.00}'
 *
 *   # 查看订单列表
 *   curl http://localhost:3000/api/demo/orders \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 支付订单（支付后不会被自动取消）
 *   curl -X POST http://localhost:3000/api/demo/orders/:id/pay \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 查看延迟实例（可以看到为该订单创建的取消任务）
 *   curl "http://localhost:3000/api/ext/scheduler/instances?taskCode=order.auto.cancel" \
 *     -H "Authorization: Bearer <token>"
 */

import {
  Controller, Post, Get, Param, Body,
  HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator'
import { SkipPermission } from 'moyan-mfw-base/backend'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ScheduledTaskService, TaskRegistry } from 'moyan-mfw-extension-scheduler/backend'
import { DemoOrder, OrderStatusDict, OrderStatusLabel } from '../entities/demo-order.entity'
import { OrderAutoCancelHandler } from '../handlers/order-auto-cancel.handler'
import { PaymentCallbackHandler } from '../handlers/payment-callback.handler'

class CreateOrderDto {
  @ApiProperty({ description: '商品名称' })
  @IsNotEmpty()
  @IsString()
  productName: string

  @ApiProperty({ description: '订单金额' })
  @IsNumber()
  amount: number

  @ApiProperty({ description: '超时秒数（默认300=5分钟，测试时可设小值如30）', required: false })
  @IsOptional()
  @IsNumber()
  timeoutSeconds?: number
}

@ApiTags('demo-order', '订单超时取消演示')
@ApiBearerAuth('Authorization')
@Controller('demo/orders')
export class DemoOrderController {
  constructor(
    @InjectRepository(DemoOrder)
    private readonly orderRepo: Repository<DemoOrder>,
    private readonly schedulerService: ScheduledTaskService,
    private readonly autoCancelHandler: OrderAutoCancelHandler,
    private readonly paymentCallbackHandler: PaymentCallbackHandler,
    private readonly registry: TaskRegistry,
  ) {}

  /**
   * 创建订单
   * @description 创建订单后自动注册延迟任务：N分钟后检查并取消未支付订单
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建订单', description: '创建订单并注册超时自动取消延迟任务' })
  @SkipPermission()
  async createOrder(@Body() dto: CreateOrderDto) {
    // 1. 创建订单
    const order = this.orderRepo.create({
      orderNo: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
      productName: dto.productName,
      amount: dto.amount,
      status: OrderStatusDict.PENDING,
    })
    await this.orderRepo.save(order)

    // 2. 注册延迟任务：N分钟后自动取消
    const timeoutSeconds = dto.timeoutSeconds ?? this.autoCancelHandler.timeoutSeconds
    const executeAt = new Date(Date.now() + timeoutSeconds * 1000)

    const instance = await this.schedulerService.createDelayInstance(
      this.autoCancelHandler.taskCode,  // 'order.auto.cancel'
      executeAt,                         // N分钟后
      order.id,                          // entityId = 订单ID（handler 用它查订单）
      { orderNo: order.orderNo, productName: order.productName, amount: order.amount }, // payload
    )

    return {
      message: `订单已创建，${timeoutSeconds}秒后未支付将自动取消`,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        productName: order.productName,
        amount: order.amount,
        status: OrderStatusLabel[order.status],
        createdAt: order.createdAt,
      },
      schedulerInstance: {
        id: instance.id,
        executeAt: executeAt.toISOString(),
        taskCode: this.autoCancelHandler.taskCode,
      },
    }
  }

  /**
   * 查看订单列表
   */
  @Get()
  @ApiOperation({ summary: '查看订单列表' })
  @SkipPermission()
  async listOrders() {
    const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' }, take: 20 })
    return {
      message: `共 ${orders.length} 笔订单`,
      orders: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        productName: o.productName,
        amount: o.amount,
        status: OrderStatusLabel[o.status],
        paidAt: o.paidAt,
        cancelledAt: o.cancelledAt,
        cancelReason: o.cancelReason,
        createdAt: o.createdAt,
      })),
    }
  }

  /**
   * 支付订单
   * @description 模拟支付，支付后延迟任务到点会跳过取消（幂等性检查）
   */
  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '支付订单', description: '支付后订单不会被自动取消' })
  @SkipPermission()
  async payOrder(@Param('id') id: string) {
    const order = await this.orderRepo.findOne({ where: { id } })
    if (!order) throw new NotFoundException('订单不存在')

    if (order.status !== OrderStatusDict.PENDING) {
      return { error: `订单状态为 ${OrderStatusLabel[order.status]}，无法支付` }
    }

    order.status = OrderStatusDict.PAID
    order.paidAt = new Date()
    await this.orderRepo.save(order)

    return {
      message: `订单 ${order.orderNo} 已支付，延迟任务到点后将跳过取消`,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        status: OrderStatusLabel[order.status],
        paidAt: order.paidAt,
      },
    }
  }

  /**
   * 查看订单详情
   */
  @Get(':id')
  @ApiOperation({ summary: '查看订单详情' })
  @SkipPermission()
  async getOrder(@Param('id') id: string) {
    const order = await this.orderRepo.findOne({ where: { id } })
    if (!order) throw new NotFoundException('订单不存在')

    return {
      order: {
        id: order.id,
        orderNo: order.orderNo,
        productName: order.productName,
        amount: order.amount,
        status: OrderStatusLabel[order.status],
        paidAt: order.paidAt,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
        createdAt: order.createdAt,
      },
    }
  }

  /**
   * 发起支付回调（递增重试演示）
   * @description 模拟支付成功后通知业务系统，首次失败触发 1→5→30→60→120 秒重试序列
   *
   * 测试流程：
   *   1. 先创建订单 → 2. 调用此接口发起回调 → 3. 观察日志中的重试序列
   *
   * 重试序列（payment.callback handler 配置）：
   *   第1次（立即）   → 失败 → 1秒后重试
   *   第2次（+1s）    → 失败 → 5秒后重试
   *   第3次（+5s）    → 失败 → 30秒后重试
   *   第4次（+30s）   → 成功（模拟：第4次起返回成功）
   */
  @Post(':id/payment-callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发起支付回调', description: '触发支付回调递增重试序列（1→5→30→60→120秒）' })
  @SkipPermission()
  async triggerPaymentCallback(@Param('id') id: string) {
    const order = await this.orderRepo.findOne({ where: { id } })
    if (!order) throw new NotFoundException('订单不存在')

    // 创建延迟实例：立即执行（executeAt=now）
    // handler 内部模拟前3次失败 → 触发 backoffStrategy 重试序列
    const instance = await this.schedulerService.createDelayInstance(
      this.paymentCallbackHandler.taskCode,
      new Date(),       // 立即执行
      order.id,          // entityId = 订单ID
      { orderNo: order.orderNo, productName: order.productName, amount: order.amount },
    )

    return {
      message: `支付回调已触发，将按 1→5→30→60→120 秒递增重试（前3次模拟失败）`,
      order: { id: order.id, orderNo: order.orderNo },
      schedulerInstance: {
        id: instance.id,
        taskCode: this.paymentCallbackHandler.taskCode,
        maxRetry: this.paymentCallbackHandler.maxRetry,
        backoffStrategy: this.paymentCallbackHandler.backoffStrategy,
      },
      tip: '查看后端日志或 /api/ext/scheduler/logs?taskCode=payment.callback 观察重试过程',
    }
  }
}
