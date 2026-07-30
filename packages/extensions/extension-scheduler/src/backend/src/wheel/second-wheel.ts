/**
 * @fileoverview 秒轮（D 秒轮）
 * @description 每秒步进，匹配到期刻度 → 取出任务（纯内存，零 DB）
 */

import type { ScheduledTaskInstance } from '../entities'

export class SecondWheel {
  private slots: ScheduledTaskInstance[][] = Array.from({ length: 60 }, () => [])
  private currentSecond = 0
  private total = 0

  /**
   * 添加任务到对应秒格
   * @param task 任务实例
   * @param second 目标秒值
   */
  add(task: ScheduledTaskInstance, second: number): void {
    const idx = second % 60
    this.slots[idx].push(task)
    this.total++
  }

  /**
   * 每秒步进，弹出当前秒到期任务
   * @description 仅弹出当前刻度的任务，步进指针
   */
  tick(out: ScheduledTaskInstance[]): void {
    const idx = this.currentSecond % 60
    if (this.slots[idx].length > 0) {
      out.push(...this.slots[idx])
      this.total -= this.slots[idx].length
      this.slots[idx] = []
    }
    this.currentSecond = (this.currentSecond + 1) % 60
  }

  /**
   * 当前轮中任务总数
   */
  size(): number {
    return this.total
  }

  /**
   * 清空所有任务
   */
  clear(): void {
    for (let i = 0; i < 60; i++) this.slots[i] = []
    this.total = 0
    this.currentSecond = 0
  }
}
