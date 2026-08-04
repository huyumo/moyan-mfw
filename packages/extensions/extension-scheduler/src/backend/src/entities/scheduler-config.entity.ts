/**
 * @fileoverview 调度器全局配置实体
 * @description 单例配置行（configKey='global'），存储清理/崩溃恢复/限流/多实例参数
 *   运行时由前端「系统配置」页编辑，SchedulerConfigService 提供 TTL 缓存
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { toDescription } from 'moyan-mfw-base/shared'
import { CrashRecoveryStrategyDict } from 'moyan-mfw-extension-scheduler/shared'

@Entity('ext_scheduler_config')
@Index('idx_scheduler_config_key', ['configKey'], { unique: true })
export class SchedulerConfig extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  @Column({ type: 'varchar', length: 64, default: 'global', comment: '配置键（单例）' })
  configKey: string

  // ── 数据清理 ──

  @Column({ type: 'boolean', default: true, comment: '是否启用定期清理' })
  cleanupEnabled: boolean

  @Column({ type: 'int', default: 7, comment: '终态实例保留天数（超过自动硬删除）' })
  instanceRetentionDays: number

  @Column({ type: 'int', default: 30, comment: '执行日志保留天数' })
  logRetentionDays: number

  @Column({ type: 'int', default: 6, comment: '清理间隔（小时）' })
  cleanupIntervalHours: number

  // ── 崩溃恢复 ──

  @Column({ type: 'tinyint', default: CrashRecoveryStrategyDict.REQUEUE, comment: toDescription(CrashRecoveryStrategyDict) })
  crashRecoveryStrategy: number

  @Column({ type: 'int', default: 600, comment: '孤儿判定超时秒数（心跳离线阈值）' })
  orphanTimeoutSeconds: number

  // ── 重启限流 ──

  @Column({ type: 'int', default: 200, comment: '重启限流批次大小（每轮预加载上限）' })
  restartBatchSize: number

  @Column({ type: 'int', default: 2000, comment: '重启限流批次间隔（毫秒）' })
  restartBatchDelayMs: number

  // ── 多实例 ──

  @Column({ type: 'boolean', default: true, comment: 'CRON多实例去重开关' })
  cronDedupEnabled: boolean
}
