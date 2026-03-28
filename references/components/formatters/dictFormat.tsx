import { defineComponent, h, toRef, PropType, VNode, RendererNode, Ref, RendererElement } from 'vue'
import { BaseComponent } from './base'
import { ElTag } from 'element-plus'


export type OptionsType = Array<{ value: string | number; label: string; type?: 'success' | 'info' | 'warning' | 'danger' }>
export interface DictFormatProps {
  value?: string | number | Array<string | number>
  options: Ref<OptionsType> | OptionsType
}

export interface DictFormatComponent extends BaseComponent {
  name: 'dict-format'
  elProps?: DictFormatProps
}

export default defineComponent({
  name: 'DictFormat',
  props: {
    value: [Number, String] as PropType<DictFormatProps['value']>,
    options: Array as PropType<DictFormatProps['options'] | any>
  },
  setup(props) {
    const value = toRef(props, 'value', '')
    const options = toRef(props, 'options', [])
    const types: Array<'success' | 'info' | 'warning' | 'danger'> = ['success', 'info', 'warning', 'danger']

    options.value.forEach((item: any, index: number) => {
      const typeIndex = index % types.length
      item.type = types[typeIndex]
    })

    const getStr = (v: string | number) => {
      const item = options.value.find((item: any) => {
        return item.value == v
      }) || { label: '--', value: '' }
      return item.label
    }

    const getType = (v: string | number) => {
      const item = options.value.find((item: any) => {
        return item.value == v
      }) || { label: '--', value: '', type: 'info' }
      return item.type
    }

    return {
      value,
      getStr,
      getType
    }
  },
  render() {
    let tags: VNode<
      RendererNode,
      RendererElement,
      {
        [key: string]: any
      }
    >[] = []

    if (Array.isArray(this.value)) {
      tags = this.value.map((item) => {
        return h(ElTag, { type: this.getType(item), style: { 'margin-left': '5px' } }, this.getStr(item))
      })
    } else {
      tags.push(h(ElTag, { type: this.getType(this.value) }, this.getStr(this.value)))
    }

    try {
      return h('div', tags)
    } catch {
      return h('span')
    }
  }
})
