/**
 * @fileoverview MfwAppSelector 应用实例选择器组件
 * @description 用于用户登录后选择应用实例，支持搜索筛选
 * @example
 * ```vue
 * <!-- 静态数据模式 -->
 * <MfwAppSelector v-model="appId" :app-list="appList" />
 *
 * <!-- 动态加载模式 -->
 * <MfwAppSelector v-model="appId" :load-app-list="loadAppList" />
 *
 * <!-- 显示角色和应用类型 -->
 * <MfwAppSelector v-model="app" show-role-tag show-app-type />
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
  type PropType
} from 'vue';
import {
  ElSelect,
  ElOption,
  ElTag,
  ElInput,
  ElEmpty,
  ElSkeleton
} from 'element-plus';
import {
  Monitor,
  Search,
  OfficeBuilding
} from '@element-plus/icons-vue';
import type {
  MfwAppSelectorProps,
  MfwAppSelectorEmits,
  MfwAppSelectorInstance,
  MfwAppSelectorSlots,
  AppInstanceItem,
  AppSelectorState
} from './types';

export default defineComponent({
  name: 'MfwAppSelector',

  props: {
    /** 绑定值 */
    modelValue: {
      type: [String, Object] as PropType<MfwAppSelectorProps['modelValue']>,
      default: undefined
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      default: false
    },
    /** 占位文本 */
    placeholder: {
      type: String,
      default: '请选择应用实例'
    },
    /** 应用列表数据（静态模式） */
    appList: {
      type: Array as PropType<AppInstanceItem[]>,
      default: () => []
    },
    /** 应用列表数据加载函数（动态模式） */
    loadAppList: {
      type: Function as PropType<MfwAppSelectorProps['loadAppList']>,
      default: undefined
    },
    /** 尺寸 */
    size: {
      type: String as PropType<'small' | 'default' | 'large'>,
      default: 'default'
    },
    /** 是否可清空 */
    clearable: {
      type: Boolean,
      default: true
    },
    /** 是否支持搜索 */
    searchable: {
      type: Boolean,
      default: true
    },
    /** 搜索防抖时间（ms） */
    debounce: {
      type: Number,
      default: 300
    },
    /** 空数据提示文本 */
    emptyText: {
      type: String,
      default: '暂无可用应用实例'
    },
    /** 加载中提示文本 */
    loadingText: {
      type: String,
      default: '加载中...'
    },
    /** 是否显示角色标识 */
    showRoleTag: {
      type: Boolean,
      default: true
    },
    /** 是否显示应用类型 */
    showAppType: {
      type: Boolean,
      default: true
    }
  },

  emits: {
    'update:modelValue': (value: string | AppInstanceItem | undefined) => true,
    change: (value: AppInstanceItem | undefined, oldValue: AppInstanceItem | undefined) => true,
    clear: () => true,
    search: (keyword: string) => true
  },

  setup(props, { emit, expose, slots }) {
    const selectRef = ref<any>();

    // 内部状态
    const state = ref<AppSelectorState>({
      visible: false,
      keyword: '',
      appList: [],
      loading: false,
      currentApp: null
    });

    // 搜索防抖定时器
    let searchTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * 获取选中的应用实例 ID
     */
    const selectedAppId = computed(() => {
      const val = props.modelValue;
      if (val === undefined || val === null) {
        return '';
      }
      if (typeof val === 'string') {
        return val;
      }
      return (val as AppInstanceItem).appId;
    });

    /**
     * 获取选中的应用实例对象
     */
    const selectedApp = computed(() => {
      const id = selectedAppId.value;
      if (!id) return undefined;
      return state.value.appList.find((app) => app.appId === id);
    });

    /**
     * 显示值（用于 Select 显示）
     */
    const displayValue = computed(() => {
      return selectedAppId.value;
    });

    /**
     * 加载应用列表
     */
    const loadAppList = async () => {
      // 优先使用动态加载函数
      if (props.loadAppList) {
        state.value.loading = true;
        try {
          const result = await props.loadAppList({
            keyword: state.value.keyword || undefined
          });
          state.value.appList = result || [];
        } catch (error) {
          console.error('加载应用列表失败:', error);
          state.value.appList = [];
        } finally {
          state.value.loading = false;
        }
      } else {
        // 使用静态数据
        state.value.appList = props.appList || [];
      }
    };

    /**
     * 处理值变化
     */
    const handleValueChange = (value: string) => {
      const oldValue = selectedApp.value;
      const app = state.value.appList.find((a) => a.appId === value);

      // 根据绑定类型返回不同格式
      if (typeof props.modelValue === 'string' || props.modelValue === undefined) {
        emit('update:modelValue', value);
      } else {
        emit('update:modelValue', app);
      }

      emit('change', app, oldValue);
      state.value.currentApp = app || null;
    };

    /**
     * 处理搜索
     */
    const handleSearch = (keyword: string) => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      searchTimer = setTimeout(() => {
        state.value.keyword = keyword;
        emit('search', keyword);
        if (props.loadAppList) {
          loadAppList();
        }
      }, props.debounce);
    };

    /**
     * 处理清除
     */
    const handleClear = () => {
      state.value.keyword = '';
      emit('clear');
      emit('update:modelValue', undefined);
      emit('change', undefined, selectedApp.value);
    };

    /**
     * 下拉面板展开/收起
     */
    const handleVisibleChange = (visible: boolean) => {
      state.value.visible = visible;
      if (visible) {
        nextTick(() => {
          loadAppList();
        });
      }
    };

    /**
     * 获取选中的应用实例
     */
    const getSelected = (): AppInstanceItem | undefined => {
      return selectedApp.value;
    };

    /**
     * 设置选中应用实例
     */
    const setSelected = (app: AppInstanceItem) => {
      if (typeof props.modelValue === 'string') {
        emit('update:modelValue', app.appId);
      } else {
        emit('update:modelValue', app);
      }
    };

    /**
     * 清空选择
     */
    const clear = () => {
      handleClear();
    };

    /**
     * 刷新应用列表
     */
    const refresh = async () => {
      await loadAppList();
    };

    // 暴露实例方法
    expose<MfwAppSelectorInstance>({
      getSelected,
      setSelected,
      clear,
      refresh
    });

    // 监听外部 appList 变化（静态模式）
    watch(
      () => props.appList,
      (newList) => {
        if (!props.loadAppList && newList) {
          state.value.appList = newList;
        }
      },
      { deep: true }
    );

    // 初始化
    onMounted(() => {
      loadAppList();
    });

    // 渲染函数
    return () => {
      // 渲染应用列表项
      const renderAppItem = (app: AppInstanceItem) => {
        const isSelected = selectedAppId.value === app.appId;

        // 自定义插槽
        if (slots.item) {
          return slots.item({ app, selected: isSelected });
        }

        // 默认渲染
        return h('div', { class: 'mfw-app-selector__item' }, [
          // 应用图标
          app.icon
            ? h('img', {
                src: app.icon,
                class: 'mfw-app-selector__icon',
                alt: app.appName
              })
            : h('div', { class: 'mfw-app-selector__icon-placeholder' }, [
                h(Monitor, { style: { width: '20px', height: '20px' } })
              ]),

          // 应用信息
          h('div', { class: 'mfw-app-selector__info' }, [
            // 应用名称
            h('div', { class: 'mfw-app-selector__name' }, [
              app.appName,
              // 角色标识
              props.showRoleTag && h(ElTag, {
                size: 'small',
                type: app.role === 'owner' ? 'warning' : 'info',
                class: 'mfw-app-selector__role-tag'
              }, app.role === 'owner' ? '拥有者' : '成员')
            ]),
            // 应用类型
            props.showAppType && h('div', { class: 'mfw-app-selector__type' }, [
              h(OfficeBuilding, { style: { width: '14px', height: '14px', marginRight: '4px' } }),
              app.appTypeName
            ]),
            // 应用编码
            h('div', { class: 'mfw-app-selector__code' }, `编码: ${app.appCode}`)
          ])
        ]);
      };

      // 渲染下拉面板内容
      const renderDropdown = () => {
        return h('div', { class: 'mfw-app-selector__dropdown' }, [
          // 搜索框（如果 searchable）
          props.searchable && h(ElInput, {
            modelValue: state.value.keyword,
            'onUpdate:modelValue': (val: string) => { handleSearch(val); },
            placeholder: '搜索应用实例...',
            prefixIcon: Search,
            clearable: true,
            size: 'small',
            class: 'mfw-app-selector__search'
          }),

          // 应用列表
          state.value.loading
            ? h(ElSkeleton, { animated: true, rows: 3, class: 'mfw-app-selector__loading' })
            : state.value.appList.length === 0
              ? slots.empty?.() || h(ElEmpty, {
                  description: state.value.keyword ? '未找到相关应用实例' : props.emptyText,
                  imageSize: 60
                })
              : h('div', { class: 'mfw-app-selector__list' },
                  state.value.appList.map((app) =>
                    h(ElOption, {
                      key: app.appId,
                      value: app.appId,
                      label: app.appName
                    }, {
                      default: () => renderAppItem(app)
                    })
                  )
                )
        ]);
      };

      return h(ElSelect, {
        ref: selectRef,
        modelValue: displayValue.value,
        'onUpdate:modelValue': handleValueChange,
        disabled: props.disabled,
        clearable: props.clearable && !props.disabled,
        placeholder: props.placeholder,
        size: props.size,
        filterable: props.searchable,
        remote: !!(props.searchable && props.loadAppList),
        remoteMethod: props.loadAppList ? handleSearch : undefined,
        loading: state.value.loading,
        loadingText: props.loadingText,
        noMatchText: '未找到相关应用实例',
        noDataText: props.emptyText,
        onClear: handleClear,
        onVisibleChange: handleVisibleChange,
        popperClass: 'mfw-app-selector__popper',
        style: { width: '100%' }
      }, {
        default: () => state.value.appList.map((app) =>
          h(ElOption, {
            key: app.appId,
            value: app.appId,
            label: app.appName,
            disabled: app.appStatus === 0
          }, {
            default: () => renderAppItem(app)
          })
        ),
        prefix: slots.prefix
      });
    };
  }
});