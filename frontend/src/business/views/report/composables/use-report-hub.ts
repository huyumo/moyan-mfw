/**
 * @fileoverview 报表中心页面组合式逻辑。
 */

import { onMounted, ref } from 'vue';
import { fetchReportExportJobs, fetchReportMetricItems } from '../api';
import type { ReportExportJob, ReportMetricItem } from '../types';

/**
 * 报表中心组合式逻辑。
 */
export function useReportHub() {
  const loading = ref(false);
  const metricItems = ref<ReportMetricItem[]>([]);
  const exportJobs = ref<ReportExportJob[]>([]);

  async function loadReportHubData() {
    loading.value = true;
    try {
      const [metrics, jobs] = await Promise.all([fetchReportMetricItems(), fetchReportExportJobs()]);
      metricItems.value = metrics;
      exportJobs.value = jobs;
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadReportHubData();
  });

  return {
    loading,
    metricItems,
    exportJobs,
    loadReportHubData,
  };
}
