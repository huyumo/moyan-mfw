<!--
/**
 * @fileoverview 制单表单组件（MfwPopup 弹窗内使用）
 * @description MfwFormCard 配置式表单；1对1 收款方（单行）模式；onConfirm 提交
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '200px' }"
  />
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { MfwFormCard, type MfwFormCardInstance } from 'moyan-mfw-base/frontend'
import type { FormItemConfig } from 'moyan-mfw-base/frontend'
import { ApiLedgerCreateTransfer } from '../../apis/ledger'
import { bizTypeExtMeta } from '../../views/ledger/shared'

defineOptions({ name: 'MfwLedgerTransferForm' })

/** MfwPopup 传入属性（纯新建，无编辑） */
const props = defineProps<{ [key: string]: any }>()

const formRef = ref<MfwFormCardInstance>()
const form = reactive<Record<string, any>>({
  bizRef: '',
  bizType: '',
  fromAccount: '',
  toAccount: '',
  amount: '',
  currency: 'CNY',
  needReview: false,
  description: '',
})

/** 当前 bizType 的扩展字段元数据（制单弹窗内联动：选 bizType 后出现扩展输入框） */
const currentExtMeta = computed(() => (form.bizType ? bizTypeExtMeta[form.bizType] : undefined))

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'bizRef',
    label: '业务幂等键',
    component: 'el-input',
    placeholder: '同键重复制单返回已有单',
    rules: [{ required: true, message: '业务幂等键必填', trigger: 'blur' }],
    elProps: { clearable: true },
  },
  {
    key: 'bizType',
    label: '业务类型',
    component: 'el-select',
    placeholder: '选择业务类型（不同类型展示不同扩展字段）',
    rules: [{ required: true, message: '业务类型必填', trigger: 'blur' }],
    elProps: {
      clearable: true,
      filterable: true,
      options: Object.entries(bizTypeExtMeta).map(([value, meta]) => ({ value, label: meta.label })),
    },
  },
  {
    key: 'fromAccount',
    label: '转出方账户ID',
    component: 'el-input',
    rules: [{ required: true, message: '转出方账户必填', trigger: 'blur' }],
    elProps: { clearable: true },
  },
  {
    key: 'toAccount',
    label: '收款方账户ID',
    component: 'el-input',
    placeholder: '1对1 转账输入单个收款方',
    rules: [{ required: true, message: '收款方账户必填', trigger: 'blur' }],
    elProps: { clearable: true },
  },
  {
    key: 'amount',
    label: '金额（最小单位）',
    component: 'el-input',
    placeholder: '如 10000 = 100.00 元',
    rules: [{ required: true, message: '金额必填', trigger: 'blur' }],
    elProps: { clearable: true },
  },
  {
    key: 'currency',
    label: '币种',
    component: 'el-input',
    placeholder: 'CNY / ITG',
    rules: [{ required: true, message: '币种必填', trigger: 'blur' }],
    elProps: { clearable: true },
  },
  // 业务扩展字段（按 bizType 动态，映射到预留索引位）
  ...(currentExtMeta.value?.search ?? []).map<FormItemConfig>((item) => ({
    key: `ext_${item.key}`,
    label: item.label,
    component: 'el-input',
    placeholder: `${item.label}（扩展筛选字段）`,
    elProps: { clearable: true },
  })),
  {
    key: 'needReview',
    label: '需要审核',
    component: 'el-switch',
    afterText: '开启后制单冻结待审，审核通过才入账',
  },
  {
    key: 'description',
    label: '备注',
    component: 'el-input',
    elProps: { type: 'textarea', rows: 2 },
  },
])

/** MfwPopup 确认回调 */
async function onConfirm(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')

  // 组装业务扩展字段（仅收集当前 bizType 声明且有值的字段）
  const extFields: Record<string, string> = {}
  for (const item of currentExtMeta.value?.search ?? []) {
    const v = form[`ext_${item.key}`]
    if (v !== undefined && v !== '') extFields[item.key] = v
  }

  await new ApiLedgerCreateTransfer(
    {
      body: {
        bizRef: form.bizRef,
        bizType: form.bizType,
        fromAccount: form.fromAccount,
        toAccounts: [{ account: form.toAccount, amount: form.amount }],
        amount: form.amount,
        currency: form.currency,
        needReview: form.needReview,
        description: form.description || undefined,
        extFields: Object.keys(extFields).length > 0 ? extFields : undefined,
      },
    },
    { hintSuccess: true } as any,
  )
}

defineExpose({ onConfirm })

void props
</script>
