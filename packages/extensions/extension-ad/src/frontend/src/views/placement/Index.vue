<!--
/**
 * @fileoverview 广告位管理列表页
 * @description 卡片展示广告位，支持轮播预览广告效果
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" data-testid="placement-create-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新建广告位
      </el-button>
    </template>
    <MfwCardListPage
      ref="cardListPage"
      :search-template="searchTemplate"
      :load-data="loadData"
      render-mode="card"
      empty-text="暂无广告位"
    >
      <template #card-item="{ item }">
        <MfwAdPlacementCard
          :placement="item"
          :ads="item.ads || []"
          :ad-count="item.adCount || 0"
          @manage-ads="handleManageAds(item)"
          @edit="handleEdit(item)"
          @delete="handleDelete(item)"
        />
      </template>
    </MfwCardListPage>
    <MfwAdPlacementDetail ref="detailRef" @close="cardListPage?.refresh()" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwCardListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import type { MfwCardListPageInstance } from 'moyan-mfw-base/frontend'
import {
  ApiAdPlacementFindAll,
  ApiAdPlacementUpdate,
  ApiAdPlacementDelete,
} from '../../apis/ad'
import { StatusDict } from 'moyan-mfw-base/shared'
import MfwAdPlacementForm from '../../components/ad-placement-form/Index.vue'
import MfwAdPlacementDetail from '../../components/ad-placement-detail/Index.vue'
import MfwAdPlacementCard from '../../components/ad-placement-card/Index.vue'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementList' })

const cardListPage = ref<MfwCardListPageInstance>()
const detailRef = ref<InstanceType<typeof MfwAdPlacementDetail>>()

const searchTemplate = [
  {
    key: 'name',
    label: '名称',
    type: 'input' as const,
    testId: 'placement-search-name',
    placeholder: '请输入名称',
  },
  {
    key: 'code',
    label: '编码',
    type: 'input' as const,
    testId: 'placement-search-code',
    placeholder: '请输入编码',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    testId: 'placement-search-status',
    placeholder: '请选择状态',
    elProps: {
      options: [
        { label: '启用', value: STATUS.ENABLED },
        { label: '禁用', value: STATUS.DISABLED },
      ],
    },
  },
]

const loadData = async (params: Record<string, unknown>) => {
  return await new ApiAdPlacementFindAll({ query: params as any })
}

const handleAdd = () => {
  MfwPopup.open({
    title: '新建广告位',
    type: 'dialog',
    component: MfwAdPlacementForm,
    popupProps: { width: 550 },
    on: { confirm: cardListPage.value?.refresh },
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
    on: { confirm: cardListPage.value?.refresh },
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiAdPlacementDelete({ params: { id: row.id } }, { hintSuccess: true })
  cardListPage.value?.refresh()
}
</script>
