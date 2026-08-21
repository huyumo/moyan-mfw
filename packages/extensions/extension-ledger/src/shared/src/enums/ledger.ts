/**
 * @fileoverview 借贷记账扩展包字典定义
 * @description 使用 moyan-mfw-base/shared 装饰器定义扩展包专属字典，供前后端共用
 */
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

/** 借贷方向（分录） */
@DictMeta({ key: 'ledger_direction', label: '借贷方向', module: '记账' })
export class DirectionDict {
  /** 借方（资金流入，signed_amount 为正） */
  @DictEntry({ label: '借', type: 'success' }) static DEBIT = 1
  /** 贷方（资金流出，signed_amount 为负） */
  @DictEntry({ label: '贷', type: 'warning' }) static CREDIT = 2
}

/** 审核状态 */
@DictMeta({ key: 'ledger_audit_status', label: '审核状态', module: '记账' })
export class AuditStatusDict {
  /** 待审核（需审单制单后，资金冻结在 frozen） */
  @DictEntry({ label: '待审核', type: 'warning' }) static PENDING_REVIEW = 1
  /** 审核通过（转为 PENDING 入队） */
  @DictEntry({ label: '审核通过', type: 'success' }) static APPROVED = 2
  /** 审核驳回（解冻，终态） */
  @DictEntry({ label: '已驳回', type: 'danger' }) static REJECTED = 3
}

/**
 * 入账状态机
 * - 免审制单 -> PENDING（入队）
 * - 需审制单 -> NOT_READY（不入队，等待审核）
 * - 审核通过 -> NOT_READY -> PENDING（入队）
 * - 审核驳回 -> REJECTED（终态，解冻）
 * - 消费认领 -> PENDING -> POSTING
 * - 入账成功 -> POSTED；重试耗尽 -> FAILED；人工取消 -> CANCELLED
 */
@DictMeta({ key: 'ledger_post_status', label: '入账状态', module: '记账' })
export class PostStatusDict {
  /** 待审核未就绪（需审单制单后，不入队，等待审核；免审单无此状态） */
  @DictEntry({ label: '待审核', type: 'info' }) static NOT_READY = 1
  /** 待入账（已入队或待入队） */
  @DictEntry({ label: '待入账', type: 'warning' }) static PENDING = 2
  /** 入账中（已认领，claim_token 标记执行者） */
  @DictEntry({ label: '入账中', type: 'primary' }) static POSTING = 3
  /** 已入账（终态） */
  @DictEntry({ label: '已入账', type: 'success' }) static POSTED = 4
  /** 入账失败（终态，重试耗尽，预占保留待人工处置） */
  @DictEntry({ label: '入账失败', type: 'danger' }) static FAILED = 5
  /** 已取消（终态，已回滚预占） */
  @DictEntry({ label: '已取消', type: 'info' }) static CANCELLED = 6
  /** 已驳回（终态，审核驳回，已解冻） */
  @DictEntry({ label: '已驳回', type: 'danger' }) static REJECTED = 7
}

/** 资金占用桶类型（制单时确定，取消/回滚按桶分支） */
@DictMeta({ key: 'ledger_hold_type', label: '占用类型', module: '记账' })
export class HoldTypeDict {
  /** 预占在途（免审单制单后转入 pending_out） */
  @DictEntry({ label: '预占在途', type: 'warning' }) static PENDING_OUT = 1
  /** 审核冻结（需审单制单后转入 frozen） */
  @DictEntry({ label: '审核冻结', type: 'info' }) static FROZEN = 2
}

/** 转账模式 */
@DictMeta({ key: 'ledger_transfer_mode', label: '转账模式', module: '记账' })
export class TransferModeDict {
  /** 一对一转账 */
  @DictEntry({ label: '一对一', type: 'info' }) static ONE_TO_ONE = 1
  /** 一对多转账（最多 100 个收款方） */
  @DictEntry({ label: '一对多', type: 'warning' }) static ONE_TO_MANY = 2
}

/**
 * 冲正状态（冲正记录表状态）
 * 冲正为同步事务完成（低频管理操作），成功即 POSTED；失败整体回滚无中间态
 */
@DictMeta({ key: 'ledger_reversal_status', label: '冲正状态', module: '记账' })
export class ReversalStatusDict {
  /** 已冲正（资金已按原单反向退回） */
  @DictEntry({ label: '已冲正', type: 'success' }) static POSTED = 1
}
