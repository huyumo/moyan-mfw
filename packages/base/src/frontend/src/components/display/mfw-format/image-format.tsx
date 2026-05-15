/**
 * @fileoverview 图片格式化组件
 * @description 将图片 URL 或 ImageResource 格式化为缩略图展示，支持预览
 * @example
 * ```vue
 * <MfwImageFormat value="https://example.com/image.jpg" :width="100" :height="100" />
 * <MfwImageFormat :value="[{src: 'url1', width: 800, height: 600}]" :preview="true" />
 * ```
 */

import { defineComponent, h, toRef, computed, type PropType } from 'vue';
import { ElImage } from 'element-plus';
import type { ImageFormatProps } from './types';
import type { ImageResource } from '../../../upload/types';

function extractImageUrl(value: string | ImageResource): string {
  if (typeof value === 'string') return value;
  return value.src;
}

export default defineComponent({
  name: 'MfwImageFormat',

  props: {
    value: {
      type: [String, Array, Object] as PropType<ImageFormatProps['value']>,
      default: null
    },
    width: {
      type: [Number, String] as PropType<ImageFormatProps['width']>,
      default: 100
    },
    height: {
      type: [Number, String] as PropType<ImageFormatProps['height']>,
      default: 100
    },
    preview: {
      type: Boolean as PropType<ImageFormatProps['preview']>,
      default: false
    },
    fit: {
      type: String as PropType<ImageFormatProps['fit']>,
      default: 'cover'
    },
    emptyText: {
      type: String as PropType<ImageFormatProps['emptyText']>,
      default: '--'
    },
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

    const imageList = computed(() => {
      if (!value.value) return [];
      if (typeof value.value === 'string') return [value.value];
      if ('src' in value.value && !Array.isArray(value.value)) return [value.value as ImageResource];
      if (Array.isArray(value.value)) return value.value;
      return [];
    });

    const urlList = computed(() => imageList.value.map(extractImageUrl));

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

      if (imageList.value.length === 1) {
        return h(ElImage, {
          src: urlList.value[0],
          width: props.width,
          height: props.height,
          fit: props.fit,
          preview: props.preview,
          class: ['mfw-image-format', props.className],
          onClick: () => handleClick(urlList.value[0])
        }, {
          default: () => slots.default?.()
        });
      }

      return h('div', { class: 'mfw-image-format-multi' }, [
        h(ElImage, {
          src: urlList.value[0],
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