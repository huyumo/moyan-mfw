/**
 * @fileoverview 任务处理器注册表
 * @description 管理所有已注册的 ScheduledTaskHandler 实例
 * 业务方 handler 在构造函数中调用 registry.register(this) 自注册
 */

import { Injectable } from '@nestjs/common'
import type { ScheduledTaskHandler } from '../interfaces/task-handler.interface'

@Injectable()
export class TaskRegistry {
  private readonly handlers = new Map<string, ScheduledTaskHandler>()

  /**
   * 注册任务处理器
   * @throws 任务编码已注册时抛出错误
   */
  register(handler: ScheduledTaskHandler): void {
    if (this.handlers.has(handler.taskCode)) {
      throw new Error(`任务编码已注册: ${handler.taskCode}`)
    }
    this.handlers.set(handler.taskCode, handler)
  }

  /**
   * 获取指定任务处理器
   */
  get(taskCode: string): ScheduledTaskHandler | undefined {
    return this.handlers.get(taskCode)
  }

  /**
   * 获取所有已注册的任务处理器
   */
  getAll(): ScheduledTaskHandler[] {
    return [...this.handlers.values()]
  }

  /**
   * 检查任务处理器是否已注册
   */
  has(taskCode: string): boolean {
    return this.handlers.has(taskCode)
  }
}
