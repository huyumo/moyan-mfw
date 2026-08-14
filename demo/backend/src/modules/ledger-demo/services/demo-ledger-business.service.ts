/**
 * @fileoverview 账本业务层调用案例服务
 * @description 演示业务开发者如何消费 extension-ledger 扩展包：
 *
 * 一、业务服务入口（LedgerModule exports）：
 *   - LedgerAccountService：开户（幂等 + 初始余额同步入账 + 字段扩展校验）
 *   - LedgerTransferService：制单（预占 + 入队）、审核、冲正、重推、取消
 *   - LedgerReconcileService：对账（恒等式校验 + 增量修复）
 *
 * 二、SPI 直用（LedgerModule 已导出 5 个 SPI token）：
 *   - LEDGER_QUEUE：积压监控 length()、延迟重投
 *   - LEDGER_LOCK：业务互斥（如每日结算防重入）
 *   - LEDGER_STORAGE：报表/聚合直查（跳过服务层）
 *   - LEDGER_FIELD_EXTENSION：制单前业务侧前置校验
 *   - LEDGER_OPTIONS：读取当前装配配置
 */

import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  LedgerAccountService,
  LedgerTransferService,
  LedgerReconcileService,
  LEDGER_STORAGE,
  LEDGER_LOCK,
  LEDGER_QUEUE,
  LEDGER_FIELD_EXTENSION,
  LEDGER_OPTIONS,
  type ILedgerStorage,
  type ILedgerLock,
  type ILedgerQueue,
  type ILedgerFieldExtension,
  type LedgerModuleOptions,
  type CreateTransferInput,
  type AuditTransferInput,
} from 'moyan-mfw-extension-ledger/backend'
import { DemoLedgerNotifyListener } from '../spi/demo-ledger-notify-listener'
import { DemoLedgerLock } from '../spi/demo-ledger-lock'
import { DemoLedgerQueue } from '../spi/demo-ledger-queue'

/** 演示商家/用户固定 holder（幂等：重复 setup 命中已有账户） */
const MERCHANT_HOLDER = { holderId: 'demo-merchant-001', holderType: 'merchant', tag: 'merchant' }
const USER_HOLDER = { holderId: 'demo-user-001', holderType: 'user', tag: 'user' }

@Injectable()
export class DemoLedgerBusinessService {
  private readonly logger = new Logger(DemoLedgerBusinessService.name)

  constructor(
    private readonly accountService: LedgerAccountService,
    private readonly transferService: LedgerTransferService,
    private readonly reconcileService: LedgerReconcileService,
    private readonly notifyListener: DemoLedgerNotifyListener,
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_LOCK) private readonly lock: ILedgerLock,
    @Inject(LEDGER_QUEUE) private readonly queue: ILedgerQueue,
    @Inject(LEDGER_FIELD_EXTENSION) private readonly fieldExt: ILedgerFieldExtension,
    @Inject(LEDGER_OPTIONS) private readonly options: LedgerModuleOptions,
  ) {}

  // ── 用例1：开户（业务服务 + 字段扩展 SPI 校验） ──

  /** 初始化演示数据：商家钱包（初始 100000.00）+ 用户钱包（初始 50000.00），幂等 */
  async setup() {
    const merchant = await this.accountService.openAccount({
      ...MERCHANT_HOLDER,
      currency: 'CNY',
      initialBalance: '10000000', // 100000.00 元（最小单位分）
      extra: { merchantNo: 'M1001', merchantName: '示例商家' },
    })
    const user = await this.accountService.openAccount({
      ...USER_HOLDER,
      currency: 'CNY',
      initialBalance: '5000000', // 50000.00 元
      extra: { userName: '演示用户' },
    })
    return { merchant: this.brief(merchant), user: this.brief(user) }
  }

  /** 开户缺 merchantNo：字段扩展 SPI 校验必须抛错 */
  async setupInvalidMerchant() {
    try {
      await this.accountService.openAccount({
        holderId: 'demo-merchant-bad',
        holderType: 'merchant',
        tag: 'merchant',
        currency: 'CNY',
        extra: {}, // 缺 merchantNo / merchantName
      })
      return { ok: true, message: '未拦截（异常！）' }
    } catch (err: any) {
      return { ok: false, message: `字段扩展 SPI 已拦截: ${err?.message}` }
    }
  }

  // ── 用例2：订单支付/退款（业务服务 + 字段扩展 + notifier 联动） ──

  /** 订单支付：用户 → 商家（免审直通，异步入账；extra.orderNo 走字段校验） */
  async payOrder(orderNo: string, amount: string) {
    const from = await this.requireUserAccount()
    const to = await this.requireMerchantAccount()
    const result = await this.transferService.createTransfer(
      {
        bizRef: `demo-order-${orderNo}`,
        bizType: 'order_pay',
        fromAccount: from.id,
        toAccounts: [{ account: to.id, amount }],
        amount,
        currency: 'CNY',
        needReview: false,
        associatedOrder: orderNo,
        extra: { orderNo },
      },
      { id: 'demo-operator', text: '演示操作员' },
    )
    return { transfer: result.transfer, created: result.created }
  }

  /** 缺 orderNo 的支付：字段扩展 SPI 必须抛错（展示真实业务路径的拦截） */
  async payOrderInvalid(orderNo: string, amount: string) {
    const from = await this.requireUserAccount()
    const to = await this.requireMerchantAccount()
    try {
      await this.transferService.createTransfer(
        {
          bizRef: `demo-order-invalid-${orderNo}`,
          bizType: 'order_pay',
          fromAccount: from.id,
          toAccounts: [{ account: to.id, amount }],
          amount,
          currency: 'CNY',
          needReview: false,
          associatedOrder: orderNo,
          extra: {}, // 缺 orderNo
        },
        { id: 'demo-operator', text: '演示操作员' },
      )
      return { ok: true, message: '未拦截（异常！）' }
    } catch (err: any) {
      return { ok: false, message: `字段扩展 SPI 已拦截: ${err?.message}` }
    }
  }

  /** 订单退款：商家 → 用户（需 reason） */
  async refundOrder(orderNo: string, amount: string, reason: string) {
    const from = await this.requireMerchantAccount()
    const to = await this.requireUserAccount()
    const result = await this.transferService.createTransfer(
      {
        bizRef: `demo-refund-${orderNo}`,
        bizType: 'refund',
        fromAccount: from.id,
        toAccounts: [{ account: to.id, amount }],
        amount,
        currency: 'CNY',
        needReview: false,
        associatedOrder: orderNo,
        extra: { orderNo, reason },
      },
      { id: 'demo-operator', text: '演示操作员' },
    )
    return { transfer: result.transfer, created: result.created }
  }

  // ── 用例3：两段式审核（需审单冻结 → 审核通过入队入账） ──

  /** 创建需审支付单：资金冻结 frozen，不入队 */
  async createReviewTransfer(orderNo: string, amount: string) {
    const from = await this.requireUserAccount()
    const to = await this.requireMerchantAccount()
    const result = await this.transferService.createTransfer(
      {
        bizRef: `demo-review-${orderNo}`,
        bizType: 'order_pay',
        fromAccount: from.id,
        toAccounts: [{ account: to.id, amount }],
        amount,
        currency: 'CNY',
        needReview: true,
        associatedOrder: orderNo,
        extra: { orderNo },
      },
      { id: 'demo-operator', text: '演示操作员' },
    )
    return { transfer: result.transfer, created: result.created }
  }

  /** 审核：通过（NOT_READY->PENDING 入队）或驳回（解冻） */
  async auditTransfer(transferNo: string, approve: boolean) {
    const input: AuditTransferInput = {
      transferNo,
      auditStatus: approve ? 1 : 2,
      auditNotes: approve ? '演示审核通过' : '演示驳回',
      auditorId: 'demo-auditor',
      auditorText: '演示审核员',
    }
    const result = await this.transferService.audit(input)
    return { ...result, message: approve ? '已审核通过，交易单入队入账' : '已驳回，预占已解冻' }
  }

  // ── 用例4：LEDGER_QUEUE 直用（积压监控 / 延迟重投） ──

  /** 队列积压监控：长度 + 自定义计数器 */
  async queueStats() {
    const q = this.queue as DemoLedgerQueue
    return {
      length: await this.queue.length(),
      enqueueCount: q.enqueueCount,
      ackCount: q.ackCount,
      nackCount: q.nackCount,
      impl: q.constructor.name,
    }
  }

  /** 业务侧延迟重投：LEDGER_QUEUE.enqueue(transferNo, delayMs)（如 5s 后重试） */
  async requeueDelayed(transferNo: string, delayMs = 5000) {
    await this.queue.enqueue(transferNo, delayMs)
    return { message: `已延迟重投 ${transferNo}（${delayMs}ms 后消费，重复入账由状态机幂等拦截）`, delayMs }
  }

  // ── 用例5：LEDGER_LOCK 直用（业务互斥，如每日结算防重入） ──

  /** 业务临界区互斥：并发请求只有一个能拿到锁（另一侧 acquired=false） */
  async lockDemo(resource = 'demo:ledger:settle', holdMs = 1500) {
    const token = await this.lock.tryLock(resource, 30)
    if (!token) {
      return { acquired: false, message: `锁已被占用（互斥生效）: ${resource}` }
    }
    try {
      // 模拟业务临界区（如每日结算/出款批次）
      await new Promise((resolve) => setTimeout(resolve, holdMs))
      return { acquired: true, message: `持锁完成业务临界区: ${resource}（${holdMs}ms）` }
    } finally {
      await this.lock.unlock(resource, token)
    }
  }

  /** 锁统计（供用例查看 tryLock/unlock 调用次数） */
  lockStats() {
    const l = this.lock as DemoLedgerLock
    return {
      impl: l.constructor.name,
      acquired: l.lockAcquired,
      failed: l.lockFailed,
      released: l.lockReleased,
    }
  }

  // ── 用例6：LEDGER_STORAGE 直用（报表/聚合查询，跳过服务层） ──

  /** 账户分页（直查） */
  async queryAccounts() {
    const { items, total } = await this.storage.queryAccounts({ page: 1, pageSize: 50 })
    return { total, items: items.map((a: any) => this.brief(a)) }
  }

  /** 流水直查（按账户 + 近 30 天，单分区裁剪） */
  async queryEntries(accountId: string) {
    const { items, total } = await this.storage.queryEntries({
      accountId,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(),
      page: 1,
      pageSize: 20,
    })
    return { total, items }
  }

  // ── 用例7：LEDGER_FIELD_EXTENSION 直用（业务侧前置校验） ──

  /** 直接调用字段扩展 SPI 校验（成功/失败两种返回） */
  fieldValidate(bizType: string, extra: Record<string, unknown>) {
    try {
      this.fieldExt.validateTransferExtra(bizType, extra)
      return { ok: true, message: `校验通过 bizType=${bizType}` }
    } catch (err: any) {
      return { ok: false, message: err?.message }
    }
  }

  // ── 用例8：对账（业务服务；内部自动走 LEDGER_LOCK 互斥 + notifier diff 事件） ──

  /** 手动触发全量对账 */
  async runReconcile() {
    return this.reconcileService.runAll('demo')
  }

  // ── 用例9：多交易类型扩展字段（积分场景：充值/兑换/推广奖励/任务奖励，bizExtMappings 映射到预留索引位） ──

  /** 积分账户常量（ITG 积分币种；B 发行库初始 1 亿发行上限，C 回购池初始 0） */
  private readonly points = {
    user: { holderId: 'points-user-001', holderType: 'user', tag: 'user', currency: 'ITG' },
    issuer: { holderId: 'points-issuer', holderType: 'system', tag: 'system', currency: 'ITG' },
    recycle: { holderId: 'points-recycle', holderType: 'system', tag: 'system', currency: 'ITG' },
  }

  /** 初始化积分场景账户（幂等）：A 用户 0 / B 发行库 1 亿 / C 回购池 0 */
  async setupPoints() {
    // initialBalance 省略即默认 0（开户同步入账）
    const user = await this.accountService.openAccount({ ...this.points.user, extra: { userName: '积分用户' } })
    const issuer = await this.accountService.openAccount({ ...this.points.issuer, initialBalance: '100000000' })
    const recycle = await this.accountService.openAccount({ ...this.points.recycle })
    return {
      message: '积分场景账户就绪：A用户=0 / B发行库=1亿 / C回购池=0',
      accounts: [this.brief(user), this.brief(issuer), this.brief(recycle)],
    }
  }

  /** 充值：B 发行库 → A 用户（extFields: channel/outTradeNo） */
  async rechargePoints(bizRef: string, amount: string, channel: string, outTradeNo: string) {
    const [issuer, user] = await Promise.all([this.requirePoints('issuer'), this.requirePoints('user')])
    return this.createExtTransfer({
      bizRef: `recharge-${bizRef}`,
      bizType: 'recharge',
      fromAccount: issuer.id,
      toAccount: user.id,
      amount,
      extFields: { channel, outTradeNo },
    })
  }

  /** 兑换/消费：A 用户 → C 回购池（extFields: goodsId/storeId） */
  async exchangePoints(bizRef: string, amount: string, goodsId: string, storeId: string) {
    const [user, recycle] = await Promise.all([this.requirePoints('user'), this.requirePoints('recycle')])
    return this.createExtTransfer({
      bizRef: `exchange-${bizRef}`,
      bizType: 'exchange',
      fromAccount: user.id,
      toAccount: recycle.id,
      amount,
      extFields: { goodsId, storeId },
    })
  }

  /** 推广奖励：B 发行库 → A 用户（extFields: promoterId/campaignId/region） */
  async promoReward(bizRef: string, amount: string, promoterId: string, campaignId: string, region?: string) {
    const [issuer, user] = await Promise.all([this.requirePoints('issuer'), this.requirePoints('user')])
    const extFields: Record<string, string> = { promoterId, campaignId }
    if (region) extFields.region = region
    return this.createExtTransfer({
      bizRef: `promo-${bizRef}`,
      bizType: 'promo_reward',
      fromAccount: issuer.id,
      toAccount: user.id,
      amount,
      extFields,
    })
  }

  /** 任务奖励：B 发行库 → A 用户（extFields: taskId） */
  async taskReward(bizRef: string, amount: string, taskId: string) {
    const [issuer, user] = await Promise.all([this.requirePoints('issuer'), this.requirePoints('user')])
    return this.createExtTransfer({
      bizRef: `task-${bizRef}`,
      bizType: 'task_reward',
      fromAccount: issuer.id,
      toAccount: user.id,
      amount,
      extFields: { taskId },
    })
  }

  /** 按业务扩展字段查交易单（LEDGER_STORAGE.queryTransfers({ extFields }) 走预留索引位） */
  async queryByExtFields(bizType: string, field: string, value: string) {
    const result = await this.storage.queryTransfers({
      bizType,
      extFields: { [field]: value },
      page: 1,
      pageSize: 20,
    })
    return {
      query: `bizType=${bizType}, ${field}=${value}`,
      total: result.total,
      items: result.items.map((t: any) => ({
        transferNo: t.transferNo,
        bizType: t.bizType,
        amount: t.amount,
        extFields: t.extFields, // 预留列翻译回语义对象
      })),
    }
  }

  /** 未映射的扩展字段制单：必须报错（演示映射注册表约束；用 exchange 类型避开 extra 校验干扰） */  async createInvalidExtField() {
    const [issuer, user] = await Promise.all([this.requirePoints('issuer'), this.requirePoints('user')])
    try {
      await this.transferService.createTransfer(
        {
          bizRef: `invalid-ext-${Date.now()}`,
          bizType: 'exchange', // exchange 无 extra 校验，走 extFields 映射校验
          fromAccount: issuer.id,
          toAccounts: [{ account: user.id, amount: '100' }],
          amount: '100',
          currency: 'ITG',
          needReview: false,
          extra: {},
          extFields: { unknownField: 'x' }, // 未在 bizExtMappings.exchange 声明
        },
        { id: 'demo-operator', text: '演示操作员' },
      )
      return { ok: true, message: '未拦截（异常！）' }
    } catch (err: any) {
      return { ok: false, message: `扩展字段映射校验已拦截: ${err?.message}` }
    }
  }

  /** 制单扩展字段模板（1对1 免审 + extFields 语义键值）
   * 注：extra 同时携带扩展字段——字段扩展 SPI 校验（validateTransferExtra）与 extra 快照保持一致 */
  private async createExtTransfer(args: {
    bizRef: string
    bizType: string
    fromAccount: string
    toAccount: string
    amount: string
    extFields: Record<string, string>
  }) {
    const result = await this.transferService.createTransfer(
      {
        bizRef: args.bizRef,
        bizType: args.bizType,
        fromAccount: args.fromAccount,
        toAccounts: [{ account: args.toAccount, amount: args.amount }],
        amount: args.amount,
        currency: 'ITG',
        needReview: false,
        extra: { ...args.extFields }, // 校验可见 + 快照审计
        extFields: args.extFields, // 映射写预留索引位
      },
      { id: 'demo-operator', text: '演示操作员' },
    )
    return { transferNo: result.transfer.transferNo, bizType: args.bizType, extFields: args.extFields }
  }

  private async requirePoints(key: 'user' | 'issuer' | 'recycle') {
    const holder = this.points[key]
    const acc = await this.accountService.findAccount(holder.holderId, holder.holderType, holder.tag, holder.currency)
    if (!acc) throw new Error(`积分账户不存在（${holder.holderId}），请先调用 setup-points`)
    return acc
  }

  // ── 监听器事件（ILedgerNotifier.registerListener 调用案例的可视化） ──

  /** 动态下拉选项数据源演示：推广活动列表（供前端 registerSearchOptionLoader 拉取） */
  async listCampaigns() {
    return {
      items: [
        { id: 'C99', name: '双11大促' },
        { id: 'C88', name: '618年中促' },
        { id: 'C77', name: '新人专享' },
      ],
    }
  }

  /** 动态级联选项数据源演示：省市区树（供前端 registerSearchOptionLoader 拉取，cascader 筛选）
   * 编码用前缀兼容链（省 33 → 市 3301 → 区 330106），配合 matchMode='prefix' 选任意级均可命中 */
  async listRegions() {
    return {
      items: [
        {
          value: '33',
          label: '浙江省',
          children: [
            {
              value: '3301',
              label: '杭州市',
              children: [
                { value: '330106', label: '西湖区' },
                { value: '330108', label: '滨江区' },
              ],
            },
            {
              value: '3302',
              label: '宁波市',
              children: [{ value: '330203', label: '海曙区' }],
            },
          ],
        },
        {
          value: '44',
          label: '广东省',
          children: [
            {
              value: '4401',
              label: '广州市',
              children: [{ value: '440106', label: '天河区' }],
            },
          ],
        },
      ],
    }
  }

  /** 业务监听器收到的事件列表 */
  notifyListenerEvents() {
    return {
      listener: this.notifyListener.constructor.name,
      total: this.notifyListener.events.length,
      events: this.notifyListener.events.slice(-20),
    }
  }

  // ── 汇总 ──

  /** SPI 装配总览：5 个 SPI 实际实现类 + 当前 options */
  async overview() {
    return {
      options: {
        accountTags: this.options.accountTags,
        bizTypes: this.options.bizTypes,
        consumerEnabled: this.options.consumerEnabled ?? true,
        consumerConcurrency: this.options.consumerConcurrency ?? 10,
        maxRetry: this.options.maxRetry ?? 3,
      },
      spiImpls: {
        storage: this.storage.constructor.name,
        lock: this.lock.constructor.name,
        queue: this.queue.constructor.name,
        notifier: 'DemoLedgerNotifier（extends EventNotifier）',
        fieldExtension: this.fieldExt.constructor.name,
        accountEntity: 'DemoMerchantAccount（extends LedgerAccountBase，新增 creditLimit 列）',
      },
      queue: await this.queueStats(),
      lockStats: this.lockStats(),
      listenerEvents: this.notifyListener.events.slice(-20),
    }
  }

  // ── 内部工具 ──

  private async requireMerchantAccount() {
    const acc = await this.accountService.findAccount(MERCHANT_HOLDER.holderId, MERCHANT_HOLDER.holderType, MERCHANT_HOLDER.tag, 'CNY')
    if (!acc) throw new Error('商家账户不存在，请先调用 setup 初始化演示数据')
    return acc
  }

  private async requireUserAccount() {
    const acc = await this.accountService.findAccount(USER_HOLDER.holderId, USER_HOLDER.holderType, USER_HOLDER.tag, 'CNY')
    if (!acc) throw new Error('用户账户不存在，请先调用 setup 初始化演示数据')
    return acc
  }

  private brief(acc: any) {
    return {
      id: acc.id,
      holderId: acc.holderId,
      holderType: acc.holderType,
      tag: acc.tag,
      currency: acc.currency,
      balance: acc.balance,
      frozen: acc.frozen,
      pendingOut: acc.pendingOut,
      totalIncome: acc.totalIncome,
      totalOutcome: acc.totalOutcome,
      creditLimit: acc.creditLimit, // 实体扩展列
      extra: acc.extra,
    }
  }
}
