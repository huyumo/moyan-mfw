<!--
/**
 * @fileoverview 任务配置编辑表单
 * @description 编辑任务的 cron/间隔/超时/启用/catchUpOnRestart/描述
 */
-->
<template>
  <MfwFormCard ref="formRef" :form-data="form" :template="formTemplate" :form-props="{ labelWidth: '120px' }" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base/frontend'
import { ApiSchedulerUpdateTask } from '../../apis/scheduler'

const props = defineProps<{
  taskCode?: string
  taskName?: string
  cronExpression?: string | null
  intervalSeconds?: number
  enabled?: boolean
  timeoutSeconds?: number
  description?: string | null
  catchUpOnRestart?: boolean
}>()
defineOptions({ name: 'MfwTaskConfigForm' })
const formRef = ref<MfwFormCardInstance>()

const form = reactive({
  taskName: '',
  cronExpression: '',
  intervalSeconds: 0,
  enabled: true,
  timeoutSeconds: 300,
  description: '',
  catchUpOnRestart: false,
})

watch(
  () => props,
  (p) => {
    form.taskName = p?.taskName || ''
    form.cronExpression = p?.cronExpression || ''
    form.intervalSeconds = p?.intervalSeconds ?? 0
    form.enabled = p?.enabled ?? true
    form.timeoutSeconds = p?.timeoutSeconds ?? 300
    form.description = p?.description || ''
    form.catchUpOnRestart = p?.catchUpOnRestart ?? false
  },
  { immediate: true },
)

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'taskName', label: '任务名称', component: 'el-input',
    rules: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    elProps: { placeholder: '请输入任务名称', clearable: true },
  },
  {
    key: 'cronExpression', label: 'Cron表达式', component: 'el-input',
    elProps: { placeholder: '6段秒级，如 0 */1 * * * *（每分钟）', clearable: true },
    afterText: '与间隔秒数二选一',
  },
  {
    key: 'intervalSeconds', label: '间隔秒数', component: 'el-input-number',
    elProps: { min: 0, controlsPosition: 'right', placeholder: '0=使用cron' },
    afterText: '与cron二选一，0=使用cron',
  },
  {
    key: 'timeoutSeconds', label: '超时秒数', component: 'el-input-number',
    rules: [{ required: true, message: '请输入超时秒数', trigger: 'blur' }],
    elProps: { min: 1, controlsPosition: 'right' },
  },
  {
    key: 'enabled', label: '是否启用', component: 'el-switch',
  },
  {
    key: 'catchUpOnRestart', label: '重启补偿', component: 'el-switch',
    afterText: '重启后是否补偿执行',
  },
  {
    key: 'description', label: '任务描述', component: 'el-input',
    elProps: { placeholder: '请输入任务描述', type: 'textarea', rows: 2 },
  },
])

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  await new ApiSchedulerUpdateTask({ params: { taskCode: props.taskCode! }, body: form })
}
defineExpose({ onConfirm })
</script>
