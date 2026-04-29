<!--
/**
 * @fileoverview 应用实例表单组件
 * @description 用于 MfwPopup 弹窗的新建/编辑表单
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
import MfwUserPicker from '../../../components/picker/user-picker';
import MfwImageSingle from '../../../components/upload/image-single';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;



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
  ownerId: '',
  appDesc: '',
  logo: undefined as ImageResourceDto | undefined,
  appStatus: STATUS.ENABLED as 1 | 0,
});

/** 基础表单项配置 */
const baseTemplate: FormItemConfig[] = [
  {
    key: 'logo',
    label: '应用Logo',
    component: MfwImageSingle,
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
    placeholder: '请输入应用名称',
    rules: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  },
  {
    key: 'appCode',
    label: '应用编码',
    component: 'el-input',
    placeholder: '请输入应用编码',
    rules: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
    show: () => !isEdit.value,
  },
  {
    key: 'appCode',
    label: '应用编码',
    component: 'el-input',
    disabled: true,
    show: () => isEdit.value,
  },
  {
    key: 'ownerId',
    label: '拥有者',
    component: MfwUserPicker,
    rules: [{ required: true, message: '请选择拥有者', trigger: 'change' }],
    elProps: {
      style: 'width: 100%',
    },
  },
  {
    key: 'appDesc',
    label: '应用描述',
    component: 'el-input',
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
    show: () => isEdit.value,
    value: STATUS.ENABLED,
    elProps: {
      activeValue: STATUS.ENABLED,
      inactiveValue: STATUS.DISABLED,
      activeText: '启用',
      inactiveText: '禁用',
    },
  },
];

/** 当前模板（动态更新 select 选项） */
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
  const result = await new ApiAppTypeFindAllList({ params: {} });
  appTypeList.value = result || [];
};

/** 初始化 */
onMounted(async () => {
  await loadAppTypes();

  if (props.id) {
    form.appTypeId = props.appTypeId;
    form.appName = props.appName;
    form.appCode = props.appCode;
    form.ownerId = props.ownerId;
    form.appDesc = props.appDesc || '';
    if (props.logo) {
      if (typeof props.logo === 'string') {
        form.logo = { src: props.logo, width: 0, height: 0 };
      } else {
        form.logo = props.logo;
      }
    }
    form.appStatus = props.appStatus as 1 | 0;
  }
});

/** 确认提交 */
const onConfirm = async () => {
  await formRef.value?.validate();

  const logoData = form.logo?.src ? form.logo : undefined;

  if (isEdit.value) {
    await new ApiAppUpdate({
      params: { id: props.id },
      body: {
        appName: form.appName,
        appDesc: form.appDesc,
        logo: logoData,
        ownerId: form.ownerId,
        appStatus: form.appStatus,
      },
    }, { hintSuccess: true });
  } else {
    await new ApiAppCreate({
      body: {
        appTypeId: form.appTypeId,
        appName: form.appName,
        appCode: form.appCode,
        ownerId: form.ownerId,
        appDesc: form.appDesc,
        logo: logoData,
        sortOrder: 0,
      },
    }, { hintSuccess: true });
  }
};

defineExpose({ onConfirm });
</script>