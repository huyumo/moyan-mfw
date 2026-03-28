import { $Mo, MoUitls } from '@/lib/uilt.mo'
import { defineComponent, h, toRef, PropType } from 'vue'
import { BaseComponent } from './base'
import { ElTag } from 'element-plus'
import { ref } from 'vue'

export interface TagFormatProps  {
  value: string,
  [key: string]: any // 其他属性
  autoColor?: boolean
}

export interface TagComponent extends BaseComponent {
  name: 'tag'
  elProps?: TagFormatProps
}

export default defineComponent({
  name: 'tag',
  props: {
    value: [String] as PropType<TagFormatProps['value']>,
  },
  setup(props) {
    const value = toRef(props, 'value', '')
    return { value }
  },
  render() {
    try {
      const color = MoUitls.$mo.getColor(this.value)
      if (this.value) {
        return h(ElTag,{style:{color,border:`1px ${color} solid`}, effect:"plain","disable-transitions":true,
          round:true, ...this.$props ,key:color },[this.value])
      }
      return h('span', '----')
    } catch {
      return h('span')
    }
  }
})
