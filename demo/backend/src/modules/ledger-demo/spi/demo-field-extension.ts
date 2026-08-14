/**
 * @fileoverview 账本字段扩展 SPI 演示实现（ILedgerFieldExtension 替换位）
 * @description 业务层自定义 extra JSON 校验规则，通过 forRoot({ fieldExtensionImpl }) 替换默认空校验。
 *
 * 用例规则（供 demo-ledger-spi.controller 触发）：
 *   - 账户：tag=merchant 必须携带 merchantNo/merchantName；tag=user 必须携带 userName
 *   - 交易单：bizType=order_pay 必须携带 orderNo；refund 必须携带 orderNo+reason；recharge 校验 channel 枚举
 */

import { Injectable } from '@nestjs/common'
import type { ILedgerFieldExtension } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class DemoFieldExtension implements ILedgerFieldExtension {
  validateAccountExtra(tag: string, extra: Record<string, unknown> | null): void {
    const map = extra ?? {}
    if (tag === 'merchant') {
      if (!map.merchantNo) throw new Error('商家账户扩展字段校验失败: merchantNo 必填')
      if (!map.merchantName) throw new Error('商家账户扩展字段校验失败: merchantName 必填')
    }
    if (tag === 'user' && !map.userName) {
      throw new Error('用户账户扩展字段校验失败: userName 必填')
    }
  }

  validateTransferExtra(bizType: string, extra: Record<string, unknown> | null): void {
    const map = extra ?? {}
    if (bizType === 'order_pay' && !map.orderNo) {
      throw new Error('交易单扩展字段校验失败: orderNo 必填（bizType=order_pay）')
    }
    if (bizType === 'refund') {
      if (!map.orderNo) throw new Error('交易单扩展字段校验失败: orderNo 必填（bizType=refund）')
      if (!map.reason) throw new Error('交易单扩展字段校验失败: reason 必填（bizType=refund）')
    }
    if (bizType === 'recharge') {
      const channel = map.channel
      if (!channel || !['wechat', 'alipay', 'bank'].includes(String(channel))) {
        throw new Error('交易单扩展字段校验失败: channel 必填且须为 wechat/alipay/bank（bizType=recharge）')
      }
    }
  }
}
