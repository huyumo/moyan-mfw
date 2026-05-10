<!--
/**
 * @fileoverview 广告位类型配置管理列表页
 * @description 管理广告位的尺寸类型配置（如首页横幅 750x300、弹窗广告 600x400）
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="'添加'">
        <el-icon><Plus /></el-icon>新建类型
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElTag, ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwPopup } from 'moyan-mfw-base-frontend'
import type { MfwListPageInstance } from 'moyan-mfw-base-frontend'
import { renderActionButtons } from 'moyan-mfw-base-frontend'
import { AdApi } from '../../api'

const STATUS = { ENABLED: 1, DISABLED: 0 } as const
defineOptions({ name: 'MfwAdTypeList' })
const listPage = ref<MfwListPageInstance>()

const searchTemplate = [
  { key: 'name', label: '类型名称', type: 'input' as const, placeholder: '请输入类型名称' },
  { key: 'code', label: '类型编码', type: 'input' as const, placeholder: '请输入类型编码' },
  { key: 'status', label: '状态', type: 'select' as const, placeholder: '请选择状态',
    elProps: { options: [{ label: '启用', value: STATUS.ENABLED }, { label: '禁用', value: STATUS.DISABLED }] },
  },
]

const columns = [
  { prop: 'name', label: '类型名称', minWidth: 120 },
  { prop: 'code', label: '类型编码', minWidth: 120 },
  { prop: 'width', label: '宽度(px)', width: 100 },
  { prop: 'height', label: '高度(px)', width: 100 },
  { prop: 'description', label: '描述', minWidth: 150, showOverflowTooltip: true },
  { prop: 'sortOrder', label: '排序', width: 80 },
  { prop: 'status', label: '状态', width: 80,
    render: ({ row }: any) => h(ElTag, {
      type: row.status === STATUS.ENABLED ? 'success' : 'danger', size: 'small',
    }, () => row.status === STATUS.ENABLED ? '启用' : '禁用'),
  },
]

const actionColumn = {
  prop: 'action', label: '操作', width: 160, fixed: 'right' as const,
  render: ({ row }: any) => renderActionButtons([
    { label: '编辑', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['编辑'] },
    { label: '删除', type: 'danger', icon: Delete, onClick: handleDelete, permission: ['删除'] },
  ], { maxVisible: 2 }, row),
}

const loadData = async (params: Record<string, unknown>) => {
  const res = await AdApi.getTypes(params)
  return res.data?.data
}
const handleAdd = () => {
  MfwPopup.open({
    title: '新建类型', type: 'dialog',
    component: () => import('../../components/ad-placement-type-form/Index.vue'),
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  })
}
const handleEdit = (row: any) => {
  MfwPopup.open({
    title: '编辑类型', type: 'dialog',
    component: () => import('../../components/ad-placement-type-form/Index.vue'),
    data: { ...row },
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  })
}
const handleDelete = async (row: any) => {
  try { await ElMessageBox.confirm(`确定删除类型「${row.name}」吗？`, '确认删除', { type: 'warning' }) }
  catch { return }
  await AdApi.deleteType(row.id)
  listPage.value?.refresh()
}
</script>
