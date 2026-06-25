/**
 * @fileoverview MfwSearchPanel 筛选面板组件
 * @description 配置驱动的筛选面板，支持多种表单项类型、展开/收起、两种触发模式
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  reactive,
  watch,
  inject,
  onMounted,
  onBeforeUnmount,
  nextTick,
  type PropType,
  type Ref,
  type ComputedRef,
  h
} from 'vue';
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElTreeSelect,
  ElRadioGroup,
  ElRadioButton,
  ElRadio,
  ElCheckboxGroup,
  ElCheckboxButton,
  ElCheckbox,
  type FormInstance
} from 'element-plus';
import type {
  MfwSearchPanelProps,
  MfwSearchPanelInstance,
  MfwSearchPanelSlots
} from './types';
import type { SearchTemplateItem, SearchItemType } from '../list-page/types';

export default defineComponent({
  name: 'MfwSearchPanel',

  props: {
    /** 搜索表单模板 */
    searchTemplate: {
      type: Array as PropType<SearchTemplateItem[]>,
      default: () => []
    },
    /** 筛选触发模式 */
    searchTrigger: {
      type: String as PropType<'change' | 'submit'>,
      default: 'submit'
    },
    /** 是否显示筛选面板 */
    showSearch: {
      type: Boolean,
      default: true
    },
    /** 加载状态 */
    loading: {
      type: Boolean,
      default: false
    },
    /** 标签宽度 */
    labelWidth: {
      type: String,
      default: 'auto'
    }
  },

  emits: ['search', 'reset', 'change'],

  setup(props, { emit, expose, slots }) {
    const formRef = ref<FormInstance>();
    const expanded = ref(false);
    
    const hasSearchPanel = inject<Ref<boolean>>('mfw-page-has-search-panel', ref(false));
    hasSearchPanel.value = true;

    const searchPanelContextRef = inject<Ref<{
      doSearch: () => void;
      reset: () => void;
      toggleExpand: () => void;
      expanded: Ref<boolean>;
      showExpandButton: ComputedRef<boolean>;
      loading: ComputedRef<boolean>;
    } | null>>('mfw-search-panel-context-ref', ref(null) as Ref<{
      doSearch: () => void;
      reset: () => void;
      toggleExpand: () => void;
      expanded: Ref<boolean>;
      showExpandButton: ComputedRef<boolean>;
      loading: ComputedRef<boolean>;
    } | null>);

    // 表单数据
    const formData = reactive<Record<string, any>>({});

    // 初始化表单默认值
    const initFormData = () => {
      props.searchTemplate.forEach(item => {
        if (item.defaultValue !== undefined) {
          formData[item.key] = item.defaultValue;
        } else {
          // 根据类型设置默认值
          if (item.type === 'checkbox-group') {
            formData[item.key] = [];
          } else if (item.type === 'date-range') {
            formData[item.key] = [];
          } else {
            formData[item.key] = '';
          }
        }
      });
    };

    // 监听模板变化重新初始化
    watch(
      () => props.searchTemplate,
      () => {
        initFormData();
      },
      { immediate: true, deep: true }
    );

    // 是否显示展开/收起按钮（当内容超过一行时显示）
    const formContainerRef = ref<HTMLElement>();
    const contentOverflows = ref(false);
    const collapsedHeight = ref(36);
    const COLLAPSED_HEIGHT_FALLBACK = 36;
    const COLLAPSED_HEIGHT_SAFE_GAP = 2;
    const COLLAPSED_HEIGHT_TOP_SAFE_GAP = 6;

    const getFirstRowHeight = (formEl: HTMLElement) => {
      const items = Array.from(formEl.querySelectorAll('.search-panel__item')) as HTMLElement[];
      if (items.length === 0) return 0;

      const formTop = formEl.getBoundingClientRect().top;
      const firstTop = items[0].getBoundingClientRect().top;
      const firstRowItems = items.filter(item => Math.abs(item.getBoundingClientRect().top - firstTop) < 2);
      const maxBottom = Math.max(...firstRowItems.map(item => item.getBoundingClientRect().bottom));
      return Math.ceil(maxBottom - formTop);
    };

    const checkOverflow = () => {
      if (!formContainerRef.value) return;
      const formEl = formContainerRef.value.querySelector('.search-panel__form') as HTMLElement;
      if (!formEl) {
        contentOverflows.value = false;
        return;
      }
      const firstRowHeight = getFirstRowHeight(formEl);
      if (firstRowHeight <= 0) {
        contentOverflows.value = false;
        collapsedHeight.value = COLLAPSED_HEIGHT_FALLBACK;
        return;
      }
      collapsedHeight.value = firstRowHeight + COLLAPSED_HEIGHT_TOP_SAFE_GAP + COLLAPSED_HEIGHT_SAFE_GAP;
      // 如果 form 高度超过首行高度 + 上下安全余量，说明内容溢出（多行）
      contentOverflows.value = formEl.scrollHeight > collapsedHeight.value;
    };

    // 多次延迟检测，确保 Element Plus 组件完全渲染
    const scheduleOverflowCheck = () => {
      [100, 300, 600].forEach((delay) => {
        setTimeout(() => checkOverflow(), delay);
      });
    };

    const showExpandButton = computed(() => {
      return contentOverflows.value;
    });

    // 切换展开/收起
    const toggleExpand = () => {
      expanded.value = !expanded.value;
    };

    // 监听容器尺寸变化，检测内容是否溢出
    let resizeObserver: ResizeObserver | null = null;
    onMounted(() => {
      // 监听外层 .search-panel 而非 __form-wrapper（后者有 overflow:hidden）
      const panelEl = formContainerRef.value?.closest('.search-panel') as HTMLElement;
      if (!panelEl) return;
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(panelEl);
      // 多次延迟检测，确保 Element Plus 组件完全渲染
      scheduleOverflowCheck();
    });
    onBeforeUnmount(() => {
      resizeObserver?.disconnect();
    });

    // 监听 expanded 变化，重新检测溢出
    watch(expanded, () => {
      nextTick(() => {
        setTimeout(() => {
          checkOverflow();
        }, 100);
      });
    });

    // 过滤空值
    const filterEmptyValues = (data: Record<string, any>): Record<string, any> => {
      const result: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null && value !== '' && 
            !(Array.isArray(value) && value.length === 0)) {
          result[key] = value;
        }
      });
      return result;
    };

    // 触发搜索
    const doSearch = () => {
      emit('search', filterEmptyValues(formData));
    };

    // 重置表单
    const reset = () => {
      props.searchTemplate.forEach(item => {
        if (item.defaultValue !== undefined) {
          formData[item.key] = item.defaultValue;
        } else {
          if (item.type === 'checkbox-group') {
            formData[item.key] = [];
          } else if (item.type === 'date-range') {
            formData[item.key] = [];
          } else {
            formData[item.key] = '';
          }
        }
      });
      formRef.value?.clearValidate();
      emit('reset');
    };

    searchPanelContextRef.value = {
      doSearch,
      reset,
      toggleExpand,
      expanded,
      showExpandButton,
      loading: computed(() => props.loading)
    };

    // 获取表单值（过滤空值）
    const getFormValues = () => {
      return filterEmptyValues(formData);
    };

    // 设置表单值
    const setFormValues = (values: Record<string, any>) => {
      Object.keys(values).forEach(key => {
        formData[key] = values[key];
      });
    };

    // 处理表单项变化
    const handleItemChange = (key: string, value: any) => {
      const item = props.searchTemplate.find(i => i.key === key);
      emit('change', key, value, { ...formData });

      // change 模式下，如果配置了 immediate 或没有配置，则触发搜索
      if (props.searchTrigger === 'change') {
        if (item?.immediate !== false) {
          doSearch();
        }
      }
    };

    // 暴露方法
    expose<MfwSearchPanelInstance>({
      reset,
      getFormValues,
      setFormValues,
      doSearch
    });

    // 获取默认占位符
    const getDefaultPlaceholder = (type: SearchItemType, label: string): string => {
      const placeholderMap: Record<SearchItemType, string> = {
        'input': `请输入${label}`,
        'select': `请选择${label}`,
        'date-picker': `请选择${label}`,
        'date-range': `请选择${label}`,
        'tree-select': `请选择${label}`,
        'radio-group': `请选择${label}`,
        'checkbox-group': `请选择${label}`,
        'custom': `请输入${label}`
      };
      return placeholderMap[type] || `请输入${label}`;
    };

    // 渲染表单项
    const renderFormItem = (item: SearchTemplateItem) => {
      const type = item.type || 'custom';
      const placeholder = item.placeholder || getDefaultPlaceholder(type, item.label);
      const elProps = item.elProps || {};

      // 设置字段值
      const setValue = (val: any) => {
        formData[item.key] = val;
        handleItemChange(item.key, val);
      };

      // 公共属性（用于内置组件）
      const commonProps = {
        clearable: true,
        ...elProps,
        modelValue: formData[item.key],
        'onUpdate:modelValue': (val: any) => {
          setValue(val);
        },
        ...(item.testId ? { 'data-testid': item.testId } : {})
      };

      // 根据类型渲染不同组件
      const renderComponent = () => {
        // 优先级 1：自定义渲染函数
        if (item.render) {
          return item.render({
            value: formData[item.key],
            setValue,
            formData,
            item
          });
        }

        // 优先级 2：自定义插槽（slot 指定或默认 search-item-${key}）
        const slotName = item.slot || `search-item-${item.key}`;
        if (slots[slotName]) {
          return slots[slotName]!({
            value: formData[item.key],
            setValue,
            formData,
            item
          });
        }

        // 优先级 3：自定义组件（支持 v-model 协议）
        if (item.component) {
          return h(item.component, {
            ...commonProps,
            placeholder
          });
        }

        // 优先级 4：内置组件
        switch (type) {
          case 'input':
            return <ElInput {...commonProps} placeholder={placeholder} />;

          case 'select':
            return (
              <ElSelect {...commonProps} placeholder={placeholder}>
                {(elProps.options || []).map((opt: any) => (
                  <ElOption
                    key={opt.value}
                    label={opt.label}
                    value={opt.value}
                    disabled={opt.disabled}
                  />
                ))}
              </ElSelect>
            );

          case 'date-picker':
            return (
              <ElDatePicker
                {...commonProps}
                type="date"
                placeholder={placeholder}
                valueFormat={elProps.valueFormat || 'YYYY-MM-DD'}
              />
            );

          case 'date-range':
            return (
              <ElDatePicker
                {...commonProps}
                type="daterange"
                rangeSeparator={elProps.rangeSeparator || '至'}
                startPlaceholder={elProps.startPlaceholder || '开始日期'}
                endPlaceholder={elProps.endPlaceholder || '结束日期'}
                valueFormat={elProps.valueFormat || 'YYYY-MM-DD'}
              />
            );

          case 'tree-select':
            return (
              <ElTreeSelect
                {...commonProps}
                placeholder={placeholder}
                data={elProps.data || []}
                checkStrictly={elProps.checkStrictly ?? true}
              />
            );

          case 'radio-group':
            const radioOptions = elProps.options || [];
            if (elProps.buttonMode) {
              return (
                <ElRadioGroup {...commonProps}>
                  {radioOptions.map((opt: any) => (
                    <ElRadioButton key={opt.value} value={opt.value}>
                      {opt.label}
                    </ElRadioButton>
                  ))}
                </ElRadioGroup>
              );
            }
            return (
              <ElRadioGroup {...commonProps}>
                {radioOptions.map((opt: any) => (
                  <ElRadio key={opt.value} value={opt.value}>
                    {opt.label}
                  </ElRadio>
                ))}
              </ElRadioGroup>
            );

          case 'checkbox-group':
            const checkboxOptions = elProps.options || [];
            if (elProps.buttonMode) {
              return (
                <ElCheckboxGroup {...commonProps}>
                  {checkboxOptions.map((opt: any) => (
                    <ElCheckboxButton key={opt.value} value={opt.value}>
                      {opt.label}
                    </ElCheckboxButton>
                  ))}
                </ElCheckboxGroup>
              );
            }
            return (
              <ElCheckboxGroup {...commonProps}>
                {checkboxOptions.map((opt: any) => (
                  <ElCheckbox key={opt.value} value={opt.value}>
                    {opt.label}
                  </ElCheckbox>
                ))}
              </ElCheckboxGroup>
            );

          case 'custom':
            // type 为 custom 但未提供 render/slot/component 时给出提示
            return <ElInput {...commonProps} placeholder={placeholder || `请配置 ${item.label} 的 render/slot/component`} />;

          default:
            return <ElInput {...commonProps} placeholder={placeholder} />;
        }
      };

      // 是否展示 label（label 为空则不显示）
      const showLabel = !!item.label;

      // 单项组件宽度（通过 CSS 变量覆盖面板级 --search-panel-item-width）
      const itemStyle = item.componentWidth !== undefined
        ? { '--search-panel-item-width': typeof item.componentWidth === 'number' ? `${item.componentWidth}px` : item.componentWidth } as any
        : undefined;

      return (
        <div class="search-panel__item" key={item.key} style={itemStyle}>
          <ElFormItem
            label={showLabel ? item.label : undefined}
            prop={item.key}
            required={item.required}
            labelWidth={props.labelWidth}
          >
            {renderComponent()}
          </ElFormItem>
        </div>
      );
    };

    return () => {
      if (!props.showSearch) {
        return null;
      }

      return (
        <div
          class={['search-panel', !expanded.value && showExpandButton.value && 'search-panel--collapsed']}
          style={{
            '--search-panel-collapsed-height': `${collapsedHeight.value}px`,
            '--search-panel-collapsed-top-safe-gap': `${COLLAPSED_HEIGHT_TOP_SAFE_GAP}px`
          }}
        >
          <div ref={formContainerRef} class="search-panel__form-wrapper">
            <ElForm
              ref={formRef}
              model={formData}
              class="search-panel__form"
            >
              {props.searchTemplate.map(renderFormItem)}
            </ElForm>
          </div>
          {slots['search-extra'] && slots['search-extra']()}
        </div>
      );
    };
  }
});