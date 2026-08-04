/**
 * @fileoverview 定时任务管理扩展包字典定义
 * @description 使用 moyan-mfw-base/shared 装饰器定义扩展包专属字典，供前后端共用
 */
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

/** 任务类型 */
@DictMeta({ key: 'scheduler_task_type', label: '任务类型', module: '定时任务' })
export class TaskTypeDict {
  @DictEntry({ label: 'Cron定时', type: 'info' })    static CRON = 1
  @DictEntry({ label: '延迟任务', type: 'warning' })  static DELAY = 2
}

/** 任务实例状态 */
@DictMeta({ key: 'scheduler_task_instance_status', label: '任务实例状态', module: '定时任务' })
export class TaskInstanceStatusDict {
  @DictEntry({ label: '待执行', type: 'warning' }) static PENDING = 1
  @DictEntry({ label: '执行中', type: 'info' })    static RUNNING = 2
  @DictEntry({ label: '已成功', type: 'success' }) static SUCCESS = 3
  @DictEntry({ label: '已失败', type: 'danger' })  static FAILED = 4
  @DictEntry({ label: '已取消', type: 'info' })    static CANCELLED = 5
  @DictEntry({ label: '已超时', type: 'danger' })  static TIMEOUT = 6
  /** 崩溃未归档，结果未知 */
  @DictEntry({ label: '未归档', type: 'danger' })  static TIMEOUT_ORPHAN = 7
}

/** 执行状态 */
@DictMeta({ key: 'scheduler_task_run_status', label: '执行状态', module: '定时任务' })
export class TaskRunStatusDict {
  @DictEntry({ label: '执行中', type: 'info' })    static RUNNING = 1
  @DictEntry({ label: '成功', type: 'success' })   static SUCCESS = 2
  @DictEntry({ label: '失败', type: 'danger' })    static FAILED = 3
  @DictEntry({ label: '超时', type: 'danger' })    static TIMEOUT = 4
  @DictEntry({ label: '跳过', type: 'info' })      static SKIPPED = 5
}

/** 触发方式 */
@DictMeta({ key: 'scheduler_task_trigger_type', label: '触发方式', module: '定时任务' })
export class TaskTriggerTypeDict {
  @DictEntry({ label: '自动' }) static AUTO = 1
  @DictEntry({ label: '手动' }) static MANUAL = 2
}

/** 崩溃恢复策略 */
@DictMeta({ key: 'scheduler_crash_recovery', label: '崩溃恢复策略', module: '定时任务' })
export class CrashRecoveryStrategyDict {
  /** 重置为待执行重新执行（要求任务幂等，防重复副作用） */
  @DictEntry({ label: '重新入队', type: 'warning' }) static REQUEUE = 1
  @DictEntry({ label: '标记失败', type: 'danger' }) static MARK_FAILED = 2
  /** 标记为未归档（结果未知，不重试） */
  @DictEntry({ label: '标记未归档', type: 'info' }) static MARK_TIMEOUT_ORPHAN = 3
}
