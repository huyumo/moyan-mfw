<!--
/**
 * @fileoverview 广告位详情抽屉组件
 * @description 在广告位详情中管理具体广告内容，支持调整排序和状态切换
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

        <el-table
          v-loading="loading"
          :data="ads"
          row-key="id"
          style="width: 100%"
        >
          <el-table-column label="排序" width="120">
            <template #default="{ row, $index }">
              <el-button
                size="small"
                :icon="Top"
                :disabled="$index === 0"
                @click="handleMoveUp(row, $index)"
                v-permission="{ value: ['编辑'] }"
              />
              <el-button
                size="small"
                :icon="Bottom"
                :disabled="$index === ads.length - 1"
                @click="handleMoveDown(row, $index)"
                v-permission="{ value: ['编辑'] }"
              />
              <span style="margin-left: 8px; color: #909399; font-size: 12px">{{ row.sortOrder }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="广告标题" min-width="140" />
          <el-table-column prop="imageUrl" label="广告图片" width="100">
            <template #default="{ row }">
              <img :src="row.imageUrl" style="width:60px;height:40px;object-fit:cover;border-radius:4px" />
            </template>
          </el-table-column>
          <el-table-column prop="linkType" label="跳转方式" width="100">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ LINK_TYPE_LABELS[row.linkType as keyof typeof LINK_TYPE_LABELS] || row.linkType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === STATUS.ENABLED ? 'success' : 'danger'" size="small">
                {{ row.status === STATUS.ENABLED ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button
                type="warning" link
                @click="handleToggleAdStatus(row)"
                v-permission="{ value: ['编辑'] }"
              >
                {{ row.status === STATUS.ENABLED ? '禁用' : '启用' }}
              </el-button>
              <el-button type="primary" link @click="handleEditAd(row)" v-permission="{ value: ['编辑'] }">编辑</el-button>
              <el-button type="danger" link @click="handleDeleteAd(row)" v-permission="{ value: ['删除'] }">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Refresh, Top, Bottom } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { MfwPopup } from 'moyan-mfw-base/frontend'
import { ApiAdFindAll, ApiAdUpdate, ApiAdDelete, ApiAdBatchUpdateSort } from '../../apis/ad'
import { StatusDict } from 'moyan-mfw-base/shared'
import { LINK_TYPE_LABELS } from 'moyan-mfw-extension-ad/shared'
import MfwAdForm from '../ad-form/Index.vue'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementDetail' })

const visible = ref(false)
const loading = ref(false)
const ads = ref<any[]>([])

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
    data: { placementId: placementIdRef.value },
    popupProps: { width: 620 },
    on: { confirm: loadAds },
  })
}

const handleEditAd = (row: any) => {
  MfwPopup.open({
    title: '编辑广告',
    type: 'dialog',
    component: MfwAdForm,
    data: { ...row },
    popupProps: { width: 620 },
    on: { confirm: loadAds },
  })
}

const handleToggleAdStatus = async (row: any) => {
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

const handleDeleteAd = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除广告「${row.title}」吗？`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiAdDelete({ params: { id: row.id } }, { hintSuccess: true })
  loadAds()
}

const handleMoveUp = async (row: any, index: number) => {
  if (index === 0) return
  const list = [...ads.value]
  const item = list.splice(index, 1)[0]
  list.splice(index - 1, 0, item)
  ads.value = list
  await batchSaveSort(list)
}

const handleMoveDown = async (row: any, index: number) => {
  if (index >= ads.value.length - 1) return
  const list = [...ads.value]
  const item = list.splice(index, 1)[0]
  list.splice(index + 1, 0, item)
  ads.value = list
  await batchSaveSort(list)
}

const batchSaveSort = async (list: any[]) => {
  const items = list.map((item: any, index: number) => ({
    id: item.id,
    sortOrder: (list.length - index) * 10,
  }))
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
</style>
