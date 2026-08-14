<!--
/**
 * @fileoverview 交易单详情抽屉组件（MfwPopup drawer 内使用）
 * @description 自写 detail-section + info-grid 风格（对齐 scheduler TaskInstanceDetail）
 */
-->
<template>
  <div class="detail-wrap">
    <section class="detail-section">
      <h4 class="section-title">基本信息</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">交易单号</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.transferNo)">{{ detail.transferNo }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">业务幂等键</span>
          <span class="info-value mono copyable" title="点击复制" @click="copyToClipboard(detail.bizRef)">{{ detail.bizRef }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">业务类型</span>
          <span class="info-value">{{ detail.bizType }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">金额</span>
          <span class="info-value">{{ formatAmount(detail.amount, detail.currency) }} {{ detail.currency }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">转账模式</span>
          <span class="info-value">{{ transferModeLabel[detail.transferMode] || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">需要审核</span>
          <span class="info-value">{{ detail.needReview ? '是' : '否' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">占用类型</span>
          <span class="info-value">{{ holdTypeLabel[detail.holdType] || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">重试次数</span>
          <span class="info-value">{{ detail.retryCount }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">制单时间</span>
          <span class="info-value">
            <MfwDateFormat :value="detail.createdAt" />
          </span>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <h4 class="section-title">状态</h4>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">审核状态</span>
          <span class="info-value">
            <el-tag :type="auditStatusTagType[detail.auditStatus] as any" size="small">{{ auditStatusLabel[detail.auditStatus] || '-' }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">入账状态</span>
          <span class="info-value">
            <el-tag :type="postStatusTagType[detail.postStatus] as any" size="small">{{ postStatusLabel[detail.postStatus] || '-' }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">制单人</span>
          <span class="info-value">{{ detail.makerText || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">审核人</span>
          <span class="info-value">{{ detail.auditorText || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">审核时间</span>
          <span class="info-value">
            <MfwDateFormat :value="detail.auditTime" />
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">审核备注</span>
          <span class="info-value">{{ detail.auditNotes || '-' }}</span>
        </div>
      </div>
    </section>

    <section v-if="detail.lastError" class="detail-section">
      <h4 class="section-title">失败信息</h4>
      <pre class="error-block">{{ detail.lastError }}</pre>
    </section>

    <section class="detail-section">
      <h4 class="section-title">收款方明细</h4>
      <el-table :data="detail.toAccounts" size="small" border>
        <el-table-column prop="account" label="账户ID" min-width="180" show-overflow-tooltip />
        <el-table-column label="金额" width="160" align="right">
          <template #default="{ row }">{{ formatAmount(row.amount, detail.currency) }}</template>
        </el-table-column>
      </el-table>
    </section>

    <section v-if="detailItems.length" class="detail-section">
      <h4 class="section-title">扩展字段</h4>
      <div class="info-grid">
        <div
          v-for="item in detailItems"
          :key="item.key"
          class="info-row"
          :class="{ full: item.span === 2 }"
        >
          <span class="info-label">{{ item.label }}</span>
          <span
            class="info-value mono copyable"
            :title="extValue(item.key)"
            @click="extValue(item.key) && copyToClipboard(extValue(item.key))"
          >{{ extValue(item.key) }}</span>
        </div>
      </div>
    </section>

    <section v-if="unknownExtraKeys.length" class="detail-section">
      <h4 class="section-title">扩展附录（未配置字段）</h4>
      <pre class="json-block">{{ JSON.stringify(unknownExtra, null, 2) }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MfwDateFormat } from 'moyan-mfw-base/frontend'
import {
  formatAmount,
  copyToClipboard,
  auditStatusLabel,
  auditStatusTagType,
  postStatusLabel,
  postStatusTagType,
  holdTypeLabel,
  transferModeLabel,
  bizTypeExtMeta,
} from '../../views/ledger/shared'

defineOptions({ name: 'MfwLedgerTransferDetail' })

/** MfwPopup 传入属性：整行交易单数据 */
const props = defineProps<{ detail: Record<string, any> }>()

/** 当前业务类型的扩展字段配置（显示名由 bizExtMappings 前端元数据提供） */
const extFieldMeta = computed(() => (props.detail.bizType ? bizTypeExtMeta[props.detail.bizType] : undefined))

/**
 * 详情扩展字段渲染项：优先 detail 配置（可配显示字段/顺序/占列 span），
 * 缺省回退 search 配置（全部独占一行，与旧行为一致）
 */
const detailItems = computed(() => {
  const meta = extFieldMeta.value
  if (!meta) return []
  if (meta.detail && meta.detail.length > 0) return meta.detail
  return (meta.search ?? []).map((i) => ({ key: i.key, label: i.label, span: 2 as const }))
})

/** 扩展字段值：优先预留索引位语义对象（extFields），其次 extra JSON */
function extValue(key: string): string {
  const fromExt = props.detail.extFields?.[key]
  if (fromExt !== undefined && fromExt !== null && fromExt !== '') return String(fromExt)
  const fromExtra = props.detail.extra?.[key]
  if (fromExtra !== undefined && fromExtra !== null && fromExtra !== '') return String(fromExtra)
  return '-'
}

/** extra 中未被扩展字段配置覆盖的键（兜底 JSON 展示） */
const knownKeys = computed(() => new Set((extFieldMeta.value?.search ?? []).map((i) => i.key)))
const unknownExtraKeys = computed(() =>
  props.detail.extra ? Object.keys(props.detail.extra).filter((k) => !knownKeys.value.has(k)) : [],
)
const unknownExtra = computed(() => {
  const extra = props.detail.extra ?? {}
  const result: Record<string, unknown> = {}
  for (const k of unknownExtraKeys.value) result[k] = extra[k]
  return result
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
/* 长字段单行省略 + 悬浮显示全文（ID 等复制型字段保留完整值可点击复制） */
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
.json-block,
.error-block {
  margin: 0;
  padding: 10px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  max-height: 240px;
  overflow: auto;
  font-family: var(--el-font-family-mono);
}
.error-block {
  color: var(--el-color-danger);
}
</style>
