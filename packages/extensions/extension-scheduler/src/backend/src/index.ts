/**
 * @fileoverview 定时任务扩展包后端入口
 * @description 导出 SchedulerModule、服务、实体、接口、权限值
 */

export { SchedulerModule, SchedulerModule as default } from './scheduler.module'
export { ScheduledTaskService, TaskRegistry, SchedulerEngineService } from './services'
export type { ScheduledTaskHandler, TaskExecutionContext, TaskExecutionResult, BackoffStrategy } from './interfaces/task-handler.interface'
export { ScheduledTaskDefinition, ScheduledTaskInstance, ScheduledTaskLog } from './entities'
export {
  UpdateTaskDto,
  TriggerTaskDto,
  CreateDelayInstanceDto,
  InstanceQueryDto,
  LogQueryDto,
  ScheduledTaskResponseDto,
  ScheduledTaskInstanceResponseDto,
  ScheduledTaskLogResponseDto,
} from './dto'
// SPI 接口与默认实现（供自定义适配器参考）
export type { ITaskStorage, IDistributedLock, ITaskDispatcher, IRuntimeNotify, SchedulerModuleOptions } from './spi/interfaces'
export { TypeOrmStorage, DbLock, EventEmitterDispatcher, PollingNotify } from './spi/impl'
export { SCHEDULER_TASK_STORAGE, SCHEDULER_DISTRIBUTED_LOCK, SCHEDULER_TASK_DISPATCHER, SCHEDULER_RUNTIME_NOTIFY } from './spi/interfaces'
// 权限值（从 shared 层再导出）
export { SCHEDULER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-scheduler/shared'
