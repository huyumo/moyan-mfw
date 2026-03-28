import { defineComponent, ref, Ref, inject } from 'vue'
import { FormCardInstance } from '@/components/formCard/type'
import { ApiSettingSave } from '@/apis/micro-system'
import { PageSceneV2 } from '@/components/pageSceneV2/type'
import { VoSettingSaveBody } from '@/apis/micro-system/schemas'
import { storeCommon } from '@/common/use/store/common'

/**
 * 统统配置页面处理器
 * @param options
 * @returns
 */
export const SettingProvider = (options: {
  setting_key: string
  setting_name: string
  formCardRef: Ref<FormCardInstance | undefined>
  ctx: any
}) => {
  const formCardRef = options.formCardRef
  const subPagePanel = inject<PageSceneV2['subPagePanel']>('subPagePanel')
  const settingForm = storeCommon.SettingForm
  const settingData = settingForm[options.setting_key]
  const formData = ref<VoSettingSaveBody & { data: any }>({
    id: settingData ? settingData.id : undefined,
    setting_key: options.setting_key,
    setting_name: options.setting_name,
    data: settingData ? settingData.data : {}
  })

  const save = () => {
    const params = formData.value
    formCardRef.value?.validate().then(() => {
      new ApiSettingSave({ params, option: { hintSuccess: true } }).then(() => {
        storeCommon.getSetting()
        subPagePanel && subPagePanel.close()
        options.ctx && options.ctx.emit && options.ctx.emit('save', params)
      })
    })
  }

  const refresh = () => {
    storeCommon.getSetting()
  }

  return {
    formCardRef,
    subPagePanel,
    settingForm,
    formData,
    save,
    refresh
  }
}
