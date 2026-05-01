<!--
/**
 * @fileoverview 应用类型编辑表单组件
 * @description 用于 MfwPopup 弹窗的编辑表单
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
import MfwIconPicker from '../../../components/picker/icon-picker';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiAppTypeUpdate } from '../../../apis/sys';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

/** Props */
interface Props {
  data?: AppTypeResponseDto;
}

const props = defineProps<Props>();

/** 表单引用 */
const formRef = ref<MfwFormCardInstance>();

/** 表单数据 */
const form = reactive({
  typeName: '',
  typeCode: '',
  icon: '',
  typeDesc: '',
  typeStatus: STATUS.ENABLED as 1 | 0,
});

/** 表单项配置 */
const formTemplate: FormItemConfig[] = [
  {
    key: 'typeName',
    label: '类型名称',
    component: 'el-input',
    testId: 'app-type-name-input',
    placeholder: '请输入类型名称',
    rules: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
  },
  {
    key: 'typeCode',
    label: '类型编码',
    component: 'el-input',
    testId: 'app-type-code-input',
    disabled: true,
  },
  {
    key: 'icon',
    label: '图标',
    component: MfwIconPicker,
    testId: 'app-type-icon-picker',
  },
  {
    key: 'typeDesc',
    label: '描述',
    component: 'el-input',
    testId: 'app-type-desc-input',
    placeholder: '请输入描述',
    elProps: {
      type: 'textarea',
      rows: 3,
    },
  },
  {
    key: 'typeStatus',
    label: '状态',
    component: 'el-switch',
    testId: 'app-type-status-switch',
    value: STATUS.ENABLED,
    disabled: () => Boolean(props.data?.typeCode === 'system' || props.data?.typeCode?.startsWith('sys')),
    elProps: {
      activeValue: STATUS.ENABLED,
      inactiveValue: STATUS.DISABLED,
      activeText: '启用',
      inactiveText: '禁用',
    },
  },
];

/** 验证规则 */
const rules = {};

/** 初始化表单 */
onMounted(() => {
  if (props.data) {
    form.typeName = props.data.typeName;
    form.typeCode = props.data.typeCode;
    form.icon = props.data.icon || '';
    form.typeDesc = props.data.typeDesc || '';
    form.typeStatus = props.data.typeStatus as 1 | 0;
  }
});

/** 确认提交 - 供 MfwPopup 调用 */
const onConfirm = async () => {
  await formRef.value?.validate();

  await new ApiAppTypeUpdate({
    params: { id: props.data!.id },
    body: {
      typeName: form.typeName,
      icon: form.icon,
      typeDesc: form.typeDesc,
      typeStatus: form.typeStatus,
    },
  },{hintSuccess: true});
};

/** 暴露方法供 MfwPopup 调用 */
defineExpose({
  onConfirm,
});
</script>