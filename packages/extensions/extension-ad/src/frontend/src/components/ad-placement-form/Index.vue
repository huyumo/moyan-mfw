<!--
/**
 * @fileoverview 广告位表单组件
 * @description 新建/编辑广告位的表单
 */
-->
<template>
  <MfwFormCard ref="formRef" :form-data="form" :template="formTemplate" :form-props="{ labelWidth: '100px' }" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base/frontend'
import { ApiAdPlacementCreate, ApiAdPlacementUpdate } from '../../apis/ad'

const props = defineProps<{
  id?: string
  name?: string
  code?: string
  width?: number
  height?: number
  description?: string
  sortOrder?: number
}>()
defineOptions({ name: 'MfwAdPlacementForm' })
const formRef = ref<MfwFormCardInstance>()
const isEdit = computed(() => !!props?.id)

const form = reactive({
  name: '',
  code: '',
  width: 750,
  height: 300,
  description: '',
  sortOrder: 0,
})

watch(
  () => props,
  (p) => {
    form.name = p?.name || ''
    form.code = p?.code || ''
    form.width = p?.width ?? 750
    form.height = p?.height ?? 300
    form.description = p?.description || ''
    form.sortOrder = p?.sortOrder ?? 0
  },
  { immediate: true },
)

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'name', label: '广告位名称', component: 'el-input',
    rules: [{ required: true, message: '请输入广告位名称', trigger: 'blur' }],
    elProps: { placeholder: '如 首页顶部横幅', clearable: true }
  },
  {
    key: 'code', label: '广告位编码', component: 'el-input',
    rules: [{ required: true, message: '请输入广告位编码', trigger: 'blur' }],
    elProps: { placeholder: '如 home-top-banner', clearable: true }
  },
  {
    key: 'width', label: '宽度(px)', component: 'el-input-number',
    rules: [{ required: true, message: '请输入宽度', trigger: 'blur' }],
    elProps: { min: 1, controlsPosition: 'right', placeholder: '如 750' }
  },
  {
    key: 'height', label: '高度(px)', component: 'el-input-number',
    rules: [{ required: true, message: '请输入高度', trigger: 'blur' }],
    elProps: { min: 1, controlsPosition: 'right', placeholder: '如 300' }
  },
  {
    key: 'description', label: '描述', component: 'el-input',
    elProps: { placeholder: '请输入描述', type: 'textarea', rows: 2 }
  },
  {
    key: 'sortOrder', label: '排序', component: 'el-input-number',
    elProps: { min: 0, controlsPosition: 'right' }
  },
])

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  if (isEdit.value) {
    await new ApiAdPlacementUpdate({ params: { id: props.id! }, body: form })
  } else {
    await new ApiAdPlacementCreate({ body: form })
  }
}
defineExpose({ onConfirm })
</script>
