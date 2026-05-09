import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'multi_app_enabled', label: '是否支持多应用，用户是否可以成为当前应用类型的多个应用实例的成员' })
export class MultiAppEnabledDict {
  @DictEntry({ label: '支持', type: 'success' })  static YES = 1
  @DictEntry({ label: '不支持', type: 'info'   })  static NO  = 0
}
