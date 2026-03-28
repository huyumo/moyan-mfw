import { MoUitls } from '@/lib/uilt.mo'
import { ref } from 'vue'
import { SearchFormTemplateArray, FormTemplateItem } from '../formCard/type'

/**
 * 搜索条件提示格式化
 */
export const getTextFuns: {
  [key: string]: (scope: { value: any; key: string; row: FormTemplateItem<any> }) => void
} = {
  'el-select-v2': (scope) => {
    scope.row.viewText = {
      label: scope.row.label || '',
      value: ''
    }
    if (Array.isArray(scope.value)) {
      scope.row.viewText.value = scope.value.length > 0 ? `+${scope.value.length}项` : ''
    } else if (scope.row.elProps) {
      scope.row.viewText.value = MoUitls.$mo.dictStr(scope.row.elProps.options, scope.value)
    } else {
      scope.row.viewText.value = scope.value
    }
  },
  'el-switch': (scope) => {
    if (scope.value) {
      scope.row.viewText = {
        label: scope.row.label || '',
        value: scope.value ? scope.row.elProps.activeText : scope.row.elProps.inactiveText
      }
    } else {
      scope.row.viewText = {
        label: '',
        value: ''
      }
    }
  },

  'el-date-picker': (scope) => {
    if (scope.value) {
      scope.row.viewText = {
        label: scope.row.label || '',
        value:
          Array.isArray(scope.value) && scope.value.length === 2
            ? MoUitls.$mo.dateFormat('YYYY-MM-DD', scope.value[0]) +
            '至' +
            MoUitls.$mo.dateFormat('YYYY-MM-DD', scope.value[1])
            : MoUitls.$mo.dateFormat('YYYY-MM-DD', scope.value)
      }
    } else {
      scope.row.viewText = {
        label: '',
        value: ''
      }
    }
  },
  'el-cascader': (scope) => {
    scope.row.viewText = {
      label: scope.row.label || '',
      value: ''
    }
    const optionArr: Array<any> = []
    const treeToArray = (tree: any) => {
      tree.forEach((item: any) => {
        optionArr.push({
          label: item.label,
          value: item.value
        })
        if (item.children) {
          treeToArray(item.children)
        }
      })
    }
    treeToArray(scope.row.elProps.options)
    if (Array.isArray(scope.value)) {
      const arr = scope.value.map((item) => {
        return MoUitls.$mo.dictStr(optionArr, item)
      })
      scope.row.viewText.value = arr.join(' / ')
    }
  },

  default: (scope) => {
    scope.row.viewText = {
      label: scope.row.label || '',
      value: scope.value
    }
  }
}

/**
 * 处理设置过滤标签属性
 * @param searchFormTemplate
 */
export const handleSetTextFun = (searchFormTemplate: SearchFormTemplateArray) => {
  searchFormTemplate.forEach((item) => {
    item.viewText = {
      label: item.label || '',
      value: ''
    }
    if (item.type) {
      item.setViewText = item.setViewText || getTextFuns[item.type] || getTextFuns.default
    } else {
      item.setViewText = item.setViewText || getTextFuns.default
    }
    item.value &&
      item.setViewText({ row: item, key: item.key, value: item.value, formData: { [item.key]: item.value } })
  })
}

/**
 * 获取要显示的过滤条件
 * @param searchFormTemplate
 */
export const getViewTexts = (searchFormTemplate: SearchFormTemplateArray) => {
  const arr: Array<{ label: string; value: string }> = []
  searchFormTemplate.forEach((item) => {
    if (item.viewText && item.viewText.value) {
      arr.push(item.viewText)
    }
  })
  return arr
}

export const searchStr = ref('')
