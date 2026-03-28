/**
 * @fileoverview 订单中心页面组合式逻辑。
 */

import { onMounted, ref } from 'vue';
import { fetchOrderActivityItems, fetchOrderSummaryMetrics } from '../api';
import type { OrderActivityItem, OrderSummaryMetric } from '../types';

/**
 * 订单中心组合式逻辑。
 */
export function useOrderCenter() {
  const loading = ref(false);
  const summaryMetrics = ref<OrderSummaryMetric[]>([]);
  const activityItems = ref<OrderActivityItem[]>([]);

  async function loadOrderCenterData() {
    loading.value = true;
    try {
      const [summary, activity] = await Promise.all([fetchOrderSummaryMetrics(), fetchOrderActivityItems()]);
      summaryMetrics.value = summary;
      activityItems.value = activity;
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadOrderCenterData();
  });

  return {
    loading,
    summaryMetrics,
    activityItems,
    loadOrderCenterData,
  };
}
