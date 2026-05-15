/**
 * @fileoverview MfwIconPicker 图标选择器组件
 * @description 提供图标选择功能，支持搜索、分类展示
 */

import './style.scss';

import {
  defineComponent,
  ref,
  watch,
  type PropType,
  h,
  markRaw,
} from 'vue';
import { ElInput, ElIcon } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import * as IconMap from '@element-plus/icons-vue';
import { MfwPopup } from '../../../feedback';
import type { MfwIconPickerProps, MfwIconPickerEmits, MfwIconPickerInstance, IconItem } from './types';
import IconPickerPanel from './IconPickerPanel.vue';

// 从 @element-plus/icons-vue 自动获取所有图标
const defaultIcons: IconItem[] = Object.keys(IconMap).map((name: string) => ({
  name,
  category: 'default',
  tags: [name.toLowerCase()]
}));

export default defineComponent({
  name: 'MfwIconPicker',

  props: {
    /** 绑定值 */
    modelValue: {
      type: String as PropType<MfwIconPickerProps['modelValue']>,
      default: ''
    },
    /** 图标列表 */
    icons: {
      type: Array as PropType<MfwIconPickerProps['icons']>,
      default: () => defaultIcons
    },
    /** 是否显示搜索 */
    showSearch: {
      type: Boolean as PropType<MfwIconPickerProps['showSearch']>,
      default: true
    },
    /** 搜索占位符 */
    searchPlaceholder: {
      type: String as PropType<MfwIconPickerProps['searchPlaceholder']>,
      default: '搜索图标...'
    },
    /** 图标尺寸 */
    iconSize: {
      type: [Number, String] as PropType<MfwIconPickerProps['iconSize']>,
      default: 20
    },
    /** 每行图标数量 */
    columns: {
      type: Number as PropType<MfwIconPickerProps['columns']>,
      default: 8
    },
    /** 弹窗宽度 */
    popupWidth: {
      type: [Number, String] as PropType<MfwIconPickerProps['popupWidth']>,
      default: 500
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean as PropType<MfwIconPickerProps['disabled']>,
      default: false
    },
    /** 占位符文本 */
    placeholder: {
      type: String as PropType<MfwIconPickerProps['placeholder']>,
      default: '请选择图标'
    },
    /** 清空提示文本 */
    clearText: {
      type: String as PropType<MfwIconPickerProps['clearText']>,
      default: '清空'
    }
  },

  emits: {
    'update:modelValue': (value: string) => true,
    change: (value: string) => true
  },

  setup(props, { emit }) {
    const internalValue = ref(props.modelValue);

    // 监听外部 modelValue 变化，同步到内部值
    watch(() => props.modelValue, (newValue) => {
      internalValue.value = newValue;
    });

    const getIconComponent = (iconName: string) => {
      return (IconMap as any)[iconName] || null;
    };

    const handleOpen = () => {
      if (props.disabled) return;
      
      MfwPopup.open({
        title: '选择图标',
        type: 'dialog',
        component: markRaw(IconPickerPanel),
        data: {
          modelValue: internalValue.value,
          icons: props.icons,
          iconSize: props.iconSize,
          columns: props.columns,
        },
        popupProps: {
          width: props.popupWidth,
          top: '10vh',
        },
        footer: {
          cancelText: '取消',
          confirmText: '确定',
        },
        on: {
          confirm: (component: any) => {
            // 从 component ref 获取选中的值
            if (component && component.selectedIcon !== undefined) {
              let selectedValue;
              // 检查是否是 ref 对象
              if (component.selectedIcon && typeof component.selectedIcon.value !== 'undefined') {
                selectedValue = component.selectedIcon.value;
              } else {
                selectedValue = component.selectedIcon;
              }
              
              if (selectedValue !== undefined) {
                internalValue.value = selectedValue;
                emit('update:modelValue', selectedValue);
                emit('change', selectedValue);
              }
            }
          },
        },
      });
    };

    const handleClear = (e: Event) => {
      e.stopPropagation();
      internalValue.value = '';
      emit('update:modelValue', '');
      emit('change', '');
    };

    return () => {
      const CurrentIconComponent = internalValue.value ? getIconComponent(internalValue.value) : null;

      return (
        <div class="mfw-icon-picker">
          <div onClick={handleOpen} style="display: flex;">
            <ElInput
              modelValue={internalValue.value}
              placeholder={props.placeholder}
              readonly
              disabled={props.disabled}
              class="mfw-icon-picker-input"
              v-slots={{
                prefix: CurrentIconComponent
                  ? () => (
                    <ElIcon size={props.iconSize}>
                      <CurrentIconComponent />
                    </ElIcon>
                  )
                  : undefined,
                suffix: internalValue.value
                  ? () => (
                    <div
                      style="cursor: pointer;"
                      onClick={(e: Event) => {
                        e.stopPropagation();
                        handleClear(e);
                      }}
                    >
                      <ElIcon size={16}>
                        <Close />
                      </ElIcon>
                    </div>
                  )
                  : undefined
              }}
            />
          </div>
        </div>
      );
    };
  }
})