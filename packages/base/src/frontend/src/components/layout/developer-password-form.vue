<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '110px' }"
  />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import MfwFormCard from '../form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../form/form-card/types';
import { ApiAuthSetDeveloperPassword } from '../../apis/sys';
import { useAuthStore } from '../../store/auth-store';

defineOptions({ name: 'DeveloperPasswordForm' });

const authStore = useAuthStore();
const formRef = ref<MfwFormCardInstance>();

const form = reactive({
  loginPassword: '',
  developerPassword: '',
  confirmDeveloperPassword: '',
});

const formTemplate: FormItemConfig[] = [
  {
    key: 'loginPassword',
    label: '登录密码',
    component: 'el-input',
    testId: 'developer-set-login-password-input',
    rules: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
    elProps: { type: 'password', showPassword: true, placeholder: '请输入登录密码以验证身份', clearable: false },
  },
  {
    key: 'developerPassword',
    label: '开发者密码',
    component: 'el-input',
    testId: 'developer-set-password-input',
    rules: [
      { required: true, message: '请输入开发者密码', trigger: 'blur' },
      { pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, message: '密码须包含字母和数字，至少6位', trigger: 'blur' },
    ],
    elProps: { type: 'password', showPassword: true, placeholder: '请输入开发者密码', clearable: false },
  },
  {
    key: 'confirmDeveloperPassword',
    label: '确认密码',
    component: 'el-input',
    testId: 'developer-set-confirm-password-input',
    rules: [
      { required: true, message: '请再次输入开发者密码', trigger: 'blur' },
      {
        validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
          if (value !== form.developerPassword) {
            callback(new Error('两次输入的密码不一致'));
          } else {
            callback();
          }
        },
        trigger: 'blur',
      },
    ],
    elProps: { type: 'password', showPassword: true, placeholder: '请再次输入开发者密码', clearable: false },
  },
];

const onConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) throw new Error('表单验证失败');

  await new ApiAuthSetDeveloperPassword({
    body: {
      loginPassword: form.loginPassword,
      developerPassword: form.developerPassword,
    },
  } as any, { hintSuccess: true, successMsg: '开发者密码设置成功' });

  // 更新 authStore 中的 hasDeveloperPassword 状态
  if (authStore.user) {
    authStore.user.hasDeveloperPassword = true;
  }
};

defineExpose({ onConfirm });
</script>
