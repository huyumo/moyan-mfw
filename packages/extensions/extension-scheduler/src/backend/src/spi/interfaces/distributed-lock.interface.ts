/**
 * @fileoverview 分布式锁 SPI 接口
 * @description 定义多实例执行互斥契约
 */

/**
 * 分布式锁 SPI
 * @description 默认实现为 DbLock（batchClaim 的原子 UPDATE 已隐含互斥）
 * 可替换为 RedisLock（基于 SET NX EX + Lua 比较删除）
 */
export interface IDistributedLock {
  /**
   * 尝试获取锁
   * @param resource 锁资源标识
   * @param ttlSeconds 锁存活时间（秒）
   * @returns 成功返回 token，失败返回 null
   */
  tryLock(resource: string, ttlSeconds: number): Promise<string | null>

  /**
   * 释放锁
   * @param resource 锁资源标识
   * @param token 获取锁时返回的 token
   * @returns 是否释放成功
   */
  unlock(resource: string, token: string): Promise<boolean>
}
