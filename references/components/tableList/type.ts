import { DefineComponent } from 'vue'
import { FormatType } from '../formatters'
export interface TableOptions { }

/**
 * 表格 属性 https://element-plus.gitee.io/zh-CN/component/table.html
 */
export interface TableTemplateItem {
  label: string
  prop: string
  width?: number
  display?: boolean // ColumnControl.display = alone 的情况下，该参数控制列表的列默认是否显示
  minWidth?: number
  elProps?: any // https://element-plus.gitee.io/zh-CN/component/table.html
  sortable?: boolean | string
  slot?: boolean
  sortNumber?: number
  formatter?: (row: any, column: any, cellValue: any, index: number) => any
  component?: FormatType
  show?: ((scope?: any) => boolean) | boolean
}

export type TableColumn = Array<TableTemplateItem>

export interface TableColumnObject {
  [key: string]: TableTemplateItem
}

export type RowHandleItme = {
  text?: null | string | ((scope?: any, index?: any) => string)
  type?:
  | 'warning'
  | 'primary'
  | 'success'
  | 'info'
  | 'danger'
  | 'text'
  | ((scope?: any, index?: any) => 'warning' | 'primary' | 'success' | 'info' | 'danger' | 'text')
  emit?: string
  icon?: string
  /**
   * 是否显示此项
   */
  show?: boolean | ((scope?: any) => any)

  /**
   * 是否禁用此项
   */
  disabled?: boolean | ((scope?: any) => any)
  auth_node_key?: string
  order?: number
}

export interface ColumnControl {
  display: 'all' | 'alone'
}

export interface TableRowHandle {
  dropdown?: {
    // 操作列折叠
    atLeast?: number // 至少几个以上的按钮才会被折叠,注意show=false的按钮也会计算在内（行编辑按钮默认是隐藏的也会占一个位置）
    text?: string // dropdown按钮文字
    type?: 'warning' | 'primary' | 'success' | 'info' | 'danger' // el-botton type
    icon?: string
  }
  view?: RowHandleItme | null
  edit?: RowHandleItme | null
  remove?: (RowHandleItme & { confirm?: boolean; confirmTitle?: string; confirmText?: string }) | null
  custom?: Array<RowHandleItme>
  width?: number
  /**
   * 操作列固定列
   */
  fixed?: 'left' | 'right' | 'center'
  show?: boolean
}

export class TableListDefaultConfig {
  static columnControl: ColumnControl
}
