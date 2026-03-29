/**
 * @fileoverview 标签格式化组件
 * @description 将文本值显示为 Element Plus 标签样式
 * @example
 * ```vue
 * <mfw-tag-format value="已完成" type="success" />
 * <mfw-tag-format value="处理中" auto-color />
 * ```
 */

import { defineComponent, h, toRef, computed, type PropType } from 'vue';
import { ElTag } from 'element-plus';
import type { TagFormatProps } from './types';

/**
 * 根据文本自动生成颜色
 */
function getAutoColor(text: string): string {
  const colors = [
    '#409EFF', // primary
    '#67C23A', // success
    '#E6A23C', // warning
    '#F56C6C', // danger
    '#909399', // info
    '#00AEEA', // sky blue
    '#722ED1', // purple
    '#13C2C2', // cyan
    '#FA8C16', // orange
    '#F5317F', // pink
  ];

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export default defineComponent({
  name: 'MfwTagFormat',

  props: {
    /** 标签文本 */
    value: [String] as PropType<TagFormatProps['value']>,
    /** 标签类型 */
    type: {
      type: String as PropType<TagFormatProps['type']>,
      default: 'primary'
    },
    /** 是否自动根据文本生成颜色 */
    autoColor: {
      type: Boolean,
      default: false
    },
    /** 是否为圆角 */
    round: {
      type: Boolean,
      default: true
    },
    /** 是否为空心 */
    effect: {
      type: String as PropType<TagFormatProps['effect']>,
      default: 'plain'
    },
    /** 空值显示文本 */
    emptyText: {
      type: String,
      default: '--'
    },
    /** 自定义类名 */
    className: {
      type: String,
      default: ''
    }
  },

  emits: ['click'],

  setup(props, { emit, slots }) {
    const value = toRef(props, 'value');
    const emptyText = toRef(props, 'emptyText');

    /** 标签颜色 */
    const tagColor = computed(() => {
      if (props.autoColor && value.value) {
        return getAutoColor(value.value);
      }
      return undefined;
    });

    /** 显示文本 */
    const displayText = computed(() => {
      if (value.value === null || value.value === undefined || value.value === '') {
        return emptyText.value;
      }
      return value.value;
    });

    const handleClick = () => {
      emit('click');
    };

    return () => {
      if (value.value === null || value.value === undefined || value.value === '') {
        return h('span', { class: 'mfw-tag-format' }, emptyText.value);
      }

      return h(ElTag, {
        type: props.autoColor ? undefined : props.type,
        color: tagColor.value,
        round: props.round,
        effect: props.effect,
        class: ['mfw-tag-format', props.className],
        style: props.autoColor ? {
          color: tagColor.value,
          border: `1px ${tagColor.value} solid`
        } : {},
        'disable-transitions': true,
        onClick: handleClick
      }, {
        default: () => slots.default?.() ?? displayText.value
      });
    };
  }
});
