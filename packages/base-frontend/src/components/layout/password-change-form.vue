<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '90px' }"
  />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import MfwFormCard from '../form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../form/form-card/types';
import { ApiAuthChangePassword } from '../../apis/sys';
import { useAuthStore } from '../../store/auth-store';

defineOptions({ name: 'PasswordChangeForm' });

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref<MfwFormCardInstance>();

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const formTemplate: FormItemConfig[] = [
  {
    key: 'oldPassword',
    label: '当前密码',
    component: 'el-input',
    rules: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    elProps: { type: 'password', showPassword: true, placeholder: '请输入当前密码', clearable: false },
  },
  {
    key: 'newPassword',
    label: '新密码',
    component: 'el-input',
    rules: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, message: '密码须包含字母和数字，至少6位', trigger: 'blur' },
    ],
    elProps: { type: 'password', showPassword: true, placeholder: '请输入新密码', clearable: false },
  },
  {
    key: 'confirmPassword',
    label: '确认密码',
    component: 'el-input',
    rules: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
          if (value !== form.newPassword) {
            callback(new Error('两次输入的密码不一致'));
          } else {
            callback();
          }
        },
        trigger: 'blur',
      },
    ],
    elProps: { type: 'password', showPassword: true, placeholder: '请再次输入新密码', clearable: false },
  },
];

const onConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) throw new Error('表单验证失败');

  await new ApiAuthChangePassword({
    body: {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    },
  } as any, { hintSuccess: true, successMsg: '密码修改成功，请重新登录' });

  await authStore.logout();
  router.push('/login');
};

defineExpose({ onConfirm });
</script>
