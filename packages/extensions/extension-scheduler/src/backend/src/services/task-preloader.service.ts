/**
 * @fileoverview 预加载服务（B 预加载 + 哈希分片 + 认领）
 * @description 每60s预加载窗口内PENDING任务，哈希分片过滤后批量原子认领
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { hostname } from 'os'
import { randomBytes } from 'crypto'
import { Inject } from '@nestjs/common'
import {
  SCHEDULER_TASK_STORAGE,
  SCHEDULER_RUNTIME_NOTIFY,
  type ITaskStorage,
  type IRuntimeNotify,
  type SchedulerModuleOptions,
} from '../spi/interfaces'
import { MinuteWheel } from '../wheel/minute-wheel'

@Injectable()
export class TaskPreloaderService implements OnModuleDestroy {
  private readonly logger = new Logger(TaskPreloaderService.name)
  private readonly WINDOW_SIZE_MS: number
  private readonly RELOAD_INTERVAL_MS: number
  private readonly BATCH_LIMIT = 0
  private readonly executorId: string
  private readonly shardCount: number
  private readonly myShard: number
  private timer: NodeJS.Timeout | null = null

  constructor(
    @Inject(SCHEDULER_TASK_STORAGE) private readonly storage: ITaskStorage,
    @Inject(SCHEDULER_RUNTIME_NOTIFY) private readonly notify: IRuntimeNotify,
    private readonly minuteWheel: MinuteWheel,
    @Inject('SCHEDULER_OPTIONS') options: SchedulerModuleOptions = {},
  ) {
    this.WINDOW_SIZE_MS = options.preloadWindowMs ?? 60_000
    this.RELOAD_INTERVAL_MS = options.reloadIntervalMs ?? 60_000
    this.shardCount = options.shardCount ?? 1
    this.executorId = `${hostname()}-${process.pid}-${randomBytes(4).toString('hex')}`
    this.myShard = this.computeShard(this.executorId)
    this.logger.log(`预加载服务初始化: executorId=${this.executorId}, shard=${this.myShard}/${this.shardCount}`)
  }

  /**
   * 模块初始化时启动预加载
   * @description 由 SchedulerEngineService 在 onModuleInit 中调用 start()
   */
  start(): void {
    this.reload() // 首次加载
    this.timer = setInterval(() => this.reload(), this.RELOAD_INTERVAL_MS)
    // 注册即时通知回调（接入 Redis 时生效）
    this.notify.onScheduled((code, executeAt) => {
      if (executeAt.getTime() <= Date.now() + this.WINDOW_SIZE_MS) {
        this.logger.debug(`收到即时通知: taskCode=${code}, executeAt=${executeAt.toISOString()}`)
        this.reload() // 即时重载
      }
    })
  }

  /**
   * 预加载重载
   * @description 查询窗口内 PENDING 任务 → 哈希分片过滤 → 批量认领 → 入分钟轮
   */
  private async reload(): Promise<void> {
    try {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + this.WINDOW_SIZE_MS)
      // 1. 查询窗口内 PENDING 任务
      const candidates = await this.storage.loadDueInstances(now, windowEnd, this.BATCH_LIMIT)
      if (candidates.length === 0) return
      // 2. 哈希分片过滤：只处理属于本实例分片的任务
      const mine = candidates.filter((c) => this.hash(c.id) % this.shardCount === this.myShard)
      if (mine.length === 0) return
      // 3. 批量原子认领
      const claimed = await this.storage.batchClaim(
        mine.map((m) => m.id),
        this.executorId,
      )
      if (claimed.length === 0) return
      // 4. 认领成功的入分钟轮
      for (const c of claimed) this.minuteWheel.addToSlot(c)
      this.logger.debug(`预加载: 窗口${candidates.length}条, 分片${mine.length}条, 认领${claimed.length}条`)
    } catch (err) {
      this.logger.error(`预加载失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * 哈希函数
   * @description 简单字符串哈希，用于分片
   */
  private hash(id: string): number {
    let h = 0
    for (let i = 0; i < id.length; i++) {
      h = (h << 5) - h + id.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h)
  }

  /**
   * 计算分片号
   */
  private computeShard(executorId: string): number {
    return this.hash(executorId) % this.shardCount
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
