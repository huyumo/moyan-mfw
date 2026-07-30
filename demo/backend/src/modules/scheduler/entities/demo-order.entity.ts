/**
 * @fileoverview 演示订单实体
 * @description 用于演示"未支付订单5分钟自动取消"延迟任务场景
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { toDescription } from 'moyan-mfw-base/shared'

/** 订单状态字典 */
export const OrderStatusDict = {
  PENDING: 1,   // 待支付
  PAID: 2,      // 已支付
  CANCELLED: 3,  // 已取消（超时自动取消）
  CLOSED: 4,     // 已关闭
} as const

export const OrderStatusLabel: Record<number, string> = {
  [OrderStatusDict.PENDING]: '待支付',
  [OrderStatusDict.PAID]: '已支付',
  [OrderStatusDict.CANCELLED]: '已取消',
  [OrderStatusDict.CLOSED]: '已关闭',
}

@Entity('demo_order')
@Index('idx_order_status', ['status'])
@Index('idx_order_no', ['orderNo'], { unique: true })
export class DemoOrder extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  @Column({ type: 'varchar', length: 64, comment: '订单号' })
  orderNo: string

  @Column({ type: 'varchar', length: 128, comment: '商品名称' })
  productName: string

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '订单金额' })
  amount: number

  @Column({ type: 'tinyint', default: OrderStatusDict.PENDING, comment: '订单状态: 1=待支付 2=已支付 3=已取消 4=已关闭' })
  status: number

  @Column({ type: 'datetime', nullable: true, comment: '支付时间' })
  paidAt: Date | null

  @Column({ type: 'datetime', nullable: true, comment: '取消时间' })
  cancelledAt: Date | null

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '取消原因' })
  cancelReason: string | null
}
