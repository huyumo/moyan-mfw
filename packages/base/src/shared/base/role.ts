import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'is_builtin', label: '是否内置' })
export class IsBuiltinDict {
  @DictEntry({ label: '内置', type: 'success' })  static YES = 1
  @DictEntry({ label: '非内置', type: 'info'   })  static NO  = 0
}

@DictMeta({ key: 'is_owner', label: '是否拥有者' })
export class IsOwnerDict {
  @DictEntry({ label: '拥有者', type: 'success' })  static YES = 1
  @DictEntry({ label: '非拥有者', type: 'info'   })  static NO  = 0
}
