<!--
/**
 * @fileoverview 璁㈠崟娲诲姩鏃堕棿绾垮崱鐗囥€? */
-->
<template>
  <el-card>
    <template #header>杩戞湡娲诲姩</template>
    <el-timeline>
      <el-timeline-item v-for="item in items" :key="`${item.timestamp}-${item.content}`" :timestamp="item.timestamp">
        {{ item.content }}
      </el-timeline-item>
    </el-timeline>
  </el-card>
</template>

<script setup lang="ts">
import type { OrderActivityItem } from '../types';

/** 缁勪欢灞炴€?*/
defineProps<{
  /** 娲诲姩椤?*/
  items: OrderActivityItem[];
}>();
</script>
