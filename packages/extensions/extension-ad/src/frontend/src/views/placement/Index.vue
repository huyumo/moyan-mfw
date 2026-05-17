<!--
/**
 * @fileoverview 广告位管理列表页
 * @description 卡片展示广告位，支持轮播预览广告效果
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="{ value: ['添加'] }">
        <el-icon><Plus /></el-icon>新建广告位
      </el-button>
    </template>

    <MfwSearchPanel
      ref="searchPanelRef"
      :search-template="searchTemplate"
      search-trigger="submit"
    >
      <template #search-extra>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </template>
    </MfwSearchPanel>

    <div v-loading="loading" class="card-grid">
      <MfwAdPlacementCard
        v-for="placement in placements"
        :key="placement.id"
        :placement="placement"
        :ads="placementAds[placement.id] || []"
        :ad-count="placementAdCounts[placement.id] || 0"
        @manage-ads="handleManageAds"
        @edit="handleEdit"
        @delete="handleDelete"
        @toggle-status="handleToggleStatus"
      />
      <div v-if="!loading && placements.length === 0" class="empty-state">
        <el-empty description="暂无广告位数据" />
      </div>
    </div>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[12, 24, 48]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadPlacements"
      @current-change="loadPlacements"
    />

    <MfwAdPlacementDetail ref="detailRef" @close="loadPlacements" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwSearchPanel, MfwPopup } from 'moyan-mfw-base/frontend'
import {
  ApiAdPlacementFindAll,
  ApiAdPlacementUpdate,
  ApiAdPlacementDelete,
  ApiAdFindAll,
} from '../../apis/ad'
import type { AdPlacementResponseDto, AdResponseDto } from '../../apis/ad/schemas'
import { StatusDict } from 'moyan-mfw-base/shared'
import MfwAdPlacementForm from '../../components/ad-placement-form/Index.vue'
import MfwAdPlacementDetail from '../../components/ad-placement-detail/Index.vue'
import MfwAdPlacementCard from '../../components/ad-placement-card/Index.vue'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementList' })

const loading = ref(false)
const placements = ref<AdPlacementResponseDto[]>([])
const placementAds = ref<Record<string, AdResponseDto[]>>({})
const placementAdCounts = ref<Record<string, number>>({})

const searchPanelRef = ref<{ getFormValues: () => Record<string, any>; reset: () => void }>()

const searchTemplate = [
  {
    key: 'name',
    label: '广告位名称',
    type: 'input' as const,
    placeholder: '请输入广告位名称',
  },
  {
    key: 'code',
    label: '广告位编码',
    type: 'input' as const,
    placeholder: '请输入广告位编码',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    placeholder: '请选择状态',
    elProps: {
      options: [
        { label: '启用', value: StatusDict.ENABLED },
        { label: '禁用', value: StatusDict.DISABLED },
      ],
    },
  },
]

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
})

const detailRef = ref<InstanceType<typeof MfwAdPlacementDetail>>()

const loadPlacements = async () => {
  loading.value = true
  try {
    const searchParams = searchPanelRef.value?.getFormValues() || {}
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }

    const res = await new ApiAdPlacementFindAll({ query: params })
    placements.value = res.list || []
    pagination.total = res.total

    await loadAdsForPlacements(placements.value.map(p => p.id))
  } finally {
    loading.value = false
  }
}

const loadAdsForPlacements = async (placementIds: string[]) => {
  const promises = placementIds.map(id =>
    new ApiAdFindAll({ query: { page: 1, pageSize: 10, placementId: id, status: STATUS.ENABLED } })
  )
  const results = await Promise.all(promises)

  placementIds.forEach((id, index) => {
    placementAds.value[id] = results[index].list || []
    placementAdCounts.value[id] = results[index].total || 0
  })
}

const handleSearch = () => {
  pagination.page = 1
  loadPlacements()
}

const handleReset = () => {
  searchPanelRef.value?.reset()
  pagination.page = 1
  loadPlacements()
}

const handleAdd = () => {
  MfwPopup.open({
    title: '新建广告位',
    type: 'dialog',
    component: MfwAdPlacementForm,
    popupProps: { width: 550 },
    on: { confirm: loadPlacements },
  })
}

const handleManageAds = (row: any) => {
  detailRef.value?.open(row.id, row)
}

const handleEdit = (row: any) => {
  MfwPopup.open({
    title: '编辑广告位',
    type: 'dialog',
    component: MfwAdPlacementForm,
    data: { ...row },
    popupProps: { width: 550 },
    on: { confirm: loadPlacements },
  })
}

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === STATUS.ENABLED ? STATUS.DISABLED : STATUS.ENABLED
  const actionText = newStatus === STATUS.ENABLED ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${actionText}广告位「${row.name}」？`, `确认${actionText}`, { type: 'warning' })
  } catch { return }
  await new ApiAdPlacementUpdate(
    { params: { id: row.id }, body: { status: newStatus } },
    { hintSuccess: true, successMsg: `${actionText}成功` },
  )
  loadPlacements()
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiAdPlacementDelete({ params: { id: row.id } }, { hintSuccess: true })
  loadPlacements()
}

onMounted(() => {
  loadPlacements()
})
</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  min-height: 200px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
