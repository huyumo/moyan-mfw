import 'reflect-metadata'
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

@DictMeta({ key: 'supplier_status', label: '供应商状态', module: '供应商管理' })
export class SupplierStatusDict {
  @DictEntry({ label: '待审核', type: 'warning' })  static PENDING   = 0
  @DictEntry({ label: '已通过', type: 'success' })  static APPROVED  = 1
  @DictEntry({ label: '已拒绝', type: 'danger'  })  static REJECTED  = 2
}
