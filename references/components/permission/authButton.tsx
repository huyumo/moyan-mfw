import { MoUitls } from '@/lib/uilt.mo'
import { defineComponent, h, toRef, PropType, ref, computed, watch } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { getConfig } from '@/config'
import { storePermission } from '@/common/use/store/permission'


const config = getConfig()

export interface AuthButtonProps {
  auth_node_key: string
  authNodeId?: number
}


export default defineComponent({
  emits: ['click'],
  name: 'AuthButton',
  props: {
    auth_node_key: [Date, String] as PropType<AuthButtonProps['auth_node_key']>,
    authNodeId: Number,
    elProps: Object as any,
    type: { type: String },
    text: String
  },
  setup(props) {
    const auth_node_key = toRef(props, 'auth_node_key', '')
    // const type = toRef(props, 'type', 'text')
    const elProps = toRef(props, 'elProps', {})

    const authNodeId = toRef(props, 'authNodeId')
    const buttonOption = ref<any>()


    !!auth_node_key.value && watch(
      storePermission.activeRoute,
      (activeRoute: any) => {
        if (!authNodeId.value) {
          try {
            buttonOption.value = activeRoute.meta.pageAuthTags[auth_node_key.value]
          } catch {
          }
        }
      },
      { deep: true, immediate: true }
    )

    if (authNodeId.value) {
      buttonOption.value = storePermission.authNodeMap.get(authNodeId.value)
    }

    return { auth_node_key, elProps, buttonOption }
  },
  render() {
    if (!this.auth_node_key) {
      return h(ElButton, { ...this.elProps, class: 'auth-button ', onClick: (e: MouseEvent) => { this.$emit('click', e) } }, [
        this.elProps.text
      ])
    } else if (this.buttonOption) {
      if (!config.debug && this.buttonOption.display_mode === 'DEV') return

      return this.$testAuth(this.buttonOption.id)
        ? h(ElButton, { ...this.elProps, class: 'auth-button ', onClick: (e: MouseEvent) => { this.$emit('click', e) } }, [
          this.buttonOption.icon && h('i', { class: `mo-icon ${this.buttonOption.icon} ft-12` }),
          this.elProps.text || this.buttonOption.auth_node_name
        ])
        : undefined
    } else {
      return h(ElButton, {
        icon: WarningFilled,
        onClick: () => {
          ElMessage.error(`未找到权限节点，请查看是否添加了：${this.auth_node_key} 节点`)
        }
      })
    }
  }
})
