import MoPopup from '../popup'
import { OpenPopupOptions } from '../popup/type'

export interface ImportPanelOptions {
  pk: string // 主键 （用于提示错误的名称）
  // show: boolean
  template: {
    columns: Array<{
      prop: string
      label: string
    }>
    data: Array<any>
    title: string
    // merges: Array<any>
    templateUrl?: string
  }
  thread: number // 并发数，默认10
  resultRender: (obj: any, vm: any) => Promise<{ $status: 'successful' | 'unsuccessful'; $message: string }>
}

export const importPanelOpen = (options: OpenPopupOptions) => {
  const def: any = {
    popupProps: {
      'close-on-click-modal': false,
      'close-on-press-escape': false,
      'show-close': false,
      draggable: true
    },
    footer: false
  }
  Object.assign(def, options)
  MoPopup.open(def)
}
