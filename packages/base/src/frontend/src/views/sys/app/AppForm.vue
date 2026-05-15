<!--
/**
 * @fileoverview Ӧ��ʵ���������
 * @description ���� MfwPopup �������½�/�༭����
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="currentTemplate"
    :rules="rules"
    :form-props="{ labelWidth: '100px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import MfwFormCard from '../../../components/form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiAppCreate, ApiAppUpdate, ApiAppTypeFindAllList } from '../../../apis/sys';
import type { AppDetailResponseDto, AppTypeResponseDto, ImageResourceDto } from '../../../apis/sys/schemas';
import MfwImageSingle from '../../../components/upload/image-single';
import { StatusDict } from 'moyan-mfw-base/shared';

const props = defineProps<AppDetailResponseDto>();

/** �Ƿ�༭ģʽ */
const isEdit = computed(() => !!props?.id);

/** �������� */
const formRef = ref<MfwFormCardInstance>();

/** Ӧ�������б� */
const appTypeList = ref<AppTypeResponseDto[]>([]);

/** �������� */
const form = reactive({
  appTypeId: '',
  appName: '',
  appCode: '',
  appDesc: '',
  logo: undefined as ImageResourceDto | undefined,
  appStatus: StatusDict.ENABLED as 1 | 0,
});

/** �������������� */
const baseTemplate: FormItemConfig[] = [
  {
    key: 'logo',
    label: 'Ӧ��Logo',
    component: MfwImageSingle,
    testId: 'app-logo-upload',
    elProps: {
      crop: true,
      cropRatio: 1,
      cropWidth: 200,
      cropHeight: 200,
      placeholder: '����ϴ�Logo',
    },
  },
  {
    key: 'appTypeId',
    label: 'Ӧ������',
    component: 'el-select',
    testId: 'app-type-select',
    placeholder: '��ѡ��Ӧ������',
    rules: [{ required: true, message: '��ѡ��Ӧ������', trigger: 'change' }],
    disabled: () => isEdit.value,
    elProps: {
      style: 'width: 100%',
    },
  },
  {
    key: 'appName',
    label: 'Ӧ������',
    component: 'el-input',
    testId: 'app-name-input',
    placeholder: '������Ӧ������',
    rules: [{ required: true, message: '������Ӧ������', trigger: 'blur' }],
  },
  {
    key: 'appCode',
    label: 'Ӧ�ñ���',
    component: 'el-input',
    testId: 'app-code-input',
    placeholder: '������Ӧ�ñ���',
    rules: [{ required: true, message: '������Ӧ�ñ���', trigger: 'blur' }],
    show: () => !isEdit.value,
  },
  {
    key: 'appCode',
    label: 'Ӧ�ñ���',
    component: 'el-input',
    testId: 'app-code-input',
    disabled: true,
    show: () => isEdit.value,
  },
  {
    key: 'appDesc',
    label: 'Ӧ������',
    component: 'el-input',
    testId: 'app-desc-input',
    placeholder: '������Ӧ������',
    elProps: {
      type: 'textarea',
      rows: 3,
    },
  },
  {
    key: 'appStatus',
    label: '״̬',
    component: 'el-switch',
    testId: 'app-status-switch',
    show: () => isEdit.value,
    value: StatusDict.ENABLED,
    elProps: {
      activeValue: StatusDict.ENABLED,
      inactiveValue: StatusDict.DISABLED,
      activeText: '����',
      inactiveText: '����',
    },
  },
];

/** ��ǰģ�壨��̬���� select ѡ� */
const currentTemplate = computed<FormItemConfig[]>(() => {
  return baseTemplate.map((item) => {
    if (item.key === 'appTypeId') {
      return {
        ...item,
        elProps: {
          ...item.elProps,
          options: appTypeList.value.map((t) => ({
            label: t.typeName,
            value: t.id,
          })),
        },
      };
    }
    return item;
  });
});

/** ��֤���� */
const rules = {};

/** ����Ӧ�������б� */
const loadAppTypes = async () => {
  const result = await new ApiAppTypeFindAllList({});
  appTypeList.value = result || [];
};

/** ����Ӧ�����飨�༭ģʽ�� */
const loadAppDetail = () => {
  if (props.id) {
    form.appTypeId = props.appTypeId;
    form.appName = props.appName;
    form.appCode = props.appCode;
    form.appDesc = props.appDesc || '';
    form.logo = props.logo || undefined;
    form.appStatus = props.appStatus as 1 | 0;
  }
};

/** ��ʼ�� */
onMounted(async () => {
  await loadAppTypes();
  loadAppDetail();
});

/** ȷ���ύ */
const onConfirm = async () => {
  await formRef.value?.validate();

  const logoData = form.logo?.src ? form.logo : undefined;

  if (isEdit.value) {
    const updateBody: any = {
      appName: form.appName,
      appDesc: form.appDesc,
      appStatus: form.appStatus,
    };
    if (logoData) {
      updateBody.logo = logoData;
    }
    await new ApiAppUpdate({
      params: { id: props.id },
      body: updateBody,
    }, { hintSuccess: true });
  } else {
    const createBody: any = {
      appTypeId: form.appTypeId,
      appName: form.appName,
      appCode: form.appCode,
      appDesc: form.appDesc,
      sortOrder: 0,
    };
    if (logoData) {
      createBody.logo = logoData;
    }
    await new ApiAppCreate({
      body: createBody,
    }, { hintSuccess: true });
  }
};

defineExpose({ onConfirm });
</script>