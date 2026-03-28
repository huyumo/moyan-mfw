<template>
  <page-scene-v2 ref="pageScene" @refresh="refresh">
    <div class="form-page-box-1 ">
      <form-card ref="formCardRef" :template="template" :form-data="formData.data"></form-card>
      <div class="form-page-footer">
        <el-button type="danger" @Click="formCardRef?.resetForm">
          重置
        </el-button>
        <el-button type="primary" @click="save">
          保存
        </el-button>
      </div>
    </div>
  </page-scene-v2>
</template>
<script lang="ts">
import { defineComponent, ref, PropType, toRef } from 'vue'
import FormCard from '@/components/formCard/index.vue'
import { FormTemplateArray, FormCardInstance } from '@/components/formCard/type'
import { SettingProvider } from '@/components/settingPage/settingProvider'

export default defineComponent({
  components: { FormCard },
  props: {
    template: {
      type: Array as PropType<FormTemplateArray>
    },
    setting_key: { type: String },
    setting_name: { type: String }
  },
  setup(props) {
    const formCardRef = ref<FormCardInstance>()
    const setting_key = toRef(props, 'setting_key', 'sysSetting')
    const setting_name = toRef(props, 'setting_name', '系统设置')
    const template = toRef(props, 'template', [])
    const { save, formData, refresh } = SettingProvider({
      setting_key: setting_key.value,
      setting_name: setting_name.value,
      formCardRef
    })

    return { template, formData, save, refresh, formCardRef }
  }
})
</script>
