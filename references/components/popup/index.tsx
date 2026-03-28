import { defineComponent, reactive, provide, ref } from 'vue'
import { DialogProps, DrawerProps } from 'element-plus'
import Dialog from './dialog.vue'
import Drawer from './drawer.vue'
import { MoUitls } from '@/lib/uilt.mo'
import { OpenPopupEntity, OpenPopupOptions } from './type'


export class MoPopup {
  static _Popups: Array<OpenPopupEntity & { el?: any, isCache: boolean }> = reactive([])

  static open(optons: OpenPopupOptions) {
    const defaultPopupProps = { title: ''} as DialogProps
    const defaultElProps = { context: null }
    const defaultFooter = {
      showCancel: true,
      showConfirm: true,
      cancelText: '关闭',
      confirmText: '确认'
    }
    const uuid = optons.uuid || MoUitls.$mo.randomString(30)


    const defaultListener = {
      confirm(e: any) { },
      close(e: any) { },
      change(e: any) { },
      cancel(e: any) { }
    }

    optons.popupProps = Object.assign(defaultPopupProps, optons.popupProps || {})
    optons.elProps = Object.assign(defaultElProps, optons.elProps || {})
    optons.type = optons.type || 'drawer'

    if (typeof optons.footer === 'undefined' || optons.footer) {
      optons.footer = Object.assign(defaultFooter, optons.footer || {})
    }
    optons.popupProps.title = optons.title || optons.popupProps.title
    optons.on = Object.assign(defaultListener, optons.on)

    let cache = MoPopup._Popups.find((item) => { return item.uuid === uuid })

    if (!cache || !cache.el) {
      cache = Object.assign(optons, { uuid, isCache: !!optons.uuid })

      MoPopup._Popups.push(cache)
    } else {
      cache.el?.open()
    }
    return cache
  }

  /**
   * 销毁缓存的对象，（如果open 的时候传了uuid，则该打卡的组件会被缓存，需要调用此方法销毁组件）
   * @param uuids 
   */
  static destroy(uuids: string[]) {
    uuids.forEach((uuid) => {
      MoPopup._Popups.forEach((item, index) => {
        if (item.uuid === uuid) {
          MoPopup._Popups.splice(index, 1)
        }
      })
    })
  }

  static get manager() {
    return defineComponent({
      setup(props) {
        provide('Popups', MoPopup._Popups)
        return () => {
          return (
            <div>
              {MoPopup._Popups.map((item) => {
                if (item.type === 'dialog') {
                  return (
                    <Dialog
                      ref={(el: any) => { item.el = el }}
                      elProps={item.elProps}
                      popupProps={item.popupProps as DialogProps}
                      component={item.component}
                      footer={item.footer}
                      uuid={item.uuid}
                      key={item.uuid}
                      isCache={item.isCache}
                      listener={item.on}
                      provides={item.provides}
                    ></Dialog>
                  )
                } else {
                  return (
                    <Drawer
                      ref={(el: any) => { item.el = el }}
                      elProps={item.elProps}
                      popupProps={item.popupProps as DrawerProps}
                      component={item.component}
                      footer={item.footer}
                      uuid={item.uuid}
                      key={item.uuid}
                      isCache={item.isCache}
                      listener={item.on}
                      provides={item.provides}
                    ></Drawer>
                  )
                }
              })}
            </div>
          )
        }
      }
    })
  }
}

export default MoPopup
