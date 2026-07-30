/**
 * @fileoverview 归档轮（J 归档轮）
 * @description 每60s触发一次归档回调（K 批量归档）
 */

export class ArchiveWheel {
  private timer: NodeJS.Timeout | null = null

  /**
   * 启动归档轮
   * @param callback 归档回调
   * @param intervalMs 触发间隔（毫秒），默认60000
   */
  start(callback: () => Promise<void>, intervalMs = 60_000): void {
    if (this.timer) return
    this.timer = setInterval(callback, intervalMs)
  }

  /**
   * 停止归档轮
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
