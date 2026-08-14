<!--
/**
 * @fileoverview 账户详情抽屉组件（MfwPopup drawer 内使用）
 * @description 自写 detail-section + info-grid 风格（对齐 LedgerTransferDetail）
 *   展示：账户ID/持有者/标签/币种/四类余额（按币种）/实体扩展列 creditLimit/扩展 JSON/创建时间
 */
-->
<template>
  <div class="detail-wrap">
    <section class="detail-section">
      <h4 class="section-title">账户信息</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">账户ID</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.id)">{{ detail.id }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">持有者ID</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.holderId)">{{ detail.holderId }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">持有者类型</span>
          <span class="info-value">{{ detail.holderType || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">标签</span>
          <span class="info-value">{{ detail.tag || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">币种</span>
          <span class="info-value">{{ detail.currency || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">信用额度</span>
          <span class="info-value">{{ formatAmount(detail.creditLimit, detail.currency) }}</span>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <h4 class="section-title">余额（最小单位）</h4>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">可用余额</span>
          <span class="info-value">{{ formatAmount(detail.balance, detail.currency) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">审核冻结</span>
          <span class="info-value">{{ formatAmount(detail.frozen, detail.currency) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">在途预占</span>
          <span class="info-value">{{ formatAmount(detail.pendingOut, detail.currency) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">累计转入</span>
          <span class="info-value">{{ formatAmount(detail.totalIncome, detail.currency) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">累计转出</span>
          <span class="info-value">{{ formatAmount(detail.totalOutcome, detail.currency) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">创建时间</span>
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
import { formatAmount, copyToClipboard } from '../../views/ledger/shared'

defineOptions({ name: 'MfwLedgerAccountDetail' })

/** MfwPopup 传入属性：整行账户数据 */
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
