import { MoUitls } from '@/lib/uilt.mo'
import { defineComponent, h, toRef, PropType } from 'vue'
import { ElRadio, ElRadioGroup } from 'element-plus'

export interface MoRadioProps {
  modelValue?: string | number
  options: Array<{ value: string | number; label: string; type?: 'success' | 'info' | 'warning' | 'danger' }>
}

export default defineComponent({
  name: 'MoRadio',
  emits: ['update:modelValue', 'change'],
  props: {
    modelValue: [String, Number] as PropType<MoRadioProps['modelValue']>,
    options: Array as PropType<MoRadioProps['options']>
  },
  setup(props) {
    const modelValue = toRef(props, 'modelValue', '')
    const options = toRef(props, 'options', [])
    return { modelValue, options }
  },
  render() {
    return h(
      ElRadioGroup,
      {
        modelValue: this.modelValue,
        onChange: (e) => {
          this.$emit('change', e)
          this.$emit('update:modelValue', e)
        }
      },
      this.options.map((item) => {
        return h(ElRadio, { label: item.value }, item.label)
      })
    )
  }
})
