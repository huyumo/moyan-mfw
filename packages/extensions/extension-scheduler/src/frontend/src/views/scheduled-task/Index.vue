<!--
/**
 * @fileoverview 定时任务管理页面
 * @description 三视图容器：任务定义 / 延迟实例 / 执行日志
 *   每个 Tab 为独立组件，自带 MfwPageWrapper（独立刷新/搜索上下文）
 *   el-tab-pane 使用 lazy 延迟挂载，首次打开才加载
 */
-->
<template>
  <MfwPageWrapper>
    <el-tabs v-model="activeTab" class="scheduler-tabs">
      <el-tab-pane label="任务定义" name="tasks" lazy>
        <TaskDefinitionTab v-if="activeTab === 'tasks'" ref="taskTabRef" @triggered="handleTriggered" />
      </el-tab-pane>
      <el-tab-pane label="延迟实例" name="instances" lazy>
        <TaskInstanceTab v-if="activeTab === 'instances'" ref="instanceTabRef" />
      </el-tab-pane>
      <el-tab-pane label="执行日志" name="logs" lazy>
        <TaskLogTab v-if="activeTab === 'logs'" ref="logTabRef" />
      </el-tab-pane>
    </el-tabs>
  </MfwPageWrapper>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskDefinitionTab from './TaskDefinitionTab.vue'
import TaskInstanceTab from './TaskInstanceTab.vue'
import TaskLogTab from './TaskLogTab.vue'
import { MfwPageWrapper } from 'moyan-mfw-base/frontend'

defineOptions({ name: 'MfwScheduledTaskPage' })

const activeTab = ref('tasks')
const taskTabRef = ref<InstanceType<typeof TaskDefinitionTab>>()
const instanceTabRef = ref<InstanceType<typeof TaskInstanceTab>>()
const logTabRef = ref<InstanceType<typeof TaskLogTab>>()

/** CRON 任务手动触发后 → 切换到延迟实例 tab 查看 */
const handleTriggered = () => {
  activeTab.value = 'instances'
  // 切换后刷新实例列表（等 tab 渲染完成）
  setTimeout(() => instanceTabRef.value?.refresh(), 100)
}
</script>

<style scoped>
.scheduler-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scheduler-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.scheduler-tabs :deep(.el-tab-pane) {
  height: 100%;
}
</style>
