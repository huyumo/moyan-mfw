<!--
/**
 * @fileoverview 报表中心页面。
 */
-->
<template>
  <section class="report-hub-page">
    <header class="report-hub-page__header">
      <h2>报表中心</h2>
      <p>提供周指标与导出任务概览，支持业务复盘与数据分发。</p>
    </header>

    <main v-loading="loading" class="report-hub-page__grid">
      <ReportWeeklyMetricsCard :items="metricItems" />
      <ReportExportJobsCard :rows="exportJobs" />
    </main>
  </section>
</template>

<script setup lang="ts">
import { ReportExportJobsCard, ReportWeeklyMetricsCard } from './components';
import { useReportHub } from './composables';

const { loading, metricItems, exportJobs } = useReportHub();
</script>

<style scoped lang="scss">
.report-hub-page {
  display: grid;
  gap: var(--mfw-spacing-md, 16px);

  &__header {
    h2 {
      margin: 0;
      font-size: var(--mfw-font-size-xl, 20px);
    }

    p {
      margin: var(--mfw-spacing-sm, 8px) 0 0;
      color: var(--mfw-muted-text-color, #5e6a7d);
    }
  }

  &__grid {
    display: grid;
    gap: var(--mfw-spacing-md, 16px);
  }
}
</style>
