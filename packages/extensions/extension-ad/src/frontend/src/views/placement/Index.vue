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

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="广告位名称">
          <el-input v-model="searchForm.name" placeholder="请输入广告位名称" clearable />
        </el-form-item>
        <el-form-item label="广告位编码">
          <el-input v-model="searchForm.code" placeholder="请输入广告位编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="StatusDict.ENABLED" />
            <el-option label="禁用" :value="StatusDict.DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" data-testid="search-btn">搜索</el-button>
          <el-button @click="handleReset" data-testid="reset-btn">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 卡片网格 -->
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
    </div>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[12, 24, 48]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadPlacements"
      @current-change="loadPlacements"
    />

    <MfwAdPlacementDetail ref="detailRef" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwPopup } from 'moyan-mfw-base/frontend'
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

const searchForm = reactive({
  name: '',
  code: '',
  status: undefined as number | undefined,
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
})

const detailRef = ref<InstanceType<typeof MfwAdPlacementDetail>>()

const loadPlacements = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.code) params.code = searchForm.code
    if (searchForm.status !== undefined) params.status = searchForm.status

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
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = undefined
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
.search-bar {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
}

.search-bar .el-select {
  width: 120px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  min-height: 200px;
}
</style>
