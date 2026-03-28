<!--
/**
 * @fileoverview 订单中心页面。
 */
-->
<template>
  <section class="order-center-page">
    <header class="order-center-page__header">
      <h2>订单中心</h2>
      <p>聚合订单概览与最新动态，帮助运营快速掌握履约状态与风险预警。</p>
    </header>

    <main v-loading="loading" class="order-center-page__grid">
      <OrderSummaryCard :metrics="summaryMetrics" />
      <OrderActivityTimeline :items="activityItems" />
    </main>
  </section>
</template>

<script setup lang="ts">
import { OrderActivityTimeline, OrderSummaryCard } from './components';
import { useOrderCenter } from './composables';

const { loading, summaryMetrics, activityItems } = useOrderCenter();
</script>

<style scoped lang="scss">
.order-center-page {
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: var(--mfw-breakpoint-md, 960px)) {
  .order-center-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
