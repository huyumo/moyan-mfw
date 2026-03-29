/**
 * @fileoverview MfwIconPicker 图标选择器组件
 * @description 提供图标选择功能，支持搜索、分类展示
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  watch,
  type PropType
} from 'vue';
import {
  ElInput,
  ElPopover,
  ElScrollbar,
  ElTag,
  ElIcon
} from 'element-plus';
import { Search, Close } from '@element-plus/icons-vue';
import type { MfwIconPickerProps, MfwIconPickerEmits, MfwIconPickerInstance, IconItem } from './types';

// 内置 Element Plus 图标列表（简化版，实际使用时可扩展）
const builtinIcons = [
  'Plus', 'Minus', 'CirclePlus', 'Close', 'Edit', 'Delete', 'Star',
  'Search', 'Upload', 'Download', 'Refresh', 'Setting', 'Question',
  'Warning', 'Info', 'Success', 'Error', 'Loading',
  'User', 'Avatar', 'Phone', 'Email', 'Message',
  'Document', 'Folder', 'Calendar', 'Clock', 'Bell',
  'Home', 'Location', 'Link', 'Picture', 'Video',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Top', 'Bottom', 'Back', 'Right'
];

const defaultIcons: IconItem[] = builtinIcons.map((name) => ({
  name,
  category: 'default',
  tags: [name.toLowerCase()]
}));

export default defineComponent({
  name: 'MfwIconPicker',

  props: {
    /** 绑定值 */
    modelValue: {
      type: String,
      default: ''
    },
    /** 图标列表 */
    icons: {
      type: Array as PropType<IconItem[]>,
      default: () => defaultIcons
    },
    /** 是否显示搜索 */
    showSearch: {
      type: Boolean,
      default: true
    },
    /** 搜索占位符 */
    searchPlaceholder: {
      type: String,
      default: '搜索图标...'
    },
    /** 图标尺寸 */
    iconSize: {
      type: [Number, String],
      default: 20
    },
    /** 每行图标数量 */
    columns: {
      type: Number,
      default: 10
    },
    /** 弹窗宽度 */
    popupWidth: {
      type: [Number, String],
      default: 400
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      default: false
    },
    /** 占位符文本 */
    placeholder: {
      type: String,
      default: '请选择图标'
    },
    /** 清空提示文本 */
    clearText: {
      type: String,
      default: '清空'
    }
  },

  emits: ['update:modelValue', 'change'],

  setup(props, { emit, expose }) {
    const visible = ref(false);
    const searchValue = ref('');
    const popoverRef = ref<any>();

    const selectedIcon = computed({
      get: () => props.modelValue,
      set: (value) => {
        emit('update:modelValue', value);
        emit('change', value);
      }
    });

    const filteredIcons = computed(() => {
      if (!searchValue.value) {
        return props.icons || [];
      }
      const keyword = searchValue.value.toLowerCase();
      return (props.icons || []).filter((icon) => {
        return (
          icon.name.toLowerCase().includes(keyword) ||
          (icon.tags && icon.tags.some((tag) => tag.toLowerCase().includes(keyword)))
        );
      });
    });

    const handleSelect = (iconName: string) => {
      selectedIcon.value = iconName;
      visible.value = false;
    };

    const handleClear = () => {
      selectedIcon.value = '';
      visible.value = false;
    };

    const open = () => {
      visible.value = true;
    };

    const close = () => {
      visible.value = false;
    };

    watch(visible, (val) => {
      if (!val) {
        searchValue.value = '';
      }
    });

    expose<MfwIconPickerInstance>({
      open,
      close,
      clear: handleClear
    });

    return () => (
      <div class="mfw-icon-picker">
        <ElPopover
          ref={popoverRef}
          v-model={visible.value}
          placement="bottom-start"
          width={props.popupWidth}
          trigger="click"
          disabled={props.disabled}
        >
          {{
            reference: () => (
              <ElInput
                modelValue={selectedIcon.value}
                placeholder={props.placeholder}
                readonly
                disabled={props.disabled}
                class="mfw-icon-picker-input"
                v-slots={{
                  prefix: selectedIcon.value
                    ? () => (
                      <ElIcon size={props.iconSize}>
                        {(ElIcon as any)[selectedIcon.value] || null}
                      </ElIcon>
                    )
                    : undefined,
                  suffix: selectedIcon.value
                    ? () => (
                      <div
                        style="cursor: pointer;"
                        onClick={(e: Event) => {
                          e.stopPropagation();
                          handleClear();
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
            ),
            default: () => (
              <div class="mfw-icon-picker-panel">
                {props.showSearch && (
                  <div class="mfw-icon-picker-search">
                    <ElInput
                      v-model={searchValue.value}
                      placeholder={props.searchPlaceholder}
                      clearable
                      prefix-icon={Search}
                      size="small"
                    />
                  </div>
                )}
                <ElScrollbar max-height="300px">
                  <div
                    class="mfw-icon-picker-grid"
                    style={{ gridTemplateColumns: `repeat(${props.columns}, 1fr)` }}
                  >
                    {filteredIcons.value.map((icon) => {
                      const IconComponent = (ElIcon as any)[icon.name];
                      return (
                        <div
                          key={icon.name}
                          class={[
                            'mfw-icon-picker-item',
                            selectedIcon.value === icon.name ? 'selected' : ''
                          ]}
                          onClick={() => handleSelect(icon.name)}
                        >
                          <ElIcon size={props.iconSize}>
                            {IconComponent && <IconComponent />}
                          </ElIcon>
                          <span class="mfw-icon-picker-item-name">{icon.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </ElScrollbar>
                {selectedIcon.value && (
                  <div class="mfw-icon-picker-footer">
                    <ElTag size="small" type="info" onClick={handleClear}>
                      {props.clearText}
                    </ElTag>
                  </div>
                )}
              </div>
            )
          }}
        </ElPopover>
      </div>
    );
  }
});
