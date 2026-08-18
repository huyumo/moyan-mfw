/**
 * @fileoverview 实体 → 读侧视图映射
 * @description 统一把存储层返回的实体转换为业务层视图（extCol1~4 语义化为 extFields）
 */

import type { AccountView, TransferView } from 'moyan-mfw-extension-ledger/shared'
import { mapColumnsToExtFields, type BizExtMappings } from './ext-columns.util'

/** 交易单实体 → TransferView（extCol1~4 翻译为 extFields 语义对象） */
export function toTransferView(entity: any, bizExtMappings?: BizExtMappings): TransferView {
  if (!entity) return entity
  const { extCol1, extCol2, extCol3, extCol4, ...rest } = entity
  return {
    ...rest,
    extFields: mapColumnsToExtFields({ extCol1, extCol2, extCol3, extCol4 }, entity.bizType, bizExtMappings),
  }
}

/** 账户实体 → AccountView（字段一致，直接断言） */
export function toAccountView(entity: any): AccountView {
  return entity as AccountView
}
