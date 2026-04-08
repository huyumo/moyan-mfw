<!--
/**
 * @fileoverview 新增内置角色表单
 * @description 用于创建与应用类型绑定的内置角色
 */
-->
<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
    label-position="top"
  >
    <el-form-item label="角色名称" prop="roleName">
      <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
    </el-form-item>

    <el-form-item label="角色编码" prop="roleCode">
      <el-input v-model="formData.roleCode" placeholder="请输入角色编码，如：admin" />
    </el-form-item>

    <el-form-item label="角色描述" prop="roleDesc">
      <el-input
        v-model="formData.roleDesc"
        type="textarea"
        :rows="3"
        placeholder="请输入角色描述"
      />
    </el-form-item>

    <el-form-item label="排序" prop="sortOrder">
      <el-input-number v-model="formData.sortOrder" :min="0" :max="999" />
    </el-form-item>

    <el-form-item label="状态" prop="roleStatus">
      <el-radio-group v-model="formData.roleStatus">
        <el-radio :label="STATUS.ENABLED">启用</el-radio>
        <el-radio :label="STATUS.DISABLED">禁用</el-radio>
      </el-radio-group>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

defineOptions({ name: 'AddBuiltinRoleForm' });

const props = defineProps<{
  data?: {
    appTypeId: string;
  };
}>();

const emit = defineEmits<{
  confirm: [void];
}>();

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

const formRef = ref<FormInstance>();

const formData = reactive({
  appTypeId: props.data?.appTypeId || '',
  roleName: '',
  roleCode: '',
  roleDesc: '',
  sortOrder: 0,
  roleStatus: STATUS.ENABLED,
});

const formRules: FormRules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度为 2-20 个字符', trigger: 'blur' },
  ],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '角色编码只能包含小写字母、数字和下划线，且以小写字母开头',
      trigger: 'blur',
    },
  ],
  roleDesc: [
    { max: 200, message: '角色描述不能超过 200 个字符', trigger: 'blur' },
  ],
};

/** 验证表单 */
const validate = async (): Promise<boolean> => {
  if (!formRef.value) return false;
  try {
    await formRef.value.validate();
    return true;
  } catch {
    return false;
  }
};

/** 获取表单数据 */
const getFormData = () => ({ ...formData });

defineExpose({
  validate,
  getFormData,
});
</script>
