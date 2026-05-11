import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'audit_module', label: '审计模块' })
export class AuditModuleDict {
  @DictEntry({ label: '认证', type: 'primary' })   static AUTH       = 'AUTH'
  @DictEntry({ label: '用户', type: 'success' })   static USER       = 'USER'
  @DictEntry({ label: '角色', type: 'warning' })   static ROLE       = 'ROLE'
  @DictEntry({ label: '权限', type: 'danger'  })   static PERMISSION = 'PERMISSION'
  @DictEntry({ label: '应用', type: 'primary' })   static APP        = 'APP'
  @DictEntry({ label: '应用类型', type: 'info' })  static APP_TYPE   = 'APP_TYPE'
  @DictEntry({ label: '成员', type: 'success' })   static MEMBER     = 'MEMBER'
  @DictEntry({ label: '系统', type: 'warning' })   static SYSTEM     = 'SYSTEM'
  @DictEntry({ label: '上传', type: 'info'    })   static UPLOAD     = 'UPLOAD'
}
