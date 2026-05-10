<!--
/**
 * @fileoverview 广告位表单组件
 * @description 新建/编辑广告位的表单
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
import { ref, reactive, computed, onMounted } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base-frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base-frontend'
import { ApiAdPlacementCreate, ApiAdPlacementUpdate, ApiAdPlacementTypeFindAll } from '../../apis'

const props = defineProps<{
  id?: string
  name?: string
  code?: string
  placementTypeId?: string
  description?: string
  sortOrder?: number
}>()
defineOptions({ name: 'MfwAdPlacementForm' })
const formRef = ref<MfwFormCardInstance>()
const isEdit = computed(() => !!props?.id)
const typeOptions = ref<{ label: string; value: string }[]>([])

const form = reactive({
  name: props?.name || '',
  code: props?.code || '',
  placementTypeId: props?.placementTypeId || '',
  description: props?.description || '',
  sortOrder: props?.sortOrder ?? 0,
})

const formTemplate = computed<FormItemConfig[]>(() => [
  { key: 'name', label: '广告位名称', component: 'el-input',
    rules: [{ required: true, message: '请输入广告位名称', trigger: 'blur' }],
    elProps: { placeholder: '如 首页顶部横幅', clearable: true } },
  { key: 'code', label: '广告位编码', component: 'el-input',
    rules: [{ required: true, message: '请输入广告位编码', trigger: 'blur' }],
    elProps: { placeholder: '如 home-top-banner', clearable: true } },
  { key: 'placementTypeId', label: '类型配置', component: 'el-select',
    rules: [{ required: true, message: '请选择类型配置', trigger: 'change' }],
    elProps: { placeholder: '请选择广告位类型', options: typeOptions.value, filterable: true } },
  { key: 'description', label: '描述', component: 'el-input',
    elProps: { placeholder: '请输入描述', type: 'textarea', rows: 2 } },
  { key: 'sortOrder', label: '排序', component: 'el-input-number',
    elProps: { min: 0, controlsPosition: 'right' } },
])

onMounted(async () => {
  const api = new ApiAdPlacementTypeFindAll()
  const res = await api.call({ pageSize: 999, status: 1 })
  const list = res.data?.data?.data || []
  typeOptions.value = list.map((t: any) => ({ label: `${t.name} (${t.width}x${t.height})`, value: t.id }))
})

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  if (isEdit.value) {
    await new ApiAdPlacementUpdate().call(props.id!, form)
  } else {
    await new ApiAdPlacementCreate().call(form)
  }
}
defineExpose({ onConfirm })
</script>
