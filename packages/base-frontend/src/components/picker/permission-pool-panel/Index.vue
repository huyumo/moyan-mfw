<!--
  @fileoverview MfwPermissionPoolPanel 权限池配置面板
  @description 用于应用类型详情页的权限池配置，支持 PC 权限树和普通权限两个 Tab

  @example
  ```vue
  <MfwPermissionPoolPanel
    app-type-id="app-type-uuid"
    @saved="onSaved"
  />
  ```
-->

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import type { PermissionTreeNodeDto, PermissionTreePayloadDto } from '../../../apis/sys/schemas'
import {
  type MfwPermissionPoolPanelProps,
  type MfwPermissionPoolPanelEmits,
  type MfwPermissionPoolPanelInstance,
} from './types'
import { ApiAppTypeGetPermissionPool, ApiAppTypeUpdatePermissionPool } from '../../../apis/sys'
import { MfwPermissionTree } from '../../business/permission-tree'

defineOptions({ name: 'MfwPermissionPoolPanel' })

// ========== Props & Emits ==========

const props = defineProps<MfwPermissionPoolPanelProps>()
const emit = defineEmits<MfwPermissionPoolPanelEmits>()

// ========== 状态 ==========

const loading = ref(false)
const saving = ref(false)

// 原始数据（从 API 加载）
const pcTreeData = ref<PermissionTreeNodeDto[]>([])
const normalTreeData = ref<PermissionTreeNodeDto[]>([])

// 已勾选的权限 ID
const checkedIds = ref<string[]>([])

// 权限值映射（nodeId -> permissionValue）
const permissionValues = ref<Map<string, string>>(new Map())

// ========== 加载数据 ==========

async function loadPermissionPool() {
  if (!props.appTypeId) return

  loading.value = true
  try {
    const response = await new ApiAppTypeGetPermissionPool({
      query: { appTypeId: props.appTypeId },
    })

    pcTreeData.value = response.permissionTrees?.pcTree || []
    normalTreeData.value = response.permissionTrees?.normalTree || []

    // 收集已勾选的 ID（inPool === true）
    const collectInPoolIds = (nodes: PermissionTreeNodeDto[]): string[] => {
      const ids: string[] = []
      for (const node of nodes) {
        if (node.inPool) {
          ids.push(node.id)
        }
        if (node.children) {
          ids.push(...collectInPoolIds(node.children))
        }
      }
      return ids
    }

    checkedIds.value = [
      ...collectInPoolIds(pcTreeData.value),
      ...collectInPoolIds(normalTreeData.value),
    ]

    emit('loaded', {
      pcTree: pcTreeData.value,
      normalTree: normalTreeData.value,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error('加载权限池失败')
    emit('error', err)
    ElMessage.error(err.message)
  } finally {
    loading.value = false
  }
}

// ========== 保存数据 ==========

async function savePermissionPool() {
  if (!props.appTypeId) return

  // 验证：检查是否有勾选的权限
  if (checkedIds.value.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    return
  }

  saving.value = true
  try {
    // 构建树形 payload（包含勾选状态和 permissionValue）
    const buildPayload = (nodes: PermissionTreeNodeDto[]): PermissionTreePayloadDto[] => {
      return nodes.map(node => {
        const isChecked = checkedIds.value.includes(node.id)
        const payload: PermissionTreePayloadDto = {
          permissionId: node.id,
          checked: isChecked,
          permissionValue: isChecked && permissionValues.value.has(node.id)
            ? permissionValues.value.get(node.id)
            : undefined,
        }
        if (node.children && node.children.length > 0) {
          payload.children = buildPayload(node.children)
        }
        return payload
      })
    }

    const payload = {
      pcTree: buildPayload(pcTreeData.value),
      normalTree: buildPayload(normalTreeData.value),
    }

    const response = await new ApiAppTypeUpdatePermissionPool({
      query: { appTypeId: props.appTypeId },
      params: { permissionTrees: payload },
    })

    ElMessage.success('保存成功')
    emit('saved', {
      appTypeId: response.appTypeId,
      updatedCount: response.updatedCount,
    })
    await loadPermissionPool()
  } catch (error) {
    const err = error instanceof Error ? error : new Error('保存权限池失败')
    emit('error', err)
    ElMessage.error(err.message)
  } finally {
    saving.value = false
  }
}

// ========== 重置 ==========

function reset() {
  loadPermissionPool()
}

// ========== 暴露实例方法 ==========

defineExpose<MfwPermissionPoolPanelInstance>({
  load: loadPermissionPool,
  save: savePermissionPool,
  reset,
})

// ========== 监听 ==========

watch(
  () => props.appTypeId,
  (newId) => {
    if (newId) {
      loadPermissionPool()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="mfw-permission-pool-panel">
    <!-- 使用统一的权限树组件 -->
    <MfwPermissionTree
      :pc-tree-data="pcTreeData"
      :normal-tree-data="normalTreeData"
      :checked-ids="checkedIds"
      mode="pool"
      :loading="loading"
      :readonly="readonly"
      @check-change="checkedIds = $event"
      @permission-value-change="(nodeId, value) => permissionValues.set(nodeId, value)"
    />

    <!-- 操作按钮 -->
    <div v-if="!readonly && !hideFooter" class="panel-footer">
      <ElButton @click="reset">重置</ElButton>
      <ElButton type="primary" :loading="saving" :icon="Check" @click="savePermissionPool">
        保存配置
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mfw-permission-pool-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }
}
</style>