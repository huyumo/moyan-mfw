<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '100px' }"
  />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import MfwFormCard from '../form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../form/form-card/types';
import { ApiAuthVerifyDeveloper } from '../../apis/sys';

defineOptions({ name: 'DeveloperVerifyForm' });

const formRef = ref<MfwFormCardInstance>();

const form = reactive({
  password: '',
});

const formTemplate: FormItemConfig[] = [
  {
    key: 'password',
    label: '开发者密码',
    component: 'el-input',
    testId: 'developer-verify-password-input',
    rules: [{ required: true, message: '请输入开发者密码', trigger: 'blur' }],
    elProps: { type: 'password', showPassword: true, placeholder: '请输入开发者密码', clearable: false },
  },
];

const onConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) throw new Error('表单验证失败');

  await new ApiAuthVerifyDeveloper({
    body: { password: form.password },
  } as any, { hintSuccess: true, successMsg: '验证成功' });
};

defineExpose({ onConfirm });
</script>
