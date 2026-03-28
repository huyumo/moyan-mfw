<!--
/**
 * @fileoverview 导出任务卡片。
 */
-->
<template>
  <el-card>
    <template #header>导出任务</template>
    <el-table :data="rows">
      <el-table-column prop="name" label="任务" />
      <el-table-column prop="owner" label="负责人" />
      <el-table-column prop="status" label="状态" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import type { ReportExportJob } from '../types';

defineProps<{
  /** 导出任务 */
  rows: ReportExportJob[];
}>();
</script>
