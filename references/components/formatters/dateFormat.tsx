import { MoUitls } from '@/lib/uilt.mo'
import { defineComponent, h, toRef, PropType } from 'vue'
import { BaseComponent } from './base'

export interface DateFormatProps {
  value?: Date | string
  fmt?: string // fmt 如：YYYY-MM-DD hh:mm:ss表示2019-06-06 19:45:00
}

export interface DateFormatComponent extends BaseComponent {
  name: 'date-format'
  elProps?: DateFormatProps
}

export default defineComponent({
  name: 'DateFormat',
  props: {
    value: [Date, String] as PropType<DateFormatProps['value']>,
    fmt: String as PropType<DateFormatProps['fmt']>
  },
  setup(props) {
    const value = toRef(props, 'value', '')
    const fmt = toRef(props, 'fmt', 'YYYY-MM-DD HH:mm:ss')
    return { value, fmt }
  },
  render() {
    try {
      const date = new Date(this.value)
      if (this.value && date) {
        return h('span', MoUitls.$mo.dateFormat(this.fmt, date))
      }
      return h('span', '----/--/--')
    } catch {
      return h('span')
    }
  }
})
