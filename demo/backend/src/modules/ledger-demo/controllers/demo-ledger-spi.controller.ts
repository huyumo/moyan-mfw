/**
 * @fileoverview 借贷记账 SPI 调用用例控制器
 * @description 完整覆盖 extension-ledger 全部 5 个 SPI 的调用/替换案例 + 业务服务 + 实体扩展
 *
 * 测试方式（先登录获取 token）：
 *   curl -X POST http://localhost:3000/api/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"username":"admin","password":"Admin@123"}'
 *
 *   # 用例0：SPI 装配总览（5 个 SPI 实际实现类 + options）
 *   curl http://localhost:3000/api/demo/ledger-spi/overview \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 用例1：开户（业务服务 LedgerAccountService + ILedgerFieldExtension 校验）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/setup \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{}'
 *
 *   # 用例1b：开户缺 merchantNo -> 字段扩展 SPI 拦截
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/setup-invalid-merchant \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{}'
 *
 *   # 用例2：订单支付（LedgerTransferService + extra.orderNo 校验 + 记账完成事件）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/pay \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"orderNo":"A1001","amount":"2000"}'
 *
 *   # 用例2b：缺 orderNo 的支付 -> 字段扩展 SPI 拦截（真实业务路径）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/pay-invalid \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"orderNo":"A1002","amount":"1000"}'
 *
 *   # 用例2c：退款（bizType=refund，需 reason）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/refund \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"orderNo":"A1001","amount":"500","reason":"七天无理由"}'
 *
 *   # 用例3：两段式审核（需审单冻结 -> 审核通过入队入账）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/review-transfer \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"orderNo":"A2001","amount":"3000"}'
 *   # 取上一步返回的 transferNo：
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/audit \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"transferNo":"<transferNo>","approve":true}'
 *
 *   # 用例3c：审核带按账户备注（端到端：需审单 -> 审核通过带 accountNotes -> 入账 -> 两账户流水显示各自派生的 note/noteExtra）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/audit-with-notes \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"orderNo":"A2002","amount":"2000"}'
 *   # 也可对已存在需审单审核时手动传 accountNotes：
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/audit \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"transferNo":"<transferNo>","approve":true,"accountNotes":{"<fromAccountId>":{"note":"转出方备注"},"<toAccountId>":{"note":"收款方备注","noteExtra":{"k":"v"}}}}'
 *
 *   # 用例3d：全额冲正（端到端：制单入账 -> 冲正 -> 验证制单条数/累计转入转出不变、冲正腿落分录、to 侧守卫）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/reverse \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"orderNo":"A2003","amount":"1500"}'
 *
 *   # 用例4：LEDGER_QUEUE 直用（积压监控 length + 计数）
 *   curl http://localhost:3000/api/demo/ledger-spi/queue-stats \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 用例5：LEDGER_LOCK 直用（业务互斥；并发两个请求只有一个 acquired=true）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/lock-demo \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{}'
 *   curl http://localhost:3000/api/demo/ledger-spi/lock-stats \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 用例6：LEDGER_STORAGE 直用（账户/流水分页查询）
 *   curl http://localhost:3000/api/demo/ledger-spi/accounts \
 *     -H "Authorization: Bearer <token>"
 *   curl "http://localhost:3000/api/demo/ledger-spi/entries/<accountId>" \
 *     -H "Authorization: Bearer <token>"
 *   # 用例6b：流水分页带 bizType 过滤（SPI 契约返回富化分录：bizType/note/noteExtra）
 *   curl "http://localhost:3000/api/demo/ledger-spi/entries/<accountId>?bizType=order_pay" \
 *     -H "Authorization: Bearer <token>"
 *   # 用例6c：to 侧查交易单（按收款方账户，TransferQueryFilter.toAccountId；分录表即 to 侧索引）
 *   curl "http://localhost:3000/api/demo/ledger-spi/transfers/to/<accountId>" \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 用例7：LEDGER_FIELD_EXTENSION 直用（业务侧前置校验，成功/失败两种）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/field-validate \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"bizType":"order_pay","extra":{"orderNo":"A3001"}}'
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/field-validate \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"bizType":"order_pay","extra":{}}'
 *
 *   # 用例8：对账（LedgerReconcileService；内部走 LEDGER_LOCK + 差异事件通知）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/reconcile \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{}'
 *
 *   # 查看监听器收到的事件（ILedgerNotifier.registerListener 调用案例）
 *   curl http://localhost:3000/api/demo/ledger-spi/notifier-events \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 用例9：提现审核流模板（LedgerWithdrawService：预占冻结 -> 审核通过/驳回 -> 定位/分页/汇总）
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/withdraw-reserve \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"bizRef":"W1001","amount":"3000","wxTransferNo":"20260818001","withdrawType":"balance"}'
 *   curl -X POST http://localhost:3000/api/demo/ledger-spi/withdraw-approve \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"bizRef":"W1001"}'
 *   curl "http://localhost:3000/api/demo/ledger-spi/withdraw-by-no?no=20260818001" \
 *     -H "Authorization: Bearer <token>"
 *   curl "http://localhost:3000/api/demo/ledger-spi/withdraw-list?status=2" \
 *     -H "Authorization: Bearer <token>"
 *   curl http://localhost:3000/api/demo/ledger-spi/withdraw-sum \
 *     -H "Authorization: Bearer <token>"
 */

import {
  Controller, Post, Body, Get, Param, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsBoolean, IsInt, Min, IsObject, IsOptional } from 'class-validator'
import { SkipPermission } from 'moyan-mfw-base/backend'
import { DemoLedgerBusinessService } from '../services/demo-ledger-business.service'

// ── DTO ──

class OrderTransferDto {
  @ApiProperty({ description: '业务订单号（幂等键一部分）' })
  @IsNotEmpty()
  @IsString()
  orderNo: string

  @ApiProperty({ description: '金额（最小单位字符串，如 2000=20.00 元）' })
  @IsNotEmpty()
  @IsString()
  amount: string
}

class RefundDto extends OrderTransferDto {
  @ApiProperty({ description: '退款原因（bizType=refund 字段扩展必填）' })
  @IsNotEmpty()
  @IsString()
  reason: string
}

/** 压测资金池开户 DTO */
class StressPoolDto {
  @ApiProperty({ description: '资金池账户数量（≤200）' })
  @IsInt()
  @Min(1)
  size: number

  @ApiProperty({ description: '每户初始余额（最小单位字符串）' })
  @IsNotEmpty()
  @IsString()
  initialBalance: string
}

/** 指定转出账户支付 DTO（压测多账户并发分布） */
class PayFromDto {
  @ApiProperty({ description: '转出账户ID' })
  @IsNotEmpty()
  @IsString()
  accountId: string

  @ApiProperty({ description: '业务订单号（幂等键一部分）' })
  @IsNotEmpty()
  @IsString()
  orderNo: string

  @ApiProperty({ description: '金额（最小单位字符串）' })
  @IsNotEmpty()
  @IsString()
  amount: string
}

class AuditDto {
  @ApiProperty({ description: '交易单号' })
  @IsNotEmpty()
  @IsString()
  transferNo: string

  @ApiProperty({ description: 'true=通过 false=驳回' })
  @IsBoolean()
  approve: boolean

  @ApiProperty({ description: '按交易相关账户分别编写的审核备注（accountId -> { note, noteExtra }，可选）' })
  @IsOptional()
  @IsObject()
  accountNotes?: Record<string, { note?: string; noteExtra?: Record<string, unknown> }>
}

class RequeueDto {
  @ApiProperty({ description: '交易单号' })
  @IsNotEmpty()
  @IsString()
  transferNo: string

  @ApiProperty({ description: '延迟毫秒（默认 5000）', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  delayMs?: number
}

class FieldValidateDto {
  @ApiProperty({ description: '业务类型（order_pay/refund/recharge）' })
  @IsNotEmpty()
  @IsString()
  bizType: string

  @ApiProperty({ description: '扩展字段（extra JSON）', required: false })
  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>
}

/** 提现审核流模板 DTO */
class WithdrawReserveDto {
  @ApiProperty({ description: '提现单 ID（幂等键）' })
  @IsNotEmpty()
  @IsString()
  bizRef: string

  @ApiProperty({ description: '金额（最小单位字符串）' })
  @IsNotEmpty()
  @IsString()
  amount: string

  @ApiProperty({ description: '微信转账单号（写入 extCol1）' })
  @IsNotEmpty()
  @IsString()
  wxTransferNo: string

  @ApiProperty({ description: '提现类型（写入 extCol2；默认 balance）', required: false })
  @IsOptional()
  @IsString()
  withdrawType?: string
}

class WithdrawRefDto {
  @ApiProperty({ description: '提现单 ID（bizRef）' })
  @IsNotEmpty()
  @IsString()
  bizRef: string
}

class WithdrawRejectDto extends WithdrawRefDto {
  @ApiProperty({ description: '驳回原因' })
  @IsNotEmpty()
  @IsString()
  reason: string
}

/** 积分场景制单 DTO（多交易类型扩展字段） */
class PointsTransferDto {
  @ApiProperty({ description: '业务幂等键（同键重复制单返回已有单）' })
  @IsNotEmpty()
  @IsString()
  bizRef: string

  @ApiProperty({ description: '积分数量（ITG 整数）' })
  @IsNotEmpty()
  @IsString()
  amount: string
}

class RechargePointsDto extends PointsTransferDto {
  @ApiProperty({ description: '充值渠道（wechat/alipay/bank）' })
  @IsNotEmpty()
  @IsString()
  channel: string

  @ApiProperty({ description: '外部支付单号' })
  @IsNotEmpty()
  @IsString()
  outTradeNo: string
}

class ExchangePointsDto extends PointsTransferDto {
  @ApiProperty({ description: '商品ID' })
  @IsNotEmpty()
  @IsString()
  goodsId: string

  @ApiProperty({ description: '门店ID' })
  @IsNotEmpty()
  @IsString()
  storeId: string
}

class PromoRewardDto extends PointsTransferDto {
  @ApiProperty({ description: '推广人ID' })
  @IsNotEmpty()
  @IsString()
  promoterId: string

  @ApiProperty({ description: '活动ID' })
  @IsNotEmpty()
  @IsString()
  campaignId: string

  @ApiProperty({ description: '推广区域（省市区 code，可选；级联筛选）', required: false })
  @IsOptional()
  @IsString()
  region?: string
}

class TaskRewardDto extends PointsTransferDto {
  @ApiProperty({ description: '任务ID' })
  @IsNotEmpty()
  @IsString()
  taskId: string
}

class ExtQueryDto {
  @ApiProperty({ description: '业务类型' })
  @IsNotEmpty()
  @IsString()
  bizType: string

  @ApiProperty({ description: '扩展字段名（如 promoterId/channel/goodsId/taskId）' })
  @IsNotEmpty()
  @IsString()
  field: string

  @ApiProperty({ description: '扩展字段值' })
  @IsNotEmpty()
  @IsString()
  value: string
}

@ApiTags('ledger-spi', '借贷记账SPI用例')
@ApiBearerAuth('Authorization')
@Controller('demo/ledger-spi')
export class DemoLedgerSpiController {
  constructor(private readonly demo: DemoLedgerBusinessService) {}

  /** 用例0：SPI 装配总览 */
  @Get('overview')
  @ApiOperation({ summary: 'SPI 装配总览', description: '5 个 SPI 实际实现类 + 当前 options + 队列/锁/监听器统计' })
  @SkipPermission()
  overview() {
    return this.demo.overview()
  }

  /** 用例1：开户（幂等） */
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '初始化演示账户', description: '商家钱包 + 用户钱包开户（初始余额同步入账；extra 走字段扩展校验）' })
  setup() {
    return this.demo.setup()
  }

  /** 用例1b：开户缺 merchantNo 被字段扩展拦截 */
  @Post('setup-invalid-merchant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '开户缺扩展字段（拦截演示）', description: 'tag=merchant 缺 merchantNo/merchantName 时 ILedgerFieldExtension 抛错' })
  setupInvalidMerchant() {
    return this.demo.setupInvalidMerchant()
  }

  /** 用例2：订单支付 */
  @Post('pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '订单支付', description: '用户→商家免审直通；extra.orderNo 字段校验；入账完成后监听器收到 posted 事件' })
  pay(@Body() dto: OrderTransferDto) {
    return this.demo.payOrder(dto.orderNo, dto.amount)
  }

  /** 用例2b：缺 orderNo 支付被字段扩展拦截 */
  @Post('pay-invalid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '缺 orderNo 支付（拦截演示）', description: 'bizType=order_pay 缺 orderNo 时真实业务路径被 ILedgerFieldExtension 拦截' })
  payInvalid(@Body() dto: OrderTransferDto) {
    return this.demo.payOrderInvalid(dto.orderNo, dto.amount)
  }

  /** 压测：打开资金池账户（tag=stress，每户初始余额 initialBalance） */
  @Post('stress-pool')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '压测资金池开户', description: '打开 N 个资金池账户（tag=stress），每户初始余额 initialBalance（单边开户入账）' })
  stressPool(@Body() dto: StressPoolDto) {
    if (dto.size > 200) throw new Error('压测资金池账户数不能超过 200')
    return this.demo.openStressPool(dto.size, dto.initialBalance)
  }

  /** 压测：指定转出账户 → 商家（多账户并发分布） */
  @Post('pay-from')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '指定转出账户支付（压测）', description: '任意账户 → 商家免审直通，用于多账户并发分布压测' })
  payFrom(@Body() dto: PayFromDto) {
    return this.demo.payFrom(dto.accountId, dto.orderNo, dto.amount)
  }

  /** 用例2c：退款 */
  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '订单退款', description: '商家→用户；bizType=refund 需 extra.orderNo + reason' })
  refund(@Body() dto: RefundDto) {
    return this.demo.refundOrder(dto.orderNo, dto.amount, dto.reason)
  }

  /** 用例3：需审单 */
  @Post('review-transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建需审支付单', description: '资金冻结 frozen 待审，不入队' })
  createReview(@Body() dto: OrderTransferDto) {
    return this.demo.createReviewTransfer(dto.orderNo, dto.amount)
  }

  /** 用例3b：审核 */
  @Post('audit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '审核需审单', description: '通过：NOT_READY->PENDING 入队入账；驳回：解冻终态；可带按账户备注 accountNotes（写 transfer.accountNotes 专用列）' })
  audit(@Body() dto: AuditDto) {
    return this.demo.auditTransfer(dto.transferNo, dto.approve, dto.accountNotes)
  }

  /** 用例3c：审核带按账户备注（端到端：需审单 -> 审核通过带 accountNotes -> 入账 -> 两账户流水显示各自派生的 note/noteExtra） */
  @Post('audit-with-notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '审核带按账户备注（端到端）', description: '创建需审单 -> 审核通过写 accountNotes -> 入账后查询两账户流水，展示按账户派生的 note/noteExtra' })
  auditWithNotes(@Body() dto: OrderTransferDto) {
    return this.demo.demoAuditWithAccountNotes(dto.orderNo, dto.amount)
  }

  /** 用例3d：全额冲正（端到端：制单入账 -> 冲正 -> 验证制单条数/累计转入转出不变、冲正腿落分录、to 侧守卫） */
  @Post('reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '全额冲正（端到端）', description: '制单入账 -> 全额冲正 -> 返回冲正记录 + 断言（制单条数/累计转入转出不变、冲正腿 isReversal=1、to 侧无误命中）' })
  reverse(@Body() dto: OrderTransferDto) {
    return this.demo.demoReverse(dto.orderNo, dto.amount)
  }

  /** 用例4：LEDGER_QUEUE 直用 */
  @Get('queue-stats')
  @ApiOperation({ summary: '队列积压监控', description: 'LEDGER_QUEUE.length() + 自定义计数器（queueImpl 替换位 DemoLedgerQueue）' })
  @SkipPermission()
  queueStats() {
    return this.demo.queueStats()
  }

  /** 用例4b：延迟重投 */
  @Post('requeue-delayed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '业务侧延迟重投', description: 'LEDGER_QUEUE.enqueue(transferNo, delayMs)；重复入账由状态机幂等拦截' })
  requeueDelayed(@Body() dto: RequeueDto) {
    return this.demo.requeueDelayed(dto.transferNo, dto.delayMs)
  }

  /** 用例5：LEDGER_LOCK 直用 */
  @Post('lock-demo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '锁互斥演示', description: '业务临界区 tryLock/unlock；并发第二个请求 acquired=false（防重入）' })
  lockDemo() {
    return this.demo.lockDemo()
  }

  @Get('lock-stats')
  @ApiOperation({ summary: '锁统计', description: 'tryLock/unlock 调用计数（lockImpl 替换位 DemoLedgerLock）' })
  @SkipPermission()
  lockStats() {
    return this.demo.lockStats()
  }

  /** 用例6：LEDGER_STORAGE 直用 */
  @Get('accounts')
  @ApiOperation({ summary: '账户分页直查', description: 'LEDGER_STORAGE.queryAccounts（跳过服务层，报表/聚合场景）' })
  @SkipPermission()
  queryAccounts() {
    return this.demo.queryAccounts()
  }

  @Get('entries/:accountId')
  @ApiOperation({ summary: '流水分页直查', description: 'LEDGER_STORAGE.queryEntries（按账户 + 近 30 天，单分区裁剪）；可选 bizType 过滤，返回富化分录（bizType/note/noteExtra）' })
  @SkipPermission()
  queryEntries(@Param('accountId') accountId: string, @Query('bizType') bizType?: string) {
    return this.demo.queryEntries(accountId, bizType)
  }

  /** 用例6b：to 侧查交易单（SPI 新增能力 TransferQueryFilter.toAccountId） */
  @Get('transfers/to/:accountId')
  @ApiOperation({ summary: 'to 侧查交易单', description: '按收款方账户查交易单（toAccountId；分录表即 to 侧索引，任一收款方命中即返回）' })
  @SkipPermission()
  queryByToAccount(@Param('accountId') accountId: string) {
    return this.demo.queryByToAccount(accountId)
  }

  /** 用例7：LEDGER_FIELD_EXTENSION 直用 */
  @Post('field-validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '字段扩展前置校验', description: '直接调用 ILedgerFieldExtension.validateTransferExtra（成功/失败两种返回）' })
  fieldValidate(@Body() dto: FieldValidateDto) {
    return this.demo.fieldValidate(dto.bizType, dto.extra ?? {})
  }

  /** 用例8：对账 */
  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动全量对账', description: 'LedgerReconcileService.runAll（内部自动走 LEDGER_LOCK 互斥；有差异时通知 diff 事件）' })
  reconcile() {
    return this.demo.runReconcile()
  }

  /** 监听器事件 */
  @Get('notifier-events')
  @ApiOperation({ summary: '监听器事件', description: 'ILedgerNotifier.registerListener 调用案例：业务监听器收到的记账完成/失败/对账差异事件' })
  @SkipPermission()
  notifierEvents() {
    return this.demo.notifyListenerEvents()
  }

  // ── 用例9：多交易类型扩展字段（积分场景，bizExtMappings 映射到预留索引位） ──

  /** 初始化积分场景账户：A 用户 0 / B 发行库 1 亿 / C 回购池 0 */
  @Post('setup-points')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '初始化积分场景账户', description: 'A用户=0 / B发行库=1亿(发行上限) / C回购池=0，币种 ITG' })
  setupPoints() {
    return this.demo.setupPoints()
  }

  /** 充值：B → A（extFields: channel/outTradeNo） */
  @Post('recharge-points')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '积分充值', description: 'B发行库 → A用户；扩展字段 channel/outTradeNo 写入预留索引位' })
  recharge(@Body() dto: RechargePointsDto) {
    return this.demo.rechargePoints(dto.bizRef, dto.amount, dto.channel, dto.outTradeNo)
  }

  /** 兑换/消费：A → C（extFields: goodsId/storeId） */
  @Post('exchange-points')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '积分兑换(消费)', description: 'A用户 → C回购池；扩展字段 goodsId/storeId 写入预留索引位' })
  exchange(@Body() dto: ExchangePointsDto) {
    return this.demo.exchangePoints(dto.bizRef, dto.amount, dto.goodsId, dto.storeId)
  }

  /** 推广奖励：B → A（extFields: promoterId/campaignId/region） */
  @Post('promo-reward')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '推广奖励', description: 'B发行库 → A用户；扩展字段 promoterId/campaignId/region 写入预留索引位' })
  promoReward(@Body() dto: PromoRewardDto) {
    return this.demo.promoReward(dto.bizRef, dto.amount, dto.promoterId, dto.campaignId, dto.region)
  }

  /** 任务奖励：B → A（extFields: taskId） */
  @Post('task-reward')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '任务奖励', description: 'B发行库 → A用户；扩展字段 taskId 写入预留索引位' })
  taskReward(@Body() dto: TaskRewardDto) {
    return this.demo.taskReward(dto.bizRef, dto.amount, dto.taskId)
  }

  /** 按业务扩展字段查交易单（走预留索引位） */
  @Get('query-ext')
  @ApiOperation({ summary: '按扩展字段查交易单', description: 'LEDGER_STORAGE.queryTransfers({ bizType, extFields }) 走预留索引等值筛选' })
  @SkipPermission()
  queryExt(@Query() dto: ExtQueryDto) {
    return this.demo.queryByExtFields(dto.bizType, dto.field, dto.value)
  }

  /** 未映射扩展字段制单：必须报错 */
  @Post('create-invalid-ext')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '未映射扩展字段制单（拦截演示）', description: 'extFields 字段未在 bizExtMappings 声明时制单必须报错' })
  createInvalidExt() {
    return this.demo.createInvalidExtField()
  }

  /** 动态下拉选项数据源：推广活动列表（扩展筛选 optionsSource='campaigns' 的加载目标） */
  @Get('campaigns')
  @ApiOperation({ summary: '推广活动列表', description: '扩展筛选动态下拉选项数据源（promo_reward.campaignId）' })
  @SkipPermission()
  campaigns() {
    return this.demo.listCampaigns()
  }

  /** 动态级联选项数据源：省市区树（扩展筛选 optionsSource='regions' 的加载目标） */
  @Get('regions')
  @ApiOperation({ summary: '区域级联选项（optionsSource=regions 数据源示例）', description: '前端 registerSearchOptionLoader 注册后自动加载' })
  @SkipPermission()
  regions() {
    return this.demo.listRegions()
  }

  /** 用例9：提现审核流模板（LedgerWithdrawService） */
  @Post('withdraw-reserve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提现预占', description: '用户 → 资金池系统户（needReview=true 冻结待审；wxTransferNo/withdrawType 写 extCol 索引位）' })
  withdrawReserve(@Body() dto: WithdrawReserveDto) {
    return this.demo.withdrawReserve(dto.bizRef, dto.amount, dto.wxTransferNo, dto.withdrawType)
  }

  @Post('withdraw-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提现审核通过', description: 'NOT_READY->PENDING 入队入账；幂等（非待审核返回 null）' })
  withdrawApprove(@Body() dto: WithdrawRefDto) {
    return this.demo.withdrawApprove(dto.bizRef)
  }

  @Post('withdraw-reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提现驳回', description: '解冻 + REJECTED 终态；幂等' })
  withdrawReject(@Body() dto: WithdrawRejectDto) {
    return this.demo.withdrawReject(dto.bizRef, dto.reason)
  }

  @Get('withdraw-by-no')
  @ApiOperation({ summary: '按微信转账单号定位提现单', description: 'findByExternalNo（extCol1 索引定位，微信回调入口）' })
  @SkipPermission()
  withdrawByNo(@Query('no') no: string) {
    return this.demo.withdrawFindByNo(no)
  }

  @Get('withdraw-list')
  @ApiOperation({ summary: '提现记录分页', description: '读侧状态 1 处理中 / 2 成功 / 3 失败' })
  @SkipPermission()
  withdrawList(@Query('status') status?: string) {
    return this.demo.withdrawList(status ? Number(status) : undefined)
  }

  @Get('withdraw-sum')
  @ApiOperation({ summary: '提现汇总', description: 'totalCount 全部 / withdrawn 成功金额（最小单位）/ pendingCount 处理中笔数' })
  @SkipPermission()
  withdrawSum() {
    return this.demo.withdrawSum()
  }
}
