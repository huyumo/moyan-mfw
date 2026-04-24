import './style.scss'

import { defineComponent, ref, type PropType } from 'vue'
import { MfwFormCard } from '../../form/form-card/mod'
import type { MfwFormCardInstance } from '../../form/form-card/types'
import { ApiUserCreate, ApiUserUpdate } from '../../../apis/sys'
import type { UserResponseDto, CreateUserDto, UpdateUserDto } from '../../../apis/sys/schemas'
import { UserPickerManager } from './manager'

export default defineComponent({
  name: 'MfwUserPickerCreatePanel',

  props: {
    context: {
      type: Object as PropType<UserResponseDto>,
      default: undefined
    },
    theme: {
      type: String,
      default: 'default'
    },
    onCreate: {
      type: Function as PropType<(data: CreateUserDto) => Promise<UserResponseDto>>,
      default: undefined
    },
    onUpdate: {
      type: Function as PropType<(id: string, data: UpdateUserDto) => Promise<UserResponseDto>>,
      default: undefined
    }
  },

  setup(props, { expose }) {
    const manager = new UserPickerManager()
    const formCardRef = ref<MfwFormCardInstance>()

    const themeConfig = manager.getTheme(props.theme, props.context)

    const formData = ref<Record<string, any>>(
      props.context
        ? {
            username: props.context.username,
            nickname: props.context.nickname,
            phone: props.context.phone,
            email: props.context.email,
            avatar: props.context.avatar
          }
        : {
            username: '',
            password: '',
            nickname: '',
            phone: '',
            email: '',
            avatar: ''
          }
    )

    const onConfirm = async () => {
      const valid = await formCardRef.value?.validate()
      if (!valid) throw new Error('validate failed')

      if (props.context?.id) {
        const updateData: UpdateUserDto = {
          nickname: formData.value.nickname,
          phone: formData.value.phone,
          email: formData.value.email,
          avatar: formData.value.avatar
        }
        if (props.onUpdate) {
          return await props.onUpdate(props.context.id, updateData)
        }
        return await new ApiUserUpdate({
          params: { id: props.context.id },
          body: updateData
        })
      }

      const createData: CreateUserDto = {
        username: formData.value.username,
        password: formData.value.password,
        nickname: formData.value.nickname,
        phone: formData.value.phone,
        email: formData.value.email,
        avatar: formData.value.avatar
      }
      if (props.onCreate) {
        return await props.onCreate(createData)
      }
      return await new ApiUserCreate({ body: createData })
    }

    expose({ onConfirm })

    return () => (
      <MfwFormCard
        ref={formCardRef}
        formData={formData.value}
        template={themeConfig.template}
        formProps={{ labelWidth: '80px' }}
      />
    )
  }
})
