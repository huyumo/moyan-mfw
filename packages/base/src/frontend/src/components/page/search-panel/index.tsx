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
  type PropType,
  type Ref,
  type ComputedRef
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
import type { SearchTemplateItem, SearchItemType } from '../../list-page/types';

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
    /** 最大可见项数（一行显示的项数） */
    maxVisibleItems: {
      type: Number,
      default: 3
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
    /** 每项占用的栅格数 */
    itemSpan: {
      type: Number,
      default: 6
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

    // 是否显示展开/收起按钮
    const showExpandButton = computed(() => {
      return props.searchTemplate.length > props.maxVisibleItems;
    });

    // 可见表单项
    const visibleItems = computed(() => {
      if (expanded.value || !showExpandButton.value) {
        return props.searchTemplate;
      }
      return props.searchTemplate.slice(0, props.maxVisibleItems);
    });

    // 切换展开/收起
    const toggleExpand = () => {
      expanded.value = !expanded.value;
    };

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
        'checkbox-group': `请选择${label}`
      };
      return placeholderMap[type] || `请输入${label}`;
    };

    // 渲染表单项
    const renderFormItem = (item: SearchTemplateItem) => {
      const placeholder = item.placeholder || getDefaultPlaceholder(item.type, item.label);
      const elProps = item.elProps || {};

      // 公共属性
      const commonProps = {
        clearable: true,
        ...elProps,
        modelValue: formData[item.key],
        'onUpdate:modelValue': (val: any) => {
          formData[item.key] = val;
          handleItemChange(item.key, val);
        },
        ...(item.testId ? { 'data-testid': item.testId } : {})
      };

      // 根据类型渲染不同组件
      const renderComponent = () => {
        switch (item.type) {
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

          default:
            return <ElInput {...commonProps} placeholder={placeholder} />;
        }
      };

      return (
        <div class="search-panel__item" key={item.key}>
          <ElFormItem label={item.label} prop={item.key} required={item.required}>
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
        <div class="search-panel">
          <ElForm
            ref={formRef}
            model={formData}
            inline
            class="search-panel__form"
            labelWidth="80px"
          >
            {visibleItems.value.map(renderFormItem)}
          </ElForm>
          {slots['search-extra'] && (
            <div class="search-panel__extra">
              {slots['search-extra']()}
            </div>
          )}
        </div>
      );
    };
  }
});