<template>
  <form-card ref="formCardRef" :form-props="{ labelWidth: '80px' }" :template="template" :form-data="formData">
  </form-card>
</template>
<script lang="ts" setup>
import { defineComponent, PropType, ref, toRef, inject, computed, onMounted } from 'vue'
import FormCard from '@/components/formCard/index.vue'
import { FormCardInstance, FormTemplateArray } from '@/components/formCard/type'
import { CreateUserAsMobileDto, DtoUserInfo, EditUserDto } from '@/apis/micro-system/schemas'
import { ApiUserInfoCreateAsMobile, ApiUserInfoEdit } from '@/apis/micro-system'
import { UserPickerManager } from './userPickerManager'

const { theme, context } = defineProps({
  context: { type: Object as PropType<DtoUserInfo> },
  theme: {
    type: String,
    default: 'default'
  }
})

const manager = new UserPickerManager()

const formCardRef = ref<FormCardInstance>()

const formData = ref<CreateUserAsMobileDto>(
  context || {
    mobile: '', // 手机号
    name: '', // 姓名
    nickname: '', // 昵称
    avatar: ''
  }
)

const template = ref<FormTemplateArray>(manager.getTheme(theme,formData).template)
const onConfirm = async () => {
  await formCardRef.value?.validate()
  if (context) {
    return new ApiUserInfoEdit({ params: formData.value as EditUserDto, option: { hintSuccess: true, hintFail: true } })
  }
  return new ApiUserInfoCreateAsMobile({ params: formData.value, option: { hintSuccess: true, hintFail: true } })
}

defineExpose({ onConfirm })
</script>
