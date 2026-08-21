<!--
/**
 * @fileoverview 冲正记录详情抽屉组件（MfwPopup drawer 内使用）
 * @description 展示冲正记录：冲正单号/原单号/业务类型/金额/原转出方（资金退回目的地）/
 *   收款方退回明细表/状态/制单人/时间；复用于「冲正记录」Tab 与「交易单详情」已冲正联动入口
 */
-->
<template>
  <div class="detail-wrap">
    <section class="detail-section">
      <h4 class="section-title">冲正信息</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">冲正单号</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.reversalNo)">{{ detail.reversalNo }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">原交易单号</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.originalTransferNo)">{{ detail.originalTransferNo }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">业务类型</span>
          <span class="info-value">{{ detail.bizType || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">状态</span>
          <span class="info-value">
            <el-tag :type="(reversalStatusTagType[detail.status] as any) ?? 'info'" size="small">{{ reversalStatusLabel[detail.status] ?? '-' }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">币种</span>
          <span class="info-value">{{ detail.currency || 'CNY' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">冲正金额</span>
          <span class="info-value">{{ formatAmount(detail.amount, detail.currency || 'CNY') }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">原转出方</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.fromAccountId)">{{ detail.fromAccountId }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">制单人</span>
          <span class="info-value">{{ detail.makerText || detail.makerId || '-' }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">冲正时间</span>
          <span class="info-value">
            <MfwDateFormat :value="detail.createdAt" />
          </span>
        </div>
        <div v-if="detail.description" class="info-row full">
          <span class="info-label">描述</span>
          <span class="info-value">{{ detail.description }}</span>
        </div>
      </div>
    </section>

    <!-- 收款方退回明细（全额冲正：原各收款方各自退回其金额至原转出方） -->
    <section v-if="detail.toAccounts && detail.toAccounts.length" class="detail-section">
      <h4 class="section-title">收款方退回明细</h4>
      <el-table :data="detail.toAccounts" size="small" border>
        <el-table-column prop="account" label="收款方账户ID" min-width="240">
          <template #default="{ row }">
            <span class="mono copyable" title="点击复制" @click="copyToClipboard(row.account)">{{ row.account }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退回金额" width="180" align="right">
          <template #default="{ row }">{{ formatAmount(row.amount, detail.currency || 'CNY') }}</template>
        </el-table-column>
      </el-table>
    </section>

    <section v-if="detail.extra && Object.keys(detail.extra).length" class="detail-section">
      <h4 class="section-title">扩展附录</h4>
      <pre class="json-block">{{ JSON.stringify(detail.extra, null, 2) }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { MfwDateFormat } from 'moyan-mfw-base/frontend'
import { formatAmount, copyToClipboard, reversalStatusLabel, reversalStatusTagType } from '../../views/ledger/shared'

defineOptions({ name: 'MfwLedgerReversalDetail' })

/** MfwPopup 传入属性：整行冲正记录数据 */
const props = defineProps<{ detail: Record<string, any> }>()
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
