import { defineComponent, PropType, ref, toRef, inject, reactive, onMounted } from 'vue'
import FormCard from '@/components/formCard/index.vue'
import { FormCardInstance } from '@/components/formCard/type'
import { FormTemplateArray } from '@/components/formCard/type'
import { ApiSimpleDocumentSave } from '@/apis/micro-system'
import { PageSceneV2 } from '@/components/pageSceneV2/type'
import { VoSimpleDocumentSaveBody } from '@/apis/micro-system/schemas'

export type GetTemplateFun<T> = (vm: T) => {
  template: FormTemplateArray
  formData: VoSimpleDocumentSaveBody
}
export default defineComponent({
  emits: ['change', 'save'],
  props: {
    doc_key: String,
    formData: Object as PropType<any>,
    template: Array as PropType<FormTemplateArray>
  },
  components: { FormCard },
  setup(props, ctx) {
    const formCardRef = ref<FormCardInstance>()
    const subPagePanel = inject<PageSceneV2['subPagePanel']>('subPagePanel')
    const doc_key = toRef(props, 'doc_key', 'default')
    const template = toRef(props, 'template', [])
    const formData = toRef(props, 'formData', {})
    const change = (scope: { value: any; key: string | undefined; row: any; formData: any; type: string }) => {
      ctx.emit('change', scope)
    }

    const save = () => {
      formCardRef.value?.validate().then(() => {
        new ApiSimpleDocumentSave({ params: { ...formData.value, doc_key: doc_key.value } }).then(() => {
          subPagePanel && subPagePanel.close()
          ctx.emit('save')
        })
      })
    }
    return { template, formData, change, save, formCardRef }
  },

  render() {
    return (
      <div class="form-page-box-2">
        <form-card ref="formCardRef" template={this.template} form-data={this.formData}> </form-card>
        <div class="form-page-footer">
          <el-button type="primary" onClick={this.save}>保存</el-button>
        </div >
      </div >
    )
  }
})