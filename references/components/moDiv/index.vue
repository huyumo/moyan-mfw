<template>
  <div class="mo-text-div" :style="{color}">
    {{ text }}
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const { formatter, modelValue,color } = defineProps({
  modelValue: {
    type: [String, Number, Object, Array],
    default: ''
  },
  formatter: {
    type: Function,
    default: (val: any) => val
  },
  color:{
    type: String,
    default: '#666666'
  }
})

const text = computed(() => formatter(modelValue))

</script>
<style lang="scss">
.mo-text-div {
  line-height: 32px;
  word-break: pre;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #666666;
}
</style>
