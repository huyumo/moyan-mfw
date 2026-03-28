import { defineComponent, h, ref, toRef, PropType, Ref, watch } from 'vue'
import { BaseComponent } from './base'

export interface TreeFormatProps {
  value?: Array<any>
  options: Array<any> | Ref<Array<any>> // tree 数据
  delimiter?: String // 分隔符
  props?: { // 映射关系
    value?: string,
    label?: string,
    children?: string
  }
}

export interface TreeFormatComponent extends BaseComponent {
  name: 'tree-format'
  elProps?: TreeFormatProps
}

export default defineComponent({
  name: 'TreeFormat',
  props: {
    delimiter: String,
    value: Array as PropType<TreeFormatProps['value']>,
    options: Array as PropType<TreeFormatProps['options']>,
    props: Object as PropType<TreeFormatProps['props']>
  },
  setup(props) {

    const delimiter = toRef(props, 'delimiter', ' / ')
    const value = ref(props.value || [])
    const options: Ref<Array<any>> = toRef(props, 'options', []) as any
    const aProps = toRef(props, 'props', {})

    const defaultProps = Object.assign({
      value: 'value',
      label: 'label',
      children: 'children'
    },
      aProps.value
    )


    watch(props, (props) => {
      value.value = props.value || []
    }, { deep: true })


    let ids = [...value.value]
    const getTreeArr = (arr: Array<any>, children: Array<any>) => {
      const id = ids.shift()
      if (id) {
        const item = children.find((item) => {
          return item[defaultProps.value] == id
        }) || { [defaultProps.value]: id, [defaultProps.label]: '', children: [] }
        arr.push(item[defaultProps.label])
        getTreeArr(arr, item.children)
      }
    }

    const renderItems = () => {
      ids = [...value.value]
      const arr: Array<any> = []
      getTreeArr(arr, options.value)
      return (<div>{arr.join(delimiter.value)}</div>)
    }
    return { value, renderItems }
  },
  render() {
    try {
      return this.renderItems()
    } catch (e) {
      return
    }
  }
})
