/**
 * API 调用类
 * @description 手动编写的 API 调用类，后端运行后可通过 pnpm build:api 从 Swagger 自动重新生成
 */
import { ApiCall } from 'moyan-api'
import type { MoMethod } from 'moyan-api'

/** 任务定义查询响应 */
export interface ScheduledTaskItem {
  id: string
  taskCode: string
  taskName: string
  taskType: number
  cronExpression: string | null
  intervalSeconds: number
  enabled: boolean
  timeoutSeconds: number
  description: string | null
  catchUpOnRestart: boolean
  maxRetry: number
  backoffStrategy: string | null
  enableLog: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  lastRunStatus: number | null
  lastErrorMessage: string | null
}

/** 任务实例查询响应 */
export interface ScheduledTaskInstanceItem {
  id: string
  taskCode: string
  taskName: string | null
  entityId: string | null
  payload: Record<string, any> | null
  executeAt: string
  status: number
  startedAt: string | null
  finishedAt: string | null
  retryCount: number
  errorMessage: string | null
  executor: string | null
}

/** 任务日志查询响应 */
export interface ScheduledTaskLogItem {
  id: string
  taskCode: string
  taskName: string
  instanceId: string | null
  status: number
  triggerType: number
  startedAt: string
  finishedAt: string | null
  durationMs: number
  executor: string | null
  errorMessage: string | null
  errorStack: string | null
  result: Record<string, any> | null
}

/** 分页响应 */
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 更新任务定义参数 */
export interface UpdateTaskParams {
  taskName?: string
  cronExpression?: string
  intervalSeconds?: number
  enabled?: boolean
  timeoutSeconds?: number
  description?: string
  catchUpOnRestart?: boolean
  maxRetry?: number
  backoffStrategy?: { type: string; delays?: number[]; base?: number; max?: number; multiplier?: number; interval?: number; increment?: number }
  enableLog?: boolean
}

/** 查询任务定义列表 */
export class ApiSchedulerListTasks extends ApiCall<
  { query?: { taskName?: string; taskType?: number } },
  ScheduledTaskItem[]
> {
  readonly path = '/api/ext/scheduler/tasks'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 查询任务定义详情 */
export class ApiSchedulerGetTask extends ApiCall<
  { params: { taskCode: string } },
  ScheduledTaskItem
> {
  readonly path = '/api/ext/scheduler/tasks/{taskCode}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 更新任务定义 */
export class ApiSchedulerUpdateTask extends ApiCall<
  { params: { taskCode: string }; body: UpdateTaskParams },
  void
> {
  readonly path = '/api/ext/scheduler/tasks/{taskCode}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/** 手动触发任务 */
export class ApiSchedulerTriggerTask extends ApiCall<
  { params: { taskCode: string }; body?: { entityId?: string; payload?: Record<string, any> } },
  ScheduledTaskInstanceItem
> {
  readonly path = '/api/ext/scheduler/tasks/{taskCode}/trigger'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/** 查询延迟实例列表 */
export class ApiSchedulerListInstances extends ApiCall<
  {
    query: {
      page: number
      pageSize: number
      taskCode?: string
      status?: number
      entityId?: string
      startTime?: string
      endTime?: string
    }
  },
  PageResponse<ScheduledTaskInstanceItem>
> {
  readonly path = '/api/ext/scheduler/instances'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 取消延迟实例 */
export class ApiSchedulerCancelInstance extends ApiCall<
  { params: { id: string } },
  boolean
> {
  readonly path = '/api/ext/scheduler/instances/{id}/cancel'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/** 查询执行日志列表 */
export class ApiSchedulerListLogs extends ApiCall<
  {
    query: {
      page: number
      pageSize: number
      taskCode?: string
      status?: number
      triggerType?: number
      startTime?: string
      endTime?: string
    }
  },
  PageResponse<ScheduledTaskLogItem>
> {
  readonly path = '/api/ext/scheduler/logs'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 查询日志详情 */
export class ApiSchedulerGetLog extends ApiCall<
  { params: { id: string } },
  ScheduledTaskLogItem
> {
  readonly path = '/api/ext/scheduler/logs/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}
