/**
 * @fileoverview 账本 SPI 调用用例演示模块
 * @description 业务层完整装配 extension-ledger：
 *   - forRoot 注入 5 个自定义 SPI（storage/lock/queue/notifier/fieldExtension）+ 账户实体扩展（accountEntity）
 *   - exports LedgerModule（含 SPI token），供其他模块（如 scheduler demo）注入 LedgerReconcileService
 *
 * 覆盖的 SPI 调用案例：
 *   | SPI | 默认实现 | demo 替换实现 | 调用案例 |
 *   | ILedgerStorage | TypeOrmLedgerStorage | DemoLedgerStorage（继承+耗时日志） | 账户/流水直查 |
 *   | ILedgerLock | DbLock | DemoLedgerLock（包装+计数） | 业务互斥、对账互斥 |
 *   | ILedgerQueue | InProcessQueue | DemoLedgerQueue（包装+计数） | 积压监控、延迟重投 |
 *   | ILedgerNotifier | EventNotifier | DemoLedgerNotifier（继承+日志） | 监听器注册 |
 *   | ILedgerFieldExtension | DefaultFieldExtension | DemoFieldExtension（业务校验规则） | 前置校验 |
 *   | 账户实体 | DefaultLedgerAccount | DemoMerchantAccount（+creditLimit） | 实体字段扩展 |
 */

import { Module } from '@nestjs/common'
import { LedgerModule } from 'moyan-mfw-extension-ledger/backend'
import { DemoMerchantAccount } from './entities/demo-ledger-account.entity'
import { DemoFieldExtension } from './spi/demo-field-extension'
import { DemoLedgerStorage } from './spi/demo-ledger-storage'
import { DemoLedgerLock } from './spi/demo-ledger-lock'
import { DemoLedgerQueue } from './spi/demo-ledger-queue'
import { DemoLedgerNotifier } from './spi/demo-ledger-notifier'
import { DemoLedgerNotifyListener } from './spi/demo-ledger-notify-listener'
import { DemoLedgerBusinessService } from './services/demo-ledger-business.service'
import { DemoLedgerSpiController } from './controllers/demo-ledger-spi.controller'

@Module({
  imports: [
    LedgerModule.forRoot({
      // ── 5 个 SPI 全部替换为 demo 实现 ──
      accountEntity: DemoMerchantAccount,
      storageImpl: DemoLedgerStorage,
      lockImpl: DemoLedgerLock,
      queueImpl: DemoLedgerQueue,
      notifierImpl: DemoLedgerNotifier,
      fieldExtensionImpl: DemoFieldExtension,
      // ── 业务注册制白名单 ──
      accountTags: ['default', 'merchant', 'user', 'system'],
      bizTypes: ['order_pay', 'refund', 'recharge', 'reverse', 'promo_reward', 'task_reward', 'exchange'],
      // ── 业务扩展字段 → 预留索引位映射（不同交易类型字段不同，映射到固定 4 个索引位） ──
      bizExtMappings: {
        recharge:     { channel: 'extCol1', outTradeNo: 'extCol2' },
        promo_reward: { promoterId: 'extCol1', campaignId: 'extCol2', region: 'extCol3' },
        task_reward:  { taskId: 'extCol1' },
        exchange:     { goodsId: 'extCol1', storeId: 'extCol2' },
      },
      // ── 业务类型展示元数据（经 GET /api/ext/ledger/biz-types 下发前端，前端零配置） ──
      bizTypeMetas: {
        recharge: {
          label: '充值',
          search: [
            // channel 静态下拉筛选（配置下发）
            {
              key: 'channel',
              label: '渠道',
              type: 'select',
              options: [
                { value: 'wechat', label: '微信' },
                { value: 'alipay', label: '支付宝' },
                { value: 'bank', label: '银行' },
              ],
            },
            { key: 'outTradeNo', label: '外部支付单号' },
          ],
          columns: [
            { prop: 'channel', label: '渠道', width: 100 },
            { prop: 'outTradeNo', label: '外部支付单号', width: 180, cp: true },
          ],
          // 详情扩展字段：channel 半行（1行2列），outTradeNo 独占一行（1行1列）
          detail: [
            { key: 'channel', label: '渠道', span: 1 },
            { key: 'outTradeNo', label: '外部支付单号', span: 2 },
          ],
        },
        exchange: {
          label: '兑换',
          search: [
            { key: 'goodsId', label: '商品ID' },
            { key: 'storeId', label: '门店ID' },
          ],
          columns: [
            { prop: 'goodsId', label: '商品ID', width: 130, cp: true },
            { prop: 'storeId', label: '门店ID', width: 120, cp: true },
          ],
        },
        promo_reward: {
          label: '推广奖励',
          search: [
            { key: 'promoterId', label: '推广人ID' },
            // campaignId 动态下拉筛选（optionsSource='campaigns'，前端 registerSearchOptionLoader 拉取）
            { key: 'campaignId', label: '活动ID', type: 'select', optionsSource: 'campaigns' },
            // region 级联筛选（省市区，optionsSource='regions' 服务端树形数据；默认取末级区县 code）
            // matchMode='prefix'：选省/市也能筛出（33 → 3301 → 330106 前缀兼容编码，LIKE '33%'）
            { key: 'region', label: '推广区域', type: 'cascader', optionsSource: 'regions', matchMode: 'prefix' },
          ],
          columns: [
            { prop: 'promoterId', label: '推广人ID', width: 130, cp: true },
            { prop: 'campaignId', label: '活动ID', width: 130, cp: true },
            { prop: 'region', label: '推广区域', width: 130, cp: true },
          ],
          detail: [
            { key: 'promoterId', label: '推广人ID', span: 1 },
            { key: 'campaignId', label: '活动ID', span: 1 },
            { key: 'region', label: '推广区域', span: 2 },
          ],
        },
        task_reward: {
          label: '任务奖励',
          search: [{ key: 'taskId', label: '任务ID' }],
          columns: [{ prop: 'taskId', label: '任务ID', width: 130, cp: true }],
        },
      },
      // ── 消费参数 ──
      consumerConcurrency: 10,
      maxRetry: 3,
      retryBackoffMs: 1000,
    }),
  ],
  controllers: [DemoLedgerSpiController],
  providers: [DemoLedgerNotifyListener, DemoLedgerBusinessService],
  exports: [LedgerModule],
})
export class DemoLedgerModule {}
