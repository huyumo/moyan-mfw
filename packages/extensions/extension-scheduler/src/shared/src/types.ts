/**
 * @fileoverview 定时任务扩展包共享类型定义
 */

/** 任务延迟实例的业务数据负载 */
export interface TaskPayload {
  [key: string]: any;
}

/** 延迟任务创建参数 */
export interface CreateDelayInstanceOptions {
  /** 任务编码 */
  taskCode: string;
  /** 应执行时间 */
  executeAt: Date;
  /** 业务实体ID（如订单号） */
  entityId?: string;
  /** 业务数据（派发时携带） */
  payload?: TaskPayload;
}
