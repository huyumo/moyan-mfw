import type { FormItemConfig } from '../../../form/form-card/types'
import type { UserResponseDto } from '../../../../apis/sys/schemas'
import type { UserPickerTheme, UserPickerThemeFn, SearchBy } from './types'
import { MfwImageSingle } from '../../../upload'

export type { UserPickerTheme, UserPickerThemeFn, SearchBy }

export class UserPickerManager {
  private static themes: Map<string, UserPickerTheme | UserPickerThemeFn> = new Map()
  private static instance: UserPickerManager

  static registerTheme(name: string, theme: UserPickerTheme | UserPickerThemeFn) {
    this.themes.set(name, theme)
  }

  getTheme(themeName: string, context?: UserResponseDto): UserPickerTheme {
    const defaultThemeFn = UserPickerManager.themes.get('default') as UserPickerThemeFn
    if (!defaultThemeFn) throw new Error('UserPickerManager: default theme not registered')

    const defaultTheme = defaultThemeFn(context)
    let customTheme = UserPickerManager.themes.get(themeName)
    if (!customTheme) throw new Error(`UserPickerManager: theme "${themeName}" not registered`)

    if (typeof customTheme === 'function') {
      customTheme = (customTheme as UserPickerThemeFn)(context)
    }

    const merged: UserPickerTheme = {
      title: customTheme.title ?? defaultTheme.title,
      helper: customTheme.helper ?? defaultTheme.helper ?? '',
      editable: customTheme.editable ?? defaultTheme.editable,
      searchBy: customTheme.searchBy ?? defaultTheme.searchBy,
      onSearch: customTheme.onSearch ?? defaultTheme.onSearch,
      onCreate: customTheme.onCreate ?? defaultTheme.onCreate,
      onUpdate: customTheme.onUpdate ?? defaultTheme.onUpdate,
      template: []
    }

    const customTemplate = customTheme.template
    merged.template = defaultTheme.template.map((defaultItem: FormItemConfig) => {
      const customItem = customTemplate.find((i: FormItemConfig) => i.key === defaultItem.key)
      if (customItem) {
        return { ...defaultItem, ...customItem }
      }
      return { ...defaultItem }
    })

    customTemplate.forEach((customItem: FormItemConfig) => {
      if (!merged.template.find((i: FormItemConfig) => i.key === customItem.key)) {
        merged.template.push({ ...customItem })
      }
    })

    return merged
  }

  constructor() {
    if (!UserPickerManager.instance) {
      this.init()
      UserPickerManager.instance = this
    }
    return UserPickerManager.instance
  }

  private init() {
    UserPickerManager.registerTheme('default', (context?: UserResponseDto): UserPickerTheme => ({
      title: '添加编辑账号',
      template: [
        {
          key: 'avatar',
          label: '头像',
          component: MfwImageSingle,
          elProps: {
            crop: true,
            cropRatio: 1,
            cropWidth: 200,
            cropHeight: 200,
            placeholder: '点击上传头像',
          },
        },
        {
          key: 'username',
          label: '用户名',
          type: 'el-input',
          component: 'el-input',
          elProps: { maxlength: 20, disabled: !!context?.id },
          rules: [
            { type: 'string', required: true, message: '用户名不能为空', trigger: 'blur' },
            { type: 'string', pattern: /^[a-zA-Z][a-zA-Z0-9]{0,19}$/, message: '用户名须以字母开头，仅允许字母和数字，最长20位', trigger: 'blur' }
          ]
        },
        {
          key: 'nickname',
          label: '昵称',
          type: 'el-input',
          component: 'el-input',
          elProps: { maxlength: 20 },
          rules: [{ type: 'string', required: true, message: '昵称不能为空', trigger: 'blur' }]
        },
        {
          key: 'phone',
          label: '手机号',
          type: 'el-input',
          component: 'el-input',
          elProps: { maxlength: 11 },
          rules: [{ type: 'string', required: true, message: '手机号不能为空', trigger: 'blur' }]
        }
      ],
      helper: '',
      editable: true,
      searchBy: 'both' as SearchBy
    }))
  }
}
