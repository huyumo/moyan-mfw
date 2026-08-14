/**
 * @fileoverview 定时任务示例模块
 * @description 注册示例 CRON 和 DELAY 任务处理器
 * 需要导入 SchedulerModule 以获取 TaskRegistry
 *
 * Redis 适配器配置说明：
 *   当 CACHE_DRIVER=redis 或本机 Redis 可连接时，RedisLock + RedisPubSubNotify 生效：
 *   - RedisLock：使用 SET NX EX + Lua 比较删除，提供真正的分布式互斥
 *   - RedisPubSubNotify：使用 pub/sub 即时通知新任务，消除 60s 轮询延迟
 *   Redis 不可用时自动回退到默认实现（DbLock + PollingNotify）
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SchedulerModule } from 'moyan-mfw-extension-scheduler/backend'
import { DemoLedgerModule } from '../ledger-demo/demo-ledger.module'
import { RedisLock } from './adapters/redis-lock.adapter'
import { RedisPubSubNotify } from './adapters/redis-pubsub-notify.adapter'
import { DemoSchedulerController } from './controllers/demo-scheduler.controller'
import { DemoOrderController } from './controllers/demo-order.controller'
import { DemoOrder } from './entities/demo-order.entity'
import { DemoCronTaskHandler } from './handlers/demo-cron-task.handler'
import { DemoDelayTaskHandler } from './handlers/demo-delay-task.handler'
import { DemoImmediateTaskHandler } from './handlers/demo-immediate-task.handler'
import { DemoTimeoutTaskHandler } from './handlers/demo-timeout-task.handler'
import { StressWorkerHandler } from './handlers/stress-worker.handler'
import { OrderAutoCancelHandler } from './handlers/order-auto-cancel.handler'
import { PaymentCallbackHandler } from './handlers/payment-callback.handler'
import { LedgerDailyReconcileHandler } from './handlers/ledger-daily-reconcile.handler'

@Module({
  imports: [
    TypeOrmModule.forFeature([DemoOrder]),
    SchedulerModule.forRoot({
      // shardCount 不配置（0）→ 启用动态分片：根据存活执行器心跳自动计算分片数
      lockImpl: RedisLock,            // Redis 分布式锁（替代 DbLock）
      notifyImpl: RedisPubSubNotify,  // Redis pub/sub 即时通知（替代 PollingNotify）
    }),
    // 导入账本演示模块以获取 LedgerReconcileService（账本对账 Handler 依赖）
    DemoLedgerModule,
  ],
  controllers: [DemoSchedulerController, DemoOrderController],
  providers: [
    RedisLock,
    RedisPubSubNotify,
    DemoCronTaskHandler,
    DemoDelayTaskHandler,
    DemoImmediateTaskHandler,  // 立即执行模式示例处理器
    DemoTimeoutTaskHandler,    // 超时验证示例处理器
    StressWorkerHandler,      // 压测工作处理器
    OrderAutoCancelHandler,    // 订单超时自动取消处理器
    PaymentCallbackHandler,  // 支付回调递增重试处理器
    LedgerDailyReconcileHandler, // 账本每日对账（账本对账能力对接 scheduler 示例）
  ],
  exports: [DemoCronTaskHandler, DemoDelayTaskHandler],
})
export class DemoSchedulerModule {}
