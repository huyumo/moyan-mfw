<!--
/**
 * @fileoverview 广告位详情抽屉组件
 * @description 在广告位详情中管理具体广告内容，支持拖拽排序和状态切换
 */
-->
<template>
  <el-drawer
    v-model="visible"
    :title="title"
    direction="rtl"
    size="50%"
    :before-close="handleClose"
  >
    <template #header>
      <div class="drawer-header">
        <span>{{ title }}</span>
        <el-tag type="info" size="small" style="margin-left: 8px">{{ placementInfoRef.width }}x{{ placementInfoRef.height }}px</el-tag>
      </div>
    </template>

    <template #default>
      <div class="drawer-content">
        <div class="action-bar">
          <el-button type="primary" @click="handleAddAd" v-permission="{ value: ['添加'] }">
            <el-icon><Plus /></el-icon>新建广告
          </el-button>
          <el-button @click="loadAds" :loading="loading">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>

        <div v-loading="loading" class="ad-grid-container">
          <draggable
            v-model="ads"
            class="ad-grid"
            item-key="id"
            animation="200"
            ghost-class="ghost-card"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <MfwAdCard
                :ad="element"
                @edit="handleEditAd"
                @delete="handleDeleteAd"
                @toggle-status="handleToggleAdStatus"
              />
            </template>
          </draggable>
          <div v-if="!loading && ads.length === 0" class="empty-state">
            <el-empty description="暂无广告数据" />
          </div>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { MfwPopup } from 'moyan-mfw-base/frontend'
import { ApiAdFindAll, ApiAdUpdate, ApiAdDelete, ApiAdBatchUpdateSort } from '../../apis/ad'
import { StatusDict } from 'moyan-mfw-base/shared'
import MfwAdCard from '../ad-card/Index.vue'
import MfwAdForm from '../ad-form/Index.vue'
import type { AdResponseDto } from '../../apis/ad/schemas'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementDetail' })

const visible = ref(false)
const loading = ref(false)
const ads = ref<AdResponseDto[]>([])

const placementIdRef = ref<string>('')
const placementInfoRef = ref({ name: '', code: '', width: 0, height: 0 })

const title = computed(() => `广告位: ${placementInfoRef.value.name || '未命名'}`)

const open = (placementId: string, info: any) => {
  placementIdRef.value = placementId
  placementInfoRef.value = info || { name: '', code: '', width: 0, height: 0 }
  visible.value = true
  loadAds()
}

const loadAds = async () => {
  if (!placementIdRef.value) return
  loading.value = true
  try {
    const res = await new ApiAdFindAll({ query: { page: 1, pageSize: 999, placementId: placementIdRef.value } })
    ads.value = res.list || []
  } finally {
    loading.value = false
  }
}

const handleAddAd = () => {
  MfwPopup.open({
    title: '新建广告',
    type: 'dialog',
    component: MfwAdForm,
    data: { 
      placementId: placementIdRef.value,
      placementWidth: placementInfoRef.value.width,
      placementHeight: placementInfoRef.value.height,
    },
    popupProps: { width: 550 },
    on: { confirm: loadAds },
  })
}

const handleEditAd = (row: AdResponseDto) => {
  MfwPopup.open({
    title: '编辑广告',
    type: 'dialog',
    component: MfwAdForm,
    data: { 
      ...row,
      placementWidth: placementInfoRef.value.width,
      placementHeight: placementInfoRef.value.height,
    },
    popupProps: { width: 550 },
    on: { confirm: loadAds },
  })
}

const handleToggleAdStatus = async (row: AdResponseDto) => {
  const newStatus = row.status === STATUS.ENABLED ? STATUS.DISABLED : STATUS.ENABLED
  const actionText = newStatus === STATUS.ENABLED ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${actionText}广告「${row.title}」？`, `确认${actionText}`, { type: 'warning' })
  } catch { return }
  await new ApiAdUpdate(
    { params: { id: row.id }, body: { status: newStatus } },
    { hintSuccess: true, successMsg: `${actionText}成功` },
  )
  loadAds()
}

const handleDeleteAd = async (row: AdResponseDto) => {
  try {
    await ElMessageBox.confirm(`确定删除广告「${row.title}」吗？`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiAdDelete({ params: { id: row.id } }, { hintSuccess: true })
  loadAds()
}

const handleDragEnd = async (event: { oldIndex: number; newIndex: number }) => {
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return

  const items = ads.value.map((ad, index) => ({ id: ad.id, sortOrder: index }))
  try {
    await new ApiAdBatchUpdateSort({ body: { items } }, { hintSuccess: true })
  } catch {
    loadAds()
  }
}

const handleClose = () => {
  visible.value = false
}

defineExpose({ open, close: handleClose })
</script>

<style scoped>
.drawer-header {
  display: flex;
  align-items: center;
}
.drawer-content {
  padding: 0 20px 20px;
}
.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.ad-grid-container {
  min-height: 200px;
}
.ad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  min-height: 100px;
}
.ghost-card {
  opacity: 0.5;
  background: #c8ebfb;
}
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
