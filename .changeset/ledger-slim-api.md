---
"moyan-mfw-extension-ledger": minor
---

- 业务层极简接入：新增懒开户（LedgerAccountService.ensureAccount / ensureSystemAccounts，openAccount 并发冲突自动重查）、一行式制单（LedgerTransferService.createBizTransfer，holder 三元组定位账户）
- 新增审核流模板 LedgerWithdrawService（提现/打款/退款等两段式审核业务）：reserve/approve/reject/findByExternalNo/queryWithdrawals/sumWithdrawn 全流程内置，读侧状态映射（1 处理中/2 成功/3 失败）与成功口径内置，bizType/字段名/文案可配置
- 查询聚合：ILedgerStorage.sumTransfers（COUNT+SUM）与 TransferQueryFilter 新增 fromAccountType / fromAccountHolderIds / postStatusExclude
- 通用定位：LedgerTransferService.findByExtField（按业务扩展字段索引定位，替代裸 SQL 按单号查询）
- 返回类型化：TransferView / AccountView / EntryView / WithdrawView，服务与 SPI 返回不再 any；extCol 统一语义化为 extFields
- 共享工具：amountToYuan（BigInt 安全分→元）、buildCompositeBizRef（组合幂等键 MD5）
