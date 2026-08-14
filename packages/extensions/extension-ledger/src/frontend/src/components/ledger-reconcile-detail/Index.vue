<!--
/**
 * @fileoverview 对账报告详情抽屉组件（MfwPopup drawer 内使用）
 * @description 自写 detail-section + info-grid 风格（对齐 LedgerTransferDetail）
 *   展示：报告ID/触发方式/时间/检查账户数/差异数/状态 + 差异明细表格（账户ID + 差额 + 各项余额）
 */
-->
<template>
  <div class="detail-wrap">
    <section class="detail-section">
      <h4 class="section-title">报告信息</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">报告ID</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.id)">{{ detail.id }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">触发方式</span>
          <span class="info-value">{{ detail.triggerType === 1 ? '手动' : '外部调度' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">检查账户</span>
          <span class="info-value">{{ detail.totalAccounts }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">差异账户</span>
          <span class="info-value">
            <el-tag :type="(detail.diffCount ?? 0) > 0 ? 'danger' : 'success'" size="small">{{ detail.diffCount ?? 0 }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">状态</span>
          <span class="info-value">
            <el-tag :type="detail.status === 1 ? 'warning' : 'success'" size="small">{{ detail.status === 1 ? '差异待处理' : '已处理' }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">触发时间</span>
          <span class="info-value">
            <MfwDateFormat :value="detail.createdAt" />
          </span>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <h4 class="section-title">差异明细（{{ diffs.length }} 条）</h4>
      <el-table v-if="diffs.length > 0" :data="diffs" size="small" border>
        <el-table-column prop="accountId" label="账户ID" min-width="220">
          <template #default="{ row }">
            <span class="mono copyable" title="点击复制" @click="copyToClipboard(row.accountId)">{{ row.accountId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="差额" width="160" align="right">
          <template #default="{ row }">
            <span :class="BigInt(row.diff) > 0n ? 'diff-pos' : 'diff-neg'">{{ formatAmount(row.diff) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="账面余额" width="130" align="right">
          <template #default="{ row }">{{ formatAmount(row.balance) }}</template>
        </el-table-column>
        <el-table-column prop="entrySum" label="分录合计" width="130" align="right">
          <template #default="{ row }">{{ formatAmount(row.entrySum) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="无差异" :image-size="60" />
    </section>

    <section v-if="detail.notes" class="detail-section">
      <h4 class="section-title">备注</h4>
      <pre class="json-block">{{ detail.notes }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MfwDateFormat } from 'moyan-mfw-base/frontend'
import { formatAmount, copyToClipboard } from '../../views/ledger/shared'

defineOptions({ name: 'MfwLedgerReconcileDetail' })

/** MfwPopup 传入属性：整行对账报告数据 */
const props = defineProps<{ detail: Record<string, any> }>()

/** 差异明细（兼容 diffs JSON 字符串或数组） */
const diffs = computed<any[]>(() => {
  const raw = props.detail.diffs
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})
</script>

<style scoped>
.detail-wrap {
  padding: 8px 16px 24px;
}
.detail-section {
  margin-bottom: 20px;
}
.section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
}
.info-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;

  &.full {
    grid-column: 1 / -1;
  }
}
.info-label {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  min-width: 70px;
}
.info-value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.info-value:not(.mono) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.mono {
  font-family: var(--el-font-family-mono);
}
.copyable {
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
  }
}
.diff-pos {
  color: var(--el-color-success);
  font-weight: 600;
}
.diff-neg {
  color: var(--el-color-danger);
  font-weight: 600;
}
.json-block {
  margin: 0;
  padding: 10px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  max-height: 240px;
  overflow: auto;
  font-family: var(--el-font-family-mono);
}
</style>
