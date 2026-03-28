import { Ref } from 'vue'
import { FormTemplateArray } from '../formCard/type'
import * as _ from 'lodash'
import { CreateUserAsMobileDto, DtoUserInfo } from '@/apis/micro-system/schemas'

export interface UserPickerTheme {
  title?: string
  template: FormTemplateArray
  helper: string
  editable?: boolean // 是否可编辑 默认为false
}

export interface UserPickerProps {
  theme?: string
  helper?: string
}

export class UserPickerManager {
  static formTemplates: Map<string, UserPickerTheme | ((formData: Ref<CreateUserAsMobileDto | DtoUserInfo | undefined>) => UserPickerTheme)> = new Map()

  // 注册form表单模板
  public static registerTheme(themeName: string, theme: UserPickerTheme | ((formData: Ref<CreateUserAsMobileDto | DtoUserInfo | undefined>) => UserPickerTheme)) {
    // TODO: 注册form表单模板
    this.formTemplates.set(themeName, theme)
  }

  public getTheme(themeName: string, formData: Ref<CreateUserAsMobileDto | DtoUserInfo | undefined>) {
    const _defaultTheme = UserPickerManager.formTemplates.get('default') as (fromData: Ref<CreateUserAsMobileDto | DtoUserInfo | undefined>)=>UserPickerTheme
    let _theme = UserPickerManager.formTemplates.get(themeName)
    const defaultTheme = _defaultTheme(formData)
    if (!_theme) throw new Error('未注册对应的表单模板')
    if (typeof _theme === 'function') {
      _theme = _theme(formData)
    }

    const theme = _.cloneDeep(_theme)
    defaultTheme.template.forEach((item) => {
      const item2 = theme.template.find((i) => i.key === item.key)
      if (item2) {
        Object.assign(item, item2)
      }
    })

    defaultTheme.helper = theme.helper
    defaultTheme.editable = theme.editable
    return defaultTheme
  }

  // UserPickerManager 实例
  private static instance: UserPickerManager

  constructor() {
    if (!UserPickerManager.instance) {
      this.init()
      UserPickerManager.instance = this
    }
    return UserPickerManager.instance
  }
  private init() {
    UserPickerManager.registerTheme('default', (formData : Ref<any>) => {
      return {
        template: [
          {
            key: 'mobile',
            label: '手机号',
            type: 'el-input',
            elProps: { maxlength: 11 },
            disabled:!!formData.value?.id,
            rules: [{ type: 'string', required: true, message: '手机号不能为空', trigger: 'blur' }]
          },
          {
            key: 'nickname',
            label: '昵称',
            type: 'el-input',
            elProps: { maxlength: 10 },
            rules: [{ type: 'string', required: true, message: '昵称不能为空', trigger: 'blur' }]
          },
          {
            key: 'name',
            label: '姓名',
            type: 'el-input',
            elProps: { maxlength: 10 },
            rules: [{ type: 'string', required: true, message: '请填写姓名', trigger: 'blur' }]
          },
          {
            key: 'avatar',
            label: '头像',
            type: 'upload-img',
            rules: [{ type: 'string', required: true, message: '请上传头像', trigger: 'blur' }]
          },
          { key: 'helper', label: '' }
        ],
        helper: '',
        editable: true
      }
    })
  }
}
