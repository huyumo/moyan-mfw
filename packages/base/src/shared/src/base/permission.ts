import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'permission_type', label: '权限类型' })
export class PermissionTypeDict {
  @DictEntry({ label: '平台权限', type: 'primary' })  static PC     = 'PC'
  @DictEntry({ label: '普通权限', type: 'success' })  static NORMAL = 'NORMAL'
}

@DictMeta({ key: 'node_type', label: '节点类型' })
export class NodeTypeDict {
  @DictEntry({ label: '菜单', type: 'primary' })  static MENU = 'MENU'
  @DictEntry({ label: '页面', type: 'success' })  static PAGE = 'PAGE'
  @DictEntry({ label: '标签', type: 'warning' })  static TAG  = 'TAG'
}

@DictMeta({ key: 'show_mode', label: '显示模式' })
export class ShowModeDict {
  @DictEntry({ label: '正常', type: 'success' })  static NORMAL = 'NORMAL'
  @DictEntry({ label: '开发者模式', type: 'warning' })  static DEV   = 'DEV'
}

@DictMeta({ key: 'is_auto_sync', label: '是否自动同步' })
export class IsAutoSyncDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}

@DictMeta({ key: 'is_visible', label: '是否可见' })
export class IsVisibleDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}

@DictMeta({ key: 'is_cache', label: '是否缓存' })
export class IsCacheDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
