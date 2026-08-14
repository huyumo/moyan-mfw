/**
 * @fileoverview DefaultFieldExtension - ILedgerFieldExtension 默认实现（空校验）
 * @description 扩展方实现本接口注入 forRoot({ fieldExtensionImpl }) 可校验业务自定义扩展字段
 */

import { Injectable } from '@nestjs/common'
import type { ILedgerFieldExtension } from '../interfaces'

@Injectable()
export class DefaultFieldExtension implements ILedgerFieldExtension {
  validateAccountExtra(_tag: string, _extra: Record<string, unknown> | null): void {
    // 默认不校验
  }

  validateTransferExtra(_bizType: string, _extra: Record<string, unknown> | null): void {
    // 默认不校验
  }
}
