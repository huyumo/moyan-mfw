<!--
/**
 * @fileoverview 短信模板表单组件
 * @description 新增/编辑短信模板的表单（MfwPopup 弹窗内容）
 */
-->
<template>
  <MfwFormCard ref="formRef" :form-data="form" :template="formTemplate" :form-props="{ labelWidth: '120px' }" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base/frontend'
import type { SmsTemplateItem } from 'moyan-mfw-extension-sms/shared'
import { ApiSmsSaveTemplate } from '../../apis/sms'

const props = defineProps<{
  id?: string
  scene?: string
  signName?: string
  templateCode?: string
  paramKeys?: string[]
  description?: string
}>()
defineOptions({ name: 'MfwSmsTemplateForm' })
const formRef = ref<MfwFormCardInstance>()
const isEdit = computed(() => !!props?.id)

const form = reactive({
  scene: '',
  signName: '',
  templateCode: '',
  paramKeys: [] as string[],
  description: '',
})

watch(
  () => props,
  (p) => {
    form.scene = p?.scene || ''
    form.signName = p?.signName || ''
    form.templateCode = p?.templateCode || ''
    form.paramKeys = p?.paramKeys ? [...p.paramKeys] : []
    form.description = p?.description || ''
  },
  { immediate: true },
)

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'scene',
    label: '场景名',
    component: 'el-input',
    rules: [
      { required: true, message: '请输入场景名', trigger: 'blur' },
      {
        pattern: /^[a-z][a-z0-9_]*$/,
        message: '小写字母开头，仅含小写字母/数字/下划线',
        trigger: 'blur',
      },
    ],
    elProps: { placeholder: '如 login_code / order_notify', clearable: true },
  },
  {
    key: 'signName',
    label: '短信签名',
    component: 'el-input',
    rules: [{ required: true, message: '请输入短信签名', trigger: 'blur' }],
    elProps: { placeholder: '如 某某酒业', clearable: true },
  },
  {
    key: 'templateCode',
    label: '模板 Code',
    component: 'el-input',
    rules: [{ required: true, message: '请输入模板 Code', trigger: 'blur' }],
    elProps: { placeholder: '如 SMS_509465234', clearable: true },
  },
  {
    key: 'paramKeys',
    label: '参数 key',
    component: 'el-select',
    elProps: {
      multiple: true,
      filterable: true,
      allowCreate: true,
      defaultFirstOption: true,
      reserveKeyword: false,
      placeholder: '输入参数名后回车添加（如 code）',
      'data-testid': 'sms-template-param-keys',
    },
  },
  {
    key: 'description',
    label: '描述',
    component: 'el-input',
    elProps: { placeholder: '模板用途说明', type: 'textarea', rows: 2 },
  },
])

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  await new ApiSmsSaveTemplate({
    body: {
      id: isEdit.value ? props.id : undefined,
      scene: form.scene,
      signName: form.signName,
      templateCode: form.templateCode,
      paramKeys: form.paramKeys,
      description: form.description || undefined,
    },
  })
}
defineExpose({ onConfirm })
</script>
