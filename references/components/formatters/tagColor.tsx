import { MoUitls } from '@/lib/uilt.mo'
import { defineComponent, h, toRef, PropType } from 'vue'
import { BaseComponent } from './base'

export interface TagColorFormatProps {
  value: string,
  size: number
}

export interface TagColorComponent extends BaseComponent {
  name: 'tag-color'
  elProps?: TagColorFormatProps
}

export default defineComponent({
  name: 'tag-color',
  props: {
    value: [String] as PropType<TagColorFormatProps['value']>,
    size: [Number] as PropType<TagColorFormatProps['size']>,
  },
  setup(props) {
    const value = toRef(props, 'value', '')
    const size = toRef(props, 'size', 25)
    return { value }
  },
  render() {
    try {
      if (this.value) {
        return h('i', {
          class: `tag-color`,
          style: {
            background: this.value,
            width: `${this.size}px`,
            height: `${this.size}px`,
          }
        })
      }
      return h('span', '----')
    } catch {
      return h('span')
    }
  }
})
