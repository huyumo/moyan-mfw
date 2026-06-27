<!--
/**
 * @fileoverview 审计日志详情组件
 * @description 显示单条审计日志的详细信息
 */
-->
<template>
  <el-descriptions :column="1" border :label-width="120">
    <el-descriptions-item label="日志ID">{{ id }}</el-descriptions-item>
    <el-descriptions-item label="模块">{{ module }}</el-descriptions-item>
    <el-descriptions-item label="事件">{{ event }}</el-descriptions-item>
    <el-descriptions-item label="操作人ID">{{ operatorId }}</el-descriptions-item>
    <el-descriptions-item label="操作人名称">{{ operatorName }}</el-descriptions-item>
    <el-descriptions-item label="目标ID">{{ targetId }}</el-descriptions-item>
    <el-descriptions-item label="目标类型">{{ targetType }}</el-descriptions-item>
    <el-descriptions-item label="描述">{{ description }}</el-descriptions-item>
    <el-descriptions-item label="IP地址">{{ ip }}</el-descriptions-item>
    <el-descriptions-item label="User-Agent">{{ userAgent || '-' }}</el-descriptions-item>
    <el-descriptions-item label="操作时间"><mfw-date-format :value="createAt" /></el-descriptions-item>
  </el-descriptions>

  <el-divider content-position="left">快照数据</el-divider>

  <div v-if="snapshot" class="snapshot-container">
    <pre class="snapshot-content">{{ JSON.stringify(snapshot, null, 2) }}</pre>
  </div>
  <el-empty v-else description="无快照数据" :image-size="80" />
</template>

<script setup lang="ts">
import type { AuditLogResponseDto } from '../../../apis/sys/schemas';

/** Props */
defineProps<AuditLogResponseDto>();
defineOptions({ name: 'AuditLogDetail' });
</script>

<style scoped lang="scss">
.snapshot-container {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
  overflow: auto;
}

.snapshot-content {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>