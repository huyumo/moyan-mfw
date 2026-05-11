<!--
/**
 * @fileoverview 广告位类型配置表单组件
 * @description 新建/编辑广告位类型配置的表单，包含尺寸配置
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '100px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base-frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base-frontend'
import { ApiAdPlacementTypeCreate, ApiAdPlacementTypeUpdate } from '../../apis/ad'

const props = defineProps<{
  id?: string
  name?: string
  code?: string
  width?: number
  height?: number
  description?: string
  sortOrder?: number
}>()
defineOptions({ name: 'MfwAdPlacementTypeForm' })
const formRef = ref<MfwFormCardInstance>()
const isEdit = computed(() => !!props?.id)
const form = reactive({
  name: props?.name || '',
  code: props?.code || '',
  width: props?.width ?? 750,
  height: props?.height ?? 300,
  description: props?.description || '',
  sortOrder: props?.sortOrder ?? 0,
})
const formTemplate: FormItemConfig[] = [
  { key: 'name', label: '类型名称', component: 'el-input', rules: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
    elProps: { placeholder: '请输入类型名称', clearable: true } },
  { key: 'code', label: '类型编码', component: 'el-input', rules: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
    elProps: { placeholder: '如 home-banner', clearable: true } },
  { key: 'width', label: '宽度(px)', component: 'el-input-number', rules: [{ required: true, message: '请输入宽度', trigger: 'blur' }],
    elProps: { min: 1, max: 9999, controlsPosition: 'right' } },
  { key: 'height', label: '高度(px)', component: 'el-input-number', rules: [{ required: true, message: '请输入高度', trigger: 'blur' }],
    elProps: { min: 1, max: 9999, controlsPosition: 'right' } },
  { key: 'description', label: '描述', component: 'el-input', elProps: { placeholder: '请输入描述', type: 'textarea', rows: 2 } },
  { key: 'sortOrder', label: '排序', component: 'el-input-number', elProps: { min: 0, controlsPosition: 'right' } },
]
const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  if (isEdit.value) {
    await new ApiAdPlacementTypeUpdate({ params: { id: props.id! }, body: form })
  } else {
    await new ApiAdPlacementTypeCreate({ body: form })
  }
}
defineExpose({ onConfirm })
</script>
