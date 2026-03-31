/**
 * @fileoverview MfwUserPicker 用户选择器组件
 * @description 支持用户选择、部门筛选、多选等功能
 * @example
 * ```vue
 * <!-- 单选 -->
 * <mfw-user-picker v-model="userId" />
 *
 * <!-- 多选 -->
 * <mfw-user-picker v-model="userIds" multiple />
 *
 * <!-- 显示部门筛选 -->
 * <mfw-user-picker v-model="userId" show-department-filter />
 *
 * <!-- 自定义占位符 -->
 * <mfw-user-picker v-model="userId" placeholder="请选择用户" />
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
  type VNode
} from 'vue';
import {
  ElSelect,
  ElOption,
  ElTag,
  ElTree,
  ElInput,
  ElEmpty,
  ElSkeleton
} from 'element-plus';
import {
  User,
  Search,
  Loading
} from '@element-plus/icons-vue';
import type {
  MfwUserPickerProps,
  MfwUserPickerEmits,
  MfwUserPickerInstance,
  MfwUserPickerSlots,
  UserInfo,
  DepartmentInfo,
  UserPickerState
} from './types';

export default defineComponent({
  name: 'MfwUserPicker',

  props: {
    /** 绑定值 */
    modelValue: {
      type: [String, Number, Array, Object] as PropType<MfwUserPickerProps['modelValue']>,
      default: undefined
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      default: false
    },
    /** 是否多选 */
    multiple: {
      type: Boolean,
      default: false
    },
    /** 最多选择数量 */
    maxCount: {
      type: Number,
      default: 0
    },
    /** 占位文本 */
    placeholder: {
      type: String,
      default: '请选择用户'
    },
    /** 是否显示部门树筛选 */
    showDepartmentFilter: {
      type: Boolean,
      default: false
    },
    /** 部门树数据 */
    departmentData: {
      type: Array as PropType<DepartmentInfo[]>,
      default: () => []
    },
    /** 用户列表数据加载函数 */
    loadUserList: {
      type: Function as PropType<MfwUserPickerProps['loadUserList']>,
      required: true
    },
    /** 自定义用户标签渲染 */
    renderTag: {
      type: Function as PropType<(user: UserInfo) => VNode | string>
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
    /** 远程搜索防抖时间（ms） */
    debounce: {
      type: Number,
      default: 300
    },
    /** 是否支持搜索 */
    searchable: {
      type: Boolean,
      default: true
    },
    /** 空数据提示文本 */
    emptyText: {
      type: String,
      default: '暂无数据'
    },
    /** 加载中提示文本 */
    loadingText: {
      type: String,
      default: '加载中...'
    }
  },

  emits: {
    'update:modelValue': (value: any) => true,
    change: (value: any) => true,
    clear: () => true,
    search: (keyword: string) => true,
    'department-change': (departmentIds: string[]) => true
  },

  setup(props, { emit, expose, slots }) {
    const selectRef = ref<any>();
    const treeRef = ref<any>();

    // 内部状态
    const state = ref<UserPickerState>({
      visible: false,
      keyword: '',
      userList: [],
      loading: false,
      selectedIds: [],
      currentValue: null,
      page: 1,
      pageSize: 50,
      total: 0,
      selectedDepartmentId: undefined
    });

    // 搜索防抖定时器
    let searchTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * 标准化值为 UserInfo[] 数组
     */
    const normalizeValue = (): (string | number)[] => {
      const val = props.modelValue;
      if (val === undefined || val === null) {
        return [];
      }
      if (Array.isArray(val)) {
        return val.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return (item as UserInfo).id;
          }
          return item as string | number;
        });
      }
      if (typeof val === 'object') {
        return [(val as UserInfo).id];
      }
      return [val];
    };

    /**
     * 获取选中的用户 ID 列表
     */
    const selectedIds = computed(() => {
      return normalizeValue();
    });

    /**
     * 获取选中的用户对象列表
     */
    const selectedUsers = computed(() => {
      return state.value.userList.filter((user) =>
        selectedIds.value.includes(user.id)
      );
    });

    /**
     * 显示值（用于 Select 显示）
     */
    const displayValue = computed(() => {
      if (props.multiple) {
        return selectedIds.value;
      }
      return selectedIds.value[0] ?? '';
    });

    /**
     * 加载用户列表
     */
    const loadUserList = async () => {
      if (!props.loadUserList) return;

      state.value.loading = true;
      try {
        const result = await props.loadUserList({
          keyword: state.value.keyword || undefined,
          departmentId: state.value.selectedDepartmentId,
          page: state.value.page,
          pageSize: state.value.pageSize
        });
        state.value.userList = result.list || [];
        state.value.total = result.total || 0;
      } catch (error) {
        console.error('加载用户列表失败:', error);
        state.value.userList = [];
        state.value.total = 0;
      } finally {
        state.value.loading = false;
      }
    };

    /**
     * 处理值变化
     */
    const handleValueChange = (value: any) => {
      const oldValue = props.multiple ? selectedUsers.value : state.value.currentValue;

      let newValue: any;
      if (props.multiple) {
        // 多选模式
        const ids = Array.isArray(value) ? value : [value];
        newValue = ids.map((id: string | number) => {
          const user = state.value.userList.find((u) => u.id === id);
          return user || { id };
        });
      } else {
        // 单选模式
        const user = state.value.userList.find((u) => u.id === value);
        newValue = user || { id: value };
        state.value.currentValue = user || null;
      }

      emit('update:modelValue', newValue);
      emit('change', newValue, oldValue);
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
        state.value.page = 1;
        emit('search', keyword);
        loadUserList();
      }, props.debounce);
    };

    /**
     * 处理部门变化
     */
    const handleDepartmentChange = (departmentId: string | number) => {
      state.value.selectedDepartmentId = departmentId;
      state.value.page = 1;
      emit('department-change', departmentId);
      loadUserList();
    };

    /**
     * 处理清除
     */
    const handleClear = () => {
      state.value.keyword = '';
      state.value.selectedDepartmentId = undefined;
      emit('clear');
      emit('update:modelValue', props.multiple ? [] : undefined);
      emit('change', props.multiple ? [] : undefined, selectedUsers.value);
      loadUserList();
    };

    /**
     * 下拉面板展开/收起
     */
    const handleVisibleChange = (visible: boolean) => {
      state.value.visible = visible;
      if (visible) {
        nextTick(() => {
          loadUserList();
        });
      }
    };

    /**
     * 聚焦
     */
    const focus = () => {
      selectRef.value?.focus();
    };

    /**
     * 失焦
     */
    const blur = () => {
      selectRef.value?.blur();
    };

    /**
     * 清空选择
     */
    const clear = () => {
      handleClear();
    };

    /**
     * 获取已选择的用户
     */
    const getSelected = (): UserInfo[] => {
      return selectedUsers.value;
    };

    /**
     * 设置选中用户
     */
    const setSelected = (users: UserInfo[]) => {
      const ids = users.map((u) => u.id);
      emit('update:modelValue', props.multiple ? ids : ids[0]);
    };

    /**
     * 刷新用户列表
     */
    const refresh = async () => {
      await loadUserList();
    };

    // 暴露实例方法
    expose<MfwUserPickerInstance>({
      focus,
      blur,
      clear,
      getSelected,
      setSelected,
      refresh
    });

    // 监听外部值变化
    watch(
      () => props.modelValue,
      () => {
        // 外部值变化时，同步内部状态
        loadUserList();
      },
      { deep: true }
    );

    // 初始化
    onMounted(() => {
      loadUserList();
    });

    // 渲染函数
    return () => {
      // 渲染部门树筛选
      const renderDepartmentFilter = () => {
        if (!props.showDepartmentFilter) {
          return null;
        }

        return h('div', { class: 'mfw-user-picker__department-filter' }, [
          h(ElTree, {
            ref: treeRef,
            data: props.departmentData,
            nodeKey: 'id',
            props: {
              children: 'children',
              label: 'name'
            },
            highlightCurrent: true,
            expandOnClickNode: false,
            onNodeClick: (data: DepartmentInfo) => {
              handleDepartmentChange(data.id);
            }
          }, {
            default: ({ node, data }: any) =>
              h('span', { class: 'mfw-tree-node' }, [
                h('span', { class: 'mfw-tree-node__label' }, node.label)
              ])
          })
        ]);
      };

      // 渲染用户列表项
      const renderUserItem = (user: UserInfo) => {
        const isSelected = selectedIds.value.includes(user.id);
        const isDisabled = props.multiple &&
          props.maxCount! > 0 &&
          selectedIds.value.length >= props.maxCount! &&
          !isSelected;

        // 自定义插槽
        if (slots.item) {
          return slots.item({ user, selected: isSelected });
        }

        // 默认渲染
        return h('div', { class: 'mfw-user-picker__item', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          // 头像
          user.avatar
            ? h('img', {
                src: user.avatar,
                style: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }
              })
            : h('div', {
                class: 'mfw-user-picker__avatar',
                style: {
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--el-color-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }
              }, user.name.charAt(0).toUpperCase()),

          // 用户信息
          h('div', { style: { flex: 1, minWidth: 0 } }, [
            h('div', { class: 'mfw-user-picker__name', style: { fontWeight: 500 } }, user.name),
            (user.departmentName || user.position) && h('div', {
              class: 'mfw-user-picker__info',
              style: { fontSize: '12px', color: 'var(--el-text-color-secondary)' }
            }, [user.departmentName, user.position ? ` · ${user.position}` : ''].filter(Boolean).join(''))
          ])
        ]);
      };

      // 渲染下拉面板内容
      const renderDropdown = () => {
        return h('div', { class: 'mfw-user-picker__dropdown' }, [
          // 部门筛选
          renderDepartmentFilter(),

          // 搜索框（如果 Select 不自带）
          props.searchable && h(ElInput, {
            modelValue: state.value.keyword,
            'onUpdate:modelValue': (val: string) => { handleSearch(val); },
            placeholder: '搜索用户...',
            prefixIcon: Search,
            clearable: true,
            size: 'small',
            style: { marginBottom: '8px' }
          }),

          // 用户列表
          state.value.loading
            ? h(ElSkeleton, { animated: true, rows: 5 })
            : state.value.userList.length === 0
              ? slots.empty?.() || h(ElEmpty, {
                  description: state.value.keyword ? '未找到相关用户' : props.emptyText,
                  imageSize: 60
                })
              : h('div', { class: 'mfw-user-picker__list' },
                  state.value.userList.map((user) =>
                    h(ElOption, {
                      key: user.id,
                      value: user.id,
                      label: user.name
                    }, {
                      default: () => renderUserItem(user)
                    })
                  )
                )
        ]);
      };

      // 渲染标签
      const renderTag = (user: UserInfo) => {
        if (slots.tag) {
          return slots.tag({ user });
        }
        if (props.renderTag) {
          return props.renderTag(user);
        }
        return h(ElTag, { key: user.id, closable: !props.disabled }, user.name);
      };

      return h(ElSelect, {
        ref: selectRef,
        modelValue: displayValue.value,
        'onUpdate:modelValue': handleValueChange,
        multiple: props.multiple,
        disabled: props.disabled,
        clearable: props.clearable && !props.disabled,
        placeholder: props.placeholder,
        size: props.size,
        filterable: props.searchable,
        remote: props.searchable,
        remoteMethod: handleSearch,
        loading: state.value.loading,
        loadingText: props.loadingText,
        noMatchText: '未找到相关用户',
        noDataText: props.emptyText,
        onClear: handleClear,
        onVisibleChange: handleVisibleChange,
        popperClass: props.showDepartmentFilter ? 'mfw-user-picker__popper' : '',
        style: { width: '100%' }
      }, {
        header: () => props.showDepartmentFilter ? renderDepartmentFilter() : null,
        default: () => state.value.userList.map((user) =>
          h(ElOption, {
            key: user.id,
            value: user.id,
            label: user.name,
            disabled: props.multiple &&
              props.maxCount! > 0 &&
              selectedIds.value.length >= props.maxCount! &&
              !selectedIds.value.includes(user.id)
          }, {
            default: () => renderUserItem(user)
          })
        ),
        prefix: slots.prefix
      });
    };
  }
});
