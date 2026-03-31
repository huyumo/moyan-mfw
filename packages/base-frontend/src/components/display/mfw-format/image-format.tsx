/**
 * @fileoverview 图片格式化组件
 * @description 将图片 URL 格式化为缩略图展示，支持预览
 * @example
 * ```vue
 * <mfw-image-format value="https://example.com/image.jpg" :width="100" :height="100" />
 * <mfw-image-format :value="['url1', 'url2']" :preview="true" />
 * ```
 */

import { defineComponent, h, toRef, computed, type PropType } from 'vue';
import { ElImage } from 'element-plus';
import type { ImageFormatProps } from './types';

export default defineComponent({
  name: 'MfwImageFormat',

  props: {
    /** 图片 URL */
    value: {
      type: [String, Array] as PropType<ImageFormatProps['value']>,
      default: null
    },
    /** 图片宽度 */
    width: {
      type: [Number, String] as PropType<ImageFormatProps['width']>,
      default: 100
    },
    /** 图片高度 */
    height: {
      type: [Number, String] as PropType<ImageFormatProps['height']>,
      default: 100
    },
    /** 是否支持预览 */
    preview: {
      type: Boolean as PropType<ImageFormatProps['preview']>,
      default: false
    },
    /** fit 模式 */
    fit: {
      type: String as PropType<ImageFormatProps['fit']>,
      default: 'cover'
    },
    /** 空值显示文本 */
    emptyText: {
      type: String as PropType<ImageFormatProps['emptyText']>,
      default: '--'
    },
    /** 自定义类名 */
    className: {
      type: String as PropType<ImageFormatProps['className']>,
      default: ''
    }
  },

  emits: {
    click: (url: string) => true
  },

  setup(props, { emit, slots }) {
    const value = toRef(props, 'value');
    const emptyText = toRef(props, 'emptyText');

    /** 图片列表 */
    const imageList = computed(() => {
      if (!value.value) return [];
      if (typeof value.value === 'string') return [value.value];
      return value.value;
    });

    /** 显示文本 */
    const displayText = computed(() => {
      if (!imageList.value || imageList.value.length === 0) {
        return emptyText.value;
      }
      return '';
    });

    const handleClick = (url: string) => {
      emit('click', url);
    };

    return () => {
      if (!imageList.value || imageList.value.length === 0) {
        return h('span', { class: 'mfw-image-format' }, emptyText.value);
      }

      // 单张图片
      if (imageList.value.length === 1) {
        return h(ElImage, {
          src: imageList.value[0],
          width: props.width,
          height: props.height,
          fit: props.fit,
          preview: props.preview,
          class: ['mfw-image-format', props.className],
          onClick: () => handleClick(imageList.value[0])
        }, {
          default: () => slots.default?.()
        });
      }

      // 多张图片 - 显示第一张 + 数量标识
      return h('div', { class: 'mfw-image-format-multi' }, [
        h(ElImage, {
          src: imageList.value[0],
          width: props.width,
          height: props.height,
          fit: props.fit,
          preview: props.preview,
          class: props.className
        }),
        h('div', { class: 'mfw-image-format-count' }, `+${imageList.value.length - 1}`)
      ]);
    };
  }
});
