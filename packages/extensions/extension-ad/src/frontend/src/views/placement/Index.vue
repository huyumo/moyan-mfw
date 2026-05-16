<!--
/**
 * @fileoverview 广告位管理列表页
 * @description 管理广告位及其尺寸配置，点击行查看广告详情，支持状态切换
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
      :row-click="handleRowClick"
      search-label-width="100px"
    />

    <MfwAdPlacementDetail ref="detailRef" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { Plus, Edit, Delete, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElTag, ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwDateFormat, MfwPopup, renderActionButtons } from 'moyan-mfw-base/frontend'
import type { MfwListPageInstance } from 'moyan-mfw-base/frontend'
import {
  ApiAdPlacementFindAll,
  ApiAdPlacementUpdate,
  ApiAdPlacementDelete,
} from '../../apis/ad'
import { StatusDict } from 'moyan-mfw-base/shared'
import MfwAdPlacementForm from '../../components/ad-placement-form/Index.vue'
import MfwAdPlacementDetail from '../../components/ad-placement-detail/Index.vue'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementList' })
const listPage = ref<MfwListPageInstance>()
const detailRef = ref<InstanceType<typeof MfwAdPlacementDetail>>()

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
  { prop: 'size', label: '尺寸', width: 120,
    render: ({ row }: any) => h('span', `${row.width}x${row.height}px`),
  },
  { prop: 'description', label: '描述', minWidth: 180, showOverflowTooltip: true },
  { prop: 'sortOrder', label: '排序', width: 80 },
  { prop: 'status', label: '状态', width: 90,
    render: ({ row }: any) => h(ElTag, {
      type: row.status === STATUS.ENABLED ? 'success' : 'danger', size: 'small',
    }, () => row.status === STATUS.ENABLED ? '启用' : '禁用'),
  },
  { prop: 'createdAt', label: '创建时间', width: 170,
    render: ({ row }: any) => h(MfwDateFormat, { value: row.createdAt }),
  },
]

const actionColumn = {
  prop: 'action', label: '操作', width: 200, fixed: 'right' as const,
  render: ({ row }: any) => renderActionButtons([
    {
      label: row.status === STATUS.ENABLED ? '禁用' : '启用',
      type: row.status === STATUS.ENABLED ? 'warning' : 'success',
      icon: row.status === STATUS.ENABLED ? CircleClose : CircleCheck,
      onClick: handleToggleStatus,
      permission: ['编辑'],
    },
    { label: '编辑', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['编辑'] },
    { label: '删除', type: 'danger', icon: Delete, onClick: handleDelete, permission: ['删除'] },
  ], { maxVisible: 3 }, row),
}

const loadData = async (params: Record<string, unknown>) => {
  const res = await new ApiAdPlacementFindAll({ query: params as any })
  return (res as any).list
}

const handleRowClick = (row: any) => {
  detailRef.value?.open(row.id, row)
}

const handleAdd = () => {
  MfwPopup.open({
    title: '新建广告位', type: 'dialog',
    component: MfwAdPlacementForm,
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  })
}
const handleEdit = (row: any) => {
  MfwPopup.open({
    title: '编辑广告位', type: 'dialog',
    component: MfwAdPlacementForm,
    data: { ...row },
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
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
  listPage.value?.refresh()
}

const handleDelete = async (row: any) => {
  try { await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`, '确认删除', { type: 'warning' }) }
  catch { return }
  await new ApiAdPlacementDelete({ params: { id: row.id } }, { hintSuccess: true })
  listPage.value?.refresh()
}
</script>
