/**
 * @fileoverview 默认运行时通知实现（PollingNotify）
 * @description notify 不操作，onScheduled 不注册
 * 引擎靠周期重载窗口（每60s）发现新任务
 */

import { Injectable } from '@nestjs/common'
import { IRuntimeNotify } from '../interfaces'

@Injectable()
export class PollingNotify implements IRuntimeNotify {
  /**
   * 通知有新任务被调度
   * @description 默认实现为空操作，引擎靠周期重载窗口发现新任务
   * 接入 Redis 时替换为 RedisPubSubNotify 可实现即时通知
   */
  async notifyTaskScheduled(_taskCode: string, _executeAt: Date): Promise<void> {
    // 空操作：靠周期重载
  }

  /**
   * 注册调度通知回调
   * @description 默认实现不注册回调
   */
  onScheduled(_callback: (taskCode: string, executeAt: Date) => void): void {
    // 空操作
  }
}
