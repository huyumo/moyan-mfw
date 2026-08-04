<!--
/**
 * @fileoverview 调度器系统配置页
 * @description 分组表单（数据清理/崩溃恢复/重启限流/多实例）+ 执行器状态表格
 *   表单用 MfwFormCard + formGroup(el-collapse)；执行器表格放表单外独立区域（MfwFormCard 无 slot）
 *   执行器列表 30s 轮询：onMounted 启动 / onBeforeUnmount 停止（tab 切换 v-if 销毁自动停止）
 */
-->
<template>
  <div class="system-config">
    <!-- 顶部操作行：手动清理 + 保存 -->
    <div class="toolbar">
      <el-button
        v-permission="{ value: ['编辑'] }"
        type="danger"
        plain
        :loading="cleaning"
        @click="handleCleanup"
      >
        手动清理
      </el-button>
      <div class="spacer"></div>
      <el-button
        v-permission="{ value: ['编辑'] }"
        type="primary"
        :loading="saving"
        @click="handleSave"
      >
        保存配置
      </el-button>
    </div>

    <!-- 配置表单（4 分组折叠面板） -->
    <MfwFormCard
      ref="formRef"
      :form-data="form"
      :form-group="formGroup"
      :form-props="{ labelWidth: '140px' }"
    />

    <!-- 执行器状态（多实例分片实时展示，表单外独立区域） -->
    <el-card shadow="never" class="executor-card">
      <template #header>
        <div class="executor-header">
          <span>存活执行器</span>
          <el-tag type="success" size="small">分片模式：自动（{{ executors.length }} 个实例）</el-tag>
        </div>
      </template>
      <el-table :data="executors" v-loading="loadingExecutors" size="small">
        <el-table-column prop="executorId" label="执行器ID" min-width="260" show-overflow-tooltip />
        <el-table-column prop="hostname" label="主机名" min-width="140" />
        <el-table-column prop="pid" label="PID" width="90" />
        <el-table-column label="最后心跳" min-width="160">
          <template #default="{ row }">{{ formatDate(row.lastHeartbeat) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MfwFormCard } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormGroupConfig, FormItemConfig } from 'moyan-mfw-base/frontend'
import {
  ApiSchedulerGetConfig,
  ApiSchedulerUpdateConfig,
  ApiSchedulerCleanup,
  ApiSchedulerListExecutors,
  type SchedulerConfigItem,
  type SchedulerExecutorItem,
} from '../../apis/scheduler'
import { CrashRecoveryStrategyDict } from 'moyan-mfw-extension-scheduler/shared'
import { crashRecoveryLabel, formatDate } from './shared'

defineOptions({ name: 'MfwSystemConfigTab' })

const formRef = ref<MfwFormCardInstance>()
const saving = ref(false)
const cleaning = ref(false)
const executors = ref<SchedulerExecutorItem[]>([])
const loadingExecutors = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

// ── 表单数据 ──

const form = reactive({
  cleanupEnabled: true,
  instanceRetentionDays: 7,
  logRetentionDays: 30,
  cleanupIntervalHours: 6,
  crashRecoveryStrategy: CrashRecoveryStrategyDict.REQUEUE,
  orphanTimeoutSeconds: 600,
  restartBatchSize: 200,
  restartBatchDelayMs: 2000,
  cronDedupEnabled: true,
})

/** 崩溃恢复策略下拉选项（重新入队需任务幂等） */
const crashRecoveryOptions = [
  { label: `${crashRecoveryLabel[1]}（需任务幂等）`, value: CrashRecoveryStrategyDict.REQUEUE },
  { label: crashRecoveryLabel[2], value: CrashRecoveryStrategyDict.MARK_FAILED },
  { label: crashRecoveryLabel[3], value: CrashRecoveryStrategyDict.MARK_TIMEOUT_ORPHAN },
]

const formGroup = computed<FormGroupConfig>(() => ({
  type: 'el-collapse',
  activeNames: ['cleanup', 'recovery', 'throttle', 'multi'],
  groups: [
    {
      key: 'cleanup',
      title: '数据清理',
      template: [
        { key: 'cleanupEnabled', label: '清理开关', component: 'el-switch' },
        { key: 'instanceRetentionDays', label: '实例保留天数', component: 'el-input-number', elProps: { min: 1, controlsPosition: 'right' }, afterText: '终态实例超过此天数自动硬删除' },
        { key: 'logRetentionDays', label: '日志保留天数', component: 'el-input-number', elProps: { min: 1, controlsPosition: 'right' }, afterText: '执行日志超过此天数自动硬删除' },
        { key: 'cleanupIntervalHours', label: '清理间隔(小时)', component: 'el-input-number', elProps: { min: 1, controlsPosition: 'right' } },
      ] as FormItemConfig[],
    },
    {
      key: 'recovery',
      title: '崩溃恢复',
      template: [
        { key: 'crashRecoveryStrategy', label: '恢复策略', component: 'el-select', elProps: { placeholder: '选择崩溃恢复策略' }, afterText: '重新入队要求任务处理器具备幂等性' },
        { key: 'orphanTimeoutSeconds', label: '孤儿超时(秒)', component: 'el-input-number', elProps: { min: 60, controlsPosition: 'right' }, afterText: '执行器心跳离线判定阈值' },
      ] as FormItemConfig[],
    },
    {
      key: 'throttle',
      title: '重启限流',
      template: [
        { key: 'restartBatchSize', label: '启动批次大小', component: 'el-input-number', elProps: { min: 1, controlsPosition: 'right' }, afterText: '重启时每轮预加载上限' },
        { key: 'restartBatchDelayMs', label: '批次间隔(毫秒)', component: 'el-input-number', elProps: { min: 100, controlsPosition: 'right' }, afterText: '积压清空前快速重载间隔' },
      ] as FormItemConfig[],
    },
    {
      key: 'multi',
      title: '多实例配置',
      template: [
        { key: 'cronDedupEnabled', label: 'CRON去重', component: 'el-switch', afterText: '多实例下 CRON 任务只执行一次' },
      ] as FormItemConfig[],
    },
  ],
}))

// ── 数据加载 ──

async function loadConfig(): Promise<void> {
  try {
    const cfg = await new ApiSchedulerGetConfig({})
    Object.assign(form, {
      cleanupEnabled: cfg.cleanupEnabled,
      instanceRetentionDays: cfg.instanceRetentionDays,
      logRetentionDays: cfg.logRetentionDays,
      cleanupIntervalHours: cfg.cleanupIntervalHours,
      crashRecoveryStrategy: cfg.crashRecoveryStrategy,
      orphanTimeoutSeconds: cfg.orphanTimeoutSeconds,
      restartBatchSize: cfg.restartBatchSize,
      restartBatchDelayMs: cfg.restartBatchDelayMs,
      cronDedupEnabled: cfg.cronDedupEnabled,
    })
  } catch {
    // 加载失败保持默认值
  }
}

async function loadExecutors(): Promise<void> {
  try {
    executors.value = await new ApiSchedulerListExecutors({})
  } catch {
    // 忽略轮询失败
  } finally {
    loadingExecutors.value = false
  }
}

// ── 操作 ──

async function handleSave(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  saving.value = true
  try {
    await new ApiSchedulerUpdateConfig({ body: { ...form } }, { hintSuccess: true } as any)
  } finally {
    saving.value = false
  }
}

async function handleCleanup(): Promise<void> {
  await ElMessageBox.confirm('确定立即执行清理？将删除超过保留天数的终态实例与执行日志。', '手动清理', {
    confirmButtonText: '执行清理',
    cancelButtonText: '取消',
    type: 'warning',
  })
  cleaning.value = true
  try {
    const result = await new ApiSchedulerCleanup({}, { hintSuccess: true } as any)
    ElMessage.success(`清理完成：实例 ${result.instances} 条，日志 ${result.logs} 条`)
  } finally {
    cleaning.value = false
  }}

// ── 生命周期：30s 轮询执行器状态（onActivated 不可用，v-if 销毁天然停止） ──

onMounted(() => {
  loadConfig()
  loadExecutors()
  pollTimer = setInterval(() => loadExecutors(), 30_000)
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<style scoped>
.system-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spacer {
  flex: 1;
}

.executor-card {
  margin-top: 4px;
}

.executor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
