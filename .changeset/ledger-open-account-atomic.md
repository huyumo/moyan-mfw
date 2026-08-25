---
"moyan-mfw-extension-ledger": patch
---

- **fix(openAccount) 事务原子化（LedgerOpenAccount-01 根治）**：开户写账户 + 写 open_account 交易单 + 写期初分录整体包入事务，
  ②③失败回滚①，杜绝"账户有余额、但无期初流水"的半截账户（此前非事务，叠加 ensureAccount 幂等跳过导致半截账户永久存在、对账恒等式无法自愈）。
- **feat(ensureOpeningEntry) 历史半截账户自愈**：`ensureAccount`/`openAccount` 命中已存在账户时，若账面余额>0 且缺 open_account 期初流水，
  按缺口幂等补齐期初流水（唯一键兜底 + 账户行锁，并发安全）；下次启动/重试自动愈合历史数据，无需人工 SQL。
