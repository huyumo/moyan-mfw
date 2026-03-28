/**
 * @fileoverview 报表中心类型定义。
 */

/**
 * 周指标数据项。
 */
export interface ReportMetricItem {
  /**
   * 百分比数值。
   */
  percentage: number;
  /**
   * 进度条状态。
   */
  status?: '' | 'success' | 'warning' | 'exception';
  /**
   * 自定义进度条颜色。
   */
  color?: string;
}

/**
 * 导出任务行数据。
 */
export interface ReportExportJob {
  /**
   * 任务名称。
   */
  name: string;
  /**
   * 负责人。
   */
  owner: string;
  /**
   * 任务状态。
   */
  status: string;
}
