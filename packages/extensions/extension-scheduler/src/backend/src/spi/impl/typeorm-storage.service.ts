/**
 * @fileoverview 默认存储实现（TypeOrmStorage）
 * @description 基于 TypeORM Repository 实现 ITaskStorage 接口
 * batchClaim: 1次UPDATE(id IN + status=PENDING → RUNNING) + 1次SELECT(executor=本机)
 * archiveWithRetry: 单次 CASE-WHEN UPDATE，归档+重试一步到位（原地更新，不创建新实例）
 */

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, LessThan } from 'typeorm'
import { PaginationResult, PaginationX, WhereBuilder, NotFoundError } from 'moyan-mfw-base/backend'
import { TaskInstanceStatusDict, TaskTriggerTypeDict } from 'moyan-mfw-extension-scheduler/shared'
import { ScheduledTaskDefinition, ScheduledTaskInstance, ScheduledTaskLog } from '../../entities'
import {
  ITaskStorage,
  RuntimeFields,
  InstanceFields,
  LogFields,
  ArchiveWithRetryParams,
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
      // UPDATE：仅同步代码声明的只读属性，不覆盖 admin 可编辑字段
      // （enableLog/maxRetry/backoffStrategy/catchUpOnRestart 仅在 INSERT 时设默认值）
      await this.taskRepo.update(existing.id, {
        taskName: task.taskName ?? existing.taskName,
        taskType: task.taskType ?? existing.taskType,
        cronExpression: task.cronExpression ?? existing.cronExpression,
        intervalSeconds: task.intervalSeconds ?? existing.intervalSeconds,
        timeoutSeconds: task.timeoutSeconds ?? existing.timeoutSeconds,
        description: task.description ?? existing.description,
      })
    } else {
      // INSERT：设置所有默认值
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
        maxRetry: task.maxRetry ?? 3,
        backoffStrategy: task.backoffStrategy ?? null,
        enableLog: task.enableLog ?? true,
      })
    }
  }

  async getTaskDefinition(taskCode: string): Promise<ScheduledTaskDefinition | null> {
    return this.taskRepo.findOne({ where: { taskCode } })
  }

  async listTaskDefinitions(filters?: { taskName?: string; taskType?: number }): Promise<ScheduledTaskDefinition[]> {
    const qb = this.taskRepo.createQueryBuilder('task')
    if (filters?.taskName) {
      qb.andWhere('task.taskName LIKE :name', { name: `%${filters.taskName}%` })
    }
    if (filters?.taskType !== undefined && filters?.taskType !== null) {
      qb.andWhere('task.taskType = :type', { type: filters.taskType })
    }
    qb.orderBy('task.createdAt', 'ASC')
    return qb.getMany()
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
      executor: instance.executor ?? null,
      triggerType: instance.triggerType ?? TaskTriggerTypeDict.AUTO,
    })
    return this.instanceRepo.save(entity)
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
      { status: TaskInstanceStatusDict.RUNNING, executor },
    )
    // 2. SELECT 确认本实例认领成功的
    return this.instanceRepo.find({
      where: { id: In(ids), executor, status: TaskInstanceStatusDict.RUNNING },
    })
  }

  async archiveWithRetry(params: ArchiveWithRetryParams): Promise<void> {
    const { successIds, timeoutIds, skippedIds, retryUpdates, giveUpIds } = params

    // 收集所有需要更新 status 的实例及其目标状态
    const statusEntries: Array<{ id: string; status: number }> = []
    for (const id of successIds) statusEntries.push({ id, status: TaskInstanceStatusDict.SUCCESS })
    for (const id of timeoutIds) statusEntries.push({ id, status: TaskInstanceStatusDict.TIMEOUT })
    for (const id of skippedIds) statusEntries.push({ id, status: TaskInstanceStatusDict.FAILED })
    for (const id of giveUpIds) statusEntries.push({ id, status: TaskInstanceStatusDict.FAILED })
    for (const r of retryUpdates) statusEntries.push({ id: r.instanceId, status: TaskInstanceStatusDict.PENDING })

    if (statusEntries.length === 0) return

    // 构建单条 CASE-WHEN UPDATE
    const qp: Record<string, any> = {}
    const statusCases = statusEntries.map((e, i) => {
      qp[`sid_${i}`] = e.id
      qp[`st_${i}`] = e.status
      return `WHEN :sid_${i} THEN :st_${i}`
    })

    // retryCount 仅对重试实例更新
    const retryCountCases = retryUpdates.map((r, i) => {
      qp[`rid_${i}`] = r.instanceId
      qp[`rc_${i}`] = r.retryCount
      return `WHEN :rid_${i} THEN :rc_${i}`
    })

    // executeAt 仅对重试实例更新
    const executeAtCases = retryUpdates.map((r, i) => {
      qp[`eid_${i}`] = r.instanceId
      qp[`at_${i}`] = r.executeAt
      return `WHEN :eid_${i} THEN :at_${i}`
    })

    const allIds = statusEntries.map((e) => e.id)

    await this.instanceRepo
      .createQueryBuilder()
      .update(ScheduledTaskInstance)
      .set({
        status: () => `CASE id ${statusCases.join(' ')} ELSE status END`,
        retryCount: () =>
          retryCountCases.length > 0
            ? `CASE id ${retryCountCases.join(' ')} ELSE retryCount END`
            : 'retryCount',
        executeAt: () =>
          executeAtCases.length > 0
            ? `CASE id ${executeAtCases.join(' ')} ELSE executeAt END`
            : 'executeAt',
      })
      .where('id IN (:...ids)', { ids: allIds })
      .setParameters(qp)
      .execute()
  }

  async cancelInstance(id: string): Promise<boolean> {
    const result = await this.instanceRepo.update(
      { id, status: TaskInstanceStatusDict.PENDING },
      { status: TaskInstanceStatusDict.CANCELLED },
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

  async getLog(id: string): Promise<any> {
    const log = await this.logRepo.findOne({ where: { id } })
    if (!log) return null
    // 关联查询实例的调用参数
    let instanceData: any = null
    if (log.instanceId) {
      const inst = await this.instanceRepo.findOne({ where: { id: log.instanceId } })
      if (inst) {
        instanceData = {
          entityId: inst.entityId,
          payload: inst.payload,
          retryCount: inst.retryCount,
        }
      }
    }
    return { ...log, instanceData }
  }

  // ── 孤儿清理 ──

  async cleanupOrphanRecords(timeoutSeconds: number): Promise<number> {
    const threshold = new Date(Date.now() - timeoutSeconds * 1000)
    const result = await this.instanceRepo.update(
      { status: TaskInstanceStatusDict.RUNNING, updateAt: LessThan(threshold) },
      { status: TaskInstanceStatusDict.TIMEOUT_ORPHAN },
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
        return `SELECT ${select} FROM ext_scheduler_task_instance inst LEFT JOIN ext_scheduler_task t ON inst.taskCode = t.taskCode ${whereClause} ${orderBy} ${limit}`
      })
      .select('inst.*, t.taskName, t.taskType')
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
    if (filters.instanceId) whereBuilder.eq('log.instanceId', filters.instanceId)
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
