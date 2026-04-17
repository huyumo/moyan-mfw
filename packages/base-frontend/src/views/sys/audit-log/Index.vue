<!--
/**
 * @fileoverview 审计日志列表页面
 * @description 查询系统操作日志，支持多维度筛选
 */
-->
<template>
  <MfwPageScene
    ref="pageScene"
    :search-template="searchTemplate"
    :columns="columns"
    :action-column="actionColumn"
    :load-data="loadData"
    :show-search="true"
  />
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { ElButton } from 'element-plus';
import { View } from '@element-plus/icons-vue';
import MfwPageScene from '../../../components/page/page-scene';
import type { MfwPageSceneInstance } from '../../../components/page/page-scene/types';
import { MfwPopup } from '../../../components/feedback';
import { ApiAuditLogFindAll, ApiAuditLogFindById } from '../../../apis/sys';
import type { AuditLogResponseDto } from '../../../apis/sys/schemas';
import AuditLogDetail from './AuditLogDetail.vue';

defineOptions({ name: 'MfwAuditLogList' });

const pageScene = ref<MfwPageSceneInstance>();

/** 搜索模板 */
const searchTemplate = [
  {
    key: 'module',
    label: '模块',
    type: 'input' as const,
    placeholder: '请输入模块名称',
  },
  {
    key: 'event',
    label: '事件',
    type: 'input' as const,
    placeholder: '请输入事件名称',
  },
  {
    key: 'operatorId',
    label: '操作人ID',
    type: 'input' as const,
    placeholder: '请输入操作人ID',
  },
  {
    key: 'startTime',
    label: '开始时间',
    type: 'date-picker' as const,
    placeholder: '请选择开始时间',
    elProps: {
      type: 'datetime',
      format: 'YYYY-MM-DD HH:mm:ss',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
    },
  },
  {
    key: 'endTime',
    label: '结束时间',
    type: 'date-picker' as const,
    placeholder: '请选择结束时间',
    elProps: {
      type: 'datetime',
      format: 'YYYY-MM-DD HH:mm:ss',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
    },
  },
];

/** 表格列 */
const columns = [
  { prop: 'module', label: '模块', minWidth: 100 },
  { prop: 'event', label: '事件', minWidth: 120 },
  { prop: 'operatorName', label: '操作人', minWidth: 120 },
  { prop: 'targetType', label: '目标类型', minWidth: 100 },
  { prop: 'targetId', label: '目标ID', minWidth: 180 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'ip', label: 'IP地址', width: 140 },
  { prop: 'createAt', label: '操作时间', width: 180 },
];

/** 操作列 */
const actionColumn = {
  prop: 'action',
  label: '操作',
  width: 80,
  fixed: 'right' as const,
  render: ({ row }: { row: AuditLogResponseDto }) => h('div', { class: 'action-buttons' }, [
    h(ElButton, {
      type: 'primary',
      link: true,
      icon: View,
      onClick: () => handleViewDetail(row),
    }, () => '详情'),
  ]),
};

/** 加载数据 */
const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiAuditLogFindAll({
    query: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      module: params.module as string,
      event: params.event as string,
      operatorId: params.operatorId as string,
      startTime: params.startTime as string,
      endTime: params.endTime as string,
    },
  });
  return {
    list: result.list || [],
    total: result.total || 0,
  };
};

/** 查看详情 */
const handleViewDetail = async (row: AuditLogResponseDto) => {
  const detail = await new ApiAuditLogFindById({ params: { id: row.id } });
  MfwPopup.open({
    title: '审计日志详情',
    type: 'drawer',
    component: AuditLogDetail,
    data: detail,
    popupProps: { width: 500 },
  });
};
</script>

<style scoped lang="scss">
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>