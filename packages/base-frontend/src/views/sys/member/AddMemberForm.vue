<!--
/**
 * @fileoverview 添加成员表单组件
 * @description 用于 MfwPopup 弹窗的添加成员表单
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :rules="rules"
    :form-props="{ labelWidth: '80px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import MfwFormCard from '../../../components/form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiAppMemberAddMember } from '../../../apis/sys';
import MfwUserPicker from '../../../components/picker/user-picker';

/** Props */
interface Props {
  data?: { appId: string };
}

const props = defineProps<Props>();

/** 表单引用 */
const formRef = ref<MfwFormCardInstance>();

/** 表单数据 */
const form = reactive({
  userId: '',
});

/** 表单项配置 */
const formTemplate: FormItemConfig[] = [
  {
    key: 'userId',
    label: '选择用户',
    component: MfwUserPicker,
    rules: [{ required: true, message: '请选择用户', trigger: 'change' }],
    elProps: {
      style: 'width: 100%',
    },
  },
];

/** 验证规则 */
const rules = {};

/** 确认提交 */
const onConfirm = async () => {
  await formRef.value?.validate();

  await new ApiAppMemberAddMember({
    params: { appId: props.data!.appId },
    body: { userId: form.userId },
  }, { hintSuccess: true });
};

defineExpose({ onConfirm });
</script>