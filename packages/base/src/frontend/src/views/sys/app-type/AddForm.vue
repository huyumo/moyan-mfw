<!--
/**
 * @fileoverview Ӧ�������½��������
 * @description ���� MfwPopup �������½�����
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
import MfwFormCard from '../../../../components/form/form-card';
import MfwIconPicker from '../../../../components/picker/icon-picker';
import type { MfwFormCardInstance, FormItemConfig } from '../../../../components/form/form-card/types';
import { ApiAppTypeCreate } from '../../../../apis/sys';
import { MultiAppEnabledDict } from '../../../../../shared/src';

/** �������� */
const formRef = ref<MfwFormCardInstance>();

/** �������� */
const form = reactive({
  typeName: '',
  typeCode: '',
  icon: '',
  typeDesc: '',
  multiAppEnabled: MultiAppEnabledDict.YES as 1 | 0,
});

/** ���������� */
const formTemplate: FormItemConfig[] = [
  {
    key: 'typeName',
    label: '��������',
    component: 'el-input',
    testId: 'app-type-name-input',
    placeholder: '��������������',
    rules: [{ required: true, message: '��������������', trigger: 'blur' }],
  },
  {
    key: 'typeCode',
    label: '���ͱ���',
    component: 'el-input',
    testId: 'app-type-code-input',
    placeholder: '���������ͱ���',
    rules: [{ required: true, message: '���������ͱ���', trigger: 'blur' }],
  },
  {
    key: 'icon',
    label: 'ͼ��',
    component: MfwIconPicker,
    testId: 'app-type-icon-picker',
  },
  {
    key: 'typeDesc',
    label: '����',
    component: 'el-input',
    testId: 'app-type-desc-input',
    placeholder: '����������',
    elProps: {
      type: 'textarea',
      rows: 3,
    },
  },
  {
    key: 'multiAppEnabled',
    label: '֧�ֶ�Ӧ��',
    component: 'el-switch',
    testId: 'app-type-multi-app-switch',
    value: MultiAppEnabledDict.YES,
    elProps: {
      activeValue: MultiAppEnabledDict.YES,
      inactiveValue: MultiAppEnabledDict.NO,
    },
  },
];

/** ��֤������ template �е� rules �������˴����������ͼ��ݣ� */
const rules = {};

/** ȷ���ύ - �� MfwPopup ���� */
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

/** ��¶������ MfwPopup ���� */
defineExpose({
  onConfirm,
});
</script>