<!--
/**
 * @fileoverview 手动触发任务表单
 * @description 支持输入 entityId 和 payload（JSON），调用手动触发 API
 */
-->
<template>
  <MfwFormCard ref="formRef" :form-data="form" :template="formTemplate" :form-props="{ labelWidth: '120px' }" />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base/frontend'
import { ApiSchedulerTriggerTask } from '../../apis/scheduler'

const props = defineProps<{
  taskCode?: string
  taskName?: string
  taskType?: number
}>()
defineOptions({ name: 'MfwTaskTriggerForm' })
const formRef = ref<MfwFormCardInstance>()

const form = reactive({
  entityId: '',
  payloadText: '',
})

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'entityId',
    label: '实体ID',
    component: 'el-input',
    elProps: { placeholder: '业务实体ID（可选，如订单号）', clearable: true },
  },
  {
    key: 'payloadText',
    label: '业务数据',
    component: 'el-input',
    elProps: {
      placeholder: 'JSON 格式，如 {"key":"value"}',
      type: 'textarea',
      rows: 4,
      clearable: true,
    },
    afterText: 'JSON 格式，留空则不传',
  },
])

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  let payload: Record<string, any> | undefined
  if (form.payloadText.trim()) {
    try {
      payload = JSON.parse(form.payloadText)
    } catch {
      throw new Error('业务数据不是有效的 JSON 格式')
    }
  }
  await new ApiSchedulerTriggerTask({
    params: { taskCode: props.taskCode! },
    body: {
      entityId: form.entityId || undefined,
      payload,
    },
  })
}
defineExpose({ onConfirm })
</script>
