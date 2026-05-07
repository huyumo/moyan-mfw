import 'reflect-metadata'
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'gender', label: '性别', module: '用户管理' })
export class GenderDict {
  @DictEntry({ label: '未知', type: 'info'    })  static UNKNOWN = 0
  @DictEntry({ label: '男',   type: 'primary' })  static MALE    = 1
  @DictEntry({ label: '女',   type: 'danger'  })  static FEMALE  = 2
}

@DictMeta({ key: 'developer', label: '开发者', module: '用户管理' })
export class DeveloperDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
