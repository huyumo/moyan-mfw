/**
 * @fileoverview 字段扩展校验 SPI 接口
 * @description extra JSON 列的 schema 校验钩子；默认 DefaultFieldExtension（空校验）
 *
 * 扩展方实现本接口注入 forRoot({ fieldExtensionImpl }) 可校验业务自定义扩展字段
 */

export interface ILedgerFieldExtension {
  /**
   * 校验账户扩展字段
   * @param tag 账户标签
   * @param extra 扩展字段
   * @throws 校验失败抛错
   */
  validateAccountExtra(tag: string, extra: Record<string, unknown> | null): void

  /**
   * 校验交易单扩展字段
   * @param bizType 业务类型
   * @param extra 扩展字段
   * @throws 校验失败抛错
   */
  validateTransferExtra(bizType: string, extra: Record<string, unknown> | null): void
}
