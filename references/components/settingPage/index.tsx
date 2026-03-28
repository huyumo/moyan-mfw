import { defineComponent, ref, PropType, toRef } from 'vue'
import FormCard from '@/components/formCard/index.vue'
import { FormTemplateArray, FormCardInstance, FormGroupOption } from '@/components/formCard/type'
import { SettingProvider } from '@/components/settingPage/settingProvider'
import { DefineComponent, VNode, ComputedRef, WritableComputedRef, h, Ref } from 'vue'
export const SettingPage = defineComponent({
  components: { FormCard },
  emits: ['save'],
  props: {
    template: {
      type: Array as PropType<FormTemplateArray>
    },
    formGroup: {
      type: Object as PropType<FormGroupOption>
    },
    setting_key: { type: String },
    setting_name: { type: String },
    pageSceneV2Slots: { type: Object as PropType<{ [key: string]: ((c: any) => any) | VNode | DefineComponent<any> | Function | DefineComponent | Ref<((c: any) => any) | VNode | DefineComponent<any> | Function | DefineComponent> }> }
  },
  setup(props, ctx) {
    const formCardRef = ref<FormCardInstance>()
    const setting_key = toRef(props, 'setting_key', 'sysSetting')
    const setting_name = toRef(props, 'setting_name', '系统设置')
    const template = toRef(props, 'template', [])
    const formGroup = toRef(props, 'formGroup')
    const pageSceneV2Slots = toRef(props, 'pageSceneV2Slots', {})
    const { save, formData, refresh } = SettingProvider({
      setting_key: setting_key.value,
      setting_name: setting_name.value,
      formCardRef,
      ctx
    })
    return { template, formData, save, refresh, formCardRef, pageSceneV2Slots, formGroup }
  },
  render() {
    return (
      <page-scene-v2 ref="pageScene" onRefresh={this.refresh} v-slots={this.pageSceneV2Slots}>
        <div class="form-page-box-1">
          <form-card ref="formCardRef" template={this.template} form-data={this.formData.data} formGroup={this.formGroup}></form-card>
          <div class="form-page-footer">
            <auth-button auth_node_key="save" type="primary" onclick={this.save}>
              保存
            </auth-button>
          </div>
        </div>
      </page-scene-v2>
    )
  }
})
export default SettingPage
