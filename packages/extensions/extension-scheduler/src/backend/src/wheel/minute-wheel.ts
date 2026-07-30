/**
 * @fileoverview 分钟轮（C 分钟轮）
 * @description 按分钟分格缓存待执行任务（纯内存）
 * 预加载阶段 B 认领成功的任务入此轮，由引擎每秒检查弹出到期任务
 */

import type { ScheduledTaskInstance } from '../entities'

export class MinuteWheel {
  private slots: ScheduledTaskInstance[][] = Array.from({ length: 60 }, () => [])
  private total = 0

  /**
   * 添加任务到分钟轮
   * @description 按 executeAt 的秒值分桶，便于精确到期弹出
   */
  addToSlot(task: ScheduledTaskInstance): void {
    const slotIndex = this.computeSlotIndex(task.executeAt)
    this.slots[slotIndex].push(task)
    this.total++
  }

  /**
   * 取出所有已到期（executeAt <= now）的任务
   * @description 遍历所有槽位，弹出 executeAt <= now 的任务
   */
  tickDue(now: Date, out: ScheduledTaskInstance[]): void {
    for (let i = 0; i < 60; i++) {
      const slot = this.slots[i]
      if (slot.length === 0) continue
      const remaining: ScheduledTaskInstance[] = []
      for (const task of slot) {
        if (task.executeAt.getTime() <= now.getTime()) {
          out.push(task)
        } else {
          remaining.push(task)
        }
      }
      this.slots[i] = remaining
    }
    this.total = this.slots.reduce((sum, s) => sum + s.length, 0)
  }

  /**
   * 移除指定ID的任务
   */
  removeById(id: string): void {
    for (let i = 0; i < 60; i++) {
      const slot = this.slots[i]
      const idx = slot.findIndex((t) => t.id === id)
      if (idx >= 0) {
        slot.splice(idx, 1)
        this.total--
        return
      }
    }
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
  }

  /**
   * 计算槽位索引
   * @description 使用 executeAt 的秒值对60取模
   */
  private computeSlotIndex(executeAt: Date): number {
    return executeAt.getSeconds() % 60
  }
}
