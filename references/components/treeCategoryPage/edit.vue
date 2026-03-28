<template>
  <div class="form-page-box-2">
    <form-card ref="formCardRef" :template="template" :form-data="formData"> </form-card>
    <div class="form-page-footer">
      <el-button type="primary" @click="save">保存</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref, toRef, inject } from 'vue'
import FormCard from '@/components/formCard/index.vue'
import { FormTemplateArray, FormCardInstance } from '@/components/formCard/type'
import { ApiTreeCategoryAdd, ApiTreeCategoryEdit } from '@/apis/micro-system'
import { PageSceneV2 } from '@/components/pageSceneV2/type'
import { getConfig } from '@/config'
import { VoTreeCategoryEditBody } from '@/apis/micro-system/schemas'
export const config = getConfig()

export default defineComponent({
  emits: ['change', 'save'],
  props: {
    formData: Object as PropType<VoTreeCategoryEditBody>,
    parentData: Object as PropType<VoTreeCategoryEditBody>,
    showIcon: Boolean,
    showParent: Boolean,
    nodeShowIconNumber: Number
  },
  components: { FormCard },
  setup(props, ctx) {
    const formCardRef = ref<FormCardInstance>()
    const subPagePanel = inject<PageSceneV2['subPagePanel']>('subPagePanel')
    const showIcon = toRef(props, 'showIcon', true)
    const showParent = toRef(props, 'showParent', true)
    const nodeShowIconNumber = toRef(props, 'nodeShowIconNumber', 1)

    const expandFormRows: (scope: {
      template: FormTemplateArray
      formData: VoTreeCategoryEditBody
      parentData: VoTreeCategoryEditBody
      showIcon: Boolean
    }) => FormTemplateArray = inject('expandFormRows') as any

    const defaultData: VoTreeCategoryEditBody = {
      root_key: '', // 分类类型
      key: '', // 唯一调用key
      category_name: '', // 名称
      icon: '',
      active_icon: '',
      expand: {},
      delete_mode: 0,
      sort: 0,
      parent_id: 0,
      id: 0,
      used_table_name: []
    }
    const parentData = toRef(props, 'parentData', defaultData)

    const formData = toRef(props, 'formData', defaultData)

    const template = ref<FormTemplateArray>([
      {
        key: 'parent_id',
        label: '父ID',
        type: 'el-input',
        value: parentData.value.id || undefined,
        disabled: true,
        show: showParent.value
      },
      {
        key: 'pCategoryName',
        label: ' 父节点',
        type: 'el-input',
        value: parentData.value.category_name,
        disabled: true,
        show: showParent.value
      },
      {
        key: 'delete_mode',
        label: '删除模式',
        type: 'el-select-v2',
        value: 0,
        elProps: {
          options: [
            { value: 0, label: '无限制' },
            { value: 1, label: 'Debug' }
          ]
        },
        show: config.debug
      },
      {
        key: 'key',
        label: '调用key',
        type: 'el-input',
        disabled: !!formData.value.id
      },
      {
        key: 'icon',
        label: '图标（未选中的）',
        type: 'upload-img',
        helper: '建议尺寸 100x100,建议格式.png',
        show: showIcon.value
      },
      {
        key: 'active_icon',
        label: '图标（已选中的）',
        type: 'upload-img',
        helper: '建议尺寸 100x100,建议格式.png',
        show: showIcon.value && nodeShowIconNumber.value >= 2
      },
      {
        key: 'category_name',
        label: '名称',
        type: 'el-input',
        rules: [{ required: true, message: '名称不能为空', type: 'string' }]
      }
    ])

    if (!!expandFormRows) {
      template.value = expandFormRows({
        template: template.value,
        formData: formData.value,
        parentData: parentData.value,
        showIcon: showIcon.value
      }) as any
    }

    const change = (scope: { value: any; key: string | undefined; row: any; formData: any; type: string }) => {
      ctx.emit('change', scope)
    }

    const save = () => {
      formCardRef.value?.validate().then(() => {
        let ret: Promise<any>
        formData.value.used_table_name = parentData.value.used_table_name
        if (formData.value.id) {
          ret = new ApiTreeCategoryEdit({ params: formData.value })
        } else {
          ret = new ApiTreeCategoryAdd({ params: formData.value })
        }
        ret.then(() => {
          subPagePanel && subPagePanel.close()
          ctx.emit('save')
        })
      })
    }
    return { template, formData, change, save, formCardRef, parentData }
  }
})
</script>
