/**
 * @fileoverview 定时任务扩展包路由路径常量
 */

export const SCHEDULER_PATHS = {
  /** 管理后台根路径 */
  ROOT: '/ext/scheduler',
  /** 任务定义 API */
  TASKS: '/api/ext/scheduler/tasks',
  /** 延迟实例 API */
  INSTANCES: '/api/ext/scheduler/instances',
  /** 执行日志 API */
  LOGS: '/api/ext/scheduler/logs',
} as const;
