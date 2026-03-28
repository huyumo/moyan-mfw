<template>
  <template :key="index" v-for="(item, index) in formTemplate">
    <component
      :key="index"
      v-if="item.headerBar && item.headerBar.show && showItem(item, formData[item.key], formData)"
      :is="item.type"
      :id="item.id"
      :disabled="disabledItem(item, formData[item.key], formData)"
      v-bind="item.elProps"
      v-model="formData[item.key]"
      v-on="item.on"
      @change="change({ value: $event, key: item.key, row: item, formData, type: 'searchBar', formTemplate })"
      :style="{ width: item.headerBar && item.headerBar.width ? item.headerBar.width : '140px' }"
    >
    </component>
  </template>
</template>
<script lang="ts">
import { defineComponent, toRef, ref, PropType, watch, onMounted } from 'vue'
import { SearchFormTemplateArray, showItem,  FormTemplateItem, handleDisabled } from './type'

export default defineComponent({
  emits: ['change'],
  props: {
    formData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    template: {
      type: Object as PropType<SearchFormTemplateArray>,
      default: () => {
        return []
      }
    },
  disabled: {
    type: Boolean,
    default: false
  }
  },
  setup(props, { emit }) {
    const formTemplate = toRef(props, 'template', [])
    const formData = toRef(props, 'formData', {})
    const disabled = toRef(props, 'disabled', false)

    formTemplate.value.forEach((item: any) => {
      if (!item.elProps) {
        item.elProps = item.elProps || {}
        item.elProps.placeholder =
          item.placeholder || (item.elProps && item.elProps.placeholder ? item.elProps.placeholder : item.label)
      }
      item.elProps.clearable = typeof item.elProps.clearable === 'undefined' ? true : item.elProps.clearable
      item.itemProps = Object.assign({ rules: item.rules }, item.itemProps)
      item.on = item.on || {}
      if (!formData.value[item.key]) {
        formData.value[item.key] = item.value
      }
    })

    const change = (scope: {
      value: any
      key: string | undefined
      row: any
      formData: any
      type: string
      formTemplate: any
    }) => {
      scope['formTemplate'] = formTemplate.value
      scope.row.setViewText && scope.row.setViewText(scope)
      scope.row.change && scope.row.change(scope)
      emit('change', scope)
    }

    const disabledItem = (item: FormTemplateItem<any>, value: any, formData: any, mode?: 'add' | 'edit' | 'view') => {
  return handleDisabled(item, value, formData, mode) ||  disabled.value
}

    return {
      formData,
      formTemplate,
      change,
      showItem,
      disabledItem
    }
  }
})
</script>
