/**
 * @fileoverview 运行时通知 SPI 接口
 * @description 定义运行时新增任务的即时通知契约
 */

/**
 * 运行时通知 SPI
 * @description 默认实现为 PollingNotify（无操作，靠引擎周期重载窗口发现新任务）
 * 可替换为 RedisPubSubNotify（即时通知 → 触发引擎即时重载，消除60s延迟）
 */
export interface IRuntimeNotify {
  /**
   * 通知有新任务被调度
   * @param taskCode 任务编码
   * @param executeAt 应执行时间
   */
  notifyTaskScheduled(taskCode: string, executeAt: Date): Promise<void>

  /**
   * 注册调度通知回调
   * @param callback 回调函数
   */
  onScheduled(callback: (taskCode: string, executeAt: Date) => void): void
}
