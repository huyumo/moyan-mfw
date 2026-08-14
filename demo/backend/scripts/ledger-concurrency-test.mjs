/**
 * @fileoverview extension-ledger 并发不超支测试
 * @description 账户余额 100000 分，并发 100 笔制单（每笔 1000 分）
 *   验证：全部成功且余额归零；额外并发第 101 笔必须被拒（防超支）
 *   再验证：余额不足被拒的请求不影响恒等式
 */

const BASE = 'http://localhost:3000/api';

let token = '';
let passed = 0;
let failed = 0;

function log(ok, name, detail = '') {
  if (ok) { passed++; console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

async function api(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 轮询交易单直到终态 */
async function waitTransfer(transferNo, timeoutMs = 15000) {
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
  // 登录
  const login = await api('POST', '/auth/login', { username: 'admin', password: 'Admin@123' }, false);
  token = login?.data?.accessToken;
  log(!!token, '获取 admin token');

  const suffix = Date.now().toString().slice(-8);
  const fromHolder = `concur-from-${suffix}`;
  const toHolder = `concur-to-${suffix}`;
  const fromAcc = await api('POST', '/ext/ledger/accounts', { holderId: fromHolder, tag: 'default', currency: 'CNY', initialBalance: '100000' });
  // 入账方不传 initialBalance（默认 0；'0' 会被金额校验拒绝）
  const toAcc = await api('POST', '/ext/ledger/accounts', { holderId: toHolder, tag: 'default', currency: 'CNY' });
  const fromId = fromAcc?.data?.id;
  const toId = toAcc?.data?.id;
  log(!!fromId && !!toId, '开户：转出方 1000.00，入账方 0.00');

  // ── 并发 100 笔制单（每笔 1000 分 = 10.00 元）──
  console.log('【1】并发 100 笔制单（总额 = 余额 100000 分）');
  const N = 100;
  const AMT = 1000;
  const results = await Promise.all(
    Array.from({ length: N }, (_, i) =>
      api('POST', '/ext/ledger/transfers', {
        bizRef: `concur-${suffix}-${i}`, bizType: 'order_pay',
        fromAccount: fromId, toAccounts: [{ account: toId, amount: String(AMT) }],
        amount: String(AMT), currency: 'CNY', needReview: false,
      }),
    ),
  );
  const okCount = results.filter((r) => r?.data?.created === true).length;
  const dupCount = results.filter((r) => r?.data?.created === false).length;
  const failCount = results.filter((r) => r?.code !== 0 && r?.data === null).length;
  log(okCount === N, `并发 ${N} 笔全部制单成功`, `成功=${okCount} 幂等重复=${dupCount} 失败=${failCount}`);

  // ── 等待全部入账 ──
  console.log('【2】等待全部入账');
  const transferNos = results.filter((r) => r?.data?.transfer).map((r) => r.data.transfer.transferNo);
  const posted = await Promise.all(transferNos.map((no) => waitTransfer(no)));
  const postedCount = posted.filter((t) => t?.postStatus === 4).length;
  log(postedCount === N, `${N} 笔全部入账（POSTED）`, `posted=${postedCount}`);

  // ── 余额校验：出账方归零、入账方收满 ──
  console.log('【3】余额与占用校验');
  const fromAfter = await api('GET', `/ext/ledger/accounts/${fromId}`);
  const toAfter = await api('GET', `/ext/ledger/accounts/${toId}`);
  log(fromAfter?.data?.balance === 0 && fromAfter?.data?.pendingOut === 0, '出账方余额归零且无残留占用', `balance=${fromAfter?.data?.balance}, pendingOut=${fromAfter?.data?.pendingOut}`);
  log(toAfter?.data?.balance === N * AMT, '入账方收满 1000.00', `balance=${toAfter?.data?.balance}`);

  // ── 并发第 101 笔必须被拒（防超支）──
  console.log('【4】第 101 笔并发制单（余额已尽）');
  const extra = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      api('POST', '/ext/ledger/transfers', {
        bizRef: `concur-extra-${suffix}-${i}`, bizType: 'order_pay',
        fromAccount: fromId, toAccounts: [{ account: toId, amount: String(AMT) }],
        amount: String(AMT), currency: 'CNY', needReview: false,
      }),
    ),
  );
  const rejected = extra.filter((r) => String(r?.message || '').includes('余额不足')).length;
  log(rejected === 5, '余额耗尽后 5 笔并发全部被拒（不超支）', `rejected=${rejected}`);

  // ── 恒等式校验 ──
  console.log('【5】对账恒等式');
  const rc = await api('POST', '/ext/ledger/reconcile', {});
  log(rc?.data?.diffCount === 0, '并发后全量对账无差异', `totalAccounts=${rc?.data?.totalAccounts}`);

  console.log(`\n========== 结果：${passed} 通过 / ${failed} 失败 ==========`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('测试脚本异常:', e.message);
  process.exit(1);
});
