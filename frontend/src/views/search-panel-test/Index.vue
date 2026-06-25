/**
* @fileoverview 搜索面板自定义组件测试页
* @description 演示 SearchTemplateItem 的 component/render/slot 三种自定义能力
*/

<template>
  <MfwPageWrapper>
    <MfwListPage ref="listPageRef" :search-template="searchTemplate" :columns="columns" :load-data="loadData"
      search-label-width="100px" :max-visible-items="20">
      <!-- 默认插槽名示例：search-item-${key} -->
      <template #search-item-status="{ value, setValue }">
        <ElTag :type="value === 'active' ? 'success' : value === 'inactive' ? 'danger' : 'info'" style="cursor: pointer"
          @click="setValue(value === 'active' ? 'inactive' : 'active')">
          点击切换: {{ value || '未选择' }}
        </ElTag>
      </template>

      <!-- 自定义插槽名示例 -->
      <template #my-range="{ value, setValue }">
        <ElSlider :model-value="value" range :max="100" @update:model-value="setValue" />
      </template>
    </MfwListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { ElTag, ElSlider, ElInput, ElSelect, ElCascader, ElTreeSelect } from 'element-plus';
import { MfwListPage, MfwPageWrapper } from 'moyan-mfw-base/frontend';
import type { SearchTemplateItem, TableColumnConfig } from 'moyan-mfw-base/frontend';

const listPageRef = ref<InstanceType<typeof MfwListPage>>();

// 模拟树形数据
const treeData = [
  { label: '部门A', value: 'dept-a', children: [{ label: '小组1', value: 'group-1' }] },
  { label: '部门B', value: 'dept-b' },
];

// 模拟级联数据
const cascaderOptions = [
  {
    label: '技术', value: 'tech', children: [
      { label: '前端', value: 'frontend' },
      { label: '后端', value: 'backend' },
    ]
  },
  { label: '产品', value: 'product' },
];

/**
 * 搜索模板：涵盖 component / render / slot 三种自定义方式
 */
const searchTemplate: SearchTemplateItem[] = [
  // 1. 内置 input 类型
  { key: 'keyword', label: '关键词', type: 'input' },

  // 2. 内置 select 类型
  {
    key: 'category',
    label: '分类',
    type: 'select',
    elProps: {
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' },
      ],
    },
  },

  // 3. component: 直接使用 ElInput
  {
    key: 'customInput',
    label: '自定义Input',
    type: 'custom',
    component: ElInput,
    placeholder: '通过 component 属性传入 ElInput',
  },

  // 4. component: 使用 ElSelect
  {
    key: 'customSelect',
    label: '自定义Select',
    type: 'custom',
    component: ElSelect,
    elProps: {
      options: [
        { label: '自定义A', value: 'A' },
        { label: '自定义B', value: 'B' },
      ],
    },
  },

  // 5. component: 使用 ElCascader
  {
    key: 'cascade',
    label: '级联',
    type: 'custom',
    component: ElCascader,
    elProps: { options: cascaderOptions, props: { checkStrictly: true } },
  },

  // 6. component: 使用 ElTreeSelect
  {
    key: 'tree',
    label: '树选',
    type: 'custom',
    component: ElTreeSelect,
    elProps: { data: treeData, checkStrictly: true },
  },

  // 7. render: 自定义渲染函数
  {
    key: 'renderComp',
    label: 'Render函数',
    type: 'custom',
    render: ({ value, setValue }) =>
      h(ElInput, {
        modelValue: value,
        'onUpdate:modelValue': setValue,
        placeholder: '通过 render 函数自定义',
      }),
  },

  // 8. slot: 使用默认插槽名 search-item-${key}
  {
    key: 'status',
    label: '', // 不传 label 则不显示
    type: 'custom',
  },

  // 9. slot: 使用自定义插槽名
  {
    key: 'range',
    label: '范围',
    type: 'custom',
    slot: 'my-range',
    labelWidth: 'auto', // 测试单项 labelWidth
    componentWidth: 100, // 测试单项组件宽度
  },

  // 10. date-range 内置类型
  { key: 'dateRange', label: '日期', labelWidth:'auto',type: 'date-range', componentWidth: 420 },
];

// 表格列
const columns: TableColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称' },
  { prop: 'keyword', label: '关键词' },
  { prop: 'customInput', label: '自定义Input' },
  { prop: 'customSelect', label: '自定义Select' },
  { prop: 'status', label: '状态' },
];

// 模拟数据加载
const loadData = async (params: Record<string, any>) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    total: 3,
    list: [
      { id: 1, name: '数据1', keyword: params.keyword, customInput: params.customInput, customSelect: params.customSelect, status: params.status },
      { id: 2, name: '数据2', keyword: '测试2', customInput: '测试', customSelect: 'A', status: 'active' },
      { id: 3, name: '数据3', keyword: '测试3', customInput: '测试', customSelect: 'B', status: 'inactive' },
    ],
  };
};
</script>
