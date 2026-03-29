/**
 * @fileoverview MfwFormCard 表单卡片组件
 * @description 配置驱动的表单组件，支持分组、动态显示/禁用等高级功能
 * @example
 * ```vue
 * <mfw-form-card
 *   :form-data="formData"
 *   :template="formTemplate"
 *   @change="handleChange"
 * />
 * ```
 */

import './style.scss';

import {
  defineComponent,
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  h,
  type PropType,
  type Ref,
  type Component,
  resolveComponent,
  toRef
} from 'vue';
import {
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElCollapse,
  ElCollapseItem,
  ElTabs,
  ElTabPane,
  ElAlert,
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus';
import type {
  MfwFormCardProps,
  MfwFormCardEmits,
  MfwFormCardInstance,
  FormItemConfig,
  FormGroupConfig
} from './types';

export default defineComponent({
  name: 'MfwFormCard',

  props: {
    /** 表单数据 */
    formData: {
      type: Object as PropType<MfwFormCardProps['formData']>,
      default: () => ({})
    },
    /** 表单项配置 */
    template: {
      type: Array as PropType<MfwFormCardProps['template']>,
      default: () => []
    },
    /** 分组配置 */
    formGroup: {
      type: Object as PropType<MfwFormCardProps['formGroup']>
    },
    /** 表单模式 */
    mode: {
      type: String as PropType<'add' | 'edit' | 'view'>
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      default: false
    },
    /** 验证规则 */
    rules: {
      type: Object as PropType<FormRules>,
      default: () => ({})
    },
    /** 表单属性 */
    formProps: {
      type: Object as PropType<Partial<MfwFormCardProps>>,
      default: () => ({ labelWidth: '120px' })
    },
    /** 外部变化标识 */
    pChange: {
      type: Boolean,
      default: false
    }
  },

  emits: ['change', 'loads', 'loadRefs'],

  setup(props, { emit, expose, slots }) {
    const formRef = ref<FormInstance>();
    const load = ref(true);
    const formTemplate = ref<FormItemConfig[]>([]);

    /**
     * 初始化表单项
     */
    const initTemplateItem = (item: FormItemConfig) => {
      if (!item.elProps) {
        item.elProps = {};
      }

      item.itemProps = Object.assign({ rules: item.rules }, item.itemProps);
      item.elProps.clearable = item.elProps.clearable ?? true;

      // 初始化默认值：只有当 formData 中没有该 key 时，才使用 template 的 value
      if (props.formData && !(item.key in props.formData)) {
        props.formData[item.key] = item.value ?? '';
      }
    };

    // 初始化模板
    const initTemplate = () => {
      formTemplate.value = (props.template || []).map(item => {
        const newItem = { ...item };
        // 深拷贝 elProps，避免多个实例共享同一引用
        if (item.elProps) {
          newItem.elProps = JSON.parse(JSON.stringify(item.elProps));
        }
        initTemplateItem(newItem);
        return newItem;
      });
    };

    initTemplate();

    // 刷新组件
    const refreshComponent = () => {
      load.value = false;
      nextTick(() => {
        nextTick(() => {
          load.value = true;
        });
      });
    };

    // 监听 template 变化，重新初始化
    watch(() => props.template, (newTemplate) => {
      formTemplate.value = (newTemplate || []).map(item => {
        const newItem = { ...item };
        // 深拷贝 elProps，避免多个实例共享同一引用
        if (item.elProps) {
          newItem.elProps = JSON.parse(JSON.stringify(item.elProps));
        }
        initTemplateItem(newItem);
        return newItem;
      });
      refreshComponent();
    }, { deep: true });

    // 监听 formData 变化，刷新组件
    watch(() => props.formData, refreshComponent, { deep: true });
    watch(() => props.pChange, refreshComponent);

    /**
     * 判断是否显示
     */
    const showItem = (item: FormItemConfig): boolean => {
      if (typeof item.show === 'undefined') {
        return true;
      }
      if (typeof item.show === 'function') {
        return item.show(props.formData || {});
      }
      return item.show;
    };

    /**
     * 判断是否禁用
     */
    const disabledItem = (item: FormItemConfig): boolean => {
      if (props.disabled) {
        return true;
      }
      if (typeof item.disabled === 'undefined') {
        return false;
      }
      if (typeof item.disabled === 'function') {
        return item.disabled(props.formData || {});
      }
      return item.disabled;
    };

    /**
     * 数据变化处理
     */
    const handleChange = (scope: { value: any; key: string; formData: any }) => {
      const item = formTemplate.value.find((i) => i.key === scope.key);
      item?.change?.(scope);
      emit('change', scope);
    };

    /**
     * 验证表单
     */
    const validate = async (): Promise<boolean> => {
      if (!formRef.value) {
        throw new Error('Form ref not found');
      }

      return formRef.value.validate().then(() => {
        return true;
      }).catch((err) => {
        // 如果有分组，自动切换到有错误的分组
        if (props.formGroup) {
          const groups = props.formGroup.groups;
          if (groups && Array.isArray(groups)) {
            const errorKeys = Object.keys(err);

            if (props.formGroup.type === 'el-collapse') {
              const newActiveNames = groups
                .filter((group) => {
                  if (group.template && Array.isArray(group.template)) {
                    return group.template.some((item) => errorKeys.includes(item.key));
                  }
                  return false;
                })
                .map((group) => group.key);

              if (props.formGroup.activeNames !== undefined) {
                props.formGroup.activeNames = newActiveNames as any;
              }
            } else if (props.formGroup.type === 'el-tabs') {
              const firstErrorGroup = groups.find((group) => {
                if (group.template && Array.isArray(group.template)) {
                  return group.template.some((item) => errorKeys.includes(item.key));
                }
                return false;
              });

              if (firstErrorGroup && props.formGroup.activeName !== undefined) {
                props.formGroup.activeName = firstErrorGroup.key;
              }
            }
          }
        }

        ElMessage.error('表单验证失败，请检查所有必填项');
        throw err;
      });
    };

    /**
     * 重置表单
     */
    const resetForm = () => {
      ElMessageBox.confirm('确定要重置表单吗？', '提示', {
        cancelButtonText: '取消',
        confirmButtonText: '确认重置'
      }).then(() => {
        formRef.value?.resetFields();
      });
    };

    onMounted(() => {
      emit('loads');
      emit('loadRefs');
    });

    expose<MfwFormCardInstance>({
      validate,
      resetForm,
      curdForm: formRef
    } as any);

    return () => {
      if (!load.value) {
        return null;
      }

      const renderFormItem = (item: FormItemConfig) => {
        if (!showItem(item)) {
          return null;
        }

        // 解析组件：支持字符串（如 'el-input'）或组件对象
        const component = typeof item.component === 'string'
          ? resolveComponent(item.component)
          : item.component as Component;

        const renderComponent = () => {
          // 使用 computed 确保 modelValue 的响应性
          const modelValueComputed = computed({
            get: () => props.formData?.[item.key],
            set: (val: any) => {
              if (props.formData) {
                props.formData[item.key] = val;
              }
            }
          });

          const propsData = {
            ...item.elProps,
            disabled: disabledItem(item),
            modelValue: modelValueComputed.value,
            'onUpdate:modelValue': (val: any) => {
              modelValueComputed.value = val;
              handleChange({ value: val, key: item.key, formData: props.formData });
            },
            ref: typeof item.ref === 'string' ? item.ref : undefined
          };

          return h(component, propsData);
        };

        return (
          <ElCol span={item.span || 24} key={item.key}>
            <ElFormItem
              {...item.itemProps}
              prop={item.key}
              label={item.label}
            >
              {renderComponent()}
              {item.afterText && (
                <span class="form-item-after-text">{item.afterText}</span>
              )}
              {item.helper && (
                <ElAlert
                  type={item.helperType === 'danger' ? 'error' : (item.helperType || 'info') as any}
                  showIcon
                  closable={false}
                  style="margin: 10px 0; width: 100%;"
                >
                  {typeof item.helper === 'string' ? item.helper : item.helper(props.formData || {})}
                </ElAlert>
              )}
            </ElFormItem>
          </ElCol>
        );
      };

      const renderFormContent = () => {
        // 有分组配置
        if (props.formGroup) {
          const groupConfig = props.formGroup;

          if (groupConfig.type === 'el-collapse') {
            return (
              <ElCollapse modelValue={groupConfig.activeNames}>
                {groupConfig.groups?.map((group) => (
                  <ElCollapseItem
                    key={group.key}
                    name={group.key}
                    title={group.title}
                  >
                    <ElRow gutter={20}>
                      {group.template?.map(renderFormItem)}
                    </ElRow>
                  </ElCollapseItem>
                ))}
              </ElCollapse>
            );
          } else if (groupConfig.type === 'el-tabs') {
            return (
              <ElTabs modelValue={groupConfig.activeName}>
                {groupConfig.groups?.map((group) => (
                  <ElTabPane
                    key={group.key}
                    name={group.key}
                    label={group.title}
                  >
                    <ElRow gutter={20}>
                      {group.template?.map(renderFormItem)}
                    </ElRow>
                  </ElTabPane>
                ))}
              </ElTabs>
            );
          }
        }

        // 无分组，直接渲染
        return (
          <ElRow gutter={20}>
            {formTemplate.value.map(renderFormItem)}
          </ElRow>
        );
      };

      return (
        <ElForm
          ref={formRef}
          {...props.formProps}
          model={props.formData}
          rules={props.rules}
          class="mfw-form-card"
        >
          {renderFormContent()}
        </ElForm>
      );
    };
  }
});
