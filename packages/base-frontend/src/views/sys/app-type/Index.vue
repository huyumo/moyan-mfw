<!--
/**
 * @fileoverview 应用类型管理列表页面
 * @description 开发者模式专属页面，管理应用类型、权限池配置、内置角色
 */
-->
<template>
  <MfwPageScene
    ref="pageScene"
    :search-template="searchTemplate"
    :columns="columns"
    :action-column="actionColumn"
    :load-data="loadData"
  >
    <template #search-actions="{ loading }">
      <el-button type="primary" :loading="loading" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新建应用类型
      </el-button>
    </template>
  </MfwPageScene>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus';
import { Plus, View, Edit, Delete } from '@element-plus/icons-vue';
import MfwPageScene from '../../../components/page/page-scene';
import type { MfwPageSceneInstance } from '../../../components/page/page-scene/types';
import { MfwPopup } from '../../../components/feedback';
import {
  ApiAppTypeFindAll,
  ApiAppTypeDelete,
} from '../../../apis/sys';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';
import EditForm from './EditForm.vue';
import AddForm from './AddForm.vue';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwAppTypeList' });

const router = useRouter();
const pageScene = ref<MfwPageSceneInstance>();

/** 搜索模板 */
const searchTemplate = [
  {
    key: 'typeName',
    label: '类型名称',
    type: 'input' as const,
    placeholder: '请输入类型名称',
  },
  {
    key: 'typeCode',
    label: '类型编码',
    type: 'input' as const,
    placeholder: '请输入类型编码',
  },
  {
    key: 'typeStatus',
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
];

/** 表格列 */
const columns = [
  { prop: 'typeName', label: '类型名称', minWidth: 150 },
  { prop: 'typeCode', label: '类型编码', minWidth: 120 },
  {
    prop: 'icon',
    label: '图标',
    width: 80,
    render: ({ row }: { row: AppTypeResponseDto }) => row.icon || '-',
  },
  {
    prop: 'multiAppEnabled',
    label: '多应用',
    width: 80,
    render: ({ row }: { row: AppTypeResponseDto }) => h(ElTag, {
      type: row.multiAppEnabled === STATUS.ENABLED ? 'success' : 'info',
      size: 'small',
    }, () => row.multiAppEnabled === STATUS.ENABLED ? '是' : '否'),
  },
  {
    prop: 'typeStatus',
    label: '状态',
    width: 80,
    render: ({ row }: { row: AppTypeResponseDto }) => h(ElTag, {
      type: row.typeStatus === STATUS.ENABLED ? 'success' : 'danger',
      size: 'small',
    }, () => row.typeStatus === STATUS.ENABLED ? '启用' : '禁用'),
  },
  { prop: 'sortOrder', label: '排序', width: 80 },
  { prop: 'createdAt', label: '创建时间', width: 180 },
];

/** 操作列 */
const actionColumn = {
  prop: 'action',
  label: '操作',
  width: 200,
  fixed: 'right' as const,
  render: ({ row }: { row: AppTypeResponseDto }) => h('div', { class: 'action-buttons' }, [
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
      type: 'danger',
      link: true,
      icon: Delete,
      onClick: () => handleDelete(row),
    }, () => '删除'),
  ]),
};

/** 加载数据 */
const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiAppTypeFindAll({
    params: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      typeName: params.typeName as string,
      typeCode: params.typeCode as string,
      typeStatus: params.typeStatus as number,
    },
  });
  return {
    list: result.list || [],
    total: result.total || 0,
  };
};

/** 查看详情 */
const handleDetail = (row: AppTypeResponseDto) => {
  router.push(`/sys/app-type/${row.id}`);
};

/** 编辑 */
const handleEdit = (row: AppTypeResponseDto) => {
  MfwPopup.open({
    title: '编辑应用类型',
    type: 'drawer',
    position: 'rtl',
    component: EditForm,
    data: { ...row },
    popupProps: { size: 400 },
    on: {
      confirm: () => {
        ElMessage.success('保存成功');
        pageScene.value?.refresh();
      },
    },
  });
};

/** 新建 */
const handleAdd = () => {
  MfwPopup.open({
    title: '新建应用类型',
    type: 'dialog',
    component: AddForm,
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        pageScene.value?.refresh();
      },
    },
  });
};

/** 删除 */
const handleDelete = async (row: AppTypeResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应用类型「${row.typeName}」吗？`,
      '确认删除',
      { type: 'warning' }
    );
    await new ApiAppTypeDelete({ params: { id: row.id } });
    ElMessage.success('删除成功');
    pageScene.value?.refresh();
  } catch {
    // 用户取消
  }
};
</script>

<style scoped lang="scss">
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>