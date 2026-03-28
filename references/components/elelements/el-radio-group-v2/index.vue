<template>
  <el-radio-group v-model="radio" :disabled="disabled" :size="size" @change="handleChange">
    <el-radio-button :label="item.label" :value="item.value" :key="item.value"  v-for="(item) in options"/>
  </el-radio-group>
</template>
  
<script lang="ts" setup>
import { PropType, ref } from 'vue';

const emit = defineEmits(['update:modelValue'])
const { modelValue,disabled,size,options } = defineProps({
  modelValue: {
    type: [Number, String,Boolean]
  },
  disabled:[Boolean],
  size:{
    type:String as PropType<'large' | 'default' | 'small'>,
  },
  options:{
    type:Array as PropType<{label:string,value:number}[]>,
  }
})

const radio = ref(modelValue)

const handleChange = (val:any) => {
  emit('update:modelValue',val)
}

</script>

<style lang="scss" scoped>

</style>