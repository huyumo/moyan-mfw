<!--
/**
 * @fileoverview 广告位管理列表页
 * @description 管理广告位及其关联的类型配置
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="'添加'">
        <el-icon><Plus /></el-icon>新建广告位
      </el-button>
    </template>

    <MfwListPage
      ref="listPage"
      :search-template="searchTemplate"
      :columns="columns"
      :action-column="actionColumn"
      :load-data="loadData"
    />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElTag, ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwFormat, MfwPopup } from 'moyan-mfw-base-frontend'
import type { MfwListPageInstance } from 'moyan-mfw-base-frontend'
import { renderActionButtons } from 'moyan-mfw-base-frontend'
import {
  ApiAdPlacementFindAll,
  ApiAdPlacementCreate,
  ApiAdPlacementUpdate,
  ApiAdPlacementDelete,
} from '../../apis'
import { StatusDict } from 'moyan-shared-dict'
import { AD_PATHS } from '../../shared/paths'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementList' })
const listPage = ref<MfwListPageInstance>()
const router = useRouter()

const searchTemplate = [
  { key: 'name', label: '广告位名称', type: 'input' as const, placeholder: '请输入广告位名称' },
  { key: 'code', label: '广告位编码', type: 'input' as const, placeholder: '请输入广告位编码' },
  { key: 'status', label: '状态', type: 'select' as const, placeholder: '请选择状态',
    elProps: { options: [{ label: '启用', value: STATUS.ENABLED }, { label: '禁用', value: STATUS.DISABLED }] },
  },
]

const columns = [
  { prop: 'name', label: '广告位名称', minWidth: 140 },
  { prop: 'code', label: '广告位编码', minWidth: 120 },
  { prop: 'description', label: '描述', minWidth: 180, showOverflowTooltip: true },
  { prop: 'sortOrder', label: '排序', width: 80 },
  { prop: 'status', label: '状态', width: 80,
    render: ({ row }: any) => h(ElTag, {
      type: row.status === STATUS.ENABLED ? 'success' : 'danger', size: 'small',
    }, () => row.status === STATUS.ENABLED ? '启用' : '禁用'),
  },
  { prop: 'createdAt', label: '创建时间', width: 170,
    render: ({ row }: any) => h(MfwFormat, { value: row.createdAt, type: 'date' }),
  },
]

const actionColumn = {
  prop: 'action', label: '操作', width: 220, fixed: 'right' as const,
  render: ({ row }: any) => renderActionButtons([
    { label: '编辑', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['编辑'] },
    { label: '广告内容', type: 'default', icon: 'Document', onClick: handleManageAd },
    { label: '删除', type: 'danger', icon: Delete, onClick: handleDelete, permission: ['删除'] },
  ], { maxVisible: 3 }, row),
}

const loadData = async (params: Record<string, unknown>) => {
  const api = new ApiAdPlacementFindAll()
  const res = await api.call(params)
  return res.data?.data
}
const handleAdd = () => {
  MfwPopup.open({
    title: '新建广告位', type: 'dialog',
    component: () => import('../../components/ad-placement-form/Index.vue'),
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  })
}
const handleEdit = (row: any) => {
  MfwPopup.open({
    title: '编辑广告位', type: 'dialog',
    component: () => import('../../components/ad-placement-form/Index.vue'),
    data: { ...row },
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  })
}
const handleManageAd = (row: any) => {
  router.push(`${AD_PATHS.CONTENT}?placementId=${row.id}`)
}
const handleDelete = async (row: any) => {
  try { await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`, '确认删除', { type: 'warning' }) }
  catch { return }
  await new ApiAdPlacementDelete().call(row.id)
  listPage.value?.refresh()
}
</script>
