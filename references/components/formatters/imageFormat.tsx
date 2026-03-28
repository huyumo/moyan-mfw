import { defineComponent, h, toRef, PropType, watch, ref, nextTick } from 'vue'
import { BaseComponent } from './base'
import { ElAvatar, ElBadge, ElImage } from 'element-plus'
import { Picture as IconPicture } from '@element-plus/icons-vue'

export interface ImageFormatProps {
  value?: string | string[]
  width?: string
  height?: string
  avatar?: boolean // 是否是头像
  isRandomParams?: boolean // 是否随机
}

export interface ImageFormatComponent extends BaseComponent {
  name: 'image-format'
  elProps?: ImageFormatProps
}

export default defineComponent({
  name: 'ImageFormat',
  props: {
    value: [String, Array] as PropType<ImageFormatProps['value']>,
    width: String as PropType<ImageFormatProps['width']>,
    height: String as PropType<ImageFormatProps['height']>,
    avatar: Boolean as PropType<ImageFormatProps['avatar']>,
    isRandomParams: Boolean as PropType<ImageFormatProps['isRandomParams']>,
    mode: {
      type: String as PropType<'one' | 'list'>,
      default: 'one'
    }
  },
  setup(props) {
    const value = ref('')
    const width = toRef(props, 'width', 'auto')
    const height = toRef(props, 'height', '30px')
    const mode = toRef(props, 'mode', 'one')
    const src = ref<any>(Array.isArray(value.value) ? value.value[0] : value.value)
    const srcList = ref(Array.isArray(value.value) ? value.value : [value.value])
    const avatar = toRef(props, 'avatar', false)
    const isRandomParams = toRef(props, 'isRandomParams', false)
    watch(
      props,
      (props) => {
        value.value = props.value as string
        width.value = props.width as string
        height.value = props.height as string

        const randomParams = isRandomParams.value ? `?${Math.random()}` : ''

        src.value = Array.isArray(value.value) ? value.value[0]+randomParams : value.value+randomParams
        srcList.value = Array.isArray(value.value) ? value.value.map((item) => item+randomParams) : [value.value+randomParams]
      },
      { deep: true, immediate: true }
    )

    return {
      width,
      height,
      src,
      srcList,
      mode
    }
  },
  render() {
    const C = this.avatar ? ElAvatar : ElImage
    try {
      if (this.mode === 'list') {
        return h(
          'div',
          { class: 'image-format-images-rows' },
          this.srcList.map((item, index) => {
            return h(
              C,
              {
                style: { width: this.width, height: this.height },
                src: item,
                previewSrcList: this.srcList,
                previewTeleported: true,
                fit: 'cover',
                initialIndex: index
              },
              {
                error: () => h('div', { class: 'el-image-error-box' }, h('i', { class: 'mo-icon icon-default-image' }))
              }
            )
          })
        )
      } else {
        return h(
          ElBadge,
          {
            class: 'image-format-badge',
            showZero: false,
            max: 10,
            hidden: this.srcList.length <= 1,
            type: 'primary',
            offset: [0, 10],
            isDot: false,
            value: this.srcList.length
          },
          [
            h(
              C,
              {
                style: { width: this.width, height: this.height },
                src: this.src,
                previewSrcList: this.srcList,
                previewTeleported: true,
                fit: 'cover',
                initialIndex: 0
              },
              {
                error: () => h('div', { class: 'el-image-error-box' }, h('i', { class: 'mo-icon icon-default-image' }))
              }
            )
          ]
        )
      }
    } catch (e) {
      return
    }
  }
})
