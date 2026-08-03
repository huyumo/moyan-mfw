/**
 * @fileoverview 定时任务管理服务
 * @description 提供任务定义管理、延迟实例管理、日志查询等管理功能
 */

import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common'
import {
  SCHEDULER_TASK_STORAGE,
  SCHEDULER_RUNTIME_NOTIFY,
  SCHEDULER_TASK_DISPATCHER,
  type ITaskStorage,
  type IRuntimeNotify,
  type ITaskDispatcher,
  type InstanceQueryFilters,
  type LogQueryFilters,
} from '../spi/interfaces'
import { TaskRegistry } from './task.registry'
import { SchedulerEngineService } from './scheduler-engine.service'
import { TaskTypeDict, TaskInstanceStatusDict, TaskTriggerTypeDict } from 'moyan-mfw-extension-scheduler/shared'
import type { ScheduledTaskDefinition, ScheduledTaskInstance, ScheduledTaskLog } from '../entities'

@Injectable()
export class ScheduledTaskService implements OnModuleInit {
  private readonly logger = new Logger(ScheduledTaskService.name)
  private engine: SchedulerEngineService | null = null

  constructor(
    @Inject(SCHEDULER_TASK_STORAGE) private readonly storage: ITaskStorage,
    @Inject(SCHEDULER_RUNTIME_NOTIFY) private readonly notify: IRuntimeNotify,
    private readonly registry: TaskRegistry,
  ) {}

  onModuleInit() {
    // 延迟获取引擎实例，避免构造函数循环依赖
    // onModuleInit 在所有 providers 实例化后执行，此时 SchedulerEngineService 已就绪
    try {
      // 通过 dispatcher 间接持有引擎引用不可行，改为在 SchedulerEngineService 中注入本 service 后反向设置
    } catch {
      // ignore
    }
  }

  /**
   * 由 SchedulerEngineService 在 onModuleInit 中调用，注入自身引用
   * @description 解决双向依赖：引擎注入本 service（构造函数），本 service 通过此方法获取引擎
   */
  setEngine(engine: SchedulerEngineService): void {
    this.engine = engine
  }

  /**
   * 获取调度引擎实例
   */
  private getEngine(): SchedulerEngineService {
    if (!this.engine) {
      throw new Error('SchedulerEngineService 尚未初始化')
    }
    return this.engine
  }

  // ── 任务定义管理 ──

  async listTasks(filters?: { taskName?: string; taskType?: number }): Promise<ScheduledTaskDefinition[]> {
    return this.storage.listTaskDefinitions(filters)
  }

  async getTaskDetail(taskCode: string): Promise<ScheduledTaskDefinition | null> {
    return this.storage.getTaskDefinition(taskCode)
  }

  async updateTask(taskCode: string, dto: any): Promise<void> {
    // backoffStrategy 对象序列化为 JSON 字符串存储
    const fields: any = { ...dto }
    if (dto.backoffStrategy && typeof dto.backoffStrategy === 'object') {
      fields.backoffStrategy = JSON.stringify(dto.backoffStrategy)
    }
    await this.storage.updateTaskRuntime(taskCode, fields)
    // 清除引擎侧任务配置缓存（如 enableLog），保证编辑后立即生效
    if (this.engine) this.engine.invalidateTaskConfig(taskCode)
    // 热重载：如果修改了调度相关字段，重启对应 CronJob
    const scheduleFields = ['cronExpression', 'intervalSeconds', 'enabled', 'timeoutSeconds']
    if (scheduleFields.some((f) => f in dto)) {
      const task = await this.storage.getTaskDefinition(taskCode)
      if (task?.taskType === TaskTypeDict.CRON) {
        if (task.enabled) {
          await this.getEngine().restartCronTask(taskCode)
        } else {
          await this.getEngine().stopCronTask(taskCode)
        }
      }
    }
  }

  /**
   * 手动触发任务
   * @description 与自动执行一致：不创建实例，直接执行 handler → 写日志 → 更新任务运行时状态；
   *   执行结果在「执行日志」中查看（触发方式=手动）
   */
  async triggerTask(taskCode: string): Promise<void> {
    const handler = this.registry.get(taskCode)
    if (!handler) {
      throw new Error(`处理器未注册: ${taskCode}`)
    }
    await this.getEngine().executeTaskNow(taskCode, handler, TaskTriggerTypeDict.MANUAL)
    this.logger.log(`手动触发任务: ${taskCode}`)
  }

  /**
   * 同步代码注册的任务到 DB
   * @description 将 handler 声明的只读属性与运行配置作为默认值 upsert；
   * UPDATE 时 storage 仅更新只读属性，admin 已编辑的运行配置保留 DB 值
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
        maxRetry: handler.maxRetry ?? 3,
        backoffStrategy: handler.backoffStrategy ? JSON.stringify(handler.backoffStrategy) : null,
        enableLog: handler.enableLog,
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

  async getLogDetail(id: string): Promise<any> {
    return this.storage.getLog(id)
  }
}
