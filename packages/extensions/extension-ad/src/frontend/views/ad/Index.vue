<!--
/**
 * @fileoverview 广告内容管理列表页
 * @description 管理广告位下具体的广告内容，支持小程序/App内部/外部链接三种跳转方式
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="'添加'">
        <el-icon><Plus /></el-icon>新建广告
      </el-button>
    </template>

    <MfwListPage
      ref="listPage"
      :filters="getFilters()"
      :search-template="searchTemplate"
      :columns="columns"
      :action-column="actionColumn"
      :load-data="loadData"
    />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElTag, ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwDateFormat, MfwPopup } from '@internal/base-frontend'
import type { MfwListPageInstance } from '@internal/base-frontend'
import { renderActionButtons } from '@internal/base-frontend'
import {
  ApiAdFindAll,
  ApiAdCreate,
  ApiAdUpdate,
  ApiAdDelete,
} from '../../apis/ad'
import { StatusDict } from '@internal/base-shared'
import { LINK_TYPE_LABELS, LINK_TYPE } from '@internal/ad-shared'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdContentList' })
const listPage = ref<MfwListPageInstance>()
const route = useRoute()

const searchTemplate = [
  { key: 'title', label: '广告标题', type: 'input' as const, placeholder: '请输入广告标题' },
  { key: 'linkType', label: '跳转类型', type: 'select' as const, placeholder: '请选择跳转类型',
    elProps: { options: Object.entries(LINK_TYPE_LABELS).map(([k, v]) => ({ label: v, value: k })) },
  },
  { key: 'status', label: '状态', type: 'select' as const, placeholder: '请选择状态',
    elProps: { options: [{ label: '启用', value: STATUS.ENABLED }, { label: '禁用', value: STATUS.DISABLED }] },
  },
]

const getFilters = () => {
  const placementId = route.query.placementId as string
  return placementId ? [{ key: 'placementId', defaultValue: placementId }] : []
}

const columns = [
  { prop: 'title', label: '广告标题', minWidth: 140 },
  { prop: 'imageUrl', label: '广告图片', width: 100,
    render: ({ row }: any) => h('img', { src: row.imageUrl, style: 'width:60px;height:40px;object-fit:cover;border-radius:4px' }),
  },
  { prop: 'linkType', label: '跳转方式', width: 120,
    render: ({ row }: any) => h(ElTag, { type: 'info', size: 'small' },
      () => LINK_TYPE_LABELS[row.linkType as keyof typeof LINK_TYPE_LABELS] || row.linkType),
  },
  { prop: 'sortOrder', label: '排序', width: 80 },
  { prop: 'status', label: '状态', width: 80,
    render: ({ row }: any) => h(ElTag, {
      type: row.status === STATUS.ENABLED ? 'success' : 'danger', size: 'small',
    }, () => row.status === STATUS.ENABLED ? '启用' : '禁用'),
  },
  { prop: 'createdAt', label: '创建时间', width: 170,
    render: ({ row }: any) => h(MfwDateFormat, { value: row.createdAt }),
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
  const res = await new ApiAdFindAll({ query: params as any })
  return (res as any).list
}
const handleAdd = () => {
  const placementId = route.query.placementId as string
  MfwPopup.open({
    title: '新建广告', type: 'dialog',
    component: () => import('../../components/ad-form/Index.vue'),
    data: placementId ? { placementId } : {},
    popupProps: { width: 620 },
    on: { confirm: listPage.value?.refresh },
  })
}
const handleEdit = (row: any) => {
  MfwPopup.open({
    title: '编辑广告', type: 'dialog',
    component: () => import('../../components/ad-form/Index.vue'),
    data: { ...row },
    popupProps: { width: 620 },
    on: { confirm: listPage.value?.refresh },
  })
}
const handleDelete = async (row: any) => {
  try { await ElMessageBox.confirm(`确定删除广告「${row.title}」吗？`, '确认删除', { type: 'warning' }) }
  catch { return }
  await new ApiAdDelete({ params: { id: row.id } })
  listPage.value?.refresh()
}
</script>
