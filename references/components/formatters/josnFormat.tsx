import { defineComponent, h, toRef, PropType } from 'vue'
import { BaseComponent } from './base'

export interface JosnFormatProps {
  value?: { [key: string]: any } | Array<any>
}

export interface JsonFormatComponent extends BaseComponent {
  name: 'json-format'
  elProps?: JosnFormatProps
}

export default defineComponent({
  name: 'JosnFormat',
  props: {
    value: [Object, Array] as PropType<JosnFormatProps['value']>
  },
  setup(props) {
    const value = toRef(props, 'value')
    return { value }
  },
  render() {
    try {
      return <span>{JSON.stringify(this.value)}</span>
    } catch (e) {
      return
    }
  }
})
