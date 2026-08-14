/**
 * @fileoverview 分布式锁 SPI 接口
 * @description 默认 DbLock（MySQL GET_LOCK）；可换 RedisLock（包装 base IRedisOnlyService.tryLock）
 *
 * 用途：对账/修复账户级锁、兜底扫描选主
 * 注意（评审 A4🔴2）：scheduler 的 DbLock 是 no-op 占位（互斥靠业务 CAS），
 *   ledger 无此业务 CAS，必须实现真正的锁（GET_LOCK 或 Redis SET NX）
 */

export interface ILedgerLock {
  /**
   * 尝试加锁
   * @param resource 锁资源 key
   * @param ttlSeconds 锁租约秒数
   * @returns 成功返回 token（释放用）；失败返回 null
   */
  tryLock(resource: string, ttlSeconds: number): Promise<string | null>

  /**
   * 释放锁（令牌校验）
   * @returns true=释放成功；false=令牌不匹配或已过期
   */
  unlock(resource: string, token: string): Promise<boolean>
}
