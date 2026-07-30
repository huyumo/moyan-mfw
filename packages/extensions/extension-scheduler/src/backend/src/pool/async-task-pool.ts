/**
 * @fileoverview 异步任务处理器池（H 处理器池，长短双池）
 * @description async 信号量控制并发，非 worker_threads
 * 长任务池（maxConcurrency=10）：timeout>30s
 * 短任务池（maxConcurrency=30）：timeout<=30s
 */

import { Injectable, Logger } from '@nestjs/common'
import type { ScheduledTaskHandler, TaskExecutionContext, TaskExecutionResult } from '../interfaces/task-handler.interface'

/**
 * 简单信号量实现
 * @description 基于 Promise 队列的异步并发控制器
 */
class Semaphore {
  private current = 0
  private readonly waiters: Array<() => void> = []

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++
      return
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve))
    this.current++
  }

  release(): void {
    this.current--
    const next = this.waiters.shift()
    if (next) next()
  }

  get available(): number {
    return this.max - this.current
  }
}

@Injectable()
export class AsyncTaskPool {
  private readonly logger = new Logger(AsyncTaskPool.name)
  private readonly longPool: Semaphore
  private readonly shortPool: Semaphore
  private readonly LONG_THRESHOLD_MS = 30_000

  constructor(longMax = 10, shortMax = 30) {
    this.longPool = new Semaphore(longMax)
    this.shortPool = new Semaphore(shortMax)
  }

  /**
   * 提交任务执行
   * @description 根据超时阈值选择长短池，acquire 信号量后执行
   * 超时通过 AbortSignal.timeout 实现
   */
  async submit(
    handler: ScheduledTaskHandler,
    ctx: TaskExecutionContext,
  ): Promise<TaskExecutionResult | void> {
    const timeoutSeconds = handler.defaultTimeoutSeconds ?? 300
    const pool = timeoutSeconds * 1000 > this.LONG_THRESHOLD_MS
      ? this.longPool
      : this.shortPool

    await pool.acquire()
    try {
      // 构造带超时的上下文
      const signal = AbortSignal.timeout(timeoutSeconds * 1000)
      const ctxWithSignal: TaskExecutionContext = { ...ctx, signal }

      // Promise.race 实现超时控制
      return await Promise.race([
        handler.execute(ctxWithSignal),
        this.createTimeout(timeoutSeconds),
      ])
    } finally {
      pool.release()
    }
  }

  /**
   * 创建超时 Promise
   */
  private createTimeout(seconds: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`任务执行超时（${seconds}秒）`)), seconds * 1000)
    })
  }
}
