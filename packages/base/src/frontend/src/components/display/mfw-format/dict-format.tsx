/**
 * @fileoverview 字典格式化组件
 * @description 根据字典值显示对应的标签文本，支持单个值或数组
 * @example
 * ```vue
 * <MfwDictFormat value="1" :dict="[{ value: 1, label: '启用' }]" />
 * <MfwDictFormat value="1" :dict="dictData" as-tag />
 * <MfwDictFormat :value="[1, 2]" :dict="dictData" as-tag />
 * ```
 */

import { defineComponent, h, toRef, computed, type PropType } from 'vue';
import { ElTag } from 'element-plus';
import type { DictFormatProps, DictItem } from './types';

export default defineComponent({
  name: 'MfwDictFormat',

  props: {
    /** 字典值（支持单个值或数组） */
    value: {
      type: [String, Number, Array] as PropType<DictFormatProps['value']>,
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
    click: (item: DictItem | DictItem[] | null) => true
  },

  setup(props, { emit, slots }) {
    const value = toRef(props, 'value');
    const dict = toRef(props, 'dict');
    const emptyText = toRef(props, 'emptyText');

    /** 是否为数组模式 */
    const isArray = computed(() => Array.isArray(value.value));

    /** 查找匹配的字典项列表 */
    const matchedItems = computed<DictItem[]>(() => {
      const v = value.value;
      if (v === null || v === undefined) {
        return [];
      }
      const values = Array.isArray(v) ? v : [v];
      return values
        .map(val => dict.value.find(item => item.value === val))
        .filter((item): item is DictItem => item !== undefined);
    });

    /** 单个匹配项（兼容非数组模式） */
    const matchedItem = computed<DictItem | null>(() => {
      return matchedItems.value[0] ?? null;
    });

    /** 显示文本 */
    const displayText = computed(() => {
      if (matchedItems.value.length === 0) {
        return emptyText.value;
      }
      return matchedItems.value.map(item => item.label).join('、');
    });

    /** 标签类型（非数组模式） */
    const tagType = computed(() => {
      return matchedItem.value?.type || 'primary';
    });

    const handleClick = (item?: DictItem) => {
      if (isArray.value) {
        emit('click', item ?? null);
      } else {
        emit('click', matchedItem.value);
      }
    };

    const handleContainerClick = () => {
      if (isArray.value) {
        emit('click', matchedItems.value.length > 0 ? matchedItems.value : null);
      }
    };

    /** 渲染单个字典项 */
    const renderItem = (item: DictItem, index: number) => {
      if (props.asTag) {
        return h(ElTag, {
          key: index,
          type: item.type || 'primary',
          class: ['mfw-dict-format', props.className],
          onClick: () => handleClick(item)
        }, {
          default: () => item.label
        });
      }

      return h('span', {
        key: index,
        class: ['mfw-dict-format', props.className],
        onClick: () => handleClick(item)
      }, item.label);
    };

    return () => {
      // 数组模式
      if (isArray.value) {
        if (matchedItems.value.length === 0) {
          return h('span', {
            class: 'mfw-dict-format',
            onClick: handleContainerClick
          }, emptyText.value);
        }

        const children: any[] = [];
        matchedItems.value.forEach((item, index) => {
          if (index > 0 && !props.asTag) {
            children.push(h('span', { key: `sep-${index}`, class: 'mfw-dict-format-separator' }, '、'));
          }
          children.push(renderItem(item, index));
        });

        return h('span', {
          class: 'mfw-dict-format-group',
          onClick: handleContainerClick
        }, children);
      }

      // 非数组模式（原有逻辑）
      if (!matchedItem.value) {
        return h('span', {
          class: 'mfw-dict-format',
          onClick: () => emit('click', null)
        }, emptyText.value);
      }

      if (props.asTag) {
        return h(ElTag, {
          type: tagType.value,
          class: ['mfw-dict-format', props.className],
          onClick: () => handleClick()
        }, {
          default: () => slots.default?.() ?? displayText.value
        });
      }

      return h('span', {
        class: ['mfw-dict-format', props.className],
        onClick: () => handleClick()
      }, {
        default: () => slots.default?.() ?? displayText.value
      });
    };
  }
});
