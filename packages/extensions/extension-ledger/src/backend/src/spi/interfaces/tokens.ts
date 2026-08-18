/**
 * @fileoverview SPI 注入 token 常量与模块配置选项
 * @description 用于 NestJS 依赖注入的 token 标识（Symbol.for 全局符号，避免字符串 token 冲突）
 */

/** 存储适配器 token（全部原子 SQL 下沉） */
export const LEDGER_STORAGE = Symbol.for('MOYAN:MFW:LEDGER_STORAGE')
/** 分布式锁 token（对账/修复账户锁、扫描选主） */
export const LEDGER_LOCK = Symbol.for('MOYAN:MFW:LEDGER_LOCK')
/** 消息队列 token（制单入队/消费/ACK/延迟重试） */
export const LEDGER_QUEUE = Symbol.for('MOYAN:MFW:LEDGER_QUEUE')
/** 事件通知 token（记账完成/失败/对账差异广播） */
export const LEDGER_NOTIFIER = Symbol.for('MOYAN:MFW:LEDGER_NOTIFIER')
/** 字段扩展校验 token（extra JSON schema 校验钩子） */
export const LEDGER_FIELD_EXTENSION = Symbol.for('MOYAN:MFW:LEDGER_FIELD_EXTENSION')
/** 模块运行参数 token */
export const LEDGER_OPTIONS = Symbol.for('MOYAN:MFW:LEDGER_OPTIONS')

/** 业务类型展示元数据配置（与前端 BizTypeExtFieldMeta 结构一致，经 API 下发） */
export interface BizTypeMetaConfig {
  /** 业务类型展示名 */
  label: string
  /**
   * 扩展搜索项（key 为语义字段名，须与 bizExtMappings 键一致）
   * type: input（默认）/ select（下拉筛选）
   * options: select 静态选项；optionsSource: 动态选项来源 key（前端 registerSearchOptionLoader 注册加载器）
   */
  search?: {
    key: string
    label: string
    type?: 'input' | 'select' | 'cascader'
    options?: { value: string | number; label: string; children?: { value: string | number; label: string; children?: unknown[] }[] }[]
    optionsSource?: string
    /** cascader 选中值提交模式：last=取末级 value（默认）；join=各级 '/' 连接 */
    valueMode?: 'last' | 'join'
    /**
     * 查询匹配方式：exact=等值匹配（默认）；prefix=前缀匹配（LIKE 'value%'）
     * 级联任意级筛选（选省/市也能筛出区县数据）时用 prefix，要求上级 value 是下级 value 的前缀
     * （如 33 → 3301 → 330106；定长码 330000 非 330106 前缀，可改用 valueMode: 'join' 存全路径）
     */
    matchMode?: 'exact' | 'prefix'
  }[]
  /** 扩展列表列（从交易单 extFields 语义对象取值；width 可设置列宽） */
  columns?: { prop: string; label: string; width?: number; cp?: boolean }[]
  /**
   * 详情扩展字段渲染配置（交易单详情抽屉）；缺省回退用 search；
   * span: 2 = 独占一行（1行1列），span: 1 / 缺省 = 半行（1行2列）
   */
  detail?: { key: string; label: string; span?: 1 | 2 }[]
}

/** 审核流（提现）模板配置（LedgerWithdrawService；打款/退款等两段式审核业务改配置复用） */
export interface WithdrawModuleOptions {
  /** 审核流业务类型（默认 'withdraw'；须在 bizTypes 白名单） */
  bizType?: string
  /** 外部单号语义字段名（默认 'wxTransferNo'；须在 bizExtMappings[bizType] 声明） */
  externalNoField?: string
  /** 类型语义字段名（默认 'withdrawType'；须在 bizExtMappings[bizType] 声明） */
  typeField?: string
  /** 读侧状态文案（键 1=处理中 2=成功 3=失败；默认 {1:'处理中',2:'成功',3:'失败'}） */
  statusTexts?: Record<number, string>
}

/** 借贷记账模块配置选项 */
export interface LedgerModuleOptions {
  /** 账户实体类（继承 LedgerAccountBase；默认 DefaultLedgerAccount）。扩展字段时注入子类 */
  accountEntity?: any
  /** ILedgerStorage 实现类（默认 TypeOrmLedgerStorage；分库分表自定义扩展位） */
  storageImpl?: any
  /** ILedgerLock 实现类（默认 DbLock：MySQL GET_LOCK；可换 RedisLock） */
  lockImpl?: any
  /** ILedgerQueue 实现类（默认 InProcessQueue：仅单实例；多实例须 RedisStreamQueue） */
  queueImpl?: any
  /** ILedgerNotifier 实现类（默认 EventNotifier：进程内；可换 RedisNotifier Pub/Sub） */
  notifierImpl?: any
  /** ILedgerFieldExtension 实现类（默认 DefaultFieldExtension：空校验） */
  fieldExtensionImpl?: any

  /**
   * 业务扩展字段 → 预留索引位映射（bizType 维度）
   * @example
   *   bizExtMappings: {
   *     recharge:     { channel: 'extCol1', outTradeNo: 'extCol2' },
   *     promo_reward: { promoterId: 'extCol1', campaignId: 'extCol2' },
   *   }
   * 制单传 CreateTransferInput.extFields（语义键值）时按映射写入预留列（extCol1~4），
   * 查询 queryTransfers({ extFields }) 按索引等值筛选；未映射字段制单报错
   */
  bizExtMappings?: Record<string, Record<string, string>>

  /**
   * 业务类型展示元数据（经 GET /api/ext/ledger/biz-types 下发前端）
   * 驱动前端交易单列表动态列/搜索项、制单表单动态字段、交易单详情扩展字段显示名；
   * 字段键（search.key / columns.prop）须与 bizExtMappings 一致
   * @example
   *   bizTypeMetas: {
   *     recharge: {
   *       label: '充值',
   *       search: [{ key: 'channel', label: '渠道' }],
   *       columns: [{ prop: 'channel', label: '渠道', width: 100 }],
   *     },
   *   }
   */
  bizTypeMetas?: Record<string, BizTypeMetaConfig>

  /** 注册的账户标签白名单（未注册的 tag 制单时拒绝；变更需重启） */
  accountTags?: string[]
  /** 注册的业务类型白名单（未注册的 bizType 制单时拒绝） */
  bizTypes?: string[]

  /** 是否启动消费者（默认 true；纯 API 模式可关） */
  consumerEnabled?: boolean
  /** 消费信号量并发上限（默认 10） */
  consumerConcurrency?: number
  /** 最大重试次数（默认 3） */
  maxRetry?: number
  /** 退避基准毫秒（默认 1000，指数退避 backoff * 2^retryCount） */
  retryBackoffMs?: number

  /** 兜底扫描是否启用（默认 true；可靠性关键路径，关闭需 README 警告） */
  scavengeEnabled?: boolean
  /** 兜底扫描周期毫秒（默认 30000） */
  scavengeIntervalMs?: number
  /** 孤儿单超时毫秒（POSTING 超时重置，默认 600000=10min，须 ≥ 入账事务 p99） */
  orphanTimeoutMs?: number
  /** 入队超时阈值毫秒（PENDING 超时补发，默认 120000=2min） */
  enqueueTimeoutMs?: number
  /** 同单重推最小间隔毫秒（last_push_at 节流，默认 300000=5min） */
  repushThrottleMs?: number

  /** 在线表活跃窗口天数（归档默认 cutoff = now - activeWindowDays，默认 90） */
  activeWindowDays?: number
  /** 归档每批行数（默认 1000） */
  archiveBatchSize?: number

  /** 最大单笔收款方数量（默认 100） */
  maxTargetsPerTransfer?: number
  /** 单笔金额上限（最小单位，默认 1e15） */
  maxAmountPerTransfer?: string

  /** 审核流模板配置（LedgerWithdrawService；不配则使用默认值） */
  withdraw?: WithdrawModuleOptions
}
