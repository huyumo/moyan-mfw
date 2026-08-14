# moyan-mfw-extension-ledger

MFW 通用借贷记账管理扩展包。基于「纯异步入账 + 同步预占 + SPI 可扩展」架构，支持多实例、高并发、大数据量，补齐单体账本的并发/扩展/可靠性短板。

## 架构概览

```
制单(同步事务) ──预占──> 入队 ──> 消费者(信号量并发) ──认领(CAS)──> 入账事务(末位CAS) ──> POSTED
                                  │
                                  ├─ 账务异常 ─> 回退PENDING(条件) + 退避重入队
                                  ├─ fencing失败 ─> 放弃(已被接管)
                                  └─ 重试耗尽 ─> FAILED + 通知(人工重推/取消)

兜底扫描(30s,选主) ─> PENDING超时补发 + POSTING孤儿(5min)重置重推
对账(能力,非调度) ─> 恒等式校验 + 增量修复(原子写调整分录) ─ 业务方对接 extension-scheduler 定时
```

**核心不变量**：`balance + frozen + pendingOut ≡ Σ(signed_amount)`（全状态机成立，已数学证明）

## 设计决策

| 决策 | 说明 |
|---|---|
| 纯异步执行 | 制单即返回，余额入账全部经队列消费 |
| 同步预占 | 制单事务内单条原子条件 UPDATE（`WHERE balance >= amt`），防超支 |
| 两段式审核 | 需审单预占进 frozen 待审；免审单预占进 pending_out 直接入队 |
| bigint 金额 | 统一最小单位（升级参考项目 int 32 位）；JSON 用字符串防 JS 精度丢失 |
| 仅全额冲正 | 借贷反向 + 关联原单；唯一索引防双冲正 |
| 对账零定时 | 包内只提供能力，定时调度由业务方对接 extension-scheduler |
| KEY 分区 | 流水表 KEY(account_id) 64 分区，用户跨月查询单分区命中 |

## 安装与集成

```bash
pnpm add moyan-mfw-extension-ledger
```

业务层 `backend/src/main.ts`：

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend'
import { LedgerModule, LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/backend'

await createBaseBackendApp({
  modules: [LedgerModule.forRoot({
    accountTags: ['default', 'merchant', 'user'],
    bizTypes: ['order_pay', 'refund', 'recharge'],
    consumerConcurrency: 10,
    // 多实例部署必须用 Redis 队列：
    // queueImpl: RedisStreamQueue,
    // lockImpl: RedisLock,
  })],
  permissionValues: [...LEDGER_EXTENSION_PERMISSION_VALUES],
})
```

## 部署硬约束

| 约束 | 说明 |
|---|---|
| **多实例必须 RedisStreamQueue** | 进程内队列仅单实例有效；多实例下消息只在本实例消费 |
| **多实例必须 RedisLock** | DbLock(GET_LOCK) 跨连接互斥但性能有限；高并发用 RedisLock |
| **MySQL 8+** | KEY 分区、CHECK 约束、XAUTOCLAIM(Redis≥6.2) |
| **兜底扫描默认开启** | 可靠性关键路径（与 Stream MAXLEN 不可同关） |
| **driver=redis** | 多实例下 CacheModule 须配 redis 驱动，否则getClient()抛异常 |

## SPI 扩展点（5 个）

| SPI | 默认实现 | 可选实现 | 扩展场景 |
|---|---|---|---|
| `ILedgerStorage` | TypeOrmLedgerStorage | 自定义 | 分库分表、换存储引擎 |
| `ILedgerLock` | DbLock(GET_LOCK) | RedisLock | 高并发分布式锁 |
| `ILedgerQueue` | InProcessQueue(单实例) | RedisStreamQueue | 多实例削峰队列 |
| `ILedgerNotifier` | EventNotifier(进程内) | RedisNotifier(Pub/Sub) | 跨实例事件广播 |
| `ILedgerFieldExtension` | DefaultFieldExtension(空校验) | 自定义 | extra JSON schema 校验 |

**账本字段扩展**（实体继承 + JSON 双通道）：

```typescript
import { LedgerAccountBase } from 'moyan-mfw-extension-ledger/backend'
import { Entity, Column } from 'typeorm'

@Entity('ext_ledger_account')
export class MerchantAccount extends LedgerAccountBase {
  @Column({ type: 'bigint', default: 0 }) creditLimit: string  // 强类型可索引
}

// forRoot({ accountEntity: MerchantAccount })
// 扩展方新增列须自带 migration：ALTER TABLE ext_ledger_account ADD COLUMN creditLimit BIGINT DEFAULT 0
```

**业务扩展字段筛选**（`bizExtMappings` 映射到预留索引位 `extCol1~4`，制单/查询均走索引）：

```typescript
// forRoot({
//   bizExtMappings: { promo_reward: { promoterId: 'extCol1', campaignId: 'extCol2', region: 'extCol3' } },
//   bizTypeMetas: {
//     promo_reward: {
//       label: '推广奖励',
//       search: [
//         { key: 'campaignId', label: '活动ID', type: 'select', optionsSource: 'campaigns' },          // 动态下拉
//         { key: 'region', label: '推广区域', type: 'cascader', optionsSource: 'regions', matchMode: 'prefix' }, // 级联任意级筛选
//       ],
//     },
//   },
// })
```

- `search[].matchMode`：`exact`（默认，等值）/ `prefix`（前缀匹配 `LIKE 'value%'`，仍可走索引）。
- **级联任意级筛选**（选省/市也能筛出区县数据）用 `prefix`，要求选项 value 为前缀兼容链
  （如 `33 → 3301 → 330106`，上级是下级的子串前缀）；定长码（`330000`）非前缀链，
  可改 `valueMode: 'join'` 存全路径 `330000/330100/330106` 配合 prefix 实现同样效果。
- 动态选项：`optionsSource` 声明来源 key，业务前端 `registerSearchOptionLoader(key, loader)` 注册加载器
  （demo：`demo/frontend/src/ledger-option-loaders.ts`），选项数据由业务 API 提供（如 `/api/demo/ledger-spi/regions`）。
```

## demo 完整 SPI 调用案例

`demo/backend/src/modules/ledger-demo/` 以「订单钱包」业务场景完整覆盖全部 SPI 的**替换**与**调用**案例（对齐 demo-scheduler.controller 的 curl 文档模式）：

| SPI | demo 替换实现（forRoot 注入） | 调用案例 |
|---|---|---|
| `ILedgerStorage` | `DemoLedgerStorage`（继承 TypeOrmLedgerStorage + 耗时日志） | `queryAccounts/queryEntries` 报表直查 |
| `ILedgerLock` | `DemoLedgerLock`（包装 DbLock + 计数） | `lock-demo` 业务互斥防重入、对账互斥 |
| `ILedgerQueue` | `DemoLedgerQueue`（包装 InProcessQueue + 计数） | `queue-stats` 积压监控、`requeue-delayed` 延迟重投 |
| `ILedgerNotifier` | `DemoLedgerNotifier`（继承 EventNotifier + 日志） | `DemoLedgerNotifyListener` registerListener 自注册 |
| `ILedgerFieldExtension` | `DemoFieldExtension`（业务校验规则） | `field-validate` 前置校验、制单/开户自动校验 |
| 账户实体 | `DemoMerchantAccount`（+ creditLimit 列） | 实体继承扩展 + 自带 migration |

业务服务 `DemoLedgerBusinessService` 同时展示 3 个导出服务的标准用法（开户/制单/审核/对账）与 SPI 直用
（`LEDGER_QUEUE.length()`、`LEDGER_LOCK.tryLock`、`LEDGER_STORAGE.queryEntries`、`LEDGER_FIELD_EXTENSION.validateTransferExtra`）。

对账能力对接定时调度：`demo/backend/src/modules/scheduler/handlers/ledger-daily-reconcile.handler.ts`
（ScheduledTaskHandler 自注册，每日 3 点执行 `LedgerReconcileService.runAll`）。

演示端点：`/api/demo/ledger-spi/*`（见控制器头部 curl 注释），Swagger 分组「借贷记账SPI示例」。
注意：demo 环境 `CACHE_DRIVER=none`，Redis 版 SPI 会降级，故演示采用「默认实现包装/继承」展示替换位；
多实例生产部署按上文「部署硬约束」切换 `RedisStreamQueue/RedisLock/RedisNotifier`。

## 状态机（post_status）

```
制单免审 ─> PENDING(入队)
制单需审 ─> NOT_READY(不入队)
审核通过 ─> NOT_READY ─> PENDING(入队)   [单条原子写,防僵尸单]
审核驳回 ─> REJECTED(终态,解冻)
消费认领 ─> PENDING ─> POSTING(claim_token)
入账成功 ─> POSTED(末位CAS)
重试耗尽 ─> FAILED(终态,预占保留)
人工取消 ─> CANCELLED(终态,按hold_type回滚预占)
```

兜底扫描**只处理 PENDING(入队超时) 与 POSTING(孤儿)**，绝不碰 NOT_READY/REJECTED/FAILED/CANCELLED/POSTED。

## XACK 协议（消息可靠性）

- 所有不处理路径（已POSTED/他人处理中/FAILED/不存在）一律 XACK，杜绝 PEL 影子消息
- 失败路径：**先 XACK 原消息再 ZADD 延迟队列**（防影子风暴）
- 末位 fencing CAS：`UPDATE SET post_status=POSTED WHERE claim_token=:my_token`，0 行=已被接管->整体回滚

## 对账（对接 extension-scheduler 示例）

```typescript
import { Injectable } from '@nestjs/common'
import { ScheduledTaskHandler } from 'moyan-mfw-extension-scheduler/backend'
import { LedgerReconcileService } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class LedgerDailyReconcileHandler implements ScheduledTaskHandler {
  taskCode = 'ledger-daily-reconcile'
  taskName = '账本每日对账'
  taskType = 'cron' as const
  defaultCron = '0 3 * * *'
  constructor(private readonly reconcile: LedgerReconcileService) {}
  async execute() { await this.reconcile.runAll('scheduler') }
}
```

## 数据模型

| 表 | 分区 | 说明 |
|---|---|---|
| `ext_ledger_account` | 无 | 账户（继承 Base 软删；唯一键 holder+tag+currency） |
| `ext_ledger_transfer` | 无 | 交易单（全点查；幂等键 bizRef+bizType） |
| `ext_ledger_entry` | KEY(account_id) 64 | 分录/流水（不继承 Base，落账不可变；复合主键 id+accountId） |
| `ext_ledger_entry_archive` | RANGE(created) 月 | 归档表（双层结构；DROP PARTITION 秒级清理） |
| `ext_ledger_reconcile_report` | 无 | 对账报告 |

## 迁移执行

扩展包 migration 位于 `database/migrations/`，业务方需在自身 data-source 中引入：

```typescript
// 业务层 data-source.ts
import { CreateLedgerTables20260814000000 } from 'moyan-mfw-extension-ledger/database/migrations/20260814000000-create-ledger-tables'
export const migrations = [CreateLedgerTables20260814000000]
```

## 容量与性能

| 层 | 容量 |
|---|---|
| 在线 entry | 64 分区 × 千万级 = 数十亿行（90 天活跃窗口恒定） |
| 归档 entry | RANGE 月分区，总量无上限 |
| transfer | 单表点查，年 3.65 亿行；归档联动 |
| 吞吐 | 制单 ≥1000 TPS/实例；消费 700~2000 笔/s/实例；天花板=单机 MySQL 写吞吐 ≈ 日 1~2 亿笔 |

## 验收指标

| 维度 | 指标 | 目标 |
|---|---|---|
| 一致性 | 恒等式违反率/不超支/重复入账/双冲正 | 全部 0 |
| 性能 | 制单 P99<50ms；消费延迟 P99<1s；流水查询 P99<50ms | 压测 |
| 可用性 | 消息零丢失(兜底≤30s)；孤儿恢复 MTTR≤10min；Redis故障制单可用 | 故障注入 |

## License

MIT
