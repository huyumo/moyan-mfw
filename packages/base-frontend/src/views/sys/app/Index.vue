<!--
/**
 * @fileoverview 应用实例管理列表页面
 * @description 管理应用实例的创建、编辑、删除和拥有者管理
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新建应用
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
import { ref, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus';
import { Plus, View, Edit, Delete, User } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwListPage } from '../../../components';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
import { MfwPopup } from '../../../components/feedback';
import {
  ApiAppFindAll,
  ApiAppDelete,
  ApiAppTypeFindAllList,
} from '../../../apis/sys';
import type { AppDetailResponseDto, AppTypeResponseDto } from '../../../apis/sys/schemas';
import AppForm from './AppForm.vue';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwAppList' });

const router = useRouter();
const listPage = ref<MfwListPageInstance>();

/** 应用类型列表（用于搜索模板） */
const appTypeList = ref<AppTypeResponseDto[]>([]);

/** 搜索模板 */
const searchTemplate = ref([
  {
    key: 'appName',
    label: '应用名称',
    type: 'input' as const,
    placeholder: '请输入应用名称',
  },
  {
    key: 'appCode',
    label: '应用编码',
    type: 'input' as const,
    placeholder: '请输入应用编码',
  },
  {
    key: 'appTypeId',
    label: '应用类型',
    type: 'select' as const,
    placeholder: '请选择应用类型',
    elProps: {
      options: [] as { label: string; value: string }[],
    },
  },
  {
    key: 'appStatus',
    label: '状态',
    type: 'select' as const,
    placeholder: '请选择状态',
    elProps: {
      options: [
        { label: '启用', value: STATUS.ENABLED },
        { label: '禁用', value: STATUS.DISABLED },
      ],
    },
  },
]);

/** 表格列 */
const columns = [
  { prop: 'appName', label: '应用名称', minWidth: 150 },
  { prop: 'appCode', label: '应用编码', minWidth: 120 },
  {
    prop: 'appType',
    label: '应用类型',
    minWidth: 120,
    render: ({ row }: { row: AppDetailResponseDto }) => (row.appType as any)?.typeName || '-',
  },
  {
    prop: 'owner',
    label: '拥有者',
    minWidth: 120,
    render: ({ row }: { row: AppDetailResponseDto }) => (row.owner as any)?.nickname || (row.owner as any)?.username || '-',
  },
  {
    prop: 'appStatus',
    label: '状态',
    width: 80,
    render: ({ row }: { row: AppDetailResponseDto }) => h(ElTag, {
      type: row.appStatus === STATUS.ENABLED ? 'success' : 'danger',
      size: 'small',
    }, () => row.appStatus === STATUS.ENABLED ? '启用' : '禁用'),
  },
  { prop: 'sortOrder', label: '排序', width: 80 },
  { prop: 'createdAt', label: '创建时间', width: 180 },
];

/** 操作列 */
const actionColumn = {
  prop: 'action',
  label: '操作',
  width: 280,
  fixed: 'right' as const,
  render: ({ row }: { row: AppDetailResponseDto }) => h('div', { class: 'action-buttons' }, [
    h(ElButton, {
      type: 'primary',
      link: true,
      icon: View,
      onClick: () => handleDetail(row),
    }, () => '详情'),
    h(ElButton, {
      type: 'primary',
      link: true,
      icon: Edit,
      onClick: () => handleEdit(row),
    }, () => '编辑'),
    h(ElButton, {
      type: 'primary',
      link: true,
      icon: User,
      onClick: () => handleMember(row),
    }, () => '成员'),
    h(ElButton, {
      type: 'danger',
      link: true,
      icon: Delete,
      onClick: () => handleDelete(row),
    }, () => '删除'),
  ]),
};

/** 加载应用类型列表 */
const loadAppTypes = async () => {
  const result = await new ApiAppTypeFindAllList({ params: {} });
  appTypeList.value = result || [];

  // 更新搜索模板的应用类型选项
  const typeOptions = result.map((item: AppTypeResponseDto) => ({
    label: item.typeName,
    value: item.id,
  }));
  if (searchTemplate.value[2]?.elProps) {
    searchTemplate.value[2].elProps.options = typeOptions;
  }
};

/** 加载数据 */
const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiAppFindAll({
    query: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      appName: params.appName as string,
      appCode: params.appCode as string,
      appTypeId: params.appTypeId as string,
      appStatus: params.appStatus as number,
    },
  });
  return {
    list: result.list || [],
    total: result.total || 0,
  };
};

/** 查看详情 */
const handleDetail = (row: AppDetailResponseDto) => {
  router.push(`/sys/app/${row.id}`);
};

/** 新建 */
const handleAdd = () => {
  MfwPopup.open({
    title: '新建应用',
    type: 'dialog',
    component: AppForm,
    popupProps: { width: 550 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        listPage.value?.refresh();
      },
    },
  });
};

/** 编辑 */
const handleEdit = (row: AppDetailResponseDto) => {
  MfwPopup.open({
    title: '编辑应用',
    type: 'dialog',
    component: AppForm,
    data: { ...row },
    popupProps: { width: 550 },
    on: {
      confirm: () => {
        ElMessage.success('更新成功');
        listPage.value?.refresh();
      },
    },
  });
};

/** 成员管理 */
const handleMember = (row: AppDetailResponseDto) => {
  router.push(`/sys/member?appId=${row.id}`);
};

/** 删除 */
const handleDelete = async (row: AppDetailResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应用「${row.appName}」吗？`,
      '确认删除',
      { type: 'warning' }
    );
    await new ApiAppDelete({ params: { id: row.id } });
    ElMessage.success('删除成功');
    listPage.value?.refresh();
  } catch {
    // 用户取消
  }
};

onMounted(() => {
  loadAppTypes();
});
</script>

<style scoped lang="scss">
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>