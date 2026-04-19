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
  />
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { ElMessage, ElTag, ElButton, ElTooltip } from 'element-plus';
import { View, Edit, Key, User } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwListPage } from '../../../components';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
import { MfwPopup } from '../../../components/feedback';
import { ApiAppTypeFindAll, ApiAppTypeFindById } from '../../../apis/sys';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';
import EditForm from './EditForm.vue';
import DetailPopup from './DetailPopup.vue';
import { PermissionPoolPanel } from '../../../components/business/permission-pool-panel';
import { BuiltinRoleDialog } from '../../../components/business/builtin-role-dialog/mod';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwAppTypeList' });

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
  width: 180,
  fixed: 'right' as const,
  render: ({ row }: { row: AppTypeResponseDto }) => h('div', { class: 'action-buttons' }, [
    h(ElTooltip, { content: '详情' }, () => h(ElButton, {
      type: 'primary',
      link: true,
      icon: View,
      onClick: () => handleDetail(row),
    })),
    h(ElTooltip, { content: '编辑' }, () => h(ElButton, {
      type: 'primary',
      link: true,
      icon: Edit,
      onClick: () => handleEdit(row),
    })),
    h(ElTooltip, { content: '配置权限池' }, () => h(ElButton, {
      type: 'primary',
      link: true,
      icon: Key,
      onClick: () => handleConfigPermissionPool(row),
    })),
    h(ElTooltip, { content: '配置内置角色' }, () => h(ElButton, {
      type: 'primary',
      link: true,
      icon: User,
      onClick: () => handleConfigBuiltinRoles(row),
    })),
  ]),
};

/** 加载数据 */
const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiAppTypeFindAll({
    query: {
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
const handleDetail = async (row: AppTypeResponseDto) => {
  try {
    const apiResult = await new ApiAppTypeFindById({ params: { id: row.id } });
    // @ts-ignore - API 实际返回 { code, data, message } 结构
    const detailData = apiResult.data || apiResult;

    MfwPopup.open({
      title: '应用类型详情',
      type: 'drawer',
      component: DetailPopup,
      data: detailData,
      popupProps: { size: 500 },
    });
  } catch (error) {
    ElMessage.error('获取应用类型详情失败');
  }
};

/** 配置权限池 */
const handleConfigPermissionPool = async (row: AppTypeResponseDto) => {
  if (!row.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  console.log('****************KKKKK::',row.id)
  MfwPopup.open({
    title: '配置权限池',
    type: 'dialog',
    component: PermissionPoolPanel,
    data: { appTypeId: row.id },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
    footer: {
      cancelText: '关闭',
      confirmText: '保存',
    },
    on: {
      confirm: () => {
        ElMessage.success('保存成功');
      },
    },
  });
};

/** 配置内置角色 */
const handleConfigBuiltinRoles = async (row: AppTypeResponseDto) => {
  if (!row.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  MfwPopup.open({
    title: '配置内置角色',
    type: 'dialog',
    component: BuiltinRoleDialog,
    data: { appTypeId: row.id },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
  });
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
        listPage.value?.refresh();
      },
    },
  });
};
</script>

<style scoped lang="scss">
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>