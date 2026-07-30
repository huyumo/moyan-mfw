/**
 * @fileoverview 定时任务管理服务
 * @description 提供任务定义管理、延迟实例管理、日志查询等管理功能
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import {
  SCHEDULER_TASK_STORAGE,
  SCHEDULER_RUNTIME_NOTIFY,
  type ITaskStorage,
  type IRuntimeNotify,
  type InstanceQueryFilters,
  type LogQueryFilters,
} from '../spi/interfaces'
import { TaskRegistry } from './task.registry'
import { TaskInstanceStatusDict } from 'moyan-mfw-extension-scheduler/shared'
import type { ScheduledTaskDefinition, ScheduledTaskInstance, ScheduledTaskLog } from '../entities'

@Injectable()
export class ScheduledTaskService {
  private readonly logger = new Logger(ScheduledTaskService.name)

  constructor(
    @Inject(SCHEDULER_TASK_STORAGE) private readonly storage: ITaskStorage,
    @Inject(SCHEDULER_RUNTIME_NOTIFY) private readonly notify: IRuntimeNotify,
    private readonly registry: TaskRegistry,
  ) {}

  // ── 任务定义管理 ──

  async listTasks(): Promise<ScheduledTaskDefinition[]> {
    return this.storage.listTaskDefinitions()
  }

  async getTaskDetail(taskCode: string): Promise<ScheduledTaskDefinition | null> {
    return this.storage.getTaskDefinition(taskCode)
  }

  async updateTask(taskCode: string, dto: Partial<ScheduledTaskDefinition>): Promise<void> {
    await this.storage.updateTaskRuntime(taskCode, dto)
  }

  /**
   * 手动触发任务
   * @description 直接创建 PENDING 实例并通知
   */
  async triggerTask(taskCode: string, payload?: Record<string, any>): Promise<ScheduledTaskInstance> {
    const instance = await this.storage.createInstance({
      taskCode,
      executeAt: new Date(),
      entityId: null,
      payload: payload ?? null,
      status: TaskInstanceStatusDict.PENDING,
    })
    await this.notify.notifyTaskScheduled(taskCode, instance.executeAt)
    this.logger.log(`手动触发任务: ${taskCode}, instanceId=${instance.id}`)
    return instance
  }

  /**
   * 同步代码注册的任务到 DB
   */
  async syncFromCode(): Promise<void> {
    for (const handler of this.registry.getAll()) {
      await this.storage.upsertTaskDefinition({
        taskCode: handler.taskCode,
        taskName: handler.taskName,
        taskType: handler.taskType,
        cronExpression: handler.defaultCron ?? null,
        intervalSeconds: handler.defaultIntervalSeconds ?? 0,
        timeoutSeconds: handler.defaultTimeoutSeconds ?? 300,
        catchUpOnRestart: handler.catchUpOnRestart ?? false,
        description: handler.description ?? null,
      })
    }
  }

  // ── 延迟实例管理 ──

  /**
   * 创建延迟任务实例
   * @description 业务方创建延迟任务（细粒度单实体定时）
   */
  async createDelayInstance(
    taskCode: string,
    executeAt: Date,
    entityId?: string,
    payload?: Record<string, any>,
  ): Promise<ScheduledTaskInstance> {
    const instance = await this.storage.createInstance({
      taskCode,
      executeAt,
      entityId: entityId ?? null,
      payload: payload ?? null,
      status: TaskInstanceStatusDict.PENDING,
    })
    await this.notify.notifyTaskScheduled(taskCode, executeAt)
    return instance
  }

  async cancelInstance(id: string): Promise<boolean> {
    return this.storage.cancelInstance(id)
  }

  async getInstance(id: string): Promise<ScheduledTaskInstance | null> {
    return this.storage.getInstance(id)
  }

  async listInstances(filters: InstanceQueryFilters) {
    return this.storage.queryInstances(filters)
  }

  // ── 日志查询 ──

  async listLogs(filters: LogQueryFilters) {
    return this.storage.queryLogs(filters)
  }

  async getLogDetail(id: string): Promise<ScheduledTaskLog | null> {
    return this.storage.getLog(id)
  }
}
