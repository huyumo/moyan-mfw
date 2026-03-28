<template>
  <div
    class="statistics-bar-item"
    :style="{ flex: flexSpan, 'flex-direction': itemFlexDirection || itemFlexDirectionFromInject }"
  >
    <div class="statistics-bar-item__title">
      <slot v-if="slots.label" name="label"></slot>
      <span v-else>{{ label }}{{ itemFlexDirection == 'row' ? ' : ' : '•' }}</span>
    </div>
    <div class="statistics-bar-item__content" :style="{ color }">
      <slot v-if="slots.default" name="default"></slot>
      <span v-else>{{ value }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, PropType, useSlots } from 'vue'

const slots = useSlots()
const itemFlexDirectionFromInject = inject<'row' | 'column' | undefined>('itemFlexDirection')

const { label, value, flexSpan, itemFlexDirection } = defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number, Object, Array], default: '' },
  flexSpan: { type: Number },
  itemFlexDirection: { type: String as PropType<'row' | 'column'>, default: 'row' },
  color: { type: String, default: '#333' }
})
</script>
<style lang="scss" scoped>
.statistics-bar-item {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  gap: 2px;
  &__title {
    color: #666;
  }
  &__content {
  }
}
</style>
