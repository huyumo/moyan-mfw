/**
 * @fileoverview 任务存储 SPI 接口
 * @description 定义任务定义/实例/日志的持久化与查询契约
 */

import {
  ScheduledTaskDefinition,
  ScheduledTaskInstance,
  ScheduledTaskLog,
} from '../../entities'
import type { PaginationResult, PaginationQueryDto } from 'moyan-mfw-base/backend'

/** 任务定义运行时可更新字段 */
export interface RuntimeFields {
  lastRunAt?: Date | null
  nextRunAt?: Date | null
  lastRunStatus?: number | null
  lastErrorMessage?: string | null
  enabled?: boolean
  cronExpression?: string | null
  intervalSeconds?: number
  timeoutSeconds?: number
  description?: string | null
  catchUpOnRestart?: boolean
  taskName?: string
}

/** 实例可更新字段 */
export interface InstanceFields {
  executor?: string | null
  retryCount?: number
}

/** 日志可更新字段 */
export interface LogFields {
  finishedAt?: Date | null
  durationMs?: number
  status?: number
  errorMessage?: string | null
  errorStack?: string | null
  result?: Record<string, any> | null
}

/** 批量归档+重试参数 */
export interface ArchiveWithRetryParams {
  /** 成功实例ID列表 */
  successIds: string[]
  /** 超时实例ID列表 */
  timeoutIds: string[]
  /** 跳过实例ID列表 */
  skippedIds: string[]
  /** 需重试的实例（原地重置为 PENDING） */
  retryUpdates: Array<{ instanceId: string; executeAt: Date; retryCount: number }>
  /** 放弃重试的实例（置为 FAILED 终态） */
  giveUpIds: string[]
}

/** 实例查询过滤条件 */
export interface InstanceQueryFilters extends PaginationQueryDto {
  taskCode?: string
  status?: number
  entityId?: string
  startTime?: string
  endTime?: string
}

/** 日志查询过滤条件 */
export interface LogQueryFilters extends PaginationQueryDto {
  taskCode?: string
  status?: number
  triggerType?: number
  /** 关联实例ID（精确匹配） */
  instanceId?: string
  startTime?: string
  endTime?: string
}

/**
 * 任务存储 SPI
 * @description 默认实现为 TypeOrmStorage，可替换为其他存储
 */
export interface ITaskStorage {
  // ── 任务定义 ──
  upsertTaskDefinition(task: Partial<ScheduledTaskDefinition>): Promise<void>
  getTaskDefinition(taskCode: string): Promise<ScheduledTaskDefinition | null>
  listTaskDefinitions(filters?: { taskName?: string; taskType?: number }): Promise<ScheduledTaskDefinition[]>
  updateTaskRuntime(taskCode: string, fields: Partial<RuntimeFields>): Promise<void>

  // ── 延迟实例 ──
  createInstance(instance: Partial<ScheduledTaskInstance>): Promise<ScheduledTaskInstance>
  /** 窗口加载：status=PENDING AND executeAt BETWEEN now AND windowEnd */
  loadDueInstances(now: Date, windowEnd: Date, limit: number): Promise<ScheduledTaskInstance[]>
  /**
   * 批量认领：
   * UPDATE status PENDING→RUNNING WHERE id IN(...) AND status=PENDING
   * 再 SELECT 确认本实例认领成功的
   */
  batchClaim(ids: string[], executor: string): Promise<ScheduledTaskInstance[]>
  /**
   * 令牌化批量认领（防同实例并发 reload 双派发）
   * UPDATE 写入 claimToken，SELECT 仅按本次令牌确认
   */
  batchClaimWithToken(ids: string[], executor: string, claimToken: string): Promise<ScheduledTaskInstance[]>
  /**
   * 批量归档并处理重试（单次 CASE-WHEN UPDATE）
   * @description 成功/超时/跳过/放弃 → 更新 status；重试 → 原地重置为 PENDING + retryCount+1 + 新 executeAt
   */
  archiveWithRetry(params: ArchiveWithRetryParams): Promise<void>
  cancelInstance(id: string): Promise<boolean>
  updateInstanceStatus(id: string, status: number, fields?: Partial<InstanceFields>): Promise<void>
  getInstance(id: string): Promise<ScheduledTaskInstance | null>

  // ── 执行日志 ──
  createLog(log: Partial<ScheduledTaskLog>): Promise<ScheduledTaskLog>
  /** 批量创建（归档链 K 用） */
  batchCreateLogs(logs: Partial<ScheduledTaskLog>[]): Promise<void>
  updateLogStatus(id: string, status: number, fields?: Partial<LogFields>): Promise<void>
  getLog(id: string): Promise<any>

  // ── 孤儿清理（启动时批量） ──
  cleanupOrphanRecords(timeoutSeconds: number): Promise<number>

  // ── 数据清理（定期/手动） ──
  /** 分批硬删除终态实例（含软删行），返回总删除数 */
  purgeOldInstances(retentionDays: number, batchSize: number): Promise<number>
  /** 分批硬删除过期日志，返回总删除数 */
  purgeOldLogs(retentionDays: number, batchSize: number): Promise<number>

  // ── 崩溃恢复 ──
  /**
   * 按策略恢复孤儿 RUNNING 实例（executor 不在存活列表）
   * @param strategy CrashRecoveryStrategyDict: 1=REQUEUE(带retryCount记账+maxRetry封顶) 2=MARK_FAILED 3=MARK_TIMEOUT_ORPHAN
   * @param aliveExecutors 存活执行器ID列表
   * @returns 恢复数
   */
  recoverOrphanedInstances(strategy: number, aliveExecutors: string[]): Promise<number>
  /** 清理孤儿 RUNNING 日志（executor 不在存活列表的崩溃残留）→ 标记 TIMEOUT，返回清理数 */
  cleanupOrphanedLogs(aliveExecutors: string[]): Promise<number>

  // ── CRON 多实例去重 ──
  /** 原子抢占 CRON 执行权（令牌化），成功返回 true */
  tryClaimCronExecution(taskCode: string, lockUntil: Date, token: string): Promise<boolean>
  /** 释放 CRON 执行权（仅释放自己令牌的锁） */
  releaseCronLock(taskCode: string, token: string): Promise<void>

  // ── 查询（管理页面用） ──
  queryInstances(filters: InstanceQueryFilters): Promise<PaginationResult<ScheduledTaskInstance>>
  queryLogs(filters: LogQueryFilters): Promise<PaginationResult<ScheduledTaskLog>>
}
