import './style.scss';

import { defineComponent, ref, type PropType } from 'vue';
import { MfwFormCard } from '../../form/form-card/mod';
import type { MfwFormCardInstance } from '../../form/form-card/types';
import { ApiUserAdminCreate, ApiUserUpdate } from '../../../apis/sys';
import type { UserResponseDto, AdminCreateUserDto, UpdateUserDto } from '../../../apis/sys/schemas';
import { UserPickerManager } from './manager';

export default defineComponent({
  name: 'MfwUserPickerCreatePanel',

  props: {
    context: {
      type: Object as PropType<UserResponseDto>,
      default: undefined,
    },
    theme: {
      type: String,
      default: 'default',
    },
    onCreate: {
      type: Function as PropType<(data: AdminCreateUserDto) => Promise<UserResponseDto>>,
      default: undefined,
    },
    onUpdate: {
      type: Function as PropType<(id: string, data: UpdateUserDto) => Promise<UserResponseDto>>,
      default: undefined,
    },
  },

  setup(props, { expose }) {
    const manager = new UserPickerManager();
    const formCardRef = ref<MfwFormCardInstance>();

    const themeConfig = manager.getTheme(props.theme, props.context);

    const formData = ref<Record<string, any>>(
      props.context
        ? {
            username: props.context.username,
            nickname: props.context.nickname,
            phone: props.context.phone,
            avatar: props.context.avatar,
          }
        : {
            username: '',
            nickname: '',
            phone: '',
            avatar: '',
          },
    );

    const onConfirm = async () => {
      const valid = await formCardRef.value?.validate();
      if (!valid) throw new Error('validate failed');

      let result: UserResponseDto | undefined;

      if (props.context?.id) {
        const updateData: UpdateUserDto = {
          nickname: formData.value.nickname,
          phone: formData.value.phone,
          avatar: formData.value.avatar,
        };
        if (props.onUpdate) {
          result = await props.onUpdate(props.context.id, updateData);
        } else {
          result = await new ApiUserUpdate(
            {
              params: { id: props.context.id },
              body: updateData,
            },
            { hintFail: false },
          );
        }
      } else {
        const createData: AdminCreateUserDto = {
          username: formData.value.username,
          phone: formData.value.phone,
          nickname: formData.value.nickname,
          avatar: formData.value.avatar,
        };
        if (props.onCreate) {
          result = await props.onCreate(createData);
        } else {
          result = await new ApiUserAdminCreate({ body: createData }, { hintFail: false });
        }
      }

      // 将结果附加到组件实例，供 MfwPopup 的 confirm 事件使用
      (instance as any).createdUser = result;
      return result;
    };

    const instance = { onConfirm };
    expose(instance);

    return () => (
      <MfwFormCard
        ref={formCardRef}
        formData={formData.value}
        template={themeConfig.template}
        formProps={{ labelWidth: '80px' }}
      />
    );
  },
});
