/**
 * @fileoverview SearchPanel 筛选面板组件
 * @description 配置驱动的筛选面板，支持多种表单项类型、展开/收起、两种触发模式
 */

import './SearchPanel.scss';

import {
  defineComponent,
  ref,
  computed,
  reactive,
  watch,
  type PropType
} from 'vue';
import {
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
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
  ElButton,
  type FormInstance
} from 'element-plus';
import { Search, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import type { SearchTemplateItem, SearchItemType } from './types';

/** SearchPanel Props 接口 */
export interface SearchPanelProps {
  /** 搜索表单模板 */
  searchTemplate?: SearchTemplateItem[];
  /** 筛选触发模式 */
  searchTrigger?: 'change' | 'submit';
  /** 最大可见项数（一行显示的项数） */
  maxVisibleItems?: number;
  /** 是否显示筛选面板 */
  showSearch?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 每项占用的栅格数 */
  itemSpan?: number;
}

/** SearchPanel Emits 接口 */
export interface SearchPanelEmits {
  /** 搜索事件 */
  (e: 'search', formData: Record<string, any>): void;
  /** 重置事件 */
  (e: 'reset'): void;
  /** 表单变化事件 */
  (e: 'change', key: string, value: any, formData: Record<string, any>): void;
}

/** SearchPanel 暴露实例接口 */
export interface SearchPanelInstance {
  /** 重置表单 */
  reset: () => void;
  /** 获取表单值 */
  getFormValues: () => Record<string, any>;
  /** 设置表单值 */
  setFormValues: (values: Record<string, any>) => void;
  /** 触发搜索 */
  doSearch: () => void;
}

export default defineComponent({
  name: 'SearchPanel',

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

    // 触发搜索
    const doSearch = () => {
      emit('search', { ...formData });
    };

    // 重置表单
    const reset = () => {
      // 重置为默认值
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

    // 获取表单值
    const getFormValues = () => {
      return { ...formData };
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
    expose<SearchPanelInstance>({
      reset,
      getFormValues,
      setFormValues,
      doSearch
    });

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
        }
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
        <ElCol span={props.itemSpan} key={item.key} class="search-panel__item">
          <ElFormItem label={item.label} prop={item.key} required={item.required}>
            {renderComponent()}
          </ElFormItem>
        </ElCol>
      );
    };

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

    // 渲染操作按钮
    const renderActions = () => {
      const defaultActions = (
        <>
          <ElButton type="primary" icon={Search} loading={props.loading} onClick={doSearch}>
            查询
          </ElButton>
          <ElButton icon={Refresh} onClick={reset}>
            重置
          </ElButton>
          {showExpandButton.value && (
            <ElButton
              type="primary"
              link
              icon={expanded.value ? ArrowUp : ArrowDown}
              onClick={toggleExpand}
            >
              {expanded.value ? '收起' : '展开'}
            </ElButton>
          )}
        </>
      );

      return (
        <ElCol span={props.itemSpan} class="search-panel__actions">
          <ElFormItem label=" ">
            {slots['search-actions']
              ? slots['search-actions']({ loading: props.loading })
              : defaultActions}
          </ElFormItem>
        </ElCol>
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
            labelWidth="auto"
          >
            <ElRow gutter={20} class="search-panel__row">
              {visibleItems.value.map(renderFormItem)}
              {renderActions()}
            </ElRow>
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