<!--
/**
 * @fileoverview 订单汇总卡片。
 */
-->
<template>
  <el-card>
    <template #header>每日汇总</template>
    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in metrics" :key="item.label" :label="item.label">
        {{ item.value }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import type { OrderSummaryMetric } from '../types';

defineProps<{
  /** 指标集合 */
  metrics: OrderSummaryMetric[];
}>();
</script>
