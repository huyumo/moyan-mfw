import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'status', label: '通用状态' })
export class StatusDict {
  @DictEntry({ label: '启用', type: 'success' })  static ENABLED  = 1
  @DictEntry({ label: '禁用', type: 'info'   })  static DISABLED = 0
}

@DictMeta({ key: 'bool', label: '布尔值' })
export class BoolDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
