<!--
/**
 * @fileoverview MfwRadioGroup 通用单选组组件
 * @description 支持 options 配置的 RadioGroup，适配 MfwFormCard
 */
-->
<template>
  <el-radio-group
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="handleChange"
  >
    <template v-if="buttonMode">
      <el-radio-button
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </el-radio-button>
    </template>
    <template v-else>
      <el-radio
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </el-radio>
    </template>
  </el-radio-group>
</template>

<script setup lang="ts">
import type { RadioOption } from './types';

const props = withDefaults(defineProps<{
  modelValue?: string | number | boolean;
  options?: RadioOption[];
  disabled?: boolean;
  buttonMode?: boolean;
}>(), {
  modelValue: undefined,
  options: () => [],
  disabled: false,
  buttonMode: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean];
  change: [value: string | number | boolean];
}>();

const handleChange = (val: string | number | boolean) => {
  emit('update:modelValue', val);
  emit('change', val);
};
</script>
