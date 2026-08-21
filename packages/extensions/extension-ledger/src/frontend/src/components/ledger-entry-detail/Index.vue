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
          <span class="info-label">业务类型</span>
          <span class="info-value">{{ detail.bizType || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">方向</span>
          <span class="info-value">
            <el-tag :type="directionTagType[detail.direction] as any" size="small">{{ directionLabel[detail.direction] || '-' }}</el-tag>
          </span>
        </div>
        <div v-if="detail.isReversal" class="info-row full">
          <span class="info-label">冲正</span>
          <span class="info-value">
            <el-tag type="warning" size="small">冲正腿（资金回流，不累计转入/转出）</el-tag>
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
          <span class="info-value">
            {{ formatAmount(detail.balanceAfter, detail.currency || 'CNY') }}
            <el-tooltip
              v-if="detail.balanceBefore === detail.balanceAfter"
              content="出账方余额在制单预占时已扣减，入账时仅释放占用，故前后不变"
              placement="top"
            >
              <el-tag size="small" type="info" style="margin-left: 6px; cursor: help">预占已扣</el-tag>
            </el-tooltip>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">入账时间</span>
          <span class="info-value">
            <MfwDateFormat :value="detail.createdAt" />
          </span>
        </div>
      </div>
    </section>

    <!-- 账户备注（审核时按账户编写，入账后随分录派生展示） -->
    <section
      v-if="detail.note || (detail.noteExtra && Object.keys(detail.noteExtra).length)"
      class="detail-section"
    >
      <h4 class="section-title">账户备注</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">备注</span>
          <span class="info-value">{{ detail.note || '-' }}</span>
        </div>
        <div v-if="detail.noteExtra && Object.keys(detail.noteExtra).length" class="info-row full">
          <span class="info-label">特殊信息</span>
          <pre class="json-block">{{ JSON.stringify(detail.noteExtra, null, 2) }}</pre>
        </div>
      </div>
    </section>

    <!-- 对方账户（同交易单的另一侧分录；异步拉取同单分录匹配） -->
    <section v-if="counterpart" class="detail-section">
      <h4 class="section-title">对方账户</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">对方账户ID</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(counterpart.accountId)">{{ counterpart.accountId }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">对方方向</span>
          <span class="info-value">
            <el-tag :type="directionTagType[counterpart.direction] as any" size="small">{{ directionLabel[counterpart.direction] || '-' }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">对方符号金额</span>
          <span class="info-value">{{ formatAmount(counterpart.signedAmount, counterpart.currency || detail.currency || 'CNY') }}</span>
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
import { onMounted, ref } from 'vue'
import { MfwDateFormat } from 'moyan-mfw-base/frontend'
import { formatAmount, copyToClipboard, directionLabel, directionTagType } from '../../views/ledger/shared'
import { ApiLedgerListEntries, type LedgerEntryItem } from '../../apis/ledger'

defineOptions({ name: 'MfwLedgerEntryDetail' })

/** MfwPopup 传入属性：整行分录数据 */
const props = defineProps<{ detail: Record<string, any> }>()

/** 对方账户分录（同交易单、账户不同；无则隐藏区块） */
const counterpart = ref<LedgerEntryItem | null>(null)

onMounted(async () => {
  try {
    const res = await new ApiLedgerListEntries({
      query: { transferNo: props.detail.transferNo, page: 1, pageSize: 20 },
    })
    const other = (res?.items ?? []).find((e: LedgerEntryItem) => e.accountId !== props.detail.accountId)
    counterpart.value = other ?? null
  } catch {
    counterpart.value = null // 拉取失败静默（对方账户为增强展示，不影响主信息）
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
