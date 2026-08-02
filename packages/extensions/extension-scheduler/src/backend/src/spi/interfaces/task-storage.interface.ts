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
  startedAt?: Date | null
  finishedAt?: Date | null
  errorMessage?: string | null
  errorStack?: string | null
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

/** 批量归档状态更新项 */
export interface BatchArchiveUpdate {
  status: number
  ids: string[]
  fields?: Partial<InstanceFields>
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
  /** 批量创建（归档链 K 生成重试任务用） */
  createInstances(instances: Partial<ScheduledTaskInstance>[]): Promise<void>
  /** 窗口加载：status=PENDING AND executeAt BETWEEN now AND windowEnd */
  loadDueInstances(now: Date, windowEnd: Date, limit: number): Promise<ScheduledTaskInstance[]>
  /**
   * 批量认领：
   * UPDATE status PENDING→RUNNING WHERE id IN(...) AND status=PENDING
   * 再 SELECT 确认本实例认领成功的
   */
  batchClaim(ids: string[], executor: string): Promise<ScheduledTaskInstance[]>
  /** 批量归档：按状态分组，每组 1 次 UPDATE */
  batchArchiveStatus(updates: BatchArchiveUpdate[]): Promise<void>
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

  // ── 查询（管理页面用） ──
  queryInstances(filters: InstanceQueryFilters): Promise<PaginationResult<ScheduledTaskInstance>>
  queryLogs(filters: LogQueryFilters): Promise<PaginationResult<ScheduledTaskLog>>
}
