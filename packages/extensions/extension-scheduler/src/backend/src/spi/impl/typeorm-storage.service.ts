/**
 * @fileoverview 默认存储实现（TypeOrmStorage）
 * @description 基于 TypeORM Repository 实现 ITaskStorage 接口
 * batchClaim: 1次UPDATE(id IN + status=PENDING → RUNNING) + 1次SELECT(executor=本机)
 * batchArchiveStatus: 按状态分组，每组1次UPDATE
 */

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, Between, LessThan } from 'typeorm'
import { PaginationResult, PaginationX, WhereBuilder, NotFoundError } from 'moyan-mfw-base/backend'
import { TaskInstanceStatusDict } from 'moyan-mfw-extension-scheduler/shared'
import { ScheduledTaskDefinition, ScheduledTaskInstance, ScheduledTaskLog } from '../../entities'
import {
  ITaskStorage,
  RuntimeFields,
  InstanceFields,
  LogFields,
  BatchArchiveUpdate,
  InstanceQueryFilters,
  LogQueryFilters,
} from '../interfaces'

@Injectable()
export class TypeOrmStorage implements ITaskStorage {
  constructor(
    @InjectRepository(ScheduledTaskDefinition)
    private readonly taskRepo: Repository<ScheduledTaskDefinition>,
    @InjectRepository(ScheduledTaskInstance)
    private readonly instanceRepo: Repository<ScheduledTaskInstance>,
    @InjectRepository(ScheduledTaskLog)
    private readonly logRepo: Repository<ScheduledTaskLog>,
  ) {}

  // ── 任务定义 ──

  async upsertTaskDefinition(task: Partial<ScheduledTaskDefinition>): Promise<void> {
    const existing = await this.taskRepo.findOne({ where: { taskCode: task.taskCode } })
    if (existing) {
      await this.taskRepo.update(existing.id, {
        taskName: task.taskName ?? existing.taskName,
        taskType: task.taskType ?? existing.taskType,
        cronExpression: task.cronExpression ?? existing.cronExpression,
        intervalSeconds: task.intervalSeconds ?? existing.intervalSeconds,
        timeoutSeconds: task.timeoutSeconds ?? existing.timeoutSeconds,
        description: task.description ?? existing.description,
        catchUpOnRestart: task.catchUpOnRestart ?? existing.catchUpOnRestart,
      })
    } else {
      await this.taskRepo.insert({
        taskCode: task.taskCode!,
        taskName: task.taskName!,
        taskType: task.taskType ?? 1,
        cronExpression: task.cronExpression ?? null,
        intervalSeconds: task.intervalSeconds ?? 0,
        enabled: true,
        timeoutSeconds: task.timeoutSeconds ?? 300,
        description: task.description ?? null,
        catchUpOnRestart: task.catchUpOnRestart ?? false,
      })
    }
  }

  async getTaskDefinition(taskCode: string): Promise<ScheduledTaskDefinition | null> {
    return this.taskRepo.findOne({ where: { taskCode } })
  }

  async listTaskDefinitions(): Promise<ScheduledTaskDefinition[]> {
    return this.taskRepo.find({ order: { createdAt: 'ASC' } })
  }

  async updateTaskRuntime(taskCode: string, fields: Partial<RuntimeFields>): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { taskCode } })
    if (!task) throw new NotFoundError(`任务定义不存在: ${taskCode}`)
    await this.taskRepo.update(task.id, fields as any)
  }

  // ── 延迟实例 ──

  async createInstance(instance: Partial<ScheduledTaskInstance>): Promise<ScheduledTaskInstance> {
    const entity = this.instanceRepo.create({
      taskCode: instance.taskCode!,
      entityId: instance.entityId ?? null,
      payload: instance.payload ?? null,
      executeAt: instance.executeAt!,
      status: instance.status ?? TaskInstanceStatusDict.PENDING,
      retryCount: instance.retryCount ?? 0,
    })
    return this.instanceRepo.save(entity)
  }

  async createInstances(instances: Partial<ScheduledTaskInstance>[]): Promise<void> {
    if (instances.length === 0) return
    const entities = instances.map((i) =>
      this.instanceRepo.create({
        taskCode: i.taskCode!,
        entityId: i.entityId ?? null,
        payload: i.payload ?? null,
        executeAt: i.executeAt!,
        status: i.status ?? TaskInstanceStatusDict.PENDING,
        retryCount: i.retryCount ?? 0,
      }),
    )
    await this.instanceRepo.save(entities)
  }

  async loadDueInstances(now: Date, windowEnd: Date, limit: number): Promise<ScheduledTaskInstance[]> {
    const qb = this.instanceRepo
      .createQueryBuilder('inst')
      .where('inst.status = :status', { status: TaskInstanceStatusDict.PENDING })
      .andWhere('inst.executeAt <= :windowEnd', { windowEnd })
      .orderBy('inst.executeAt', 'ASC')
    if (limit > 0) qb.limit(limit)
    return qb.getMany()
  }

  async batchClaim(ids: string[], executor: string): Promise<ScheduledTaskInstance[]> {
    if (ids.length === 0) return []
    // 1. 原子 UPDATE：PENDING → RUNNING
    await this.instanceRepo.update(
      { id: In(ids), status: TaskInstanceStatusDict.PENDING },
      { status: TaskInstanceStatusDict.RUNNING, executor, startedAt: new Date() },
    )
    // 2. SELECT 确认本实例认领成功的
    return this.instanceRepo.find({
      where: { id: In(ids), executor, status: TaskInstanceStatusDict.RUNNING },
    })
  }

  async batchArchiveStatus(updates: BatchArchiveUpdate[]): Promise<void> {
    for (const update of updates) {
      if (update.ids.length === 0) continue
      await this.instanceRepo.update(
        { id: In(update.ids) },
        {
          status: update.status,
          ...(update.fields as any),
        },
      )
    }
  }

  async cancelInstance(id: string): Promise<boolean> {
    const result = await this.instanceRepo.update(
      { id, status: TaskInstanceStatusDict.PENDING },
      { status: TaskInstanceStatusDict.CANCELLED, finishedAt: new Date() },
    )
    return (result.affected ?? 0) > 0
  }

  async updateInstanceStatus(id: string, status: number, fields?: Partial<InstanceFields>): Promise<void> {
    await this.instanceRepo.update(id, { status, ...(fields as any) })
  }

  async getInstance(id: string): Promise<ScheduledTaskInstance | null> {
    return this.instanceRepo.findOne({ where: { id } })
  }

  // ── 执行日志 ──

  async createLog(log: Partial<ScheduledTaskLog>): Promise<ScheduledTaskLog> {
    const entity = this.logRepo.create({
      taskCode: log.taskCode!,
      taskName: log.taskName!,
      instanceId: log.instanceId ?? null,
      status: log.status ?? 1,
      triggerType: log.triggerType ?? 1,
      startedAt: log.startedAt ?? new Date(),
      executor: log.executor ?? null,
    })
    return this.logRepo.save(entity)
  }

  async batchCreateLogs(logs: Partial<ScheduledTaskLog>[]): Promise<void> {
    if (logs.length === 0) return
    const entities = logs.map((l) =>
      this.logRepo.create({
        taskCode: l.taskCode!,
        taskName: l.taskName!,
        instanceId: l.instanceId ?? null,
        status: l.status ?? 1,
        triggerType: l.triggerType ?? 1,
        startedAt: l.startedAt ?? new Date(),
        finishedAt: l.finishedAt ?? null,
        durationMs: l.durationMs ?? 0,
        executor: l.executor ?? null,
        errorMessage: l.errorMessage ?? null,
        errorStack: l.errorStack ?? null,
        result: l.result ?? null,
      }),
    )
    await this.logRepo.save(entities)
  }

  async updateLogStatus(id: string, status: number, fields?: Partial<LogFields>): Promise<void> {
    await this.logRepo.update(id, { status, ...(fields as any) })
  }

  async getLog(id: string): Promise<ScheduledTaskLog | null> {
    return this.logRepo.findOne({ where: { id } })
  }

  // ── 孤儿清理 ──

  async cleanupOrphanRecords(timeoutSeconds: number): Promise<number> {
    const threshold = new Date(Date.now() - timeoutSeconds * 1000)
    const result = await this.instanceRepo.update(
      { status: TaskInstanceStatusDict.RUNNING, updateAt: LessThan(threshold) },
      { status: TaskInstanceStatusDict.TIMEOUT_ORPHAN, finishedAt: new Date() },
    )
    return result.affected ?? 0
  }

  // ── 查询（管理页面用） ──

  async queryInstances(filters: InstanceQueryFilters): Promise<PaginationResult<ScheduledTaskInstance>> {
    const whereBuilder = new WhereBuilder()
    whereBuilder.isNull('inst.deleteAt')
    if (filters.taskCode) whereBuilder.eq('inst.taskCode', filters.taskCode)
    if (filters.status) whereBuilder.eq('inst.status', filters.status)
    if (filters.entityId) whereBuilder.eq('inst.entityId', filters.entityId)
    if (filters.startTime) whereBuilder.gte('inst.executeAt', filters.startTime)
    if (filters.endTime) whereBuilder.lte('inst.executeAt', filters.endTime)

    const pager = new PaginationX(
      this.instanceRepo.manager.connection,
      filters as any,
    )
    const result = await pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `SELECT ${select} FROM ext_scheduler_task_instance inst ${whereClause} ${orderBy} ${limit}`
      })
      .select('inst.*')
      .defaultOrderBy('inst.executeAt DESC')
      .getData()

    return result
  }

  async queryLogs(filters: LogQueryFilters): Promise<PaginationResult<ScheduledTaskLog>> {
    const whereBuilder = new WhereBuilder()
    whereBuilder.isNull('log.deleteAt')
    if (filters.taskCode) whereBuilder.eq('log.taskCode', filters.taskCode)
    if (filters.status) whereBuilder.eq('log.status', filters.status)
    if (filters.triggerType) whereBuilder.eq('log.triggerType', filters.triggerType)
    if (filters.startTime) whereBuilder.gte('log.startedAt', filters.startTime)
    if (filters.endTime) whereBuilder.lte('log.startedAt', filters.endTime)

    const pager = new PaginationX(
      this.logRepo.manager.connection,
      filters as any,
    )
    const result = await pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `SELECT ${select} FROM ext_scheduler_task_log log ${whereClause} ${orderBy} ${limit}`
      })
      .select('log.*')
      .defaultOrderBy('log.startedAt DESC')
      .getData()

    return result
  }
}
