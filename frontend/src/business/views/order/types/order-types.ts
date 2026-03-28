/**
 * @fileoverview 订单中心类型定义。
 */

/**
 * 订单汇总指标项。
 */
export interface OrderSummaryMetric {
  /**
   * 指标标签。
   */
  label: string;
  /**
   * 指标值。
   */
  value: string;
}

/**
 * 订单活动时间线项。
 */
export interface OrderActivityItem {
  /**
   * 时间戳文本。
   */
  timestamp: string;
  /**
   * 活动内容。
   */
  content: string;
}
