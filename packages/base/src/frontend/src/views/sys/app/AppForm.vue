<!--
/**
 * @fileoverview 应用实例表单组件
 * @description 基于 MfwPopup 封装的新建/编辑表单
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

/** 是否编辑模式 */
const isEdit = computed(() => !!props?.id);

/** 表单引用 */
const formRef = ref<MfwFormCardInstance>();

/** 应用类型列表 */
const appTypeList = ref<AppTypeResponseDto[]>([]);

/** 表单数据 */
const form = reactive({
  appTypeId: '',
  appName: '',
  appCode: '',
  appDesc: '',
  logo: undefined as ImageResourceDto | undefined,
  appStatus: StatusDict.ENABLED as 1 | 0,
});

/** 基础表单模板 */
const baseTemplate: FormItemConfig[] = [
  {
    key: 'logo',
    label: '应用Logo',
    component: MfwImageSingle,
    testId: 'app-logo-upload',
    elProps: {
      crop: true,
      cropRatio: 1,
      cropWidth: 200,
      cropHeight: 200,
      placeholder: '点击上传Logo',
    },
  },
  {
    key: 'appTypeId',
    label: '应用类型',
    component: 'el-select',
    testId: 'app-type-select',
    placeholder: '请选择应用类型',
    rules: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
    disabled: () => isEdit.value,
    elProps: {
      style: 'width: 100%',
    },
  },
  {
    key: 'appName',
    label: '应用名称',
    component: 'el-input',
    testId: 'app-name-input',
    placeholder: '请输入应用名称',
    rules: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  },
  {
    key: 'appCode',
    label: '应用编码',
    component: 'el-input',
    testId: 'app-code-input',
    placeholder: '请输入应用编码',
    rules: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
    show: () => !isEdit.value,
  },
  {
    key: 'appCode',
    label: '应用编码',
    component: 'el-input',
    testId: 'app-code-input',
    disabled: true,
    show: () => isEdit.value,
  },
  {
    key: 'appDesc',
    label: '应用描述',
    component: 'el-input',
    testId: 'app-desc-input',
    placeholder: '请输入应用描述',
    elProps: {
      type: 'textarea',
      rows: 3,
    },
  },
  {
    key: 'appStatus',
    label: '状态',
    component: 'el-switch',
    testId: 'app-status-switch',
    show: () => isEdit.value,
    value: StatusDict.ENABLED,
    elProps: {
      activeValue: StatusDict.ENABLED,
      inactiveValue: StatusDict.DISABLED,
      activeText: '启用',
      inactiveText: '禁用',
    },
  },
];

/** 当前模板（动态生成 select 选项） */
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

/** 验证规则 */
const rules = {};

/** 加载应用类型列表 */
const loadAppTypes = async () => {
  const result = await new ApiAppTypeFindAllList({});
  appTypeList.value = result || [];
};

/** 加载应用数据（编辑模式） */
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

/** 初始化 */
onMounted(async () => {
  await loadAppTypes();
  loadAppDetail();
});

/** 确认提交 */
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
