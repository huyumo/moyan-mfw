<!--
/**
 * @fileoverview 应用类型新建表单组件
 * @description 用于 MfwPopup 弹窗的新建表单
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
import { ref, reactive } from 'vue';
import MfwFormCard from '../../../components/form/form-card';
import MfwIconPicker from '../../../components/picker/icon-picker';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiAppTypeCreate } from '../../../apis/sys';
import { MultiAppEnabledDict } from '../../../../shared';

/** 表单引用 */
const formRef = ref<MfwFormCardInstance>();

/** 表单数据 */
const form = reactive({
  typeName: '',
  typeCode: '',
  icon: '',
  typeDesc: '',
  multiAppEnabled: MultiAppEnabledDict.YES as 1 | 0,
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
    placeholder: '请输入类型编码',
    rules: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
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
    key: 'multiAppEnabled',
    label: '支持多应用',
    component: 'el-switch',
    testId: 'app-type-multi-app-switch',
    value: MultiAppEnabledDict.YES,
    elProps: {
      activeValue: MultiAppEnabledDict.YES,
      inactiveValue: MultiAppEnabledDict.NO,
    },
  },
];

/** 验证规则（由 template 中的 rules 处理，此处仅用于类型兼容） */
const rules = {};

/** 确认提交 - 供 MfwPopup 调用 */
const onConfirm = async () => {
  await formRef.value?.validate();

  await new ApiAppTypeCreate({
    body: {
      typeName: form.typeName,
      typeCode: form.typeCode,
      icon: form.icon,
      typeDesc: form.typeDesc,
      multiAppEnabled: form.multiAppEnabled,
      typeStatus: 1,
      sortOrder: 0,
    },
  }, { hintSuccess: true });
};

/** 暴露方法供 MfwPopup 调用 */
defineExpose({
  onConfirm,
});
</script>