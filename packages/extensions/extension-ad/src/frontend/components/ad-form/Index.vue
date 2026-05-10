<!--
/**
 * @fileoverview 广告内容表单组件
 * @description 新建/编辑广告内容的表单，支持小程序/App内部/外部链接三种跳转方式
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '110px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base-frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base-frontend'
import { AdApi } from '../../api'
import { LINK_TYPE_LABELS, LINK_TYPE } from '../../shared/constants'

const props = defineProps<{
  id?: string
  placementId?: string
  title?: string
  imageUrl?: string
  linkType?: string
  linkUrl?: string
  miniAppId?: string
  miniAppPath?: string
  internalRoute?: string
  startTime?: string
  endTime?: string
  sortOrder?: number
}>()
defineOptions({ name: 'MfwAdForm' })
const formRef = ref<MfwFormCardInstance>()
const isEdit = computed(() => !!props?.id)
const placementOptions = ref<{ label: string; value: string }[]>([])

const form = reactive({
  placementId: props?.placementId || '',
  title: props?.title || '',
  imageUrl: props?.imageUrl || '',
  linkType: props?.linkType || LINK_TYPE.EXTERNAL,
  linkUrl: props?.linkUrl || '',
  miniAppId: props?.miniAppId || '',
  miniAppPath: props?.miniAppPath || '',
  internalRoute: props?.internalRoute || '',
  startTime: props?.startTime || '',
  endTime: props?.endTime || '',
  sortOrder: props?.sortOrder ?? 0,
})

const linkTypeOptions = Object.entries(LINK_TYPE_LABELS).map(([k, v]) => ({ label: v, value: k }))

const formTemplate = computed<FormItemConfig[]>(() => {
  const base: FormItemConfig[] = [
    { key: 'placementId', label: '所属广告位', component: 'el-select',
      rules: [{ required: true, message: '请选择广告位', trigger: 'change' }],
      elProps: { placeholder: '请选择广告位', options: placementOptions.value, filterable: true } },
    { key: 'title', label: '广告标题', component: 'el-input',
      rules: [{ required: true, message: '请输入广告标题', trigger: 'blur' }],
      elProps: { placeholder: '请输入广告标题', clearable: true } },
    { key: 'imageUrl', label: '广告图片 URL', component: 'el-input',
      rules: [{ required: true, message: '请输入广告图片 URL', trigger: 'blur' }],
      elProps: { placeholder: '请输入广告图片 URL', clearable: true } },
    { key: 'linkType', label: '跳转方式', component: 'el-select',
      rules: [{ required: true, message: '请选择跳转方式', trigger: 'change' }],
      elProps: { placeholder: '请选择跳转方式', options: linkTypeOptions } },
  ]

  if (form.linkType === LINK_TYPE.EXTERNAL) {
    base.push({ key: 'linkUrl', label: '跳转链接', component: 'el-input',
      rules: [{ required: true, message: '请输入跳转链接', trigger: 'blur' }],
      elProps: { placeholder: 'https://...', clearable: true } })
  } else if (form.linkType === LINK_TYPE.MINIAPP) {
    base.push(
      { key: 'miniAppId', label: '小程序 AppId', component: 'el-input',
        rules: [{ required: true, message: '请输入小程序 AppId', trigger: 'blur' }],
        elProps: { placeholder: 'wx...', clearable: true } },
      { key: 'miniAppPath', label: '小程序路径', component: 'el-input',
        rules: [{ required: true, message: '请输入小程序路径', trigger: 'blur' }],
        elProps: { placeholder: 'pages/index/index', clearable: true } },
    )
  } else if (form.linkType === LINK_TYPE.INTERNAL) {
    base.push({ key: 'internalRoute', label: 'App内部路由', component: 'el-input',
      rules: [{ required: true, message: '请输入 App 内部路由路径', trigger: 'blur' }],
      elProps: { placeholder: '/pages/goods/detail?id=xxx', clearable: true } })
  }

  base.push(
    { key: 'startTime', label: '开始时间', component: 'el-date-picker',
      elProps: { type: 'datetime', placeholder: '选择开始时间', valueFormat: 'YYYY-MM-DDTHH:mm:ss' } },
    { key: 'endTime', label: '结束时间', component: 'el-date-picker',
      elProps: { type: 'datetime', placeholder: '选择结束时间', valueFormat: 'YYYY-MM-DDTHH:mm:ss' } },
    { key: 'sortOrder', label: '排序', component: 'el-input-number',
      elProps: { min: 0, controlsPosition: 'right' } },
  )
  return base
})

onMounted(async () => {
  const res = await AdApi.getPlacements({ pageSize: 999, status: 1 })
  const list = res.data?.data?.data || []
  placementOptions.value = list.map((p: any) => ({ label: `${p.name} (${p.code})`, value: p.id }))
})

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  const body = { ...form }
  if (isEdit.value) {
    await AdApi.updateAd(props.id!, body)
  } else {
    await AdApi.createAd(body)
  }
}
defineExpose({ onConfirm })
</script>
