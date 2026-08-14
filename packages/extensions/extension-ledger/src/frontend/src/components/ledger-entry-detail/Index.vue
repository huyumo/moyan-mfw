<!--
/**
 * @fileoverview 分录流水详情抽屉组件（MfwPopup drawer 内使用）
 * @description 自写 detail-section + info-grid 风格（对齐 LedgerTransferDetail）
 *   展示：分录单号/交易单号/账户/方向/符号金额（按币种）/变更前后/时间/扩展 JSON
 */
-->
<template>
  <div class="detail-wrap">
    <section class="detail-section">
      <h4 class="section-title">分录信息</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">分录单号</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.entryNo)">{{ detail.entryNo }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">交易单号</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.transferNo)">{{ detail.transferNo }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">账户ID</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.accountId)">{{ detail.accountId }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">方向</span>
          <span class="info-value">
            <el-tag :type="directionTagType[detail.direction] as any" size="small">{{ directionLabel[detail.direction] || '-' }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">币种</span>
          <span class="info-value">{{ detail.currency || 'CNY' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">符号金额</span>
          <span class="info-value">{{ formatAmount(detail.signedAmount, detail.currency || 'CNY') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">变更前余额</span>
          <span class="info-value">{{ formatAmount(detail.balanceBefore, detail.currency || 'CNY') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">变更后余额</span>
          <span class="info-value">{{ formatAmount(detail.balanceAfter, detail.currency || 'CNY') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">入账时间</span>
          <span class="info-value">
            <MfwDateFormat :value="detail.createdAt" />
          </span>
        </div>
      </div>
    </section>

    <section v-if="detail.extra && Object.keys(detail.extra).length" class="detail-section">
      <h4 class="section-title">扩展附录</h4>
      <pre class="json-block">{{ JSON.stringify(detail.extra, null, 2) }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { MfwDateFormat } from 'moyan-mfw-base/frontend'
import { formatAmount, copyToClipboard, directionLabel, directionTagType } from '../../views/ledger/shared'

defineOptions({ name: 'MfwLedgerEntryDetail' })

/** MfwPopup 传入属性：整行分录数据 */
const props = defineProps<{ detail: Record<string, any> }>()

void props
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
