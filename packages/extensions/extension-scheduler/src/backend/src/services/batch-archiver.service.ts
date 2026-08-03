/**
 * @fileoverview 批量归档服务（K 批量归档）
 * @description 读 I 全部分组缓存 → 批量 UPDATE 实例状态 → 失败重试 → 批量 INSERT 日志
 *
 * 重试机制：
 *   - 失败任务按 handler 级别配置的 maxRetry + backoffStrategy 决定是否重试及下次执行时间
 *   - handler 未配置时回退到全局 SchedulerModuleOptions 默认值
 *   - 支持三种退避策略：fixed（固定序列）/ exponential（指数退避）/ linear（线性递增）
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import { SCHEDULER_TASK_STORAGE, type ITaskStorage, type SchedulerModuleOptions } from '../spi/interfaces'
import { ResultBufferPool } from '../pool/result-buffer-pool'
import { TaskRegistry } from './task.registry'
import { TaskRunStatusDict, TaskInstanceStatusDict, TaskTriggerTypeDict } from 'moyan-mfw-extension-scheduler/shared'
import type { ScheduledTaskInstance, ScheduledTaskLog } from '../entities'
import type { BackoffStrategy } from '../interfaces/task-handler.interface'

/** 全局默认退避策略：指数退避 60s→120s→240s */
const DEFAULT_BACKOFF: BackoffStrategy = {
  type: 'exponential',
  base: 60_000,
  multiplier: 2,
  max: 3_600_000, // 上限1小时
}

@Injectable()
export class BatchArchiverService {
  private readonly logger = new Logger(BatchArchiverService.name)
  private readonly defaultMaxRetry: number
  private readonly defaultBackoff: BackoffStrategy

  constructor(
    @Inject(SCHEDULER_TASK_STORAGE) private readonly storage: ITaskStorage,
    private readonly resultBuffer: ResultBufferPool,
    private readonly registry: TaskRegistry,
    @Inject('SCHEDULER_OPTIONS') options: SchedulerModuleOptions = {},
  ) {
    this.defaultMaxRetry = options.maxRetry ?? 3
    this.defaultBackoff = options.backoffStrategy ?? DEFAULT_BACKOFF
  }

  /**
   * 执行归档
   * @description drainAll → 按状态分组 → batchArchiveStatus → 失败重试 → batchCreateLogs → clear
   */
  async archive(): Promise<void> {
    const entries = this.resultBuffer.drainAll()
    if (entries.length === 0) return

    this.logger.debug(`归档: ${entries.length} 条结果`)

    // 按状态分组（按 run-status 分组）
    const groups = new Map<number, typeof entries>()
    for (const e of entries) {
      const g = groups.get(e.status) ?? []
      g.push(e)
      groups.set(e.status, g)
    }

    // 批量更新实例状态（每组1次UPDATE）
    // 注意：ResultBuffer 中存的是 TaskRunStatusDict 值（1-5），
    //   需要转换为 TaskInstanceStatusDict 值（3=成功, 4=失败）写入实例表
    const runToInstanceStatus: Record<number, number> = {
      [TaskRunStatusDict.SUCCESS]: TaskInstanceStatusDict.SUCCESS,
      [TaskRunStatusDict.FAILED]: TaskInstanceStatusDict.FAILED,
      [TaskRunStatusDict.TIMEOUT]: TaskInstanceStatusDict.TIMEOUT,
      [TaskRunStatusDict.SKIPPED]: TaskInstanceStatusDict.FAILED,
      [TaskRunStatusDict.RUNNING]: TaskInstanceStatusDict.RUNNING,
    }
    const archiveUpdates = [...groups.entries()].map(([runStatus, items]) => ({
      status: runToInstanceStatus[runStatus] ?? TaskInstanceStatusDict.FAILED,
      ids: items.map((i) => i.instanceId),
      fields: {
        finishedAt: new Date(),
      } as any,
      // 错误消息按实例单独记录，避免同组共享导致互相覆盖
      errors: items
        .map((i) => (i.error ? { instanceId: i.instanceId, message: i.error.message } : null))
        .filter((e): e is { instanceId: string; message: string } => e !== null),
    }))
    await this.storage.batchArchiveStatus(archiveUpdates)

    // 失败的重试：按 handler 各自配置创建新实例
    const failed = groups.get(TaskRunStatusDict.FAILED) ?? []
    if (failed.length > 0) {
      const retryInstances: Partial<ScheduledTaskInstance>[] = []

      for (const f of failed) {
        // 优先从 DB 任务定义读取重试配置（前端可编辑），回退到 handler 级别，再回退到全局默认
        const taskDef = await this.storage.getTaskDefinition(f.taskCode)
        const handler = this.registry.get(f.taskCode)
        let maxRetry: number
        let backoff: any

        if (taskDef?.maxRetry !== undefined && taskDef.maxRetry !== null) {
          // DB 有配置（前端编辑过），优先使用
          maxRetry = taskDef.maxRetry
          backoff = taskDef.backoffStrategy ? JSON.parse(taskDef.backoffStrategy) : (handler?.backoffStrategy ?? this.defaultBackoff)
        } else {
          // 回退到 handler 级别
          maxRetry = handler?.maxRetry ?? this.defaultMaxRetry
          backoff = handler?.backoffStrategy ?? this.defaultBackoff
        }

        // 超过最大重试次数则放弃
        if (f.retryCount >= maxRetry) {
          this.logger.warn(`任务 ${f.taskCode} 达到最大重试次数 ${maxRetry}，放弃重试: instanceId=${f.instanceId}`)
          continue
        }

        // 计算退避时间
        const delayMs = this.computeBackoff(backoff, f.retryCount)

        retryInstances.push({
          taskCode: f.taskCode,
          executeAt: new Date(Date.now() + delayMs),
          status: TaskInstanceStatusDict.PENDING,
          retryCount: f.retryCount + 1,
          entityId: f.entityId,
          payload: f.payload,
          // 重试实例沿用原执行来源（手动触发的链保持"手动"）
          triggerType: f.triggerType ?? TaskTriggerTypeDict.AUTO,
        })
      }

      if (retryInstances.length > 0) {
        await this.storage.createInstances(retryInstances)
        this.logger.debug(`归档: 创建 ${retryInstances.length} 条重试实例`)
      }
    }

    // 批量生成日志（仅对 enableLog=true 的任务）
    const logs: Partial<ScheduledTaskLog>[] = entries
      .filter((e) => e.enableLog !== false)
      .map((e) => ({
        taskCode: e.taskCode,
        taskName: e.taskName ?? this.registry.get(e.taskCode)?.taskName ?? e.taskCode,
        instanceId: e.instanceId,
        status: e.status,
        triggerType: e.triggerType ?? TaskTriggerTypeDict.AUTO,
        startedAt: e.startedAt,
        finishedAt: e.finishedAt,
        durationMs: e.finishedAt.getTime() - e.startedAt.getTime(),
        executor: e.executor ?? null,
        errorMessage: e.error?.message ?? null,
        errorStack: e.error?.stack ?? null,
        result: e.result ?? null,
      }))
    if (logs.length > 0) {
      await this.storage.batchCreateLogs(logs)
    }

    // 清空缓冲
    this.resultBuffer.clear()
  }

  /**
   * 计算退避时间
   * @description 根据策略类型计算第 retryCount 次重试的延迟毫秒数
   * @param strategy 退避策略
   * @param retryCount 当前重试次数（0=首次失败后第一次重试）
   * @returns 延迟毫秒数
   */
  private computeBackoff(strategy: BackoffStrategy, retryCount: number): number {
    switch (strategy.type) {
      case 'none':
        return 0

      case 'fixed': {
        // 固定序列：delays[0] 对应第一次重试
        const idx = Math.min(retryCount, strategy.delays.length - 1)
        return strategy.delays[idx]
      }

      case 'exponential': {
        // 指数退避：base * multiplier^retryCount，不超过 max
        const { base, multiplier = 2, max } = strategy
        const delay = base * Math.pow(multiplier, retryCount)
        return Math.min(delay, max)
      }

      case 'linear': {
        // 线性递增：interval + increment * retryCount
        return strategy.interval + strategy.increment * retryCount
      }

      default:
        return 60_000 // 安全兜底
    }
  }
}
