/**
 * @fileoverview 消息队列 SPI 接口
 * @description 默认 InProcessQueue（进程内，仅单实例）；可换 RedisStreamQueue（消费组+XAUTOCLAIM）
 *
 * 消息只含 transferNo（DB 是真相源），消费时从 DB 加载交易单
 * 接口形状兼容未来 RabbitMQ/Kafka 实现（同 scheduler F2/F3 预留模式）
 *
 * XACK 协议（评审 A2🔴2）：
 *   - 所有不处理路径（skip/已 POSTED/他人处理中/FAILED/不存在）一律 XACK
 *   - 失败路径：先 XACK 原消息再 ZADD 延迟队列（防 PEL 影子消息风暴）
 */

/** 队列消息处理器 */
export type QueueMessageHandler = (transferNo: string, messageId: string) => Promise<void>

export interface ILedgerQueue {
  /**
   * 入队
   * @param transferNo 交易单号
   * @param delayMs 延迟毫秒（退避重试用，0=立即）
   */
  enqueue(transferNo: string, delayMs?: number): Promise<void>

  /**
   * 启动消费者
   * @param consumerId 消费者标识（实例级，如 hostname-pid-random）
   * @param concurrency 并发上限
   * @param handler 消息处理回调（异常由调用方分类处理）
   */
  startConsumer(consumerId: string, concurrency: number, handler: QueueMessageHandler): Promise<void>

  /** 停止消费者（优雅停机：停止拉取，已处理的消息完成） */
  stopConsumer(): Promise<void>

  /**
   * 确认消息处理完成（XACK）
   * @param messageId 消息 ID（Redis Stream 条目 ID；InProcessQueue 可为 transferNo）
   */
  ack(messageId: string): Promise<void>

  /**
   * 消息处理失败的重试入队（先 XACK 原消息，再延迟重入队）
   * @param messageId 原消息 ID
   * @param transferNo 交易单号
   * @param delayMs 延迟毫秒
   */
  nackAndRequeue(messageId: string, transferNo: string, delayMs: number): Promise<void>

  /** 队列长度（积压监控） */
  length(): Promise<number>
}
