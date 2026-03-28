/**
 * @fileoverview 订单中心数据访问层。
 */

import type { OrderActivityItem, OrderSummaryMetric } from '../types';

/**
 * 查询订单汇总指标。
 */
export async function fetchOrderSummaryMetrics(): Promise<OrderSummaryMetric[]> {
  return [
    { label: '新订单', value: '146' },
    { label: '已支付', value: '129' },
    { label: '待发货', value: '38' },
  ];
}

/**
 * 查询订单活动时间线。
 */
export async function fetchOrderActivityItems(): Promise<OrderActivityItem[]> {
  return [
    { timestamp: '08:20', content: '订单 #A10231 支付完成' },
    { timestamp: '09:15', content: '仓库已分配批次 S-08' },
    { timestamp: '11:40', content: '订单 #A10255 已标记待审核' },
  ];
}
