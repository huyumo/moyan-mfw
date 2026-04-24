import './style.scss'

import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  h,
  type PropType
} from 'vue'
import { ElInput, ElButton, ElAvatar, ElMessage } from 'element-plus'
import { Search, Plus, Close, Edit } from '@element-plus/icons-vue'
import { MfwPopup } from '../../feedback/popup/mod'
import { ApiUserFindOneByKeyword, ApiUserFindById } from '../../../apis/sys'
import type { UserResponseDto } from '../../../apis/sys/schemas'
import CreatePanel from './create-panel'
import { UserPickerManager } from './manager'
import type {
  MfwUserPickerProps,
  MfwUserPickerInstance,
  SearchBy
} from './types'

export default defineComponent({
  name: 'MfwUserPicker',

  props: {
    modelValue: {
      type: String as PropType<MfwUserPickerProps['modelValue']>,
      default: undefined
    },
    theme: {
      type: String,
      default: 'default'
    },
    helper: {
      type: String,
      default: ''
    },
    searchBy: {
      type: String as PropType<SearchBy>,
      default: undefined
    },
    onSearch: {
      type: Function as PropType<MfwUserPickerProps['onSearch']>,
      default: undefined
    },
    onCreate: {
      type: Function as PropType<MfwUserPickerProps['onCreate']>,
      default: undefined
    },
    onUpdate: {
      type: Function as PropType<MfwUserPickerProps['onUpdate']>,
      default: undefined
    }
  },

  emits: {
    'update:modelValue': (value: string | undefined) => true,
    change: (user: UserResponseDto | null) => true
  },

  setup(props, { emit, expose, slots }) {
    const active = ref<UserResponseDto>()
    const keyword = ref('')
    const noDataTag = ref('请使用手机号/用户名搜索或添加新用户')

    const manager = new UserPickerManager()
    const themeConfig = computed(() => manager.getTheme(props.theme, active.value))

    const helperStr = computed(() => props.helper || themeConfig.value.helper || '')
    const editable = computed(() => themeConfig.value.editable ?? true)
    const effectiveSearchBy = computed(() => props.searchBy || themeConfig.value.searchBy || 'both')

    const emitChange = (user: UserResponseDto | null) => {
      emit('update:modelValue', user?.id)
      emit('change', user)
    }

    const resolveSearchFn = computed(() => props.onSearch || themeConfig.value.onSearch)
    const resolveCreateFn = computed(() => props.onCreate || themeConfig.value.onCreate)
    const resolveUpdateFn = computed(() => props.onUpdate || themeConfig.value.onUpdate)

    const doSearch = async () => {
      if (!keyword.value) {
        ElMessage.warning('请输入搜索关键词')
        return
      }

      try {
        const searchFn = resolveSearchFn.value
        if (searchFn) {
          const user = await searchFn(keyword.value)
          if (user) {
            active.value = user
            emitChange(user)
          } else {
            noDataTag.value = `未搜索到"${keyword.value}"相关的用户`
          }
        } else {
          const user = await new ApiUserFindOneByKeyword({
            query: {
              keyword: keyword.value,
              searchBy: effectiveSearchBy.value
            }
          })
          if (user) {
            active.value = user
            emitChange(user)
          } else {
            noDataTag.value = `未搜索到"${keyword.value}"相关的用户`
          }
        }
      } catch (error) {
        console.error('搜索用户失败:', error)
        noDataTag.value = '搜索失败，请重试'
      } finally {
        keyword.value = ''
      }
    }

    const openCreatePanel = (user?: UserResponseDto) => {
      MfwPopup.open({
        title: themeConfig.value.title || (user ? '编辑账号' : '添加账号'),
        component: CreatePanel,
        type: 'dialog',
        popupProps: { width: '500px' },
        data: {
          context: user,
          theme: props.theme,
          onCreate: resolveCreateFn.value,
          onUpdate: resolveUpdateFn.value
        },
        on: {
          confirm: (componentRef: any) => {
            const result = componentRef?.onConfirm?.()
            if (result instanceof Promise) {
              result.then((createdUser: UserResponseDto) => {
                if (createdUser) {
                  active.value = createdUser
                  emitChange(createdUser)
                }
              })
            }
          }
        }
      })
    }

    const handleDelete = () => {
      active.value = undefined
      emitChange(null)
    }

    const loadUserById = async () => {
      if (!props.modelValue) return
      try {
        const user = await new ApiUserFindById({ params: { id: props.modelValue } })
        if (user) {
          active.value = user
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    }

    const clear = () => handleDelete()
    const getSelected = (): UserResponseDto | null => active.value ?? null
    const setSelected = (user: UserResponseDto) => {
      active.value = user
      emitChange(user)
    }
    const refresh = () => loadUserById()

    expose<MfwUserPickerInstance>({ clear, getSelected, setSelected, refresh })

    watch(
      () => props.modelValue,
      (newVal, oldVal) => {
        if (newVal !== oldVal && newVal && !active.value?.id) {
          loadUserById()
        }
      }
    )

    onMounted(() => {
      if (props.modelValue) {
        loadUserById()
      }
    })

    return () => {
      const renderEmpty = () => (
        <div class="mfw-user-picker__empty">
          <div class="mfw-user-picker__empty-tag">{noDataTag.value}</div>
          {helperStr.value && <div class="mfw-user-picker__empty-helper">{helperStr.value}</div>}
          {slots.empty?.()}
        </div>
      )

      const renderUserInfo = () => (
        <div class="mfw-user-picker__info">
          <ElAvatar size={40} src={active.value?.avatar} />
          <div class="mfw-user-picker__info-detail">
            <div class="mfw-user-picker__info-name">
              <span>{active.value?.nickname || active.value?.username}</span>
              {active.value?.username && active.value?.nickname && (
                <span class="mfw-user-picker__info-label">{active.value.username}</span>
              )}
            </div>
            <div class="mfw-user-picker__info-phone">{active.value?.phone}</div>
          </div>
          <div class="mfw-user-picker__info-actions">
            {editable.value && (
              <ElButton
                type="primary"
                text
                circle
                icon={Edit}
                onClick={(e: Event) => {
                  e.stopPropagation()
                  openCreatePanel(active.value)
                }}
              />
            )}
            <ElButton
              type="danger"
              text
              circle
              icon={Close}
              onClick={(e: Event) => {
                e.stopPropagation()
                handleDelete()
              }}
            />
          </div>
        </div>
      )

      return (
        <div class="mfw-user-picker">
          {!active.value && (
            <div class="mfw-user-picker__search" onKeyup={(e: KeyboardEvent) => { if (e.key === 'Enter') doSearch() }}>
              <ElInput
                v-model={keyword.value}
                placeholder="请输入手机号/用户名查询"
                v-slots={{
                  append: () => (
                    <ElButton icon={Search} onClick={doSearch} />
                  )
                }}
              />
              <ElButton
                icon={Plus}
                type="primary"
                style="margin-left: 10px"
                onClick={() => openCreatePanel()}
              />
            </div>
          )}
          <div class="mfw-user-picker__content">
            {!active.value ? renderEmpty() : renderUserInfo()}
          </div>
        </div>
      )
    }
  }
})
