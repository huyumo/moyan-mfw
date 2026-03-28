import {
  defineComponent,
  ref,
  DefineComponent,
  VNode,
  PropType,
  provide,
  toRef,
  inject,
  reactive,
  onMounted,
  nextTick
} from 'vue'
import { DialogProps, DrawerProps } from 'element-plus'
import { OpenPopupEntity, InternalPopupPageListener } from './type'

const beforeListenerConfirmFun = ref<(done: (data?: any) => void) => void>((done) => {
  done()
})

/**
 * 子组件设置监听 父组件（dialog、drawer）点击确定按钮 的属性
 * *** 子组件必须暴露 setConfirm 属性 ，且引用此对象，才能实现功能
 */
export const PropSetConfirm = {
  type: Function as PropType<(confirm: (done: (data?: any) => void) => void) => void>,
  default: async (confirm: (done: (data?: any) => void) => void) => {
    beforeListenerConfirmFun.value = confirm
  }
}

export const popupComponentOptions = () => {
  return {
    name: 'Popup',
    exports: ['open'],
    props: {
      isCache: Boolean,
      uuid: String,
      elProps: {
        type: Object as PropType<{ context: any }>
      },
      popupProps: {
        type: Object as PropType<DialogProps | DrawerProps>
      },
      component: {
        type: Object as PropType<VNode | DefineComponent<any> | Function | DefineComponent>
      },
      footer: {
        type: [Object, Boolean] as PropType<OpenPopupEntity['footer'] | boolean>
      },
      listener: {
        type: Object as PropType<InternalPopupPageListener>
      },
      provides: {
        type: Object as PropType<{ [key: string]: any }>
      }
    },
    setup(props: any) {
      const beforeListenerConfirmFun = ref<(done: (data?: any) => void) => void>((done) => {
        done()
      })
      const componentRef = ref()
      const Popups: Array<OpenPopupEntity> = inject('Popups', [])
      const footer = toRef(props, 'footer')
      const uuid = toRef(props, 'uuid')
      const elProps = toRef(props, 'elProps')
      const popupType = toRef(props, 'popupType', 'dialog')
      const modelValue = ref({})
      const provides = toRef(props, 'provides', {})
      const loading = ref(false)

      Object.keys(provides.value).forEach((key) => {
        provide(key, provides.value[key])
      })

      const listener = toRef(props, 'listener', {
        confirm(e: any) {},
        close(e: any) {},
        change(e: any) {},
        cancel(e: any) {}
      })

      const show = ref(true)
      const onClosed = () => {
        /**
         * 销毁
         */
        if (!props.isCache) {
          typeof componentRef.value.onBeforeDestroy === 'function' && componentRef.value.onBeforeDestroy()
          Popups.forEach((item, index) => {
            if (item.uuid === uuid.value) {
              Popups.splice(index, 1)
            }
          })
        }
        listener.value.close()
      }

      // const setConfirm = PropSetConfirm.default
      const setConfirm = (confirm: (done: (data: any) => void) => void) => {
        beforeListenerConfirmFun.value = confirm
      }

      const onConfirm = (e: any) => {
        console.log('onConfirm', componentRef.value)

        if (typeof componentRef.value.onConfirm === 'function') {
          // 添加 Promise 的支持，
          // 如果子组件导出的 onConfirm 是Promise 方法，则会开启确认菜单的loading 功能
          const r = componentRef.value.onConfirm((data: any) => {
            nextTick(() => {
              if (!(r instanceof Promise)) {
                listener.value.confirm(data || e)
                onClose()
              }
            })
          })

          if (r instanceof Promise) {
            loading.value = true
            r.then((data) => {
              listener.value.confirm(data || e)
              onClose()
            }).finally(() => {
              loading.value = false
            })
          }
        } else {
          beforeListenerConfirmFun.value((data: any) => {
            listener.value.confirm(data || e)
            onClose()
          })
        }
      }

      const onClose = () => {
        show.value = false
        loading.value = false
        listener.value.close()
      }

      const onCancel = (e: any) => {
        if (e?.target?.name == 'file') return
        if (typeof componentRef.value.onCancel === 'function') {
          componentRef.value.onCancel((data: any) => {
            listener.value.cancel(data || e)
            onClose()
          })
        } else {
          listener.value.cancel(e)
          onClose()
        }
      }

      const listener2 = reactive({
        ...listener.value,
        confirm: onConfirm,
        close: onClose,
        cancel: onCancel
      })

      const com = toRef(props, 'component')
      const popupProps = toRef(props, 'popupProps')

      onMounted(() => {
        setTimeout(() => {
          if (componentRef.value && typeof componentRef.value.onAnimationFinished === 'function') {
            componentRef.value.onAnimationFinished()
          }
        }, 300)
      })

      const open = () => {
        show.value = true
      }

      return {
        popupType,
        show,
        elProps,
        com,
        popupProps,
        footer,
        listener,
        listener2,
        onClosed,
        onConfirm,
        onClose,
        onCancel,
        modelValue,
        setConfirm,
        open,
        loading,
        componentRef
      }
    }
  }
}
