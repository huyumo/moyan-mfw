<!--
/**
 * @fileoverview 开户表单组件（MfwPopup 弹窗内使用）
 * @description MfwFormCard 配置式表单；onConfirm 提交；defineExpose 暴露给 MfwPopup
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
import { ElMessage } from 'element-plus'
import { MfwFormCard, type MfwFormCardInstance } from 'moyan-mfw-base/frontend'
import type { FormItemConfig } from 'moyan-mfw-base/frontend'
import { ApiLedgerOpenAccount } from '../../apis/ledger'

defineOptions({ name: 'MfwLedgerAccountForm' })

/** MfwPopup 传入属性（无编辑模式，纯新建） */
const props = defineProps<{ [key: string]: any }>()

const formRef = ref<MfwFormCardInstance>()
const form = reactive<Record<string, any>>({
  holderId: '',
  holderType: 'system',
  tag: 'default',
  currency: 'CNY',
  initialBalance: '',
  extra: '',
})

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'holderId',
    label: '持有者ID',
    component: 'el-input',
    placeholder: '商家/用户 ID',
    rules: [{ required: true, message: '持有者ID必填', trigger: 'blur' }],
    elProps: { clearable: true },
  },
  {
    key: 'holderType',
    label: '持有者表名',
    component: 'el-input',
    placeholder: '默认 system',
    elProps: { clearable: true },
  },
  {
    key: 'tag',
    label: '账户标签',
    component: 'el-input',
    placeholder: '默认 default',
    elProps: { clearable: true },
  },
  {
    key: 'currency',
    label: '币种',
    component: 'el-input',
    placeholder: '默认 CNY',
    elProps: { clearable: true },
  },
  {
    key: 'initialBalance',
    label: '初始余额',
    component: 'el-input',
    placeholder: '最小单位字符串（如 10000=100元），可留空',
    elProps: { clearable: true },
  },
  {
    key: 'extra',
    label: '扩展字段',
    component: 'el-input',
    elProps: { type: 'textarea', rows: 3, placeholder: 'JSON，如 {"level": 1}，可留空' },
  },
])

/** MfwPopup 确认回调：校验 + 提交；失败抛错阻止弹窗关闭 */
async function onConfirm(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')

  let extra: Record<string, unknown> | undefined
  if (form.extra && String(form.extra).trim()) {
    try {
      extra = JSON.parse(form.extra)
    } catch {
      throw new Error('扩展字段不是合法 JSON')
    }
  }
  const body: Record<string, unknown> = { holderId: form.holderId }
  if (form.holderType) body.holderType = form.holderType
  if (form.tag) body.tag = form.tag
  if (form.currency) body.currency = form.currency
  if (form.initialBalance) body.initialBalance = form.initialBalance
  if (extra) body.extra = extra

  await new ApiLedgerOpenAccount({ body: body as any }, { hintSuccess: true } as any)
}

defineExpose({ onConfirm })

void props
</script>
