/**
 * @fileoverview 定期清理服务
 * @description 清理已终态的任务实例与过期执行日志（分批硬删除，避免长锁）
 *   自调度模式：每轮执行完重新读取 cleanupIntervalHours，setTimeout 调度下一轮
 *   单实例协调：仅存活执行器排序第一的实例执行（复用 ExecutorHeartbeatService）
 */

import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common'
import {
  SCHEDULER_TASK_STORAGE,
  type ITaskStorage,
} from '../spi/interfaces'
import { SchedulerConfigService } from './scheduler-config.service'
import { ExecutorHeartbeatService } from './executor-heartbeat.service'

@Injectable()
export class SchedulerCleanupService implements OnModuleDestroy {
  private readonly logger = new Logger(SchedulerCleanupService.name)
  private readonly BATCH_SIZE = 1000
  private timer: NodeJS.Timeout | null = null
  private stopped = false

  constructor(
    @Inject(SCHEDULER_TASK_STORAGE) private readonly storage: ITaskStorage,
    private readonly heartbeat: ExecutorHeartbeatService,
    private readonly configService: SchedulerConfigService,
  ) {}

  /**
   * 启动清理（由 SchedulerEngineService.onModuleInit 调用）
   * @description 延迟 60s 执行首次清理（避开启动崩溃恢复窗口），随后自调度
   */
  start(): void {
    setTimeout(() => this.runCleanup(), 60_000)
  }

  /**
   * 执行一次清理（自调度：执行完重读配置，setTimeout 下一轮）
   */
  private async runCleanup(): Promise<void> {
    if (this.stopped) return
    try {
      const config = await this.configService.getConfig()
      // 多实例协调：仅存活执行器排序第一的实例执行，避免重复清理
      const isCoordinator = await this.heartbeat.isCoordinator()
      if (isCoordinator && config.cleanupEnabled) {
        const result = await this.cleanupNow()
        this.logger.log(`定期清理完成: 实例 ${result.instances} 条, 日志 ${result.logs} 条`)
      }
    } catch (err) {
      this.logger.error(`定期清理失败: ${(err as Error).message}`)
    } finally {
      // 自调度：即使失败也重新读取间隔调度下一轮
      try {
        const config = await this.configService.getConfig()
        this.scheduleNext(config.cleanupIntervalHours)
      } catch {
        this.scheduleNext(6) // 失败兜底 6h
      }
    }
  }

  private scheduleNext(intervalHours: number): void {
    if (this.stopped) return
    const intervalMs = Math.max(1, intervalHours) * 3600_000
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.runCleanup(), intervalMs)
  }

  /**
   * 手动触发清理（Controller 调用）
   * @returns 删除的实例数与日志数
   */
  async cleanupNow(): Promise<{ instances: number; logs: number }> {
    const config = await this.configService.getConfig()
    const instances = await this.storage.purgeOldInstances(
      config.instanceRetentionDays,
      this.BATCH_SIZE,
    )
    const logs = await this.storage.purgeOldLogs(
      config.logRetentionDays,
      this.BATCH_SIZE,
    )
    return { instances, logs }
  }

  onModuleDestroy(): void {
    this.stopped = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
