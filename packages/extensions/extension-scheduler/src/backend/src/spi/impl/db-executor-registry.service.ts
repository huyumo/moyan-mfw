/**
 * @fileoverview 默认执行器注册表实现（DbExecutorRegistry）
 * @description 基于 DB 心跳表，零额外依赖
 *   register: INSERT ... ON DUPLICATE KEY UPDATE（executorId 唯一索引）
 *   heartbeat: UPDATE lastHeartbeat
 *   getAliveExecutors: 查询 lastHeartbeat > now-timeout 的存活实例
 *   unregister: DELETE 硬删除
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SchedulerExecutor } from '../../entities'
import { IExecutorRegistry, ExecutorInfo } from '../interfaces/executor-registry.interface'

@Injectable()
export class DbExecutorRegistry implements IExecutorRegistry, OnModuleInit {
  private readonly logger = new Logger(DbExecutorRegistry.name)

  constructor(
    @InjectRepository(SchedulerExecutor)
    private readonly executorRepo: Repository<SchedulerExecutor>,
  ) {}

  async onModuleInit(): Promise<void> {
    // 启动时清理超过 90s 无心跳的旧记录（上一次运行残留）
    await this.cleanupStaleExecutors()
  }

  async register(executor: ExecutorInfo): Promise<void> {
    // MySQL 8.0.19+ 新语法，避免 VALUES() 废弃警告
    await this.executorRepo.manager.query(
      `INSERT INTO ext_scheduler_executor (id, executorId, hostname, pid, lastHeartbeat, createdAt, updateAt)
       VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())
       AS new
       ON DUPLICATE KEY UPDATE
         hostname = new.hostname,
         pid = new.pid,
         lastHeartbeat = new.lastHeartbeat,
         deleteAt = NULL,
         updateAt = NOW()`,
      [executor.executorId, executor.hostname, executor.pid, executor.lastHeartbeat],
    )
  }

  async heartbeat(executorId: string): Promise<void> {
    await this.executorRepo
      .createQueryBuilder()
      .update(SchedulerExecutor)
      .set({ lastHeartbeat: new Date() })
      .where('executorId = :executorId', { executorId })
      .execute()
  }

  async getAliveExecutors(timeoutSeconds: number): Promise<ExecutorInfo[]> {
    const threshold = new Date(Date.now() - timeoutSeconds * 1000)
    const rows = await this.executorRepo
      .createQueryBuilder('e')
      .where('e.lastHeartbeat > :threshold', { threshold })
      .andWhere('e.deleteAt IS NULL')
      .orderBy('e.executorId', 'ASC')
      .getMany()
    return rows.map((r) => ({
      executorId: r.executorId,
      hostname: r.hostname,
      pid: r.pid,
      lastHeartbeat: r.lastHeartbeat,
    }))
  }

  async unregister(executorId: string): Promise<void> {
    await this.executorRepo.manager.query(
      'DELETE FROM ext_scheduler_executor WHERE executorId = ?',
      [executorId],
    )
  }

  private async cleanupStaleExecutors(): Promise<void> {
    const threshold = new Date(Date.now() - 90_000)
    const result = await this.executorRepo.manager.query(
      'DELETE FROM ext_scheduler_executor WHERE lastHeartbeat < ?',
      [threshold],
    )
    if (result.affectedRows > 0) {
      this.logger.log(`清理 ${result.affectedRows} 条过期执行器心跳记录`)
    }
  }
}