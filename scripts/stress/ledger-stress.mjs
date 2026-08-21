#!/usr/bin/env node
/**
 * @fileoverview extension-ledger 并发压力测试
 * @description 大规模并发制单 → 验证抗并发能力（吞吐/时延/错误率/超支拦截/无死锁）+ 并发后数据正确性
 *              （对账恒等式 balance+frozen+pendingOut≡Σ(signedAmount)、余额守恒、幂等唯一、无滞留单、分录借贷平衡）
 *
 * 场景（全部走真实 HTTP 路径，免审直通 pay：用户→商家，热行竞争集中在同一转出账户）：
 *   1. fanout    单转出方热行扇出：N 笔并发、金额固定、orderNo 互异 —— 制单预占行锁串行化（防超支）+ 入账并发
 *   2. dup       幂等竞争：M 笔并发、orderNo 相同 —— unique(bizRef,bizType) 只允许 1 张制单
 *   3. overspend 超支拦截：K 笔并发、总额超过账户余额 —— 原子 WHERE balance>=amt 只放行 floor(balance/amt) 笔，其余 余额不足
 *
 * 用法：
 *   node scripts/stress/ledger-stress.mjs --scale smoke   # 冒烟档（count=300, concurrency=50）
 *   node scripts/stress/ledger-stress.mjs --scale full    # 大规模档（count=1500, concurrency=100）
 *   node scripts/stress/ledger-stress.mjs --count 2000 --concurrency 150 --amount 100 --dup 30 --os-count 1000 --os-amount 10000
 *   node scripts/stress/ledger-stress.mjs --skip-setup --skip-verify   # 跳过开户/数据校验（重复压测）
 * 报告：scripts/stress/results/ledger-stress-<ts>.json
 */

import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const DEMO_DIR = path.join(REPO_ROOT, 'demo/backend')
const RESULT_DIR = path.join(__dirname, 'results')

// ── 依赖锚定（demo/backend 声明了 mysql2） ──
const require = createRequire(path.join(DEMO_DIR, 'package.json'))
const mysql = require('mysql2/promise')

// ── .env 解析 ──
function loadEnv(file) {
  const env = {}
  if (!fs.existsSync(file)) return env
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}
const ENV = { ...loadEnv(path.join(DEMO_DIR, '.env')), ...loadEnv(path.join(DEMO_DIR, '.env.local')) }
const DB = {
  host: ENV.DB_HOST || 'localhost',
  port: Number(ENV.DB_PORT || 3306),
  user: ENV.DB_USERNAME || 'root',
  password: ENV.DB_PASSWORD || '',
  database: ENV.DB_NAME || 'moyan_mfw',
}
const API_BASE = `http://127.0.0.1:${ENV.PORT || 3000}${ENV.API_PREFIX || '/api'}`
const ADMIN_PASSWORD = ENV.ADMIN_DEFAULT_PASSWORD || 'Admin@123'

// ── 参数解析 ──
function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const eq = key.indexOf('=')
      if (eq >= 0) { out[key.slice(0, eq)] = key.slice(eq + 1); continue }
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith('--')) { out[key] = next; i++ } else out[key] = true
    } else out._.push(a)
  }
  return out
}
const ARGS = parseArgs(process.argv.slice(2))
const NUM = (v, d) => (v === undefined || v === true ? d : Number(v))

// 档位
const SCALE = ARGS.scale === 'full' ? 'full' : ARGS.scale === 'huge' ? 'huge' : 'smoke'
const DEFAULT = {
  smoke: { count: 300, concurrency: 50, amount: 100, dup: 20, osCount: 800, osAmount: 10000, topup: 2000000, poolSize: 0, poolCount: 0, poolAmount: 100, poolInitial: 1000000 },
  full: { count: 1500, concurrency: 100, amount: 100, dup: 30, osCount: 1000, osAmount: 10000, topup: 5000000, poolSize: 0, poolCount: 0, poolAmount: 100, poolInitial: 1000000 },
  huge: { count: 5000, concurrency: 200, amount: 100, dup: 40, osCount: 3000, osAmount: 10000, topup: 2000000, poolSize: 100, poolCount: 5000, poolAmount: 100, poolInitial: 1000000 },
}[SCALE]
const CFG = {
  scale: SCALE,
  count: NUM(ARGS.count, DEFAULT.count),
  concurrency: NUM(ARGS.concurrency, DEFAULT.concurrency),
  amount: String(NUM(ARGS.amount, DEFAULT.amount)),
  dup: NUM(ARGS.dup, DEFAULT.dup),
  osCount: NUM(ARGS['os-count'], DEFAULT.osCount),
  osAmount: String(NUM(ARGS['os-amount'], DEFAULT.osAmount)),
  topup: NUM(ARGS.topup, DEFAULT.topup),
  poolSize: NUM(ARGS['pool-size'], DEFAULT.poolSize),
  poolCount: NUM(ARGS['pool-count'], DEFAULT.poolCount),
  poolAmount: String(NUM(ARGS['pool-amount'], DEFAULT.poolAmount)),
  poolInitial: String(NUM(ARGS['pool-initial'], DEFAULT.poolInitial)),
  skipSetup: ARGS['skip-setup'] === true,
  skipVerify: ARGS['skip-verify'] === true,
  drainTimeoutSec: NUM(ARGS['drain-timeout'], 300),
}

// ── 工具 ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-')

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD }),
  })
  const json = await res.json()
  const data = json?.data ?? json
  const token = data?.accessToken || data?.token
  if (!token) throw new Error(`登录失败: ${json?.message || '未知错误'}`)
  return token
}

async function apiJson(token, pathUrl, options = {}) {
  const res = await fetch(`${API_BASE}${pathUrl}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON */ }
  return { status: res.status, json, text }
}

/** 并发受限任务池：返回 [{ jobIndex, ok, status, ms, created, transferNo, body }] */
async function runPool(createJobs, concurrency) {
  const jobs = createJobs()
  const results = new Array(jobs.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (true) {
      const i = cursor++
      if (i >= jobs.length) return
      const job = jobs[i]
      const t0 = performance.now()
      let status = 0
      let body = null
      try {
        const res = await fetch(job.url, { method: 'POST', headers: job.headers, body: job.body })
        status = res.status
        body = await res.json()
      } catch (err) {
        body = { error: err?.message }
      }
      const ms = performance.now() - t0
      const data = body?.data
      results[i] = {
        jobIndex: i,
        orderNo: job.orderNo,
        accountId: job.accountId ?? null,
        ok: status >= 200 && status < 300 && body?.code === 0,
        created: data?.created ?? null,
        transferNo: data?.transfer?.transferNo ?? null,
        status,
        code: body?.code ?? null,
        msg: body?.message ?? (body?.data?.message ?? null) ?? body?.error ?? '',
        ms,
      }
    }
  })
  await Promise.all(workers)
  return results
}

const pct = (arr, p) => {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor((p / 100) * s.length)))]
}
const sum = (arr) => arr.reduce((s, v) => s + v, 0)
const fmtNum = (n, d = 1) => (n ?? 0).toFixed(d)

const dbConnect = () => mysql.createConnection({ ...DB, connectTimeout: 10000 })

/** 账户快照（CNY 演示账户 + 全表计数） */
async function snapshot(conn, ids) {
  const [rows] = await conn.query(
    `SELECT id, balance, frozen, pendingOut, totalIncome, totalOutcome FROM ext_ledger_account WHERE id IN (?) AND deleteAt IS NULL`,
    [ids],
  )
  const acc = Object.fromEntries(rows.map((r) => [r.id, r]))
  const [c1] = await conn.query('SELECT COUNT(*) c FROM ext_ledger_transfer')
  const [c2] = await conn.query('SELECT COUNT(*) c FROM ext_ledger_entry')
  const [c3] = await conn.query('SELECT COUNT(*) c FROM ext_ledger_reversal')
  return { accounts: acc, transferTotal: Number(c1[0].c), entryTotal: Number(c2[0].c), reversalTotal: Number(c3[0].c) }
}

/** 等待入账排空：本批 transferNo 全部离开 PENDING/POSTING；返回实际等待秒数 */
async function waitDrain(conn, transferNos, timeoutSec) {
  const t0 = performance.now()
  const deadline = t0 + timeoutSec * 1000
  let stuck = null
  while (performance.now() < deadline) {
    const [rows] = await conn.query(
      `SELECT postStatus, COUNT(*) c FROM ext_ledger_transfer WHERE transferNo IN (?) AND postStatus IN (2,3) GROUP BY postStatus`,
      [transferNos],
    )
    stuck = Object.fromEntries(rows.map((r) => [String(r.postStatus), Number(r.c)]))
    if (Object.keys(stuck).length === 0) return { drained: true, stuck, waitSec: (performance.now() - t0) / 1000 }
    await sleep(1000)
  }
  return { drained: false, stuck, waitSec: (performance.now() - t0) / 1000 }
}

// ══════════════ 主流程 ══════════════
/** 等待全局入账排空（存量 PENDING/POSTING 清 0，保证基线后余额断言精确） */
async function waitQuiescent(conn, timeoutSec = 90) {
  const t0 = performance.now()
  while (performance.now() - t0 < timeoutSec * 1000) {
    const [rows] = await conn.query('SELECT COUNT(*) c FROM ext_ledger_transfer WHERE postStatus IN (2,3)')
    if (Number(rows[0].c) === 0) return true
    await sleep(1000)
  }
  return false
}

async function main() {
  fs.mkdirSync(RESULT_DIR, { recursive: true })
  const report = { cfg: CFG, startedAt: new Date().toISOString(), scenarios: {}, verify: null, pass: false }
  const tTotal0 = performance.now()

  console.log(`\n══════ extension-ledger 并发压测（${CFG.scale} 档）══════`)
  console.log(`count=${CFG.count} concurrency=${CFG.concurrency} amount=${CFG.amount} dup=${CFG.dup} overspend=${CFG.osCount}×${CFG.osAmount}`)

  // 1. 登录
  const token = await login()
  console.log('[1/6] 登录成功')

  // 2. 开户（幂等；拿到 user/merchant 账户 ID）
  let userId, merchantId
  if (!CFG.skipSetup) {
    const { json } = await apiJson(token, '/demo/ledger-spi/setup', { method: 'POST', body: '{}' })
    userId = json?.data?.user?.id
    merchantId = json?.data?.merchant?.id
    if (!userId || !merchantId) throw new Error(`开户失败: ${JSON.stringify(json)}`)
    console.log(`[2/6] 账户就绪 user=${userId.slice(0, 8)}… merchant=${merchantId.slice(0, 8)}…`)
  } else {
    const conn = await dbConnect()
    const [rows] = await conn.query(`SELECT id, holderId FROM ext_ledger_account WHERE holderId IN ('demo-user-001','demo-merchant-001') AND deleteAt IS NULL`)
    await conn.end()
    const byHolder = Object.fromEntries(rows.map((r) => [r.holderId, r.id]))
    userId = byHolder['demo-user-001']
    merchantId = byHolder['demo-merchant-001']
    if (!userId || !merchantId) throw new Error('--skip-setup 但找不到演示账户')
  }
  const acctIds = [userId, merchantId]

  // 3. 可选顶格（merchant→user refund 提升 user 可用余额，保证超支场景有足够空间）
  if (CFG.topup > 0) {
    const { json } = await apiJson(token, '/demo/ledger-spi/refund', {
      method: 'POST',
      body: JSON.stringify({ orderNo: `stress-topup-${Date.now()}`, amount: String(CFG.topup), reason: '压测顶格' }),
    })
    if (json?.code !== 0) throw new Error(`顶格失败: ${JSON.stringify(json)}`)
    console.log(`[2.5] 顶格：user 余额 +${CFG.topup}（merchant→user refund，待入账）`)
  }

  // 4. 基线快照（DB）——先等全局排空，保证后续余额断言精确
  const conn = await dbConnect()
  await waitQuiescent(conn)
  const baseline = await snapshot(conn, acctIds)
  const B = baseline.accounts
  console.log(
    `[3/6] 基线 user.balance=${B[userId].balance} totalOutcome=${B[userId].totalOutcome} | ` +
    `merchant.balance=${B[merchantId].balance} totalIncome=${B[merchantId].totalIncome} | ` +
    `transfers=${baseline.transferTotal} entries=${baseline.entryTotal}`,
  )

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const payUrl = '/demo/ledger-spi/pay'

  // ═══ 场景1：热行扇出 ═══
  console.log(`\n── 场景1 fanout：${CFG.count} 笔并发 pay（user→merchant, amount=${CFG.amount}）──`)
  const t1 = performance.now()
  const fanout = await runPool(() => {
    const jobs = []
    for (let i = 0; i < CFG.count; i++) {
      const orderNo = `stress-fanout-${CFG.scale}-${Date.now()}-${i}`
      jobs.push({ orderNo, url: `${API_BASE}${payUrl}`, headers, body: JSON.stringify({ orderNo, amount: CFG.amount }) })
    }
    return jobs
  }, CFG.concurrency)
  const fanoutDurMs = performance.now() - t1
  const fanoutOk = fanout.filter((r) => r.ok)
  const fanoutFail = fanout.filter((r) => !r.ok)
  const fanoutLat = fanout.map((r) => r.ms)
  const fanoutTransferNos = fanoutOk.map((r) => r.transferNo).filter(Boolean)
  const fanoutExpectTransfers = fanoutOk.length
  console.log(
    `  完成 ${fanout.length} 笔 / 成功制单 ${fanoutOk.length} / 失败 ${fanoutFail.length}` +
    ` / 耗时 ${fmtNum(fanoutDurMs / 1000, 2)}s / 吞吐 ${fmtNum(fanoutOk.length / (fanoutDurMs / 1000), 1)} req/s`,
  )
  console.log(`  时延 p50=${fmtNum(pct(fanoutLat, 50), 0)}ms p90=${fmtNum(pct(fanoutLat, 90), 0)}ms p99=${fmtNum(pct(fanoutLat, 99), 0)}ms max=${fmtNum(Math.max(...fanoutLat, 0), 0)}ms`)
  if (fanoutFail.length) {
    const errs = {}
    for (const r of fanoutFail) errs[`${r.status} ${r.msg}`] = (errs[`${r.status} ${r.msg}`] || 0) + 1
    console.log(`  失败明细: ${JSON.stringify(errs)}`)
  }
  report.scenarios.fanout = {
    total: CFG.count, success: fanoutOk.length, failed: fanoutFail.length, expectTransfers: fanoutExpectTransfers,
    durationMs: fanoutDurMs, throughputPerSec: fanoutOk.length / (fanoutDurMs / 1000),
    latency: { p50: pct(fanoutLat, 50), p90: pct(fanoutLat, 90), p99: pct(fanoutLat, 99), max: Math.max(...fanoutLat, 0) },
    failDetail: fanoutFail.reduce((m, r) => (m[`${r.status} ${r.msg}`] = (m[`${r.status} ${r.msg}`] || 0) + 1, m), {}),
  }

  // ═══ 场景2：幂等竞争 ═══
  console.log(`\n── 场景2 dup：${CFG.dup} 笔并发同 orderNo（应只有 1 张制单）──`)
  const dupOrderNo = `stress-dup-${CFG.scale}-${Date.now()}`
  const t2 = performance.now()
  const dup = await runPool(() =>
    Array.from({ length: CFG.dup }, (_, i) => ({ orderNo: dupOrderNo, url: `${API_BASE}${payUrl}`, headers, body: JSON.stringify({ orderNo: dupOrderNo, amount: CFG.amount }) })),
  CFG.concurrency)
  const dupDurMs = performance.now() - t2
  const dupCreated = dup.filter((r) => r.created === true).length
  const dupReturned = dup.filter((r) => r.created === false).length
  const dupTransferNo = dup.find((r) => r.transferNo)?.transferNo ?? null
  console.log(`  完成 ${dup.length} 笔 / created=true ${dupCreated} / created=false ${dupReturned} / 失败 ${dup.filter((r) => !r.ok).length} / transferNo=${dupTransferNo}`)
  report.scenarios.dup = { total: CFG.dup, createdTrue: dupCreated, createdFalse: dupReturned, failed: dup.filter((r) => !r.ok).length, orderNo: dupOrderNo, transferNo: dupTransferNo }

  // ═══ 场景3：超支拦截 ═══
  // 此刻账户余额已稳定（场景1/2 已入账）。并发总额 > 余额 → 恰好 floor(balance/amount) 笔放行
  const [balRow] = await conn.query('SELECT balance FROM ext_ledger_account WHERE id = ?', [userId])
  const osBalance = BigInt(balRow[0].balance)
  const osAmt = BigInt(CFG.osAmount)
  const osExpected = Number(osBalance / osAmt)
  console.log(`\n── 场景3 overspend：${CFG.osCount} 笔并发 pay amount=${CFG.osAmount}（余额 ${osBalance}，预计放行 ${osExpected} 笔）──`)
  const t3 = performance.now()
  const overspend = await runPool(() => {
    const jobs = []
    for (let i = 0; i < CFG.osCount; i++) {
      const orderNo = `stress-os-${CFG.scale}-${Date.now()}-${i}`
      jobs.push({ orderNo, url: `${API_BASE}${payUrl}`, headers, body: JSON.stringify({ orderNo, amount: CFG.osAmount }) })
    }
    return jobs
  }, CFG.concurrency)
  const osDurMs = performance.now() - t3
  const osOk = overspend.filter((r) => r.ok)
  const osInsufficient = overspend.filter((r) => r.msg.includes('余额不足'))
  const osOther = overspend.filter((r) => !r.ok && !r.msg.includes('余额不足'))
  const osTransferNos = osOk.map((r) => r.transferNo).filter(Boolean)
  console.log(
    `  完成 ${overspend.length} / 放行 ${osOk.length}（预计 ${osExpected}）/ 余额不足 ${osInsufficient.length} / 其他失败 ${osOther.length}` +
    ` / 耗时 ${fmtNum(osDurMs / 1000, 2)}s / 吞吐 ${fmtNum(osOk.length / (osDurMs / 1000), 1)} req/s`,
  )
  if (osOther.length) {
    const errs = {}
    for (const r of osOther) errs[`${r.status} ${r.msg}`] = (errs[`${r.status} ${r.msg}`] || 0) + 1
    console.log(`  其他失败明细: ${JSON.stringify(errs)}`)
  }
  report.scenarios.overspend = {
    total: CFG.osCount, success: osOk.length, expectedSuccess: osExpected, insufficient: osInsufficient.length,
    otherFailed: osOther.length, balanceBefore: osBalance.toString(), amount: CFG.osAmount,
    durationMs: osDurMs, throughputPerSec: osOk.length / (osDurMs / 1000),
  }

  // ═══ 场景4：多账户资金池（并发分布到 N 个账户，贴近真实生产多账户记账） ═══
  let poolAccountIds = []
  let poolTransferNos = []
  let pool = []
  let poolBalancesBefore = []
  let poolDurMs = 0
  if (CFG.poolCount > 0 && CFG.poolSize > 0) {
    console.log(`\n── 场景4 pool：${CFG.poolSize} 个资金池账户，${CFG.poolCount} 笔并发 pay-from（round-robin 分布，amount=${CFG.poolAmount}）──`)
    const { json: poolJson } = await apiJson(token, '/demo/ledger-spi/stress-pool', {
      method: 'POST',
      body: JSON.stringify({ size: CFG.poolSize, initialBalance: CFG.poolInitial }),
    })
    if (poolJson?.code !== 0) throw new Error(`资金池开户失败: ${JSON.stringify(poolJson)}`)
    poolAccountIds = poolJson.data.accounts.map((a) => a.id)
    // 开户后（制单前）快照各池账户余额，用于逐账户 delta 校验
    const [poolBal] = await conn.query('SELECT id, balance FROM ext_ledger_account WHERE id IN (?) AND deleteAt IS NULL', [poolAccountIds])
    poolBalancesBefore = Object.fromEntries(poolBal.map((r) => [r.id, BigInt(r.balance)]))
    const t4 = performance.now()
    pool = await runPool(() => {
      const jobs = []
      for (let i = 0; i < CFG.poolCount; i++) {
        const orderNo = `stress-pool-${CFG.scale}-${Date.now()}-${i}`
        jobs.push({
          orderNo,
          accountId: poolAccountIds[i % poolAccountIds.length],
          url: `${API_BASE}/demo/ledger-spi/pay-from`,
          headers,
          body: JSON.stringify({ accountId: poolAccountIds[i % poolAccountIds.length], orderNo, amount: CFG.poolAmount }),
        })
      }
      return jobs
    }, CFG.concurrency)
    poolDurMs = performance.now() - t4
    const poolOk = pool.filter((r) => r.ok)
    const poolFail = pool.filter((r) => !r.ok)
    poolTransferNos = poolOk.map((r) => r.transferNo).filter(Boolean)
    console.log(
      `  完成 ${pool.length} / 成功 ${poolOk.length} / 失败 ${poolFail.length} / 耗时 ${fmtNum(poolDurMs / 1000, 2)}s / 吞吐 ${fmtNum(poolOk.length / (poolDurMs / 1000), 1)} req/s`,
    )
    if (poolFail.length) {
      const errs = {}
      for (const r of poolFail) errs[`${r.status} ${r.msg}`] = (errs[`${r.status} ${r.msg}`] || 0) + 1
      console.log(`  失败明细: ${JSON.stringify(errs)}`)
    }
    report.scenarios.pool = {
      poolSize: poolAccountIds.length, total: CFG.poolCount, success: poolOk.length, failed: poolFail.length,
      amount: CFG.poolAmount, durationMs: poolDurMs, throughputPerSec: poolOk.length / (poolDurMs / 1000),
      failDetail: poolFail.reduce((m, r) => (m[`${r.status} ${r.msg}`] = (m[`${r.status} ${r.msg}`] || 0) + 1, m), {}),
    }
  }

  // ═══ 等待入账排空 ═══
  const allNos = [...fanoutTransferNos, ...(dupTransferNo ? [dupTransferNo] : []), ...osTransferNos, ...poolTransferNos]
  console.log(`\n[4/6] 等待入账排空（本批 ${allNos.length} 张制单）...`)
  const tDrain = performance.now()
  const drain = await waitDrain(conn, allNos, CFG.drainTimeoutSec)
  const drainSec = (performance.now() - tDrain) / 1000
  const drainedCount = allNos.length
  console.log(`  排空耗时 ${fmtNum(drainSec, 2)}s / 入账吞吐 ${fmtNum(drainedCount / drainSec, 1)} posts/s / 滞留 ${JSON.stringify(drain.stuck)}`)
  if (!drain.drained) console.error(`  ⚠️ 超时仍有滞留单: ${JSON.stringify(drain.stuck)}`)
  report.drain = { drained: drain.drained, waitSec: fmtNum(drainSec, 2), postsPerSec: drainedCount / drainSec, stuck: drain.stuck, totalTracked: drainedCount }

  // ═══ 数据正确性校验 ═══
  console.log(`\n[5/6] 数据正确性校验...`)
  const verify = await runVerify(conn, {
    userId, merchantId, acctIds, baseline, fanout, dup, dupTransferNo, dupOrderNo, overspend, osExpected,
    osAmount: CFG.osAmount, fanoutAmount: CFG.amount, allNos,
    pool, poolAccountIds, poolTransferNos, poolBalancesBefore, poolAmount: CFG.poolAmount,
  })
  report.verify = verify
  const failures = verify.checks.filter((c) => !c.pass)
  verify.pass = failures.length === 0

  // 独立交叉验证：调用包内对账服务（只读）
  console.log(`\n[6/6] 调用包内对账服务 /reconcile 交叉验证...`)
  const { json: rc } = await apiJson(token, '/demo/ledger-spi/reconcile', { method: 'POST', body: '{}' })
  const rcDiff = rc?.data?.diffCount ?? null
  const rcTotal = rc?.data?.totalAccounts ?? null
  verify.reconcileApi = { totalAccounts: rcTotal, diffCount: rcDiff, ok: rcDiff === 0 }
  if (rcDiff !== 0) verify.checks.push({ key: 'reconcile_api', desc: '包内对账服务 diffCount=0', pass: false, actual: rcDiff })
  verify.pass = verify.pass && rcDiff === 0

  await conn.end()

  report.pass = verify.pass
  report.durationSec = fmtNum((performance.now() - tTotal0) / 1000, 1)
  report.finishedAt = new Date().toISOString()

  // 输出
  const file = path.join(RESULT_DIR, `ledger-stress-${nowStamp()}.json`)
  fs.writeFileSync(file, JSON.stringify(report, null, 2))
  console.log(`\n报告: ${file}`)

  console.log('\n══════════ 数据正确性校验结果 ══════════')
  for (const c of verify.checks) console.log(`  ${c.pass ? '✅' : '❌'} ${c.desc}${c.pass ? '' : `  （期望=${c.expected ?? '?'} 实际=${c.actual ?? '?'}）`}`)
  console.log(`  对账服务 /reconcile: ${rcDiff === 0 ? `✅ 0 差异（${rcTotal} 账户）` : `❌ ${rcDiff} 差异`}`)
  console.log('\n══════════════════════════════════════')
  if (verify.pass) console.log('🎉 压测通过：抗并发正确性全部满足')
  else {
    console.error(`❌ 存在 ${failures.length} 项校验失败，详见报告`)
    process.exitCode = 1
  }
}

// ══════════════ 数据校验 ══════════════
async function runVerify(conn, v) {
  const checks = []
  const push = (key, desc, pass, actual, expected) => checks.push({ key, desc, pass, actual, expected })

  // 1. 场景1 制单数 == 成功数（每笔成功预占必落一张 transfer）
  const [tr] = await conn.query(
    'SELECT COUNT(*) c FROM ext_ledger_transfer WHERE transferNo IN (?)', [v.fanout.map((r) => r.transferNo).filter(Boolean)],
  )
  push('fanout_transfer_count', `fanout 制单数=${v.fanout.filter((r) => r.ok).length}`, Number(tr[0].c) === v.fanout.filter((r) => r.ok).length, Number(tr[0].c), v.fanout.filter((r) => r.ok).length)

  // 2. 场景1 每笔 POSTED：无滞留、无失败单
  const [ts] = await conn.query(
    `SELECT postStatus, COUNT(*) c FROM ext_ledger_transfer WHERE transferNo IN (?) GROUP BY postStatus`, [v.fanout.map((r) => r.transferNo).filter(Boolean)],
  )
  const tsMap = Object.fromEntries(ts.map((r) => [String(r.postStatus), Number(r.c)]))
  push('fanout_all_posted', 'fanout 全部 POSTED=4 且无 FAILED/PENDING/POSTING 滞留', tsMap['4'] === v.fanout.filter((r) => r.ok).length && !tsMap['2'] && !tsMap['3'] && !tsMap['5'], JSON.stringify(tsMap), `4=${v.fanout.filter((r) => r.ok).length}`)

  // 3. 场景1 分录：每张 POSTED 单 2 条分录，ΣsignedAmount=0（借贷平衡）
  const [en] = await conn.query(
    `SELECT transferNo, COUNT(*) c, COALESCE(SUM(signedAmount),0) s FROM ext_ledger_entry WHERE transferNo IN (?) GROUP BY transferNo`, [v.fanout.map((r) => r.transferNo).filter(Boolean)],
  )
  const entryPerTransferBad = en.filter((e) => e.c !== 2 || BigInt(e.s) !== 0n)
  push('fanout_entry_balance', 'fanout 每张单恰 2 条分录且 ΣsignedAmount=0（借贷平衡）', entryPerTransferBad.length === 0, `坏单=${entryPerTransferBad.length}`, '0')

  // 4. 场景2 幂等：DB 只有 1 张单
  const [dt] = await conn.query(`SELECT COUNT(*) c FROM ext_ledger_transfer WHERE bizRef = ?`, [`demo-order-${v.dupOrderNo}`])
  push('dup_unique_transfer', `幂等：同 orderNo 并发后 DB 仅 1 张制单`, Number(dt[0].c) === 1, Number(dt[0].c), 1)

  // 5. 场景2 幂等：created=true 恰好 1 个，且无请求失败（其余均为 created=false 幂等返回）
  push('dup_created_once', `幂等：created=true 恰好 1 个响应`, v.dup.filter((r) => r.created === true).length === 1, v.dup.filter((r) => r.created === true).length, 1)
  push('dup_no_failure', `幂等：其余请求均 created=false 幂等返回（0 失败）`, v.dup.filter((r) => !r.ok).length === 0, v.dup.filter((r) => !r.ok).length, 0)

  // 6. 场景3 超支拦截：放行数 == floor(balance/amount)，且无其他失败
  push('overspend_expected', `超支拦截：放行=${v.overspend.filter((r) => r.ok).length} == floor(余额/金额)=${v.osExpected}`, v.overspend.filter((r) => r.ok).length === v.osExpected, v.overspend.filter((r) => r.ok).length, v.osExpected)
  const osOther = v.overspend.filter((r) => !r.ok && !r.msg.includes('余额不足'))
  push('overspend_no_other_error', `超支场景无预期外失败（其余均为 余额不足）`, osOther.length === 0, osOther.length, 0)

  // 7. 余额守恒：user 变化 == -放行总额（制单即预占扣减），merchant 变化 == +放行总额（入账后累计）
  const [after] = await conn.query(
    'SELECT id, balance, frozen, pendingOut, totalIncome, totalOutcome FROM ext_ledger_account WHERE id IN (?) AND deleteAt IS NULL', [v.acctIds],
  )
  const afterMap = Object.fromEntries(after.map((r) => [r.id, r]))
  const B = v.baseline.accounts
  const fanoutAmt = BigInt(v.fanoutAmount)
  const fanoutTotal = fanoutAmt * BigInt(v.fanout.filter((r) => r.ok).length)
  const osAmt = BigInt(v.osAmount)
  const osPaid = osAmt * BigInt(v.osExpected)
  const dupPaid = fanoutAmt * BigInt(v.dup.filter((r) => r.created === true).length)
  const poolAmt = BigInt(v.poolAmount ?? '0')
  const poolPaid = poolAmt * BigInt((v.pool ?? []).filter((r) => r.ok).length)
  const expectedUserDelta = -(fanoutTotal + osPaid + dupPaid)
  const actualUserDelta = BigInt(afterMap[v.userId].balance) - BigInt(B[v.userId].balance)
  push(
    'user_balance_delta', `user.balance 变化 == -Σ放行额（${(expectedUserDelta).toString()}）`, actualUserDelta === expectedUserDelta,
    actualUserDelta.toString(), expectedUserDelta.toString(),
  )
  const expectedMerchantDelta = fanoutTotal + osPaid + dupPaid + poolPaid
  const actualMerchantDelta = BigInt(afterMap[v.merchantId].balance) - BigInt(B[v.merchantId].balance)
  push(
    'merchant_balance_delta', `merchant.balance 变化 == +Σ放行额（${expectedMerchantDelta.toString()}）`, actualMerchantDelta === expectedMerchantDelta,
    actualMerchantDelta.toString(), expectedMerchantDelta.toString(),
  )
  // 累计口径：totalIncome(merchant) +totalOutcome(user) 同步反映放行总额
  const actualIncomeDelta = BigInt(afterMap[v.merchantId].totalIncome) - BigInt(B[v.merchantId].totalIncome)
  const actualOutcomeDelta = BigInt(afterMap[v.userId].totalOutcome) - BigInt(B[v.userId].totalOutcome)
  push('merchant_total_income_delta', `merchant.totalIncome 变化 == +Σ放行额`, actualIncomeDelta === expectedMerchantDelta, actualIncomeDelta.toString(), expectedMerchantDelta.toString())
  // user.totalOutcome 只含 user 自身放行（fanout+dup+overspend），pool 从资金池账户出账不经过 user
  push('user_total_outcome_delta', `user.totalOutcome 变化 == +user 自身放行额`, actualOutcomeDelta === -expectedUserDelta, actualOutcomeDelta.toString(), (-expectedUserDelta).toString())
  // 待入账桶干净：pendingOut/frozen 归零
  push(
    'no_pending_out', `user/merchant pendingOut+frozen 归零`, afterMap[v.userId].pendingOut === 0 && afterMap[v.merchantId].pendingOut === 0 && afterMap[v.userId].frozen === 0 && afterMap[v.merchantId].frozen === 0,
    `${afterMap[v.userId].pendingOut}/${afterMap[v.userId].frozen}`, '0/0',
  )

  // 7b. 多账户资金池：全部 POSTED + 逐账户余额变化 == -该户放行总额
  if (v.poolAccountIds && v.poolAccountIds.length > 0) {
    const poolNos = v.poolTransferNos ?? []
    const [pstat] = await conn.query(
      `SELECT postStatus, COUNT(*) c FROM ext_ledger_transfer WHERE transferNo IN (?) GROUP BY postStatus`, [poolNos],
    )
    const pstatMap = Object.fromEntries(pstat.map((r) => [String(r.postStatus), Number(r.c)]))
    push('pool_all_posted', `pool ${poolNos.length} 张单全部 POSTED=4 且无滞留/失败`, pstatMap['4'] === poolNos.length && !pstatMap['2'] && !pstatMap['3'] && !pstatMap['5'], JSON.stringify(pstatMap), `4=${poolNos.length}`)

    // 每户放行笔数 = round-robin 分配计数
    const perAcct = {}
    for (const r of v.pool) if (r.ok && r.accountId) perAcct[r.accountId] = (perAcct[r.accountId] || 0) + 1
    const [pa] = await conn.query('SELECT id, balance FROM ext_ledger_account WHERE id IN (?) AND deleteAt IS NULL', [v.poolAccountIds])
    const poolDeltaBad = []
    for (const row of pa) {
      const before = v.poolBalancesBefore?.[row.id]
      if (before === undefined) continue
      const paid = BigInt(perAcct[row.id] || 0) * poolAmt
      const after = BigInt(row.balance)
      if (before - after !== paid) poolDeltaBad.push({ id: row.id, before: before.toString(), after: after.toString(), paid: paid.toString() })
    }
    push('pool_account_delta', `pool 逐账户余额变化 == -该户放行总额（${v.poolAccountIds.length} 户）`, poolDeltaBad.length === 0, `坏账户=${poolDeltaBad.length}`, '0')
  }

  // 8. 对账恒等式（全账户，包内公式）：balance+frozen+pendingOut == Σ(signedAmount)
  const [accounts] = await conn.query('SELECT id, balance, frozen, pendingOut FROM ext_ledger_account WHERE deleteAt IS NULL')
  const reconcileDiffs = []
  for (const a of accounts) {
    const [s] = await conn.query('SELECT COALESCE(SUM(signedAmount),0) s FROM ext_ledger_entry WHERE accountId = ?', [a.id])
    const lhs = BigInt(a.balance) + BigInt(a.frozen) + BigInt(a.pendingOut)
    const diff = lhs - BigInt(s[0].s)
    if (diff !== 0n) reconcileDiffs.push({ accountId: a.id, diff: diff.toString(), balance: a.balance.toString(), entrySum: s[0].s })
  }
  push('reconcile_identity_all_accounts', `对账恒等式：全 ${accounts.length} 账户 balance+frozen+pendingOut≡Σ(signedAmount)`, reconcileDiffs.length === 0, `差异账户=${reconcileDiffs.length}`, '0')

  // 9. 本次压测全部制单：每张单分录 ΣsignedAmount==0（借贷平衡）
  //    注：不做「全局 Σ==0」断言——开户初始余额为单边入账（ledger_open_account 无对应贷方），
  //    全局累加等于系统内全部开立资金，非零属设计预期；每账户恒等式才是核心不变量。
  const testTransferNos = [...v.fanout.map((r) => r.transferNo).filter(Boolean), ...(v.dupTransferNo ? [v.dupTransferNo] : []), ...v.overspend.map((r) => r.transferNo).filter(Boolean), ...(v.poolTransferNos ?? [])]
  const [tse] = await conn.query(
    `SELECT COUNT(*) c, COALESCE(SUM(signedAmount),0) s FROM ext_ledger_entry WHERE transferNo IN (?)`, [testTransferNos],
  )
  const tseByTransfer = await conn.query(
    `SELECT transferNo, COUNT(*) c, COALESCE(SUM(signedAmount),0) s FROM ext_ledger_entry WHERE transferNo IN (?) GROUP BY transferNo`, [testTransferNos],
  ).then(([rows]) => rows.filter((r) => r.c !== 2 || BigInt(r.s) !== 0n))
  push('test_transfers_double_entry', `本次压测 ${testTransferNos.length} 张制单全部借贷平衡（每单恰 2 分录且 Σ=0）`, tseByTransfer.length === 0, `坏单=${tseByTransfer.length}`, '0')

  // 10. 无负数余额（全账户）
  const [neg] = await conn.query('SELECT COUNT(*) c FROM ext_ledger_account WHERE deleteAt IS NULL AND (balance < 0 OR frozen < 0 OR pendingOut < 0)')
  push('no_negative_balance', `无账户余额/冻结/在途为负`, Number(neg[0].c) === 0, Number(neg[0].c), 0)

  return { checks, accountsChecked: accounts.length, reconcileDiffs }
}

main().catch((e) => {
  console.error(`\n❌ 压测执行失败: ${e?.stack || e}`)
  process.exit(1)
})
