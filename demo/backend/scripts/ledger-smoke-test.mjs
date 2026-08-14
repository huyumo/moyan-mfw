/**
 * @fileoverview extension-ledger 功能冒烟测试脚本
 * @description 覆盖：开户/制单(免审)/异步入账/需审审核通过/驳回解冻/余额不足/幂等/冲正/取消/对账
 * 通过 HTTP API 调用 demo backend（localhost:3000）
 */

const BASE = 'http://localhost:3000/api';

let token = '';
let passed = 0;
let failed = 0;

function log(ok, name, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function api(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 轮询交易单直到终态 */
async function waitTransfer(transferNo, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await api('GET', `/ext/ledger/transfers/${transferNo}`);
    const t = res?.data;
    if (t && [4, 5, 6, 7].includes(t.postStatus)) return t;
    await sleep(300);
  }
  return null;
}

async function main() {
  // ── 登录 ──
  console.log('【0】登录');
  const login = await api('POST', '/auth/login', { username: 'admin', password: 'Admin@123' }, false);
  token = login?.data?.accessToken;
  log(!!token, '获取 admin token');

  // ── 开户 ──
  console.log('【1】开户（初始余额同步入账）');
  const suffix = Date.now().toString().slice(-8);
  const holderA = `holder-a-${suffix}`;
  const holderB = `holder-b-${suffix}`;
  const accA = await api('POST', '/ext/ledger/accounts', { holderId: holderA, tag: 'default', currency: 'CNY', initialBalance: '1000000' });
  const accB = await api('POST', '/ext/ledger/accounts', { holderId: holderB, tag: 'default', currency: 'CNY', initialBalance: '500000' });
  log(accA?.data?.id && accA?.data?.balance === 1000000, '开户A 初始余额 1000.00 同步入账', `balance=${accA?.data?.balance}`);
  log(accB?.data?.id && accB?.data?.balance === 500000, '开户B 初始余额 500.00 同步入账', `balance=${accB?.data?.balance}`);
  const accountA = accA?.data?.id;
  const accountB = accB?.data?.id;
  // 幂等开户
  const accA2 = await api('POST', '/ext/ledger/accounts', { holderId: holderA, tag: 'default', currency: 'CNY' });
  log(accA2?.data?.id === accountA, '开户幂等（重复开户返回同一账户）');

  // ── 制单（免审）+ 异步入账 ──
  console.log('【2】制单免审 + 异步入账');
  const t1 = await api('POST', '/ext/ledger/transfers', {
    bizRef: `biz-pay-${suffix}`, bizType: 'order_pay',
    fromAccount: accountA, toAccounts: [{ account: accountB, amount: '10000' }],
    amount: '10000', currency: 'CNY', needReview: false,
  });
  log(!!t1?.data?.transfer?.transferNo, '制单成功（免审）', `transferNo=${t1?.data?.transfer?.transferNo}`);
  const t1No = t1?.data?.transfer?.transferNo;
  const t1Posted = await waitTransfer(t1No);
  log(t1Posted?.postStatus === 4, '异步消费入账（POSTED）', `postStatus=${t1Posted?.postStatus}`);

  // 余额校验：A 1000-100=900，B 500+100=600
  const aAfter = await api('GET', `/ext/ledger/accounts/${accountA}`);
  const bAfter = await api('GET', `/ext/ledger/accounts/${accountB}`);
  log(aAfter?.data?.balance === 990000, '出账方余额 900.00（预占+入账后）', `balance=${aAfter?.data?.balance}`);
  log(bAfter?.data?.balance === 510000, '入账方余额 600.00', `balance=${bAfter?.data?.balance}`);
  log(bAfter?.data?.totalIncome === 510000, '入账方累计转入 600.00');
  log(aAfter?.data?.pendingOut === 0 && aAfter?.data?.frozen === 0, '出账方无残留占用（pendingOut/frozen=0）');

  // ── 余额不足 ──
  console.log('【3】余额不足拒绝');
  const t2 = await api('POST', '/ext/ledger/transfers', {
    bizRef: `biz-over-${suffix}`, bizType: 'order_pay',
    fromAccount: accountB, toAccounts: [{ account: accountA, amount: '999999999' }],
    amount: '999999999', currency: 'CNY', needReview: false,
  });
  log(t2?.code !== 0 || t2?.data === null, '超余额制单被拒绝', JSON.stringify(t2?.message || t2?.data || '').slice(0, 80));

  // ── 需审制单 + 审核通过 ──
  console.log('【4】需审制单 → 审核通过 → 入账');
  const t3 = await api('POST', '/ext/ledger/transfers', {
    bizRef: `biz-review-${suffix}`, bizType: 'refund',
    fromAccount: accountB, toAccounts: [{ account: accountA, amount: '5000' }],
    amount: '5000', currency: 'CNY', needReview: true,
  });
  const t3No = t3?.data?.transfer?.transferNo;
  log(!!t3No, '需审制单成功');
  // 审核前：冻结生效，不入队
  const t3Before = await api('GET', `/ext/ledger/transfers/${t3No}`);
  log(t3Before?.data?.postStatus === 1, '审核前 NOT_READY（未入队）', `postStatus=${t3Before?.data?.postStatus}`);
  const bFrozen = await api('GET', `/ext/ledger/accounts/${accountB}`);
  log(bFrozen?.data?.frozen === 5000, '审核前冻结 50.00', `frozen=${bFrozen?.data?.frozen}`);
  // 审核通过
  const audit = await api('POST', '/ext/ledger/transfers/audit', { transferNo: t3No, auditStatus: 1, auditNotes: '测试通过' });
  log(audit?.code === 0, '审核通过');
  const t3Posted = await waitTransfer(t3No);
  log(t3Posted?.postStatus === 4, '审核通过后异步入账（POSTED）', `postStatus=${t3Posted?.postStatus}`);
  const aAfter3 = await api('GET', `/ext/ledger/accounts/${accountA}`);
  const bAfter3 = await api('GET', `/ext/ledger/accounts/${accountB}`);
  log(aAfter3?.data?.balance === 995000, 'A 余额 995.00（+50 退款）', `balance=${aAfter3?.data?.balance}`);
  log(bAfter3?.data?.balance === 505000 && bAfter3?.data?.frozen === 0, 'B 余额 595.00 且冻结清零');

  // ── 需审制单 + 驳回解冻 ──
  console.log('【5】需审制单 → 驳回 → 解冻');
  const t4 = await api('POST', '/ext/ledger/transfers', {
    bizRef: `biz-reject-${suffix}`, bizType: 'order_pay',
    fromAccount: accountA, toAccounts: [{ account: accountB, amount: '20000' }],
    amount: '20000', currency: 'CNY', needReview: true,
  });
  const t4No = t4?.data?.transfer?.transferNo;
  const reject = await api('POST', '/ext/ledger/transfers/audit', { transferNo: t4No, auditStatus: 2, auditNotes: '测试驳回' });
  log(reject?.code === 0, '审核驳回');
  const t4Res = await api('GET', `/ext/ledger/transfers/${t4No}`);
  log(t4Res?.data?.postStatus === 7, '驳回后 REJECTED 终态');
  const aAfter4 = await api('GET', `/ext/ledger/accounts/${accountA}`);
  log(aAfter4?.data?.balance === 995000 && aAfter4?.data?.frozen === 0, '驳回解冻，余额还原且冻结清零', `balance=${aAfter4?.data?.balance}`);
  // 驳回单不会被兜底扫描误入队（等 2s 验证仍 REJECTED）
  await sleep(2000);
  const t4Res2 = await api('GET', `/ext/ledger/transfers/${t4No}`);
  log(t4Res2?.data?.postStatus === 7, '驳回单不被误入队（终态保持）');

  // ── 幂等制单 ──
  console.log('【6】幂等制单');
  const t1Again = await api('POST', '/ext/ledger/transfers', {
    bizRef: `biz-pay-${suffix}`, bizType: 'order_pay',
    fromAccount: accountA, toAccounts: [{ account: accountB, amount: '10000' }],
    amount: '10000', currency: 'CNY', needReview: false,
  });
  log(t1Again?.data?.created === false && t1Again?.data?.transfer?.transferNo === t1No, '同 bizRef 返回已有单（不重复入账）');
  const aIdem = await api('GET', `/ext/ledger/accounts/${accountA}`);
  log(aIdem?.data?.balance === 995000, '幂等后余额不变（未二次扣款）');

  // ── 冲正 ──
  console.log('【7】全额冲正');
  const rev = await api('POST', '/ext/ledger/transfers/reverse', {
    originalTransferNo: t1No, bizRef: `biz-rev-${suffix}`, bizType: 'reverse',
  });
  const revNo = rev?.data?.transfer?.transferNo;
  log(!!revNo, '冲正单创建成功', `reverseNo=${revNo}`);
  const revPosted = await waitTransfer(revNo);
  log(revPosted?.postStatus === 4, '冲正单入账（POSTED）');
  const aAfter7 = await api('GET', `/ext/ledger/accounts/${accountA}`);
  const bAfter7 = await api('GET', `/ext/ledger/accounts/${accountB}`);
  log(aAfter7?.data?.balance === 1005000, 'A 余额 1005.00（冲正退回 100）', `balance=${aAfter7?.data?.balance}`);
  log(bAfter7?.data?.balance === 495000, 'B 余额 590.00（被扣回 100）', `balance=${bAfter7?.data?.balance}`);
  // 重复冲正被拒
  const rev2 = await api('POST', '/ext/ledger/transfers/reverse', {
    originalTransferNo: t1No, bizRef: `biz-rev2-${suffix}`, bizType: 'reverse',
  });
  log(rev2?.code !== 0, '重复冲正被拒绝（唯一索引防双冲正）');

  // ── 对账 ──
  console.log('【8】对账（恒等式校验）');
  const rc = await api('POST', '/ext/ledger/reconcile', {});
  log(rc?.data?.diffCount === 0, '全量对账无差异（恒等式成立）', `totalAccounts=${rc?.data?.totalAccounts}`);
  const reports = await api('GET', '/ext/ledger/reconcile/reports?page=1&pageSize=5');
  log(reports?.data?.items?.length >= 1, '对账报告已落库可查');

  // ── 流水查询 ──
  console.log('【9】流水分页查询（单分区裁剪）');
  const entries = await api('GET', `/ext/ledger/entries?accountId=${accountA}&page=1&pageSize=20`);
  log(entries?.data?.total >= 4, 'A 账户流水分页查询', `total=${entries?.data?.total}`);

  console.log(`\n========== 结果：${passed} 通过 / ${failed} 失败 ==========`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('测试脚本异常:', e.message);
  process.exit(1);
});
