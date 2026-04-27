<!--
/**
 * @fileoverview 用户表单组件
 * @description 新建/编辑用户的表单
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
import { MfwFormCard, MfwRadioGroup, MfwImageSingle, MfwImageGallery, MfwQuillEditor } from '../../../components';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import type { ImageResource } from '../../../components/upload/types';
import { ApiUserAdminCreate, ApiUserUpdate } from '../../../apis/sys';
import type { UserResponseDto } from '../../../apis/sys/schemas';

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
    label: '头像',
    component: MfwImageSingle,
    elProps: {
      crop: true,
      cropRatio: 1,
      cropWidth: 200,
      cropHeight: 200,
      placeholder: '点击上传头像',
    },
  },
  {
    key: 'username',
    label: '用户名',
    component: 'el-input',
    disabled: isEdit.value,
    rules: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { pattern: /^[a-zA-Z][a-zA-Z0-9]{0,19}$/, message: '用户名须以字母开头，仅允许字母和数字，最长20位', trigger: 'blur' },
    ],
    elProps: {
      placeholder: '请输入用户名',
      clearable: true,
    },
  },
  {
    key: 'nickname',
    label: '昵称',
    component: 'el-input',
    rules: [
      { max: 50, message: '昵称长度不能超过 50 个字符', trigger: 'blur' },
    ],
    elProps: {
      placeholder: '请输入昵称',
      clearable: true,
    },
  },
  {
    key: 'phone',
    label: '手机号',
    component: 'el-input',
    rules: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
    ],
    elProps: {
      placeholder: '请输入手机号',
      clearable: true,
    },
  },
  {
    key: 'gender',
    label: '性别',
    component: MfwRadioGroup,
    elProps: {
      options: [
        { label: '未知', value: 0 },
        { label: '男', value: 1 },
        { label: '女', value: 2 },
      ],
    },
  },
  {
    key: 'images',
    label: '图片集',
    component: MfwImageGallery,
    elProps: {
      limit: 9,
      placeholder: '点击上传图片',
    },
  },
  {
    key: 'content',
    label: '富文本',
    component: MfwQuillEditor,
    elProps: {
      height: '250px',
      placeholder: '请输入富文本内容',
    },
  },
];

const onConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) throw new Error('表单验证失败');

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
