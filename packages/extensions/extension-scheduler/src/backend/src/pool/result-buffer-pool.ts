/**
 * @fileoverview 结果缓冲池（I 状态分组缓冲池）
 * @description 按状态分桶缓存执行结果（不落库），由归档链 K 批量读取落库
 */

import { Injectable } from '@nestjs/common'
import type { TaskExecutionResult } from '../interfaces/task-handler.interface'

/** 结果条目 */
export interface ResultEntry {
  /** 实例ID */
  instanceId: string
  /** 任务编码 */
  taskCode: string
  /** 执行状态 */
  status: number
  /** 执行结果 */
  result?: TaskExecutionResult | null
  /** 错误信息 */
  error?: Error | null
  /** 开始执行时间 */
  startedAt: Date
  /** 完成时间 */
  finishedAt: Date
  /** 执行实例标识 */
  executor?: string
  /** 业务实体ID */
  entityId?: string
  /** 业务数据 */
  payload?: Record<string, any>
  /** 重试次数 */
  retryCount: number
}

@Injectable()
export class ResultBufferPool {
  private buckets = new Map<number, ResultEntry[]>()

  /**
   * 推入结果
   * @description 按状态分桶缓存
   */
  push(
    instanceId: string,
    status: number,
    result?: TaskExecutionResult | null,
    error?: Error | null,
    extra?: Partial<ResultEntry>,
  ): void {
    const bucket = this.buckets.get(status) ?? []
    bucket.push({
      instanceId,
      status,
      result,
      error,
      startedAt: extra?.startedAt ?? new Date(),
      finishedAt: extra?.finishedAt ?? new Date(),
      executor: extra?.executor,
      taskCode: extra?.taskCode ?? '',
      entityId: extra?.entityId,
      payload: extra?.payload,
      retryCount: extra?.retryCount ?? 0,
    })
    this.buckets.set(status, bucket)
  }

  /**
   * 排空所有结果
   * @description 归档链 K 调用，读取后清空所有桶
   */
  drainAll(): ResultEntry[] {
    const all: ResultEntry[] = []
    for (const [, bucket] of this.buckets) all.push(...bucket)
    this.buckets.clear()
    return all
  }

  /**
   * 清空指定状态桶或全部
   */
  clear(status?: number): void {
    if (status !== undefined) this.buckets.delete(status)
    else this.buckets.clear()
  }

  /**
   * 当前缓冲总数
   */
  size(): number {
    let total = 0
    for (const [, bucket] of this.buckets) total += bucket.length
    return total
  }
}
