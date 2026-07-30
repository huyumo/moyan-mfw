/**
 * @fileoverview 调度引擎核心服务（G 核心编排）
 * @description 编排预加载、时间轮、派发、归档的全生命周期
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common'
import { CronJob } from 'cron'
import {
  SCHEDULER_TASK_STORAGE,
  SCHEDULER_TASK_DISPATCHER,
  type ITaskStorage,
  type ITaskDispatcher,
  type SchedulerModuleOptions,
} from '../spi/interfaces'
import { TaskPreloaderService } from './task-preloader.service'
import { BatchArchiverService } from './batch-archiver.service'
import { TaskRegistry } from './task.registry'
import { MinuteWheel, SecondWheel, ArchiveWheel } from '../wheel'
import { AsyncTaskPool } from '../pool/async-task-pool'
import { ResultBufferPool } from '../pool/result-buffer-pool'
import { ScheduledTaskService } from './scheduled-task.service'
import type { TaskExecutionContext } from '../interfaces/task-handler.interface'
import type { ScheduledTaskInstance } from '../entities'
import {
  TaskTypeDict,
  TaskRunStatusDict,
  TaskTriggerTypeDict,
  TaskInstanceStatusDict,
} from 'moyan-mfw-extension-scheduler/shared'

@Injectable()
export class SchedulerEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerEngineService.name)
  private readonly TICK_INTERVAL_MS: number
  private readonly ARCHIVE_INTERVAL_MS: number
  private isDestroying = false
  private tickTimer: NodeJS.Timeout | null = null
  private cronJobs: CronJob[] = []

  constructor(
    private readonly preloader: TaskPreloaderService,
    private readonly minuteWheel: MinuteWheel,
    private readonly secondWheel: SecondWheel,
    private readonly archiveWheel: ArchiveWheel,
    @Inject(SCHEDULER_TASK_DISPATCHER) private readonly dispatcher: ITaskDispatcher,
    private readonly taskPool: AsyncTaskPool,
    private readonly resultBuffer: ResultBufferPool,
    private readonly archiver: BatchArchiverService,
    @Inject(SCHEDULER_TASK_STORAGE) private readonly storage: ITaskStorage,
    private readonly registry: TaskRegistry,
    private readonly taskService: ScheduledTaskService,
    @Inject('SCHEDULER_OPTIONS') private readonly options: SchedulerModuleOptions = {},
  ) {
    this.TICK_INTERVAL_MS = options.tickIntervalMs ?? 200
    this.ARCHIVE_INTERVAL_MS = options.archiveIntervalMs ?? 60_000
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('调度引擎启动中...')
    // 1. 同步任务定义（upsert code-registered tasks）
    await this.syncFromCode()
    // 2. 清理孤儿记录（崩溃残留的 RUNNING）
    const orphans = await this.storage.cleanupOrphanRecords(600)
    if (orphans > 0) this.logger.warn(`清理 ${orphans} 条孤儿记录`)
    // 3. catchUpOnRestart 补偿执行
    await this.catchUpMissedTasks()
    // 4. 启动 CRON 类型任务
    await this.startCronTasks()
    // 5. 启动预加载服务
    this.preloader.start()
    // 6. 启动秒轮 tick
    this.tickTimer = setInterval(() => this.tick(), this.TICK_INTERVAL_MS)
    // 7. 启动归档轮（每60s）
    this.archiveWheel.start(() => this.archiver.archive(), this.ARCHIVE_INTERVAL_MS)
    // 8. 注册结果回调（远程派发 F2/F3 用；本地 F1 走快速路径）
    this.dispatcher.onResult((instanceId, result, error) => {
      const status = error ? TaskRunStatusDict.FAILED : TaskRunStatusDict.SUCCESS
      this.resultBuffer.push(instanceId, status, result, error)
    })
    this.logger.log('调度引擎启动完成')
  }

  /**
   * tick 驱动
   * @description 秒轮步进弹出 → 查 registry → 构造 ctx → dispatcher.dispatch → 结果写 ResultBufferPool
   */
  private async tick(): Promise<void> {
    if (this.isDestroying) return
    const now = new Date()
    // ① 从分钟轮取出到期任务
    const fromMinute: ScheduledTaskInstance[] = []
    this.minuteWheel.tickDue(now, fromMinute)
    // ② 入秒轮暂存（如果还没到精确秒）
    for (const inst of fromMinute) {
      const remainingMs = inst.executeAt.getTime() - Date.now()
      if (remainingMs <= this.TICK_INTERVAL_MS) {
        this.due.push(inst)
      } else {
        this.secondWheel.add(inst, Math.floor(remainingMs / 1000))
      }
    }
    // ③ 秒轮步进弹出
    this.secondWheel.tick(this.due)
    if (this.due.length === 0) return

    // ④ 批量派发
    for (const instance of this.due) {
      const handler = this.registry.get(instance.taskCode)
      if (!handler) {
        this.resultBuffer.push(
          instance.id,
          TaskRunStatusDict.FAILED,
          null,
          new Error(`处理器未注册: ${instance.taskCode}`),
          { taskCode: instance.taskCode, startedAt: new Date(), retryCount: instance.retryCount },
        )
        continue
      }
      // 派发执行
      this.dispatchInstance(instance, handler)
    }
    this.due.length = 0
  }

  /** 到期任务暂存区 */
  private due: ScheduledTaskInstance[] = []

  /**
   * 派发任务实例执行
   */
  private async dispatchInstance(instance: any, handler: any): Promise<void> {
    const startedAt = new Date()
    // 先创建日志
    const log = await this.storage.createLog({
      taskCode: instance.taskCode,
      taskName: handler.taskName,
      instanceId: instance.id,
      status: TaskRunStatusDict.RUNNING,
      triggerType: TaskTriggerTypeDict.AUTO,
      startedAt,
      executor: this.preloader['executorId'],
    })

    const ctx: TaskExecutionContext = {
      taskCode: instance.taskCode,
      logId: log.id,
      instanceId: instance.id,
      entityId: instance.entityId ?? undefined,
      payload: instance.payload ?? undefined,
      triggeredAt: startedAt,
      triggerType: TaskTriggerTypeDict.AUTO,
      logger: this.logger,
      retryCount: instance.retryCount ?? 0,
      maxRetry: handler.maxRetry ?? (this as any).options?.maxRetry ?? 3,
    }

    try {
      // F1 快速路径：dispatcher 内部调 taskPool.submit 或直接调 handler
      const result = await this.taskPool.submit(handler, ctx)
      // 结果直写 I（绕过事件层，零开销）
      this.resultBuffer.push(
        instance.id,
        TaskRunStatusDict.SUCCESS,
        result ?? null,
        null,
        {
          taskCode: instance.taskCode,
          startedAt,
          finishedAt: new Date(),
          executor: this.preloader['executorId'],
          entityId: instance.entityId,
          payload: instance.payload,
          retryCount: instance.retryCount,
        },
      )
    } catch (err) {
      this.resultBuffer.push(
        instance.id,
        TaskRunStatusDict.FAILED,
        null,
        err instanceof Error ? err : new Error(String(err)),
        {
          taskCode: instance.taskCode,
          startedAt,
          finishedAt: new Date(),
          executor: this.preloader['executorId'],
          entityId: instance.entityId,
          payload: instance.payload,
          retryCount: instance.retryCount,
        },
      )
    }
  }

  /**
   * 同步代码注册的任务到 DB
   */
  private async syncFromCode(): Promise<void> {
    const handlers = this.registry.getAll()
    for (const handler of handlers) {
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
    this.logger.log(`同步 ${handlers.length} 个任务定义`)
  }

  /**
   * 补偿执行遗漏的 CRON 任务
   */
  private async catchUpMissedTasks(): Promise<void> {
    const tasks = await this.storage.listTaskDefinitions()
    for (const task of tasks) {
      if (!task.catchUpOnRestart || !task.enabled) continue
      if (task.taskType !== TaskTypeDict.CRON) continue
      const handler = this.registry.get(task.taskCode)
      if (!handler) continue
      // 创建补偿执行实例
      const now = new Date()
      await this.storage.createInstance({
        taskCode: task.taskCode,
        executeAt: now,
        status: TaskInstanceStatusDict.PENDING,
      })
      this.logger.log(`补偿执行任务: ${task.taskCode}`)
    }
  }

  /**
   * 启动 CRON 类型任务
   * @description 用 cron 包 CronJob 调度
   */
  private async startCronTasks(): Promise<void> {
    const tasks = await this.storage.listTaskDefinitions()
    for (const task of tasks) {
      if (task.taskType !== TaskTypeDict.CRON || !task.enabled) continue
      const handler = this.registry.get(task.taskCode)
      if (!handler) {
        this.logger.warn(`CRON 任务 ${task.taskCode} 处理器未注册，跳过`)
        continue
      }
      // cronExpression 或 intervalSeconds
      let cronExpression = task.cronExpression
      if (!cronExpression && task.intervalSeconds > 0) {
        // 将间隔秒数转为 cron 表达式
        const sec = task.intervalSeconds
        if (sec < 60) {
          // 低于60秒：秒级 cron
          cronExpression = `*/${sec} * * * * *`
        } else if (sec % 60 === 0) {
          // 整分钟：分钟级 cron
          cronExpression = `0 */${sec / 60} * * * *`
        } else {
          // 非整分钟：按秒级拆分（向下取整到分钟 + 秒偏移）
          cronExpression = `*/${sec} * * * * *`
        }
      }
      if (!cronExpression) {
        this.logger.warn(`CRON 任务 ${task.taskCode} 无 cron 表达式且无间隔，跳过`)
        continue
      }
      try {
        const job = new CronJob(
          cronExpression,
          async () => {
            await this.executeCronTask(task.taskCode, handler)
          },
        )
        job.start()
        this.cronJobs.push(job as any)
        // 更新 nextRunAt
        await this.storage.updateTaskRuntime(task.taskCode, { nextRunAt: job.nextDate()?.toJSDate() ?? null })
        this.logger.log(`启动 CRON 任务: ${task.taskCode} (${cronExpression})`)
      } catch (err) {
        this.logger.error(`启动 CRON 任务 ${task.taskCode} 失败: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  /**
   * 执行 CRON 任务
   * @description 条件 UPDATE nextRunAt 充当锁 → 执行 handler → 写日志
   */
  private async executeCronTask(taskCode: string, handler: any): Promise<void> {
    if (this.isDestroying) return
    const startedAt = new Date()
    this.logger.debug(`执行 CRON 任务: ${taskCode}`)

    // 先创建日志
    const log = await this.storage.createLog({
      taskCode,
      taskName: handler.taskName,
      status: TaskRunStatusDict.RUNNING,
      triggerType: TaskTriggerTypeDict.AUTO,
      startedAt,
      executor: this.preloader['executorId'],
    })

    const ctx: TaskExecutionContext = {
      taskCode,
      logId: log.id,
      triggeredAt: startedAt,
      triggerType: TaskTriggerTypeDict.AUTO,
      logger: this.logger,
      retryCount: 0,
      maxRetry: handler.maxRetry ?? (this as any).options?.maxRetry ?? 3,
    }

    try {
      const result = await this.taskPool.submit(handler, ctx)
      // 更新日志
      await this.storage.updateLogStatus(log.id, TaskRunStatusDict.SUCCESS, {
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        result: result ?? null,
      })
      // 更新任务运行时状态
      await this.storage.updateTaskRuntime(taskCode, {
        lastRunAt: startedAt,
        lastRunStatus: TaskRunStatusDict.SUCCESS,
        lastErrorMessage: null,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      await this.storage.updateLogStatus(log.id, TaskRunStatusDict.FAILED, {
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        errorMessage: error.message,
        errorStack: error.stack ?? null,
      })
      await this.storage.updateTaskRuntime(taskCode, {
        lastRunAt: startedAt,
        lastRunStatus: TaskRunStatusDict.FAILED,
        lastErrorMessage: error.message,
      })
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('调度引擎停止中...')
    this.isDestroying = true
    // 停止 CRON 任务
    for (const job of this.cronJobs) job.stop()
    this.cronJobs = []
    // 停止 tick
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
    // 停止归档轮
    this.archiveWheel.stop()
    // 停止预加载
    this.preloader.onModuleDestroy()
    // 优雅停机：flush I 残留缓冲强制落库
    if (this.resultBuffer.size() > 0) {
      await this.archiver.archive()
    }
    this.logger.log('调度引擎已停止，缓冲已落库')
  }
}
