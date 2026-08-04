/**
 * @fileoverview WAL（Write-Ahead Log）本地文件缓存服务
 * @description 在"内存 resultBuffer -> 60s 批量 archive -> MySQL"链路中插入本地文件兜底，
 *   解决两个问题：
 *   1. 崩溃丢数据：结果产出即 append WAL，崩溃后重启重放，零丢失
 *   2. 连接峰值：createLog 改 wal.append（写文件，0 MySQL 连接），archive 时批量落盘
 *
 * 实现策略：
 *   - WriteStream（createWriteStream）+ cork/uncork 聚合批量写入，减少 syscall
 *   - 定期 fsync（默认 100ms）覆盖进程崩溃，频率独立于写入
 *   - 每实例独立文件（wal-{executorId}.jsonl），按 executorId 隔离
 *   - archive 成功后 truncate 已落盘条目（rename + 重写未归档行）
 *   - walDir 不可写时自动降级纯内存模式（warn 日志，不阻塞启动）
 */

import { Injectable, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { createWriteStream, createReadStream, existsSync, mkdirSync, renameSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { ReadStream, WriteStream } from 'fs'
import type { ResultEntry } from '../pool/result-buffer-pool'

/** WAL 条目类型 */
export type WalEntryType = 'result' | 'log'

/** WAL 条目（与 ResultEntry 对称 + 序号 + 类型） */
export interface WalEntry {
  /** 单调递增序号（用于 truncate 定位） */
  seq: number
  /** 条目类型：result=实例执行结果, log=执行日志(RUNNING态) */
  type: WalEntryType
  /** 实例ID */
  instanceId: string
  /** 任务编码 */
  taskCode: string
  /** 任务名称 */
  taskName?: string
  /** 执行状态（TaskRunStatusDict） */
  status: number
  /** 执行结果 */
  result?: any
  /** 错误信息（序列化为 string） */
  errorMessage?: string | null
  /** 错误堆栈 */
  errorStack?: string | null
  /** 开始执行时间 */
  startedAt: string
  /** 完成时间 */
  finishedAt: string
  /** 执行实例标识 */
  executor?: string
  /** 业务实体ID */
  entityId?: string
  /** 业务数据 */
  payload?: Record<string, any>
  /** 重试次数 */
  retryCount: number
  /** 是否记录执行日志 */
  enableLog?: boolean
  /** 触发方式（1=自动 2=手动） */
  triggerType?: number
}

/**
 * 将 ResultEntry 转为可序列化的 WAL 条目（Error -> string）
 */
function toWalEntry(seq: number, type: WalEntryType, entry: Partial<ResultEntry> & { instanceId: string; status: number }): WalEntry {
  return {
    seq,
    type,
    instanceId: entry.instanceId,
    taskCode: entry.taskCode ?? '',
    taskName: entry.taskName,
    status: entry.status,
    result: entry.result ?? null,
    errorMessage: entry.error instanceof Error ? entry.error.message : (entry.error as any)?.message ?? null,
    errorStack: entry.error instanceof Error ? entry.error.stack : null,
    startedAt: (entry.startedAt ?? new Date()).toISOString(),
    finishedAt: (entry.finishedAt ?? new Date()).toISOString(),
    executor: entry.executor,
    entityId: entry.entityId,
    payload: entry.payload,
    retryCount: entry.retryCount ?? 0,
    enableLog: entry.enableLog ?? true,
    triggerType: entry.triggerType,
  }
}

/** 终态状态集（SUCCESS=2, FAILED=3, TIMEOUT=4, SKIPPED=5） */
const TERMINAL_RUN_STATUS = new Set([2, 3, 4, 5])

@Injectable()
export class WalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WalService.name)
  private readonly enabled: boolean
  private readonly walDir: string
  private readonly fsyncIntervalMs: number

  private walPath!: string
  private stream: WriteStream | null = null
  private seq = 0
  private fsyncTimer: NodeJS.Timeout | null = null
  private corked = false
  /** 降级模式：WAL 不可用时退化为纯内存（仅 resultBuffer，不写文件） */
  private degraded = false

  constructor(
    @Inject('SCHEDULER_OPTIONS') options: any = {},
  ) {
    this.enabled = options.walEnabled !== false // 默认 true
    this.walDir = options.walDir ?? join(tmpdir(), 'mfw-scheduler-wal')
    this.fsyncIntervalMs = options.walFsyncIntervalMs ?? 100
  }

  /**
   * 初始化 WAL（由 SchedulerEngineService.onModuleInit 显式调用，需要 executorId）
   */
  init(executorId: string): void {
    if (!this.enabled) {
      this.logger.log('WAL 已禁用（walEnabled=false）')
      return
    }

    try {
      // 确保目录存在
      if (!existsSync(this.walDir)) mkdirSync(this.walDir, { recursive: true })
      // 文件名含 executorId，每实例独立
      this.walPath = join(this.walDir, `wal-${executorId}.jsonl`)
      this.openStream()
      // 定期 fsync（覆盖进程崩溃）
      this.fsyncTimer = setInterval(() => this.fsync(), this.fsyncIntervalMs)
      this.logger.log(`WAL 已初始化: ${this.walPath}, fsync间隔=${this.fsyncIntervalMs}ms`)
    } catch (err) {
      this.degrade(`WAL 初始化失败: ${(err as Error).message}`)
    }
  }

  private openStream(): void {
    this.stream = createWriteStream(this.walPath, { flags: 'a', highWaterMark: 64 * 1024 })
    this.stream.on('error', (err) => {
      this.degrade(`WAL 写入流错误: ${err.message}`)
    })
  }

  /**
   * 降级为纯内存模式
   */
  private degrade(reason: string): void {
    if (this.degraded) return
    this.degraded = true
    this.enabled as any // 保持字段引用
    this.logger.warn(`${reason}，降级为纯内存模式（崩溃恢复退化为 heartbeat 孤儿判定）`)
    if (this.stream) {
      try { this.stream.destroy() } catch { /* 忽略 */ }
      this.stream = null
    }
    if (this.fsyncTimer) {
      clearInterval(this.fsyncTimer)
      this.fsyncTimer = null
    }
  }

  /**
   * 追加一条 WAL 记录
   * @description 同步写入流缓冲区（非 fsync），微秒级开销
   * @returns WAL 序号（用于关联 resultBuffer 条目，归档后截断用）；降级模式返回 0
   */
  append(type: WalEntryType, entry: Partial<ResultEntry> & { instanceId: string; status: number }): number {
    if (!this.enabled || this.degraded || !this.stream) return 0
    const seq = ++this.seq
    const walEntry = toWalEntry(seq, type, entry)
    try {
      this.stream.write(JSON.stringify(walEntry) + '\n')
      return seq
    } catch (err) {
      this.degrade(`WAL append 失败: ${(err as Error).message}`)
      return 0
    }
  }

  /**
   * 获取当前序号（供外部查询）
   */
  getCurrentSeq(): number {
    return this.seq
  }

  /**
   * 批量追加开始：cork 流，聚合写入
   */
  beginBatch(): void {
    if (!this.stream || this.corked) return
    this.stream.cork()
    this.corked = true
  }

  /**
   * 批量追加结束：uncork 流，一次性 flush
   */
  endBatch(): void {
    if (!this.stream || !this.corked) return
    this.stream.uncork()
    this.corked = false
  }

  /**
   * 强制 fsync（优雅停机时调用）
   */
  flush(): void {
    if (!this.stream || this.degraded) return
    try {
      if (this.corked) this.endBatch()
      // process.stdout 也用 WriteStream，但 WAL 的 fd 是文件
      const fd = (this.stream as any).fd
      if (typeof fd === 'number') {
        // Node.js WriteStream 的 fd 可通过 .fd 获取
        // 使用同步 fsync 确保落盘
        const { fsyncSync } = require('fs')
        fsyncSync(fd)
      }
    } catch (err) {
      this.logger.warn(`WAL flush 失败: ${(err as Error).message}`)
    }
  }

  /**
   * 定期 fsync（由定时器调用）
   */
  private fsync(): void {
    if (!this.stream || this.degraded) return
    try {
      const fd = (this.stream as any).fd
      if (typeof fd === 'number') {
        const { fsyncSync } = require('fs')
        fsyncSync(fd)
      }
    } catch {
      // fd 未就绪或其他错误，忽略（下次定时器重试）
    }
  }

  /**
   * 读取全部 WAL 条目（启动重放用）
   */
  readAll(): WalEntry[] {
    if (!this.enabled || this.degraded || !this.walPath) return []
    if (!existsSync(this.walPath)) return []
    const entries: WalEntry[] = []
    try {
      const data = require('fs').readFileSync(this.walPath, 'utf8')
      for (const line of data.split('\n')) {
        if (!line.trim()) continue
        try {
          entries.push(JSON.parse(line))
        } catch {
          // 跳过损坏行（可能最后一条写了一半）
          this.logger.warn(`WAL 跳过损坏行: ${line.slice(0, 80)}...`)
        }
      }
    } catch (err) {
      this.logger.warn(`WAL 读取失败: ${(err as Error).message}`)
    }
    return entries
  }

  /**
   * 重放 WAL（由 SchedulerEngineService.onModuleInit 调用）
   * @param replayFn 回调：传入终态 result 条目，由调用方执行 archiveWithRetry + batchCreateLogs
   * @returns 重放的终态条目数
   */
  async replay(
    replayFn: (entries: WalEntry[]) => Promise<void>,
  ): Promise<number> {
    if (!this.enabled || this.degraded) return 0
    const entries = this.readAll()
    if (entries.length === 0) return 0

    // 仅重放 type=result 且终态的条目（已完成但没归档的）
    const toReplay = entries.filter((e) => e.type === 'result' && TERMINAL_RUN_STATUS.has(e.status))
    const logCount = entries.filter((e) => e.type === 'log').length

    this.logger.log(`WAL 重放: 共 ${entries.length} 条, 终态结果 ${toReplay.length} 条待补落盘, RUNNING日志 ${logCount} 条跳过(由孤儿恢复处理)`)

    if (toReplay.length > 0) {
      try {
        await replayFn(toReplay)
        this.logger.log(`WAL 重放完成: ${toReplay.length} 条终态结果已补落盘`)
      } catch (err) {
        this.logger.error(`WAL 重放失败，保留 WAL 文件供下次重试: ${(err as Error).message}`)
        return 0 // 不 truncate，下次启动重试
      }
    }

    // 重放成功，清空 WAL
    this.truncateAll()
    // 重置 seq（WAL 已空，从头开始）
    this.seq = 0
    return toReplay.length
  }

  /**
   * 清空全部 WAL（重放成功后调用）
   */
  private truncateAll(): void {
    if (!this.stream || this.degraded) return
    try {
      this.stream.end()
      // 截断文件并重建流
      const { truncateSync } = require('fs')
      truncateSync(this.walPath, 0)
      this.openStream()
    } catch (err) {
      this.logger.warn(`WAL truncate 失败: ${(err as Error).message}`)
    }
  }

  /**
   * 归档成功后清理已落盘条目
   * @description 保留 seq > maxArchivedSeq 的条目（archive 之后新产生的）
   */
  truncateArchived(maxArchivedSeq: number): void {
    if (!this.enabled || this.degraded || !this.stream) return
    if (maxArchivedSeq <= 0) return

    try {
      // 关闭当前流
      this.stream.end()
      this.stream = null

      // 读取全部，保留 seq > maxArchivedSeq 的
      const entries = this.readAll()
      const remaining = entries.filter((e) => e.seq > maxArchivedSeq)

      // 重写文件（仅含未归档行）
      const { writeFileSync } = require('fs')
      const lines = remaining.map((e) => JSON.stringify(e)).join('\n')
      writeFileSync(this.walPath, lines + (lines ? '\n' : ''))

      // 重建流
      this.openStream()
      // seq 保持单调递增（不重置）
    } catch (err) {
      this.degrade(`WAL truncateArchived 失败: ${(err as Error).message}`)
    }
  }

  onModuleInit(): void {
    // WAL 初始化需要 executorId，由 SchedulerEngineService 显式调用 init()
  }

  onModuleDestroy(): void {
    if (this.fsyncTimer) {
      clearInterval(this.fsyncTimer)
      this.fsyncTimer = null
    }
    if (this.stream) {
      this.flush()
      try { this.stream.end() } catch { /* 忽略 */ }
      this.stream = null
    }
  }
}
