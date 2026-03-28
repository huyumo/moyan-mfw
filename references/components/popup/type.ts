import { DefineComponent, VNode } from 'vue'
import { DialogProps, DrawerProps } from 'element-plus'
import { type } from 'os'

interface PopupProps {
  dialog: {
    [K in keyof DialogProps]?: DialogProps[K]
  }
  drawer: {
    [K in keyof DrawerProps]?: DrawerProps[K]
  }
}

export interface OpenPopupOptions {
  component: VNode | DefineComponent<any> | Function | DefineComponent
  type?: 'dialog' | 'drawer'
  elProps?: { context: any; [key: string]: any }
  popupProps?: (PopupProps['dialog'] | PopupProps['drawer']) & { title?: string }
  title?: string
  uuid?: string
  provides?: {
    [key: string]: any
  }
  footer?:
    | {
        showCancel?: boolean
        showConfirm?: boolean
        cancelText?: string
        confirmText?: string
      }
    | boolean
  on?: PopupPageListener
}

export interface OpenPopupEntity extends OpenPopupOptions {
  uuid: string
}

export interface PopupPageListener {
  confirm?(e?: any): void
  close?(e?: any): void
  change?(e?: any): void
  cancel?(e?: any): void
  [key: string]: any
}

export type InternalPopupPageListener = PopupPageListener

export type ConfirmDone<T = any> = (data?: T) => void
