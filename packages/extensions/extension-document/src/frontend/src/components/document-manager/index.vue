<!--
/**
 * @fileoverview MfwDocumentManager 文档管理页面组件
 * @description 高内聚开箱即用的完整管理页面，基于 MfwPageWrapper + MfwListPage + MfwPopup 规范
 * 使用者只需配置 docKey + 字段开关即可得到一个完整的文档管理页面
 */
-->
<template>
  <MfwPageWrapper :title="title">
    <template #header-extra>
      <slot name="header-extra" />
      <el-button
        v-if="showAdd !== false"
        type="primary"
        data-testid="document-create-btn"
        @click="handleAdd"
      >
        <el-icon><Plus /></el-icon>
        新建文档
      </el-button>
    </template>

    <MfwListPage
      ref="listPageRef"
      :search-template="realSearchTemplate"
      :columns="realColumns"
      :action-column="realActionColumn"
      :load-data="loadData"
      :page-size="pageSize"
    >
      <template v-if="$slots['search-extra']" #search-extra>
        <slot name="search-extra" />
      </template>
    </MfwListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { Plus, View, Edit, Delete } from '@element-plus/icons-vue';
import {
  MfwPageWrapper,
  MfwListPage,
  MfwDateFormat,
  MfwPopup,
  renderActionButtons,
  type MfwListPageInstance,
  type TableColumnConfig,
  type ActionColumnConfig,
  type SearchTemplateItem,
} from 'moyan-mfw-base/frontend';
import { DocumentStatus } from 'moyan-mfw-extension-document/shared';
import DocumentForm from './DocumentForm.vue';
import DocumentDetail from './DocumentDetail.vue';
import { listDocuments, getDocumentById, deleteDocument } from './api';
import type {
  MfwDocumentManagerProps,
  MfwDocumentManagerExpose,
  DocumentFieldConfig,
  DocumentExtFieldConfig,
  DocumentColumnConfig,
  DocumentSearchField,
  DocumentData,
} from './types';

const props = withDefaults(defineProps<MfwDocumentManagerProps>(), {
  appId: null,
  formFields: () => [],
  extFields: () => [],
  columns: () => [],
  searchFields: () => [],
  showAdd: true,
  showEdit: true,
  showDelete: true,
  showView: true,
  formPopupType: 'dialog',
  formPopupWidth: 720,
  detailPopupType: 'drawer',
  detailPopupSize: 600,
  pageSize: 20,
  baseUrl: '/api/ext/document',
});

const listPageRef = ref<MfwListPageInstance>();

const STATUS_TEXT: Record<number, string> = {
  [DocumentStatus.DRAFT]: '草稿',
  [DocumentStatus.PUBLISHED]: '已发布',
  [DocumentStatus.OFFLINE]: '已下线',
};

const STATUS_TAG: Record<number, 'success' | 'info' | 'warning' | 'danger'> = {
  [DocumentStatus.DRAFT]: 'info',
  [DocumentStatus.PUBLISHED]: 'success',
  [DocumentStatus.OFFLINE]: 'warning',
};

/** 搜索模板：用户自定义优先，否则默认 */
const realSearchTemplate = computed<SearchTemplateItem[]>(() => {
  if (props.searchFields.length) {
    return props.searchFields as SearchTemplateItem[];
  }
  return [
    { key: 'keyword', label: '关键词', type: 'input', placeholder: '搜索标题/摘要' },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '选择状态',
      elProps: {
        options: [
          { label: '草稿', value: DocumentStatus.DRAFT },
          { label: '已发布', value: DocumentStatus.PUBLISHED },
          { label: '已下线', value: DocumentStatus.OFFLINE },
        ],
      },
    },
    { key: 'docGroup', label: '分组', type: 'input', placeholder: '搜索分组' },
  ];
});

/** 列配置：用户自定义优先，否则默认 */
const realColumns = computed<TableColumnConfig[]>(() => {
  if (props.columns.length) {
    return props.columns as TableColumnConfig[];
  }
  return [
    { prop: 'title', label: '标题', minWidth: 200 },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      render: ({ row }) =>
        h(
          ElTag,
          { size: 'small', type: STATUS_TAG[row.status] || 'info' },
          () => STATUS_TEXT[row.status] ?? String(row.status ?? ''),
        ),
    },
    { prop: 'docGroup', label: '分组', width: 120 },
    { prop: 'viewPageviews', label: '浏览量', width: 100, sortable: true },
    {
      prop: 'createdAt',
      label: '创建时间',
      width: 180,
      render: ({ row }) => h(MfwDateFormat, { value: row.createdAt }),
    },
  ];
});

/** 操作列 */
const realActionColumn = computed<ActionColumnConfig>(() => ({
  label: '操作',
  width: 200,
  fixed: 'right',
  render: ({ row }) =>
    renderActionButtons(
      [
        { label: '查看', type: 'primary', icon: View, onClick: handleView, testId: 'document-view-btn' },
        { label: '编辑', type: 'primary', icon: Edit, onClick: handleEdit, testId: 'document-edit-btn' },
        { label: '删除', type: 'danger', icon: Delete, onClick: handleDelete, testId: 'document-delete-btn' },
      ],
      { maxVisible: 3 },
      row,
    ),
}));

/** 加载列表数据 */
async function loadData(params: Record<string, any>): Promise<{ list: any[]; total: number }> {
  const query: Record<string, any> = {
    ...params,
    docKey: props.docKey,
  };
  if (props.appId !== null && props.appId !== undefined) {
    query.appId = props.appId;
  }
  const result = await listDocuments(query);
  return { list: result.list || [], total: Number(result.total) || 0 };
}

/** 新增 */
function handleAdd() {
  MfwPopup.open({
    title: '新建文档',
    type: props.formPopupType,
    component: DocumentForm,
    elProps: {
      docKey: props.docKey,
      appId: props.appId,
      fields: props.formFields,
      extFields: props.extFields,
    },
    popupProps: { width: props.formPopupWidth, size: props.formPopupWidth },
    on: { confirm: () => listPageRef.value?.refresh() },
  });
}

/** 编辑 */
function handleEdit(row: DocumentData) {
  MfwPopup.open({
    title: '编辑文档',
    type: props.formPopupType,
    component: DocumentForm,
    elProps: {
      docKey: props.docKey,
      appId: props.appId,
      record: row,
      fields: props.formFields,
      extFields: props.extFields,
    },
    popupProps: { width: props.formPopupWidth, size: props.formPopupWidth },
    on: { confirm: () => listPageRef.value?.refresh() },
  });
}

/** 查看 */
function handleView(row: DocumentData) {
  MfwPopup.open({
    title: '文档详情',
    type: props.detailPopupType,
    component: DocumentDetail,
    elProps: {
      id: row.id,
      showExtFields: props.extFields.length > 0,
    },
    footer: false,
    popupProps: { size: props.detailPopupSize, width: props.detailPopupSize },
  });
}

/** 删除 */
async function handleDelete(row: DocumentData) {
  try {
    await ElMessageBox.confirm(`确定删除文档「${row.title}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  if (!row.id) return;
  try {
    await deleteDocument(row.id);
    ElMessage.success('删除成功');
    await listPageRef.value?.refresh();
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败');
  }
}

function refresh(): Promise<void> {
  return listPageRef.value?.refresh() ?? Promise.resolve();
}

defineExpose<MfwDocumentManagerExpose>({ refresh });
</script>
