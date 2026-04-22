<!--
/**
 * @fileoverview 用户表单组件
 * @description 新建/编辑用户的表单
 */
-->
<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="80px"
    @submit.prevent
  >
    <el-form-item label="用户名" prop="username">
      <el-input
        v-model="form.username"
        placeholder="请输入用户名"
        :disabled="isEdit"
        clearable
      />
    </el-form-item>

    <el-form-item v-if="!isEdit" label="密码" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="请输入密码"
        show-password
        clearable
      />
    </el-form-item>

    <el-form-item label="昵称" prop="nickname">
      <el-input
        v-model="form.nickname"
        placeholder="请输入昵称"
        clearable
      />
    </el-form-item>

    <el-form-item label="手机号" prop="phone">
      <el-input
        v-model="form.phone"
        placeholder="请输入手机号"
        clearable
      />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input
        v-model="form.email"
        placeholder="请输入邮箱"
        clearable
      />
    </el-form-item>

    <el-form-item label="性别" prop="gender">
      <el-radio-group v-model="form.gender">
        <el-radio :value="0">未知</el-radio>
        <el-radio :value="1">男</el-radio>
        <el-radio :value="2">女</el-radio>
      </el-radio-group>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { type FormInstance, type FormRules } from 'element-plus';
import { ApiUserCreate, ApiUserUpdate } from '../../../apis/sys';
import type { UserResponseDto } from '../../../apis/sys/schemas';

interface UserFormData {
  username: string;
  password: string;
  nickname: string;
  phone: string;
  email: string;
  gender: number;
}



const props = defineProps<UserResponseDto>();

defineOptions({ name: 'UserForm' });

const formRef = ref<FormInstance>();
const isEdit = computed(() => !!props?.id);

const form = reactive<UserFormData>({
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
  gender: 0,
});

const rules: FormRules<UserFormData> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度需为 2-50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需为 6-20 个字符', trigger: 'blur' },
  ],
  nickname: [
    { max: 50, message: '昵称长度不能超过 50 个字符', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
};

onMounted(() => {
  if (isEdit.value && props) {
    form.username = props.username;
    form.nickname = props.nickname || '';
    form.phone = props.phone || '';
    form.email = props.email || '';
    form.gender = props.gender || 0;
  }
});

const onConfirm = async () => {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) throw new Error('表单验证失败');

  if (isEdit.value) {
    await new ApiUserUpdate({
      params: { id: props.id },
      body: {
        nickname: form.nickname,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
      },
    }, { hintSuccess: true });
  } else {
    await new ApiUserCreate({
      body: {
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
      },
    }, { hintSuccess: true });
  }
};

defineExpose({ onConfirm });
</script>