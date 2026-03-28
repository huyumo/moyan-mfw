<template>
  <div class="statistics-bar">
    <slot></slot>
    <div class="statistics-bar-item-right"></div>
  </div>
</template>
<script setup lang="ts">
import { provide } from 'vue'
const { itemFlexDirection } = defineProps({
  itemFlexDirection: { default: 'row', type: String }
})

provide('itemFlexDirection', itemFlexDirection)
</script>

<style scoped lang="scss">
.statistics-bar {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px;
  row-gap: 10px; /* 单独设置行间距 */
  column-gap: 2px; /* 单独设置列间距 */
  border-bottom: 1px solid #e0e0e0;
  .statistics-bar-item-right {
    flex: 1;
  }
}
</style>
