/**
 * @fileoverview 执行器心跳服务（共享）
 * @description 统一管理本实例的执行器标识、注册与心跳，供 Preloader（动态分片）与 Cleanup（单实例协调）复用
 *   - 构造时生成 executorId（hostname-pid-randomHex）
 *   - start(): 注册 + 每30s心跳 + 注册表清理
 *   - stop(): 注销（优雅停机）
 *   - isCoordinator(): 是否存活执行器排序第一（清理等单实例任务的协调判断）
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import { hostname } from 'os'
import { randomBytes } from 'crypto'
import {
  SCHEDULER_EXECUTOR_REGISTRY,
  type IExecutorRegistry,
  type ExecutorInfo,
} from '../spi/interfaces'

@Injectable()
export class ExecutorHeartbeatService {
  private readonly logger = new Logger(ExecutorHeartbeatService.name)
  private readonly HEARTBEAT_INTERVAL_MS = 30_000
  private readonly ALIVE_TIMEOUT_SECONDS = 90

  readonly executorId: string
  private heartbeatTimer: NodeJS.Timeout | null = null

  constructor(
    @Inject(SCHEDULER_EXECUTOR_REGISTRY) private readonly registry: IExecutorRegistry,
  ) {
    this.executorId = `${hostname()}-${process.pid}-${randomBytes(4).toString('hex')}`
  }

  get info(): ExecutorInfo {
    return {
      executorId: this.executorId,
      hostname: hostname(),
      pid: process.pid,
      lastHeartbeat: new Date(),
    }
  }

  /**
   * 启动心跳：注册执行器 → 每30s更新心跳
   */
  async start(): Promise<void> {
    await this.registerSelf()
    this.heartbeatTimer = setInterval(() => this.heartbeatSelf(), this.HEARTBEAT_INTERVAL_MS)
    this.logger.log(`执行器心跳启动: executorId=${this.executorId}`)
  }

  private async registerSelf(): Promise<void> {
    try {
      await this.registry.register(this.info)
    } catch (err) {
      this.logger.error(`执行器注册失败: ${(err as Error).message}`)
    }
  }

  private async heartbeatSelf(): Promise<void> {
    try {
      await this.registry.heartbeat(this.executorId)
    } catch (err) {
      this.logger.error(`心跳更新失败: ${(err as Error).message}`)
    }
  }

  /**
   * 获取存活执行器列表（按 executorId 排序）
   */
  async getAliveExecutors(): Promise<ExecutorInfo[]> {
    return this.registry.getAliveExecutors(this.ALIVE_TIMEOUT_SECONDS)
  }

  /**
   * 是否协调者（存活列表排序第一）
   * @description 用于清理等只需单实例执行的协调判断；空列表时回退为自己
   */
  async isCoordinator(): Promise<boolean> {
    const alive = await this.getAliveExecutors()
    if (alive.length === 0) return true
    return alive[0].executorId === this.executorId
  }

  /**
   * 停止心跳并注销（优雅停机）
   */
  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    try {
      await this.registry.unregister(this.executorId)
      this.logger.log(`执行器已注销: ${this.executorId}`)
    } catch (err) {
      this.logger.error(`执行器注销失败: ${(err as Error).message}`)
    }
  }
}
