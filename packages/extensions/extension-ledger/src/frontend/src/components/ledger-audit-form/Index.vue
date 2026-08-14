<!--
/**
 * @fileoverview 审核表单组件（MfwPopup 弹窗内使用）
 * @description 审核通过/驳回 + 备注；onConfirm 提交
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '100px' }"
  />
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { MfwFormCard, type MfwFormCardInstance } from 'moyan-mfw-base/frontend'
import type { FormItemConfig } from 'moyan-mfw-base/frontend'
import { ApiLedgerAuditTransfer } from '../../apis/ledger'

defineOptions({ name: 'MfwLedgerAuditForm' })

/** MfwPopup 传入属性：交易单号 + 目标动作 */
const props = defineProps<{ transferNo: string; action: 1 | 2 }>()

const formRef = ref<MfwFormCardInstance>()
const form = reactive<Record<string, any>>({
  auditNotes: '',
})

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'auditNotes',
    label: '审核备注',
    component: 'el-input',
    elProps: { type: 'textarea', rows: 3, placeholder: props.action === 1 ? '审核通过备注（可选）' : '驳回原因（建议填写）' },
  },
])

/** MfwPopup 确认回调 */
async function onConfirm(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')

  await new ApiLedgerAuditTransfer(
    {
      body: {
        transferNo: props.transferNo,
        auditStatus: props.action,
        auditNotes: form.auditNotes || undefined,
      },
    },
    { hintSuccess: true } as any,
  )
}

defineExpose({ onConfirm })
</script>
