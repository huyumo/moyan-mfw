<!--
/**
 * @fileoverview Ӧ�����ͱ༭�������
 * @description ���� MfwPopup �����ı༭����
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
import MfwFormCard from '../../../../components/form/form-card';
import MfwIconPicker from '../../../../components/picker/icon-picker';
import type { MfwFormCardInstance, FormItemConfig } from '../../../../components/form/form-card/types';
import { ApiAppTypeUpdate } from '../../../../apis/sys';
import type { AppTypeResponseDto } from '../../../../apis/sys/schemas';
import { StatusDict } from '../../../../../shared/src';

/** Props */
interface Props {
  data?: AppTypeResponseDto;
}

const props = defineProps<Props>();

/** �������� */
const formRef = ref<MfwFormCardInstance>();

/** �������� */
const form = reactive({
  typeName: '',
  typeCode: '',
  icon: '',
  typeDesc: '',
  typeStatus: StatusDict.ENABLED as 1 | 0,
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
    disabled: true,
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
    key: 'typeStatus',
    label: '״̬',
    component: 'el-switch',
    testId: 'app-type-status-switch',
    value: StatusDict.ENABLED,
    disabled: () => Boolean(props.data?.typeCode === 'system' || props.data?.typeCode?.startsWith('sys')),
    elProps: {
      activeValue: StatusDict.ENABLED,
      inactiveValue: StatusDict.DISABLED,
      activeText: '����',
      inactiveText: '����',
    },
  },
];

/** ��֤���� */
const rules = {};

/** ��ʼ������ */
onMounted(() => {
  if (props.data) {
    form.typeName = props.data.typeName;
    form.typeCode = props.data.typeCode;
    form.icon = props.data.icon || '';
    form.typeDesc = props.data.typeDesc || '';
    form.typeStatus = props.data.typeStatus as 1 | 0;
  }
});

/** ȷ���ύ - �� MfwPopup ���� */
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

/** ��¶������ MfwPopup ���� */
defineExpose({
  onConfirm,
});
</script>