/**
 * @fileoverview 用户信息展示组件
 * @description 通过 userId 获取用户信息并展示，支持多种显示模式
 * @example
 * ```vue
 * <MfwUserFormat userId="123" mode="name" />
 * <MfwUserFormat userId="123" mode="card" showDepartment />
 * <MfwUserFormat userId="123" mode="full" :fetcher="fetchUserById" />
 * ```
 */

import { defineComponent, toRef, ref, computed, watch, type PropType, h } from 'vue';
import { ElAvatar, ElTag, ElPopover, ElSkeleton } from 'element-plus';
import type { UserFormatProps, UserInfo } from './types';
import type { ImageResource } from '../../upload/types';

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

function extractAvatarUrl(avatar: string | ImageResource | undefined): string {
  if (!avatar) return defaultAvatar;
  if (typeof avatar === 'string') return avatar;
  return avatar.src;
}

export default defineComponent({
  name: 'MfwUserFormat',

  props: {
    /** 用户 ID */
    userId: {
      type: [String, Number] as PropType<UserFormatProps['userId']>,
      default: null
    },
    /** 用户信息获取函数 */
    fetcher: {
      type: Function as PropType<UserFormatProps['fetcher']>,
      default: null
    },
    /** 显示模式 */
    mode: {
      type: String as PropType<UserFormatProps['mode']>,
      default: 'name'
    },
    /** 头像尺寸 */
    avatarSize: {
      type: [Number, String] as PropType<UserFormatProps['avatarSize']>,
      default: 'default'
    },
    /** 是否显示部门 */
    showDepartment: {
      type: Boolean as PropType<UserFormatProps['showDepartment']>,
      default: false
    },
    /** 是否显示职位 */
    showPosition: {
      type: Boolean as PropType<UserFormatProps['showPosition']>,
      default: false
    },
    /** 是否显示状态 */
    showStatus: {
      type: Boolean as PropType<UserFormatProps['showStatus']>,
      default: false
    },
    /** 是否可点击 */
    clickable: {
      type: Boolean as PropType<UserFormatProps['clickable']>,
      default: false
    },
    /** 空值显示文本 */
    emptyText: {
      type: String as PropType<UserFormatProps['emptyText']>,
      default: '--'
    },
    /** 自定义类名 */
    className: {
      type: String as PropType<UserFormatProps['className']>,
      default: ''
    }
  },

  emits: {
    click: (user: UserInfo | null) => true,
    loaded: (user: UserInfo | null) => true
  },

  setup(props, { emit, slots }) {
    const userId = toRef(props, 'userId');
    const fetcher = toRef(props, 'fetcher');
    const mode = toRef(props, 'mode');

    const userInfo = ref<UserInfo | null>(null);
    const loading = ref(false);

    /** 获取用户信息 */
    const fetchUserInfo = async () => {
      if (!userId.value) {
        userInfo.value = null;
        return;
      }

      if (!fetcher.value) {
        userInfo.value = {
          id: userId.value,
          nickname: `用户${userId.value}`,
          avatar: defaultAvatar
        };
        return;
      }

      loading.value = true;

      try {
        const result = await fetcher.value(userId.value);
        userInfo.value = result;
        emit('loaded', result);
      } catch {
        userInfo.value = null;
        emit('loaded', null);
      } finally {
        loading.value = false;
      }
    };

    watch(userId, fetchUserInfo, { immediate: true });

    /** 显示名称 */
    const displayName = computed(() => {
      if (!userInfo.value) return props.emptyText;
      return userInfo.value.nickname || userInfo.value.username || `用户${userInfo.value.id}`;
    });

    /** 头像尺寸数值 */
    const avatarSizeValue = computed(() => {
      if (typeof props.avatarSize === 'number') return props.avatarSize;
      const sizeMap: Record<string, number> = {
        small: 24,
        default: 32,
        large: 40
      };
      return sizeMap[props.avatarSize as string] || 32;
    });

    /** 状态标签 */
    const statusTag = computed(() => {
      if (!userInfo.value?.status) return null;
      const statusMap: Record<string, { label: string; type: 'primary' | 'success' | 'info' | 'warning' | 'danger' }> = {
        active: { label: '在职', type: 'success' },
        inactive: { label: '离职', type: 'info' },
        disabled: { label: '禁用', type: 'danger' }
      };
      return statusMap[userInfo.value.status] || null;
    });

    const handleClick = () => {
      if (props.clickable) {
        emit('click', userInfo.value);
      }
    };

    /** 渲染头像模式 */
    const renderAvatar = () => {
      if (loading.value) {
        return h(ElSkeleton, { style: { width: avatarSizeValue.value, height: avatarSizeValue.value } });
      }
      return h(ElAvatar, {
        src: extractAvatarUrl(userInfo.value?.avatar),
        size: avatarSizeValue.value,
        class: 'mfw-user-avatar'
      });
    };

    /** 渲染名称模式 */
    const renderName = () => {
      if (loading.value) {
        return h(ElSkeleton, { style: { width: 80, height: 16 } });
      }
      return h('span', { class: 'mfw-user-name' }, displayName.value);
    };

    /** 渲染卡片模式 */
    const renderCard = () => {
      if (loading.value) {
        return h(ElSkeleton, { rows: 2, animated: true });
      }
      const children = [
        renderAvatar(),
        h('div', { class: 'mfw-user-info' }, [
          h('span', { class: 'mfw-user-name' }, displayName.value),
          props.showDepartment && userInfo.value?.department && h('span', { class: 'mfw-user-dept' }, userInfo.value.department),
          props.showPosition && userInfo.value?.position && h('span', { class: 'mfw-user-position' }, userInfo.value.position),
          props.showStatus && statusTag.value && h(ElTag, { type: statusTag.value.type, size: 'small' }, statusTag.value.label)
        ])
      ];
      return h('div', { class: 'mfw-user-card' }, children);
    };

    /** 渲染完整模式 */
    const renderFull = () => {
      if (loading.value) {
        return h(ElSkeleton, { rows: 3, animated: true });
      }
      if (!userInfo.value) {
        return h('span', { class: 'mfw-user-empty' }, props.emptyText);
      }

      const popoverContent = h('div', { class: 'mfw-user-popover-content' }, [
        h('div', { class: 'mfw-user-popover-header' }, [
          h(ElAvatar, { src: extractAvatarUrl(userInfo.value?.avatar), size: 48 }),
          h('div', { class: 'mfw-user-popover-info' }, [
            h('span', { class: 'mfw-user-popover-name' }, displayName.value),
            userInfo.value.department && h('span', { class: 'mfw-user-popover-dept' }, userInfo.value.department),
            userInfo.value.position && h('span', { class: 'mfw-user-popover-position' }, userInfo.value.position)
          ])
        ]),
        h('div', { class: 'mfw-user-popover-contact' }, [
          userInfo.value.email && h('span', { class: 'mfw-user-popover-email' }, userInfo.value.email),
          userInfo.value.phone && h('span', { class: 'mfw-user-popover-phone' }, userInfo.value.phone)
        ]),
        props.showStatus && statusTag.value && h(ElTag, { type: statusTag.value.type }, statusTag.value.label)
      ]);

      return h(ElPopover, {
        placement: 'bottom',
        trigger: 'hover',
        width: 280
      }, {
        default: () => popoverContent,
        reference: () => renderCard()
      });
    };

    return () => {
      if (!userId.value) {
        return h('span', { class: ['mfw-user-format', props.className] }, props.emptyText);
      }

      const wrapperClass = ['mfw-user-format', `mfw-user-${mode.value}`, props.className];
      if (props.clickable) {
        wrapperClass.push('mfw-user-clickable');
      }

      const content = (() => {
        switch (mode.value) {
          case 'avatar':
            return renderAvatar();
          case 'name':
            return renderName();
          case 'card':
            return renderCard();
          case 'full':
            return renderFull();
          default:
            return renderName();
        }
      })();

      return h('div', {
        class: wrapperClass,
        onClick: handleClick
      }, [
        slots.default?.({ user: userInfo.value, loading: loading.value }) || content
      ]);
    };
  }
});