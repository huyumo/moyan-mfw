/**
 * @fileoverview 调度器全局配置服务
 * @description 读写 ext_scheduler_config 单例配置行（configKey='global'）
 *   TTL 缓存（10s）避免高频查询；updateConfig 后清除缓存立即生效
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { SchedulerConfig } from '../entities'
import { CrashRecoveryStrategyDict } from 'moyan-mfw-extension-scheduler/shared'

/** 配置默认值（DB 无配置行时使用） */
export const DEFAULT_SCHEDULER_CONFIG: Partial<SchedulerConfig> = {
  configKey: 'global',
  cleanupEnabled: true,
  instanceRetentionDays: 7,
  logRetentionDays: 30,
  cleanupIntervalHours: 6,
  crashRecoveryStrategy: CrashRecoveryStrategyDict.REQUEUE,
  orphanTimeoutSeconds: 600,
  restartBatchSize: 200,
  restartBatchDelayMs: 2000,
  cronDedupEnabled: true,
}

@Injectable()
export class SchedulerConfigService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerConfigService.name)
  private readonly TTL_MS = 10_000
  private cache: SchedulerConfig | null = null
  private cacheExpireAt = 0

  constructor(
    @InjectRepository(SchedulerConfig)
    private readonly configRepo: Repository<SchedulerConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const existing = await this.configRepo.findOne({ where: { configKey: 'global' } })
      if (!existing) {
        await this.configRepo.insert({
          id: randomUUID(),
          ...DEFAULT_SCHEDULER_CONFIG,
        } as any)
        this.logger.log('初始化调度器全局配置（默认值）')
      }
    } catch (err) {
      this.logger.warn(`初始化配置失败（可能表尚未迁移）: ${(err as Error).message}`)
    }
  }

  /**
   * 获取全局配置（TTL 缓存）
   */
  async getConfig(): Promise<SchedulerConfig> {
    const now = Date.now()
    if (this.cache && this.cacheExpireAt > now) return this.cache
    try {
      const config = await this.configRepo.findOne({ where: { configKey: 'global' } })
      if (config) {
        this.cache = config
        this.cacheExpireAt = now + this.TTL_MS
        return config
      }
    } catch {
      // 查询失败（表不存在等）回退默认值
    }
    return { id: 'default', ...DEFAULT_SCHEDULER_CONFIG } as SchedulerConfig
  }

  /**
   * 更新全局配置（仅更新传入字段），清除缓存立即生效
   */
  async updateConfig(dto: Partial<SchedulerConfig>): Promise<void> {
    await this.configRepo.update({ configKey: 'global' }, dto as any)
    this.invalidateCache()
  }

  invalidateCache(): void {
    this.cache = null
    this.cacheExpireAt = 0
  }
}
