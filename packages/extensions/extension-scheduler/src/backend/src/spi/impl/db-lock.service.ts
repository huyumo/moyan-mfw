/**
 * @fileoverview 默认分布式锁实现（DbLock）
 * @description batchClaim 的原子 UPDATE 已隐含互斥，此处仅提供接口占位
 * CRON 类型任务用 taskDefinition 条件 UPDATE（nextRunAt<=now → 下次时间）充当锁
 */

import { Injectable } from '@nestjs/common'
import { IDistributedLock } from '../interfaces'

@Injectable()
export class DbLock implements IDistributedLock {
  /**
   * 尝试获取锁
   * @description 默认实现中，延迟任务的互斥已由 batchClaim 的原子 UPDATE 保证
   * CRON 任务的互斥由条件 UPDATE nextRunAt 保证
   * 此处返回固定 token，表示"锁获取成功"
   */
  async tryLock(resource: string, _ttlSeconds: number): Promise<string | null> {
    return `db-lock-${resource}-${Date.now()}`
  }

  /**
   * 释放锁
   * @description 默认实现为空操作（锁的释放由任务状态更新隐含完成）
   */
  async unlock(_resource: string, _token: string): Promise<boolean> {
    return true
  }
}
