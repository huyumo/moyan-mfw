<!--
/**
 * @fileoverview PC 权限手动添加表单组件
 * @description 用于 MfwPopup 弹窗的手动添加权限表单
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :rules="rules"
    :form-props="{ labelWidth: '100px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import MfwFormCard from '../../../components/form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiPermissionCreate } from '../../../apis/sys';

/** Props */
interface Props {
  data?: {
    parentId?: string;
    permName?: string;
    permCode?: string;
  };
}

const props = defineProps<Props>();

/** 表单引用 */
const formRef = ref<MfwFormCardInstance>();

/** 表单数据 */
const form = reactive({
  permName: '',
  permCode: '',
  nodeType: 'MENU' as 'MENU' | 'PAGE',
  routePath: '',
});

/** 表单项配置 */
const formTemplate: FormItemConfig[] = [
  {
    key: 'permName',
    label: '权限名称',
    component: 'el-input',
    placeholder: '请输入权限名称',
    rules: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  },
  {
    key: 'permCode',
    label: '权限编码',
    component: 'el-input',
    placeholder: '请输入权限编码',
    rules: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  },
  {
    key: 'nodeType',
    label: '节点类型',
    component: 'el-select',
    rules: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
    value: 'MENU',
    elProps: {
      style: 'width: 100%',
      options: [
        { label: '目录 (MENU)', value: 'MENU' },
        { label: '页面 (PAGE)', value: 'PAGE' },
      ],
    },
  },
  {
    key: 'routePath',
    label: '路由路径',
    component: 'el-input',
    placeholder: '如：/system/user',
  },
];

/** 验证规则 */
const rules = {};

/** 初始化 */
onMounted(() => {
  if (props.data) {
    form.permName = props.data.permName || '';
    form.permCode = props.data.permCode || '';
  }
});

/** 确认提交 */
const onConfirm = async () => {
  await formRef.value?.validate();

  await new ApiPermissionCreate({
    params: {
      permName: form.permName,
      permCode: form.permCode,
      nodeType: form.nodeType,
      permissionType: 'PC',
      routePath: form.routePath || undefined,
      showMode: 'NORMAL',
      parentId: props.data?.parentId || undefined,
    },
  });
};

defineExpose({ onConfirm });
</script>