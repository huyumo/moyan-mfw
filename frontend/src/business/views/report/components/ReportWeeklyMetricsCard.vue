<!--
/**
 * @fileoverview 周指标卡片。
 */
-->
<template>
  <el-card>
    <template #header>周指标</template>
    <el-progress
      v-for="item in items"
      :key="`${item.percentage}-${item.status ?? ''}-${item.color ?? ''}`"
      :percentage="item.percentage"
      :status="item.status"
      :color="item.color"
    />
  </el-card>
</template>

<script setup lang="ts">
import type { ReportMetricItem } from '../types';

defineProps<{
  /** 指标数据 */
  items: ReportMetricItem[];
}>();
</script>
