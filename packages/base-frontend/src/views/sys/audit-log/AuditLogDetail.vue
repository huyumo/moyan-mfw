<!--
/**
 * @fileoverview 审计日志详情组件
 * @description 显示单条审计日志的详细信息
 */
-->
<template>
  <el-descriptions :column="1" border>
    <el-descriptions-item label="日志ID">{{ data?.id }}</el-descriptions-item>
    <el-descriptions-item label="模块">{{ data?.module }}</el-descriptions-item>
    <el-descriptions-item label="事件">{{ data?.event }}</el-descriptions-item>
    <el-descriptions-item label="操作人ID">{{ data?.operatorId }}</el-descriptions-item>
    <el-descriptions-item label="操作人名称">{{ data?.operatorName }}</el-descriptions-item>
    <el-descriptions-item label="目标ID">{{ data?.targetId }}</el-descriptions-item>
    <el-descriptions-item label="目标类型">{{ data?.targetType }}</el-descriptions-item>
    <el-descriptions-item label="描述">{{ data?.description }}</el-descriptions-item>
    <el-descriptions-item label="IP地址">{{ data?.ip }}</el-descriptions-item>
    <el-descriptions-item label="User-Agent">{{ data?.userAgent || '-' }}</el-descriptions-item>
    <el-descriptions-item label="操作时间">{{ data?.createAt }}</el-descriptions-item>
  </el-descriptions>

  <el-divider content-position="left">快照数据</el-divider>

  <div v-if="data?.snapshot" class="snapshot-container">
    <pre class="snapshot-content">{{ JSON.stringify(data.snapshot, null, 2) }}</pre>
  </div>
  <el-empty v-else description="无快照数据" :image-size="80" />
</template>

<script setup lang="ts">
import type { AuditLogResponseDto } from '../../../apis/sys/schemas';

/** Props */
interface Props {
  data?: AuditLogResponseDto;
}

defineProps<Props>();
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