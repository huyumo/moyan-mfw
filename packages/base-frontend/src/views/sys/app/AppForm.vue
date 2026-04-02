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
import { ApiAppCreate, ApiAppUpdate, ApiAppTypeFindAllList, ApiUserFindAll } from '../../../apis/sys';
import type { AppDetailResponseDto, AppTypeResponseDto } from '../../../apis/sys/schemas';
import MfwUserPicker from '../../../components/picker/user-picker';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

/** Props */
interface Props {
  data?: AppDetailResponseDto;
}

const props = defineProps<Props>();

/** 是否编辑模式 */
const isEdit = computed(() => !!props.data?.id);

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
  icon: '',
  appStatus: STATUS.ENABLED as 1 | 0,
});

/** 加载用户列表（用于用户选择器） */
const loadUserList = async (params: { keyword?: string; departmentId?: string | number; page?: number; pageSize?: number }) => {
  const result = await new ApiUserFindAll({
    params: {
      username: params.keyword,
      phone: params.keyword,
      pageSize: params.pageSize || 20,
      page: params.page || 1,
    },
  });
  return { list: result.list || [], total: result.total || 0 };
};

/** 基础表单项配置 */
const baseTemplate: FormItemConfig[] = [
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
    key: 'appCodeDisplay',
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
      placeholder: '请选择拥有者',
      loadUserList,
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
    key: 'icon',
    label: '应用图标',
    component: 'el-input',
    placeholder: '请输入图标名称或 URL',
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

  if (props.data) {
    form.appTypeId = props.data.appTypeId;
    form.appName = props.data.appName;
    form.appCode = props.data.appCode;
    form.ownerId = props.data.ownerId;
    form.appDesc = props.data.appDesc || '';
    form.icon = props.data.icon || '';
    form.appStatus = props.data.appStatus as 1 | 0;
  }
});

/** 确认提交 */
const onConfirm = async () => {
  await formRef.value?.validate();

  if (isEdit.value) {
    await new ApiAppUpdate({
      query: { id: props.data!.id },
      params: {
        appName: form.appName,
        appDesc: form.appDesc,
        icon: form.icon,
        ownerId: form.ownerId,
        appStatus: form.appStatus,
      },
    });
  } else {
    await new ApiAppCreate({
      params: {
        appTypeId: form.appTypeId,
        appName: form.appName,
        appCode: form.appCode,
        ownerId: form.ownerId,
        appDesc: form.appDesc,
        icon: form.icon,
        sortOrder: 0,
      },
    });
  }
};

defineExpose({ onConfirm });
</script>