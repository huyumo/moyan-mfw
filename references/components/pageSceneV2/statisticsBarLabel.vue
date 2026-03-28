<template>
  <div :style="{width}" >
    <slot></slot>
  </div>
</template>
<script setup lang="ts">

const {width} = defineProps({
  width: {
    type: String,
    default: 'auto'
  }
})
</script>