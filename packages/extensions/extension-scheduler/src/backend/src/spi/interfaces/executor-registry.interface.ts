/**
 * @fileoverview 执行器注册表 SPI 接口
 * @description 定义执行器心跳注册/查询契约，用于动态分片与孤儿判定
 *   默认实现 DbExecutorRegistry（DB 心跳表），可选 RedisExecutorRegistry（Redis TTL）
 */

/** 执行器信息 */
export interface ExecutorInfo {
  executorId: string
  hostname: string | null
  pid: number | null
  lastHeartbeat: Date
}

/**
 * 执行器注册表 SPI
 */
export interface IExecutorRegistry {
  /** 注册执行器（启动时调用，INSERT ON DUPLICATE KEY UPDATE） */
  register(executor: ExecutorInfo): Promise<void>
  /** 更新心跳（定时调用，每30s） */
  heartbeat(executorId: string): Promise<void>
  /** 获取存活执行器列表（按 executorId 排序，保证所有实例计算结果一致） */
  getAliveExecutors(timeoutSeconds: number): Promise<ExecutorInfo[]>
  /** 注销执行器（优雅停机时调用） */
  unregister(executorId: string): Promise<void>
}