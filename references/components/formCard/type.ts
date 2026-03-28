import { RuleItem, Rules } from 'async-validator'
import type { FormInstance, FormItemRule } from 'element-plus'
import { DefineComponent, VNode, ComputedRef, WritableComputedRef, h, Ref } from 'vue'
import { formCrudComponents, formCrudComponentTypes } from '../formCrudComponents'
export interface DistItem {
  [key: string]: any
  children: DistData
}

export type DistData = Array<DistItem>

export type ComponentNode =((c: any) => any) | VNode | DefineComponent<any> | Function | DefineComponent | Ref<((c: any) => any) | VNode | DefineComponent<any> | Function | DefineComponent> | any

export interface FormTemplateItem<T extends formCrudComponentTypes> {
  label?: string
  type?: formCrudComponentTypes
  key: string
  helper?: string | ((scope: { value: any; key: string; row: FormTemplateItem<T>; formData: any }) => {
    type:'text'|'component',
    value:ComponentNode|string
  }) // 帮助
  helperType?: 'info' | 'warning' | 'error' | 'success' | 'primary' // 帮助显示类型
  disabled?: boolean | ((scope: { value: any; key: string; row: FormTemplateItem<T>; formData: any }) => boolean)
  show?: boolean | ((scope: { value: any; key: string; row: FormTemplateItem<T>; formData: any }) => boolean)
  rules?: FormItemRule | FormItemRule[]
  // slot?: any
  // children?: Array<VNode | DefineComponent<any> | Function | DefineComponent | string | number>
  component?: ComponentNode
  ref?: string,
  value?: any // 默认值
  addDisabled?: false //是否仅在添加编辑框中关闭该字段
  editDisabled?: false //是否仅在修改编辑框中关闭该字段
  groupKey?: string // 分组key
  span?: number // 栅格
  afterText?: string // el-form-item 后面文字
  slots?: { // 插槽
    [key: string]: ComponentNode
  }
  // valueChangeImmediate?: boolean //是否在打开对话框后触发一次valueChange事件
  viewText?: {
    label: string
    value: string
  } //显示文本,如果有options【字典】，则自动返回，其他的默认未文本框值
  itemProps?: {
    // el-form-item的配置
    // https://element-plus.gitee.io/zh-CN/component/form.html#%E5%9F%BA%E7%A1%80%E8%A1%A8%E5%8D%95
    labelWidth?: string //可以隐藏表单项的label
    [key: string]: any
    rules?: RuleItem | RuleItem[]
  }
  elProps?: formCrudComponents[T]['elProps']

  placeholder?: string
  change?: (scope: { value: any; key: string; row: FormTemplateItem<T>; formData: any, formTemplate?: SearchFormTemplateArray }) => void
  setViewText?: (scope: { value: any; key: string; row: FormTemplateItem<T>; formData: any }) => void
  on?: { [key: string]: Function }
  id?: any
  computed?: ComputedRef<any> | WritableComputedRef<any>
}

export interface SearchFormTemplateItem extends FormTemplateItem<formCrudComponentTypes> {
  headerBar?: {
    show?: boolean
    width?: string
  }
}

export type FormTemplateArray = Array<FormTemplateItem<formCrudComponentTypes>>

export type SearchFormTemplateArray = Array<SearchFormTemplateItem>

export interface FormTemplate {
  [key: string]: FormTemplateItem<formCrudComponentTypes>
}

export interface SearchFormTemplate {
  [key: string]: SearchFormTemplateItem
}

export interface FormGroupOption {
  type: 'el-tabs' | 'el-collapse'
  elProps?: any // el-tabs|el-collapse 的属性 ，参考https://element-plus.gitee.io/zh-CN/component/tabs.html，https://element-plus.gitee.io/zh-CN/component/collapse.html
  groups?: {
    key: string
    //分组key
    title: string //分组标题
    disabled?: ((context: any) => boolean) | boolean //禁止展开或收起
    // disabled(context){return true} //可以传一个方法
    show?: ((context: any) => boolean) | boolean //是否显示
    // show(context){return true} //可以传一个方法
    icon?: string //分组标题前的图标
    columns?: Array<string> //该组内包含的字段列表
    template?: FormTemplateItem<formCrudComponentTypes>[]
  }[]
  activeNames?: string[]
  activeName?: string
}

export interface FormCardInstance {
  validate: () => Promise<any> // 验证表单
  resetForm: () => void // 重置表单
  clearDraftBox:()=>void  // 清除草稿箱内容
  curdForm: FormInstance
}

export const handleDisabled = (item: FormTemplateItem<any>, value: any, formData: any, mode?: 'add' | 'edit' | 'view') => {
  if (item.addDisabled && mode === 'add') return true
  if (item.editDisabled && mode === 'edit') return true
  if (typeof item.disabled === 'function') {
    return item.disabled({ value, key: item.key, row: item, formData: formData })
  } else {
    return item.disabled
  }
}

export const handleShow = (item: FormTemplateItem<any>, value: any, formData: any) => {

  if (typeof item.show === 'function') {
    return item.show({ value, key: item.key, row: item, formData: formData })
  } else {
    return typeof item.show === 'undefined' ? true : item.show
  }
}

export const showItem = (item: FormTemplateItem<any>, value: any, formData: any) => {
  return handleShow(item, value, formData)
}


