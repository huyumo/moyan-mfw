import { defineComponent, h, toRef, ref, PropType, VNode, RendererNode, RendererElement, watch } from 'vue'
import { BaseComponent } from './base'
import { ElTag, ElTooltip } from 'element-plus'

export interface DictEntrysFormatProps {
  value?: Array<{ value: string | number; label: string; type: 'success' | 'info' | 'warning' | 'danger' }>
}

export interface DictEntrysFormatComponent extends BaseComponent {
  name: 'dict-entrys-format'
  elProps?: DictEntrysFormatProps
}

export default defineComponent({
  name: 'DictEntrysFormat',
  props: {
    value: Array as PropType<DictEntrysFormatProps['value']>
  },
  setup(props) {
    const value = toRef(props, 'value', [])
    const types: Array<'success' | 'info' | 'warning' | 'danger'> = ['success', 'info', 'warning', 'danger']

    value.value.forEach((item, index) => {
      const typeIndex = index % types.length
      item.type = types[typeIndex]
    })
    return { value }
  },
  render() {
    try {
      let tags: VNode<
        RendererNode,
        RendererElement,
        {
          [key: string]: any
        }
      >[] = this.value.map((item) => {
        return h(ElTooltip, { placement: 'top', content: JSON.stringify(item.value) }, [
          h(ElTag, { type: item.type }, item.label)
        ])
      })
      return h('div', tags)
    } catch {
      return h('span')
    }
  }
})
