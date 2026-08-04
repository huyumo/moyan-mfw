/**
 * @fileoverview 预加载服务（B 预加载 + 动态分片 + 重启限流）
 * @description 每60s预加载窗口内PENDING任务：
 *   - 动态分片：通过执行器心跳注册表实时计算存活实例数（shardCount）与自己的分片号（myShard）
 *   - 重启限流：启动后 isRampUpMode，每轮按 restartBatchSize 分批加载，满载时按 restartBatchDelayMs 快速调度下一轮
 *   - 防重入：isReloading 标志，避免定时器/通知/快速重载并发触发
 *   - 令牌化认领：batchClaimWithToken 防同实例并发 reload 的 SELECT 自我匹配双派发
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import { randomBytes } from 'crypto'
import {
  SCHEDULER_TASK_STORAGE,
  SCHEDULER_RUNTIME_NOTIFY,
  type ITaskStorage,
  type IRuntimeNotify,
  type SchedulerModuleOptions,
} from '../spi/interfaces'
import { MinuteWheel } from '../wheel/minute-wheel'
import { SchedulerConfigService } from './scheduler-config.service'
import { ExecutorHeartbeatService } from './executor-heartbeat.service'

@Injectable()
export class TaskPreloaderService {
  private readonly logger = new Logger(TaskPreloaderService.name)
  private readonly WINDOW_SIZE_MS: number
  private readonly RELOAD_INTERVAL_MS: number
  /** 静态分片数（options.shardCount > 0 时覆盖动态分片，向后兼容） */
  private readonly staticShardCount: number
  private readonly ALIVE_TIMEOUT_SECONDS = 90
  private readonly isReloading = false
  private timer: NodeJS.Timeout | null = null
  private rampUpTimer: NodeJS.Timeout | null = null
  private isRampUpMode = true
  /** 防重入标志：reload 执行期间忽略定时器/通知/快速重载的并发触发 */
  private reloading = false

  constructor(
    @Inject(SCHEDULER_TASK_STORAGE) private readonly storage: ITaskStorage,
    @Inject(SCHEDULER_RUNTIME_NOTIFY) private readonly notify: IRuntimeNotify,
    private readonly minuteWheel: MinuteWheel,
    private readonly heartbeat: ExecutorHeartbeatService,
    private readonly configService: SchedulerConfigService,
    @Inject('SCHEDULER_OPTIONS') options: SchedulerModuleOptions = {},
  ) {
    this.WINDOW_SIZE_MS = options.preloadWindowMs ?? 60_000
    this.RELOAD_INTERVAL_MS = options.reloadIntervalMs ?? 60_000
    this.staticShardCount = options.shardCount ?? 0
    this.logger.log(
      `预加载服务初始化: executorId=${this.heartbeat.executorId}` +
      (this.staticShardCount > 0 ? `, 静态分片=${this.staticShardCount}（覆盖动态分片）` : ', 动态分片'),
    )
  }

  /**
   * 模块初始化时启动预加载（由 SchedulerEngineService.onModuleInit 调用）
   */
  start(): void {
    this.reload() // 首次加载（限流模式）
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
   * @description 查询窗口内 PENDING 任务 → 动态分片过滤 → 令牌化批量认领 → 入分钟轮
   */
  private async reload(): Promise<void> {
    // 防重入：同步置位（在第一个 await 前），finally 复位（覆盖全部提前 return 路径）
    if (this.reloading) return
    this.reloading = true
    try {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + this.WINDOW_SIZE_MS)

      // 1. 动态分片：查询存活执行器，计算 shardCount 与 myShard
      //    （options.shardCount > 0 时使用静态分片覆盖，向后兼容）
      let shardCount: number
      let myShard: number
      if (this.staticShardCount > 0) {
        shardCount = this.staticShardCount
        myShard = this.hash(this.heartbeat.executorId) % shardCount
      } else {
        const aliveExecutors = await this.heartbeat.getAliveExecutors()
        shardCount = aliveExecutors.length > 0 ? aliveExecutors.length : 1
        myShard = aliveExecutors.length > 0
          ? aliveExecutors.findIndex((e) => e.executorId === this.heartbeat.executorId)
          : 0
        if (myShard < 0) {
          // 自己还没在存活列表中（刚启动，心跳尚未注册），跳过本轮
          this.logger.debug(`本实例尚未注册心跳，跳过本轮预加载`)
          return
        }
      }

      // 2. 读取配置：重启限流批次大小
      const config = await this.configService.getConfig()
      const batchLimit = config.restartBatchSize || 200

      // 3. 查询窗口内 PENDING 任务（分批，防止积压一次性拉爆）
      const candidates = await this.storage.loadDueInstances(now, windowEnd, batchLimit)
      if (candidates.length === 0) {
        this.isRampUpMode = false // 积压清空，退出限流模式
        return
      }

      // 4. 哈希分片过滤：只处理属于本实例分片的任务
      const mine = candidates.filter((c) => this.hash(c.id) % shardCount === myShard)
      if (mine.length === 0) {
        // 本分片无任务，但仍需判断是否继续限流重载
        this.handleRampUp(candidates.length, batchLimit, config.restartBatchDelayMs)
        return
      }

      // 5. 令牌化批量原子认领（防并发 reload 双派发）
      const claimToken = randomBytes(8).toString('hex')
      const claimed = await this.storage.batchClaimWithToken(
        mine.map((m) => m.id),
        this.heartbeat.executorId,
        claimToken,
      )
      if (claimed.length > 0) {
        for (const c of claimed) this.minuteWheel.addToSlot(c)
      }
      this.logger.debug(
        `预加载: 窗口${candidates.length}条, 存活${shardCount}实例, 分片${mine.length}条, 认领${claimed.length}条`,
      )

      // 6. 限流模式：满载则快速调度下一轮
      this.handleRampUp(candidates.length, batchLimit, config.restartBatchDelayMs)
    } catch (err) {
      this.logger.error(`预加载失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      this.reloading = false
    }
  }

  /**
   * 限流模式处理：如果本轮满载说明可能还有积压，按 restartBatchDelayMs 快速调度下一轮
   */
  private handleRampUp(loadedCount: number, batchLimit: number, delayMs: number): void {
    if (this.isRampUpMode && loadedCount >= batchLimit) {
      if (this.rampUpTimer) clearTimeout(this.rampUpTimer)
      this.rampUpTimer = setTimeout(() => this.reload(), Math.max(500, delayMs || 2000))
    } else {
      this.isRampUpMode = false // 积压已清空，退出限流模式
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
   * 停止预加载（由 SchedulerEngineService.onModuleDestroy 显式调用）
   * @description 不实现 OnModuleDestroy 接口，避免与引擎显式调用重复触发
   */
  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.rampUpTimer) {
      clearTimeout(this.rampUpTimer)
      this.rampUpTimer = null
    }
  }
}
