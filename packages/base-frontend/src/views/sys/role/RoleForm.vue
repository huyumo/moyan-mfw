<!--
/**
 * @fileoverview 角色编辑表单组件
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
import { ref, reactive, computed, onMounted } from 'vue';
import MfwFormCard from '../../../components/form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiRoleCreate, ApiRoleUpdate } from '../../../apis/sys';
import type { RoleResponseDto } from '../../../apis/sys/schemas';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

/** Props */
interface Props {
  data?: RoleResponseDto;
}

const props = defineProps<Props>();

/** 是否编辑模式 */
const isEdit = computed(() => !!props.data?.id);

/** 表单引用 */
const formRef = ref<MfwFormCardInstance>();

/** 表单数据 */
const form = reactive({
  roleName: '',
  roleCode: '',
  roleCodeDisplay: '',
  roleDesc: '',
  roleStatus: STATUS.ENABLED as 1 | 0,
});

/** 表单项配置 */
const formTemplate: FormItemConfig[] = [
  {
    key: 'roleName',
    label: '角色名称',
    component: 'el-input',
    placeholder: '请输入角色名称',
    rules: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  },
  {
    key: 'roleCode',
    label: '角色编码',
    component: 'el-input',
    placeholder: '请输入角色编码',
    rules: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
    show: () => !isEdit.value,
  },
  {
    key: 'roleCodeDisplay',
    label: '角色编码',
    component: 'el-input',
    disabled: true,
    show: () => isEdit.value,
  },
  {
    key: 'roleDesc',
    label: '角色描述',
    component: 'el-input',
    placeholder: '请输入角色描述',
    elProps: {
      type: 'textarea',
      rows: 3,
    },
  },
  {
    key: 'roleStatus',
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

/** 验证规则 */
const rules = {};

/** 初始化表单 */
onMounted(() => {
  if (props.data) {
    form.roleName = props.data.roleName;
    form.roleCode = props.data.roleCode;
    form.roleCodeDisplay = props.data.roleCode;
    form.roleDesc = props.data.roleDesc || '';
    form.roleStatus = props.data.roleStatus as 1 | 0;
  }
});

/** 确认提交 */
const onConfirm = async () => {
  await formRef.value?.validate();

  if (isEdit.value) {
    await new ApiRoleUpdate({
      params: { id: props.data!.id },
      body: {
        roleName: form.roleName,
        roleDesc: form.roleDesc,
        roleStatus: form.roleStatus,
      },
    });
  } else {
    await new ApiRoleCreate({
      body: {
        roleName: form.roleName,
        roleCode: form.roleCode,
        roleDesc: form.roleDesc,
      },
    });
  }
};

defineExpose({ onConfirm });
</script>