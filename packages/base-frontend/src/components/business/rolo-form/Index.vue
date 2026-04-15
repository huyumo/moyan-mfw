<!--
/**
 * @fileoverview 新增内置角色表单
 * @description 用于创建与应用类型绑定的内置角色
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :model="formData"
    :template="formTemplate"
    label-width="100px"
    label-position="top"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ApiRoleCreate } from '../../../apis/sys';
import { CreateRoleDto } from '../../../apis/sys/schemas';
import { FormItemConfig, MfwFormCard } from '../../form';

defineOptions({ name: 'MfwAddRoleForm' });

const { role } = defineProps<{
  role: CreateRoleDto;
}>();

const emit = defineEmits<{
  confirm: [void];
}>();

const formRef = ref<FormInstance>();

const formData = reactive(role);
const formTemplate: FormItemConfig[] = [
  {
    key: 'roleName',
    label: '角色名称',
    type: 'input',
    component: 'el-input',
    rules: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  },
  {
    key: 'roleCode',
    label: '角色编码',
    type: 'input',
    component: 'el-input',
    rules: [
      { required: true, message: '请输入角色编码', trigger: 'blur' },
      {
        pattern: /^[a-z][a-z0-9_]*$/,
        message: '角色编码只能包含小写字母、数字和下划线，且以小写字母开头',
        trigger: 'blur',
      },
    ],
  },
  {
    key: 'roleDesc',
    label: '角色描述',
    type: 'input',
    component: 'el-input',
    rules: [{ max: 200, message: '角色描述不能超过 200 个字符', trigger: 'blur' }],
  },
  {
    key: 'sortOrder',
    label: '排序',
    type: 'number',
    component: 'el-input-number',
    rules: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  },
];

const onConfirm = async () => {
  await formRef.value?.validate();
  await new ApiRoleCreate({ params: formData, option: { hintSuccess: true, successMsg: '角色创建成功' } });
};

defineExpose({
  onConfirm,
});
</script>
