<template>
  <div class="icon-picker-input" @click="select">
    <div class="left"><i :class="selected" /></div>
    <div class="conter">
      <span v-if="!selected" class="placeholder">{{}}</span>
      <span v-else>{{ selected }}</span>
    </div>
    <i class="mo-icon icon-guanbi" @click.stop="close" />
  </div>
</template>

<script lang="ts">
import { defineComponent, toRef, watch, ref } from 'vue'
import MoPopup from '../popup'
import Picker from './picker.vue'

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    modelValue: String,
    placeholder: { type: String, default: '请选择' }
  },
  setup(props, { emit }) {
    const selected = ref(props.modelValue || '')

    watch(selected, (value) => {
      emit('update:modelValue', value)
    })

    const close = () => {
      selected.value = ''
    }

    const select = () => {
      MoPopup.open({
        title: 'ICON',
        type: 'dialog',
        component: Picker,
        popupProps: { width: 600 },
        footer: { showConfirm: false },
        on: {
          confirm: (item) => {
            selected.value = item
          }
        }
      })
    }

    return { selected, close, select }
  }
})
</script>

<style lang="scss">
.icon-picker-input {
  width: 100%;
  height: 32px;
  border: 1px solid var(--el-border-color-base);
  border-radius: 4px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
  cursor: pointer;
  .placeholder {
    color: var(--el-disabled-text-color);
  }
  &:hover {
    .icon-guanbi {
      display: block;
    }
  }
  .left {
    width: 36px;
    height: 32px;
    border-right: 1px solid var(--el-border-color-base);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .conter {
    flex: 1;
    height: 100%;
    padding-left: 10px;
  }
  .icon-guanbi {
    padding: 0 5px;
    color: var(--el-disabled-text-color);
    display: none;
  }
}
</style>
