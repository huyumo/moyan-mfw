<!--
/**
 * @fileoverview 任务配置编辑表单
 * @description 根据 taskType 动态显示配置项：
 *   CRON 类型：cron表达式/间隔秒数/超时/启用/重启补偿/描述
 *   DELAY 类型：超时/最大重试次数/重试间隔/描述（无 cron/interval/catchUpOnRestart）
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
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'

const props = defineProps<{
  taskCode?: string
  taskName?: string
  taskType?: number
  cronExpression?: string | null
  intervalSeconds?: number
  enabled?: boolean
  timeoutSeconds?: number
  description?: string | null
  catchUpOnRestart?: boolean
  maxRetry?: number
  backoffStrategy?: string | null
  enableLog?: boolean
}>()
defineOptions({ name: 'MfwTaskConfigForm' })
const formRef = ref<MfwFormCardInstance>()

const isCron = computed(() => props.taskType === TaskTypeDict.CRON)

const form = reactive({
  taskName: '',
  cronExpression: '',
  intervalSeconds: 0,
  enabled: true,
  timeoutSeconds: 300,
  description: '',
  catchUpOnRestart: false,
  maxRetry: 3,
  backoffDelays: '1,5,60,1440', // 重试间隔（分钟），逗号分隔
  enableLog: true,
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
    form.maxRetry = p?.maxRetry ?? 3
    form.enableLog = p?.enableLog ?? true
    // 解析 backoffStrategy JSON 为逗号分隔的分钟数
    if (p?.backoffStrategy) {
      try {
        const bs = typeof p.backoffStrategy === 'string' ? JSON.parse(p.backoffStrategy) : p.backoffStrategy
        if (bs.type === 'fixed' && Array.isArray(bs.delays)) {
          form.backoffDelays = bs.delays.map((ms: number) => ms / 60000).join(',')
        }
      } catch {
        // 解析失败保持默认值
      }
    }
  },
  { immediate: true },
)

const formTemplate = computed<FormItemConfig[]>(() => {
  const items: FormItemConfig[] = [
    {
      key: 'taskName', label: '任务名称', component: 'el-input',
      rules: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
      elProps: { placeholder: '请输入任务名称', clearable: true },
    },
  ]

  // CRON 类型才显示调度配置
  if (isCron.value) {
    items.push(
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
    )
  }

  // 通用配置
  items.push(
    {
      key: 'timeoutSeconds', label: '超时秒数', component: 'el-input-number',
      rules: [{ required: true, message: '请输入超时秒数', trigger: 'blur' }],
      elProps: { min: 1, controlsPosition: 'right' },
    },
    {
      key: 'enabled', label: '是否启用', component: 'el-switch',
    },
    {
      key: 'enableLog', label: '执行日志', component: 'el-switch',
      afterText: '关闭后不记录执行日志（高频任务可关闭）',
    },
  )

  // CRON 类型才显示重启补偿
  if (isCron.value) {
    items.push({
      key: 'catchUpOnRestart', label: '重启补偿', component: 'el-switch',
      afterText: '重启后是否补偿执行',
    })
  }

  // 重试配置（DELAY 类型才有意义，CRON 也可配置但不影响执行）
  if (!isCron.value) {
    items.push(
      {
        key: 'maxRetry', label: '最大重试', component: 'el-input-number',
        elProps: { min: 0, max: 10, controlsPosition: 'right' },
        afterText: '0=不重试',
      },
      {
        key: 'backoffDelays', label: '重试间隔', component: 'el-input',
        elProps: { placeholder: '如 1,5,60,1440' },
        afterText: '分钟，逗号分隔，依次对应每次重试的等待时间',
      },
    )
  }

  items.push({
    key: 'description', label: '任务描述', component: 'el-input',
    elProps: { placeholder: '请输入任务描述', type: 'textarea', rows: 2 },
  })

  return items
})

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  const body: any = {
    taskName: form.taskName,
    timeoutSeconds: form.timeoutSeconds,
    enabled: form.enabled,
    enableLog: form.enableLog,
    description: form.description,
  }
  if (isCron.value) {
    body.cronExpression = form.cronExpression
    body.intervalSeconds = form.intervalSeconds
    body.catchUpOnRestart = form.catchUpOnRestart
  } else {
    body.maxRetry = form.maxRetry
    // 将分钟数组转为 backoffStrategy JSON
    const delays = form.backoffDelays.split(',').map(s => parseInt(s.trim()) * 60000).filter(n => !isNaN(n) && n >= 0)
    body.backoffStrategy = { type: 'fixed', delays }
  }
  await new ApiSchedulerUpdateTask({ params: { taskCode: props.taskCode! }, body })
}
defineExpose({ onConfirm })
</script>
