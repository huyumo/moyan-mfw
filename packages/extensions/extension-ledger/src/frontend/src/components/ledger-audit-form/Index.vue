<!--
/**
 * @fileoverview 审核表单组件（MfwPopup 弹窗内使用）
 * @description 审核通过/驳回 + 备注；审核通过时可针对交易相关账户分别填写备注（纯文本）+ 特殊信息（JSON）；
 *   onConfirm 组装 accountNotes 提交
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '120px' }"
  />
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { MfwFormCard, type MfwFormCardInstance } from 'moyan-mfw-base/frontend'
import type { FormItemConfig } from 'moyan-mfw-base/frontend'
import { ApiLedgerAuditTransfer, type AuditTransferParams } from '../../apis/ledger'

defineOptions({ name: 'MfwLedgerAuditForm' })

/** 交易相关账户项（转出方 + 各收款方） */
interface AuditAccountOption {
  accountId: string
  role: string
}

/** MfwPopup 传入属性：交易单号 + 目标动作 + 涉及账户列表（审核通过时按账户渲染备注输入） */
const props = defineProps<{ transferNo: string; action: 1 | 2; accounts?: AuditAccountOption[] }>()

const formRef = ref<MfwFormCardInstance>()
const form = reactive<Record<string, any>>({
  auditNotes: '',
})

const formTemplate = computed<FormItemConfig[]>(() => {
  const base: FormItemConfig[] = [
    {
      key: 'auditNotes',
      label: '审核备注',
      component: 'el-input',
      elProps: { type: 'textarea', rows: 3, placeholder: props.action === 1 ? '审核通过备注（可选）' : '驳回原因（建议填写）' },
    },
  ]
  // 审核通过：按交易相关账户动态渲染"备注（纯文本）+ 特殊信息（JSON）"
  if (props.action !== 1 || !props.accounts?.length) return base
  const items: FormItemConfig[] = []
  for (const acc of props.accounts) {
    items.push(
      {
        key: `note_${acc.accountId}`,
        label: `${acc.role}备注`,
        component: 'el-input',
        elProps: { type: 'textarea', rows: 2, placeholder: `${acc.role}（${acc.accountId}）备注，可选` },
      },
      {
        key: `extra_${acc.accountId}`,
        label: `${acc.role}特殊信息`,
        component: 'el-input',
        elProps: { type: 'textarea', rows: 2, placeholder: `${acc.role}（${acc.accountId}）JSON，可选，如 {"channel":"..."}` },
      },
    )
  }
  return [...base, ...items]
})

/** MfwPopup 确认回调 */
async function onConfirm(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')

  const body: AuditTransferParams = {
    transferNo: props.transferNo,
    auditStatus: props.action,
    auditNotes: form.auditNotes || undefined,
  }

  // 审核通过：组装按账户备注（纯文本 + JSON 校验后合并）
  if (props.action === 1 && props.accounts?.length) {
    const accountNotes: Record<string, { note?: string; noteExtra?: Record<string, unknown> }> = {}
    for (const acc of props.accounts) {
      const note = String(form[`note_${acc.accountId}`] ?? '').trim()
      const extraText = String(form[`extra_${acc.accountId}`] ?? '').trim()
      if (!note && !extraText) continue
      let noteExtra: Record<string, unknown> | undefined
      if (extraText) {
        try {
          const parsed = JSON.parse(extraText)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            noteExtra = parsed as Record<string, unknown>
          } else {
            throw new Error('not-object')
          }
        } catch {
          throw new Error(`${acc.role}特殊信息必须是合法 JSON 对象`)
        }
      }
      accountNotes[acc.accountId] = { note: note || undefined, noteExtra }
    }
    if (Object.keys(accountNotes).length > 0) {
      body.accountNotes = accountNotes
    }
  }

  await new ApiLedgerAuditTransfer({ body }, { hintSuccess: true } as any)
}

defineExpose({ onConfirm })
</script>
