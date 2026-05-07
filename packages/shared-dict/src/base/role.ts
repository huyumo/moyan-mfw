import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'is_builtin', label: '是否内置' })
export class IsBuiltinDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}

@DictMeta({ key: 'is_owner', label: '是否拥有者' })
export class IsOwnerDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
