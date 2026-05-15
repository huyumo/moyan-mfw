<!--
/**
 * @fileoverview �û��������
 * @description �½�/�༭�û��ı���
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '80px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { MfwFormCard, MfwRadioGroup, MfwImageSingle, MfwImageGallery, MfwQuillEditor, MfwMdEditor } from '../../../components';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import type { ImageResource } from '../../../components/upload/types';
import { ApiUserAdminCreate, ApiUserUpdate } from '../../../apis/sys';
import type { UserResponseDto } from '../../../apis/sys/schemas';
import { toItems, GenderDict } from 'moyan-mfw-base/shared';

const props = defineProps<UserResponseDto>();

defineOptions({ name: 'UserForm' });

const formRef = ref<MfwFormCardInstance>();
const isEdit = computed(() => !!props?.id);

const form = reactive({
  avatar: props?.avatar || undefined,
  username: props?.username || '',
  nickname: props?.nickname || '',
  phone: props?.phone || '',
  gender: props?.gender ?? 0,
  images: [] as ImageResource[],
  content: '',
});

const formTemplate: FormItemConfig[] = [
  {
    key: 'avatar',
    label: 'ͷ��',
    component: MfwImageSingle,
    testId: 'user-avatar-upload',
    elProps: {
      crop: true,
      cropRatio: 1,
      cropWidth: 200,
      cropHeight: 200,
      placeholder: '����ϴ�ͷ��',
    },
  },
  {
    key: 'username',
    label: '�û���',
    component: 'el-input',
    testId: 'user-username-input',
    disabled: isEdit.value,
    rules: [
      { required: true, message: '�������û���', trigger: 'blur' },
      { pattern: /^[a-zA-Z][a-zA-Z0-9]{0,19}$/, message: '�û���������ĸ��ͷ����������ĸ�����֣��20λ', trigger: 'blur' },
    ],
    elProps: {
      placeholder: '�������û���',
      clearable: true,
    },
  },
  {
    key: 'nickname',
    label: '�ǳ�',
    component: 'el-input',
    testId: 'user-nickname-input',
    rules: [
      { max: 50, message: '�ǳƳ��Ȳ��ܳ��� 50 ���ַ�', trigger: 'blur' },
    ],
    elProps: {
      placeholder: '�������ǳ�',
      clearable: true,
    },
  },
  {
    key: 'phone',
    label: '�ֻ���',
    component: 'el-input',
    testId: 'user-phone-input',
    rules: [
      { required: true, message: '�������ֻ���', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '��������ȷ���ֻ���', trigger: 'blur' },
    ],
    elProps: {
      placeholder: '�������ֻ���',
      clearable: true,
    },
  },
  {
    key: 'gender',
    label: '�Ա�',
    component: MfwRadioGroup,
    testId: 'user-gender-radio',
    elProps: {
      options: toItems(GenderDict),
    },
  }
];

const onConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) throw new Error('������֤ʧ��');

  if (isEdit.value) {
    await new ApiUserUpdate({
      params: { id: props.id },
      body: {
        nickname: form.nickname,
        phone: form.phone,
        gender: form.gender,
        avatar: form.avatar,
      },
    }, { hintSuccess: true });
  } else {
    await new ApiUserAdminCreate({
      body: {
        username: form.username,
        phone: form.phone,
        nickname: form.nickname,
        gender: form.gender,
        avatar: form.avatar,
      },
    }, { hintSuccess: true });
  }
};

defineExpose({ onConfirm });
</script>
