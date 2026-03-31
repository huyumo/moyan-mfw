/**
 * @fileoverview 字典格式化组件
 * @description 根据字典值显示对应的标签文本
 * @example
 * ```vue
 * <mfw-dict-format value="1" :dict="[{ value: 1, label: '启用' }]" />
 * <mfw-dict-format value="1" :dict="dictData" as-tag />
 * ```
 */

import { defineComponent, h, toRef, computed, type PropType } from 'vue';
import { ElTag } from 'element-plus';
import type { DictFormatProps, DictItem } from './types';

export default defineComponent({
  name: 'MfwDictFormat',

  props: {
    /** 字典值 */
    value: {
      type: [String, Number] as PropType<DictFormatProps['value']>,
      default: null
    },
    /** 字典数据 */
    dict: {
      type: Array as PropType<DictFormatProps['dict']>,
      default: () => []
    },
    /** 是否显示为标签 */
    asTag: {
      type: Boolean as PropType<DictFormatProps['asTag']>,
      default: false
    },
    /** 空值显示文本 */
    emptyText: {
      type: String as PropType<DictFormatProps['emptyText']>,
      default: '--'
    },
    /** 自定义类名 */
    className: {
      type: String as PropType<DictFormatProps['className']>,
      default: ''
    }
  },

  emits: {
    click: (item: DictItem | null) => true
  },

  setup(props, { emit, slots }) {
    const value = toRef(props, 'value');
    const dict = toRef(props, 'dict');
    const emptyText = toRef(props, 'emptyText');

    /** 查找匹配的字典项 */
    const matchedItem = computed<DictItem | null>(() => {
      if (value.value === null || value.value === undefined) {
        return null;
      }
      return dict.value.find(item => item.value === value.value) || null;
    });

    /** 显示文本 */
    const displayText = computed(() => {
      if (!matchedItem.value) {
        return emptyText.value;
      }
      return matchedItem.value.label;
    });

    /** 标签类型 */
    const tagType = computed(() => {
      return matchedItem.value?.type || 'primary';
    });

    const handleClick = () => {
      emit('click', matchedItem.value);
    };

    return () => {
      if (!matchedItem.value) {
        return h('span', { class: 'mfw-dict-format' }, emptyText.value);
      }

      if (props.asTag) {
        return h(ElTag, {
          type: tagType.value,
          class: ['mfw-dict-format', props.className],
          onClick: handleClick
        }, {
          default: () => slots.default?.() ?? displayText.value
        });
      }

      return h('span', {
        class: ['mfw-dict-format', props.className],
        onClick: handleClick
      }, {
        default: () => slots.default?.() ?? displayText.value
      });
    };
  }
});
