<template>
  <div class="form-card-helper" v-if="options.type === 'text'" v-html="options.value"></div>
  <component v-else :is="options.value" />
</template>
<script setup lang="ts">
import { computed, PropType } from 'vue'
import { ComponentNode, FormTemplateItem } from './type'

const { item, formData } = defineProps({
  item: {
    type: Object as PropType<FormTemplateItem<any>>
  },
  formData: { type: Object as PropType<Record<string, any>> }
})

const options = computed(() => {
  if (typeof item?.helper === 'function') {
    return item.helper({ value: item.computed, row: item, key: item.key, formData })
  } else {
    return {
      type: 'text',
      value: item?.helper
    }
  }
})
</script>
<style lang="scss" scoped>
.form-card-helper{
  white-space: pre-wrap;
}
</style>
