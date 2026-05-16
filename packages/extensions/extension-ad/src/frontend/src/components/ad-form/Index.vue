<!--
/**
 * @fileoverview 广告内容表单组件
 * @description 新建/编辑广告内容的表单，支持图片/视频媒体类型和小程序/App内部/外部链接/不跳转四种跳转方式
 */
-->
<template>
  <MfwFormCard ref="formRef" :form-data="form" :template="formTemplate" :form-props="{ labelWidth: '110px' }" />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { MfwFormCard, MfwImageSingle, MfwVideoSingle, MfwRadioGroup } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base/frontend'
import type { ImageResource, MediaResource } from 'moyan-mfw-base/frontend'
import { ApiAdCreate, ApiAdUpdate } from '../../apis/ad'
import { LINK_TYPE_LABELS, LINK_TYPE } from 'moyan-mfw-extension-ad/shared'

type MediaType = 'image' | 'video'

const props = defineProps<{
  placementId: string
  placementWidth?: number
  placementHeight?: number
  id?: string
  mediaType?: MediaType
  media?: ImageResource | MediaResource
  title?: string
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

const cropRatio = computed(() => {
  if (props.placementWidth && props.placementHeight && props.placementHeight > 0) {
    return props.placementWidth / props.placementHeight
  }
  return 1
})

const form = reactive({
  placementId: props?.placementId || '',
  mediaType: props?.mediaType || 'image' as MediaType,
  media: props?.media || undefined as ImageResource | MediaResource | undefined,
  title: props?.title || '',
  linkType: props?.linkType || LINK_TYPE.NONE,
  linkUrl: props?.linkUrl || '',
  miniAppId: props?.miniAppId || '',
  miniAppPath: props?.miniAppPath || '',
  internalRoute: props?.internalRoute || '',
  startTime: props?.startTime || '',
  endTime: props?.endTime || '',
  sortOrder: props?.sortOrder ?? 0,
})

const linkTypeOptions = Object.entries(LINK_TYPE_LABELS).map(([k, v]) => ({ label: v, value: k }))

const mediaTypeOptions = [
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
]

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'title', label: '广告标题', component: 'el-input',
    rules: [{ required: true, message: '请输入广告标题', trigger: 'blur' }],
    elProps: { placeholder: '请输入广告标题', clearable: true }
  },
  {
    key: 'mediaType', label: '媒体类型', component: MfwRadioGroup,
    rules: [{ required: true, message: '请选择媒体类型', trigger: 'change' }],
    elProps: { options: mediaTypeOptions }
  },
  {
    key: 'media', label: '广告图片', component: MfwImageSingle,
    show: (data) => data.mediaType === 'image',
    rules: [{ required: true, message: '请上传广告图片', trigger: 'change' }],
    elProps: { placeholder: '点击上传图片', crop: true, cropRatio: cropRatio.value }
  },
  {
    key: 'media', label: '广告视频', component: MfwVideoSingle,
    show: (data) => data.mediaType === 'video',
    rules: [{ required: true, message: '请上传广告视频', trigger: 'change' }],
    elProps: { placeholder: '点击上传视频', maxSize: 100 }
  },
  {
    key: 'linkType', label: '跳转方式', component: 'el-select',
    rules: [{ required: true, message: '请选择跳转方式', trigger: 'change' }],
    elProps: { placeholder: '请选择跳转方式', options: linkTypeOptions }
  },
  {
    key: 'linkUrl', label: '跳转链接', component: 'el-input',
    show: (data) => data.linkType === LINK_TYPE.EXTERNAL,
    rules: [{ required: true, message: '请输入跳转链接', trigger: 'blur' }],
    elProps: { placeholder: 'https://...', clearable: true }
  },
  {
    key: 'miniAppId', label: '小程序 AppId', component: 'el-input',
    show: (data) => data.linkType === LINK_TYPE.MINIAPP,
    rules: [{ required: true, message: '请输入小程序 AppId', trigger: 'blur' }],
    elProps: { placeholder: 'wx...', clearable: true }
  },
  {
    key: 'miniAppPath', label: '小程序路径', component: 'el-input',
    show: (data) => data.linkType === LINK_TYPE.MINIAPP,
    rules: [{ required: true, message: '请输入小程序路径', trigger: 'blur' }],
    elProps: { placeholder: 'pages/index/index', clearable: true }
  },
  {
    key: 'internalRoute', label: 'App内部路由', component: 'el-input',
    show: (data) => data.linkType === LINK_TYPE.INTERNAL,
    rules: [{ required: true, message: '请输入 App 内部路由路径', trigger: 'blur' }],
    elProps: { placeholder: '/pages/goods/detail?id=xxx', clearable: true }
  },
  {
    key: 'startTime', label: '开始时间', component: 'el-date-picker',
    elProps: { type: 'datetime', placeholder: '选择开始时间', valueFormat: 'YYYY-MM-DDTHH:mm:ss' }
  },
  {
    key: 'endTime', label: '结束时间', component: 'el-date-picker',
    elProps: { type: 'datetime', placeholder: '选择结束时间', valueFormat: 'YYYY-MM-DDTHH:mm:ss' }
  },
  {
    key: 'sortOrder', label: '排序', component: 'el-input-number',
    elProps: { min: 0, controlsPosition: 'right' }
  },
])

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  if (!form.media) throw new Error('请上传媒体资源')
  const body = {
    placementId: form.placementId,
    mediaType: form.mediaType,
    media: form.media,
    title: form.title,
    linkType: form.linkType,
    linkUrl: form.linkUrl || undefined,
    miniAppId: form.miniAppId || undefined,
    miniAppPath: form.miniAppPath || undefined,
    internalRoute: form.internalRoute || undefined,
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    sortOrder: form.sortOrder,
  }
  if (isEdit.value) {
    await new ApiAdUpdate({ params: { id: props.id! }, body })
  } else {
    await new ApiAdCreate({ body })
  }
}
defineExpose({ onConfirm })
</script>
