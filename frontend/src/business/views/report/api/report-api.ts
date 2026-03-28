/**
 * @fileoverview 报表中心数据访问层。
 */

import type { ReportExportJob, ReportMetricItem } from '../types';

/**
 * 查询周指标数据。
 */
export async function fetchReportMetricItems(): Promise<ReportMetricItem[]> {
  return [
    { percentage: 82, status: 'success' },
    { percentage: 64 },
    { percentage: 48, color: 'var(--mfw-warning-color, #e6a23c)' },
  ];
}

/**
 * 查询导出任务列表。
 */
export async function fetchReportExportJobs(): Promise<ReportExportJob[]> {
  return [
    { name: '月度结算报表', owner: 'Lin', status: 'Done' },
    { name: '门店对比报表', owner: 'Shen', status: 'Running' },
    { name: '区域趋势报表', owner: 'Qiao', status: 'Queued' },
  ];
}
