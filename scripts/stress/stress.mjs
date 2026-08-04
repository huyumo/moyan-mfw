#!/usr/bin/env node
/**
 * @fileoverview 调度器 6 实例压测编排脚本
 * @description 先种数据 → 再启动实例（保证预加载限流快路径生效），全程采样监控系统指标
 *
 * 子命令：
 *   clean    - 清空 ext_scheduler_task_instance/_task_log/_executor 三表
 *   config   - SQL 写入压测配置（restartBatchSize/restartBatchDelayMs，启动前生效）
 *   seed     - 批量种入 N 条 PENDING 压测任务（taskCode=stress.worker）
 *   start    - pm2 启动 6 实例 + 等待 6 个执行器心跳
 *   apiconfig- 登录 admin → API GET/PUT 配置（验证页面可配置的真实路径）
 *   monitor  - 2s 采样：任务状态/吞吐/每实例 CPU·内存/系统/磁盘·网络/MySQL/心跳，输出汇总报告
 *   stop     - pm2 停止 + 恢复默认配置（SQL + API 双路径）
 *   run      - 一键执行 clean → config → seed → start → apiconfig → monitor → stop
 *
 * 示例：node scripts/stress/stress.mjs run --count 10000 --sleep 50
 */

import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import os from 'os'
import fs from 'fs'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const DEMO_DIR = path.join(REPO_ROOT, 'demo/backend')
const RESULT_DIR = path.join(__dirname, 'results')
const STATE_FILE = path.join(RESULT_DIR, 'state.json')
const PM2_CONFIG = path.join(__dirname, 'pm2-stress.config.cjs')
const INSTANCE_NAMES = Array.from({ length: 6 }, (_, i) => `scheduler-stress-i${i + 1}`)

// ── 依赖锚定（demo/backend 声明了 mysql2/redis） ──
const require = createRequire(path.join(DEMO_DIR, 'package.json'))
const mysql = require('mysql2/promise')

// ── 简易 .env 解析 ──
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
const CMD = ARGS._[0] || 'run'
const NUM = (v, d) => (v === undefined || v === true ? d : Number(v))

// ── 工具函数 ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-')
const fmtMB = (b) => (b / 1024 / 1024).toFixed(1) + 'MB'
const fmtNum = (n, d = 1) => (n ?? 0).toFixed(d)

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
}
function shOut(cmd) {
  try { return sh(cmd) } catch (e) { return String(e.stdout || '') + String(e.stderr || '') }
}

const dbConnect = () => mysql.createConnection({ ...DB, connectTimeout: 10000 })

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON */ }
  return { status: res.status, json, text }
}

async function login() {
  const { json } = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD }),
  })
  const data = json?.data ?? json
  const token = data?.accessToken || data?.token
  if (!token) throw new Error(`登录失败: ${json?.message || '未知错误'}`)
  return token
}

// ══════════════ 子命令：clean ══════════════
async function clean() {
  const conn = await dbConnect()
  try {
    await conn.query('DELETE FROM ext_scheduler_task_instance')
    await conn.query('DELETE FROM ext_scheduler_task_log')
    await conn.query('DELETE FROM ext_scheduler_executor')
    console.log('[clean] 已清空 instance/log/executor 三表')
  } finally { await conn.end() }
}

// ══════════════ 子命令：config（SQL，启动前生效） ══════════════
async function config() {
  const batch = NUM(ARGS.batch, 300)
  const delay = NUM(ARGS.delay, 500)
  const conn = await dbConnect()
  try {
    await conn.query(
      'UPDATE ext_scheduler_config SET restartBatchSize=?, restartBatchDelayMs=? WHERE configKey=?',
      [batch, delay, 'global'],
    )
    const [rows] = await conn.query('SELECT restartBatchSize, restartBatchDelayMs FROM ext_scheduler_config WHERE configKey=?', ['global'])
    console.log(`[config] SQL 已写入: restartBatchSize=${rows[0].restartBatchSize}, restartBatchDelayMs=${rows[0].restartBatchDelayMs}`)
  } finally { await conn.end() }
}

// ══════════════ 子命令：seed ══════════════
async function seed() {
  const count = NUM(ARGS.count, 10000)
  const sleepMs = NUM(ARGS.sleep, 50)
  const chunk = 500
  const conn = await dbConnect()
  try {
    const now = new Date()
    const base = 'INSERT INTO ext_scheduler_task_instance (id, taskCode, entityId, payload, executeAt, status, retryCount, triggerType, createdAt) VALUES ?'
    for (let i = 0; i < count; i += chunk) {
      const rows = []
      for (let j = 0; j < chunk && i + j < count; j++) {
        rows.push([
          crypto.randomUUID(),
          'stress.worker',
          null,
          JSON.stringify({ sleepMs }),
          now,
          1, // PENDING
          0,
          1, // AUTO
          now,
        ])
      }
      await conn.query(base, [rows])
      const done = Math.min(i + chunk, count)
      if (done % 2000 === 0 || done === count) console.log(`[seed] 已种入 ${done}/${count}`)
    }
    const [after] = await conn.query('SELECT COUNT(*) c FROM ext_scheduler_task_instance WHERE taskCode=?', ['stress.worker'])
    if (Number(after[0].c) !== count) throw new Error(`种子数量校验失败: 期望 ${count}, 实际 ${after[0].c}`)
    fs.mkdirSync(RESULT_DIR, { recursive: true })
    fs.writeFileSync(STATE_FILE, JSON.stringify({ seedTs: Date.now(), total: count, sleepMs }))
    console.log(`[seed] ✅ 完成: ${count} 条 PENDING 任务 (sleepMs=${sleepMs})`)
  } finally { await conn.end() }
}

// ══════════════ 子命令：start ══════════════
async function start() {
  const waitSec = NUM(ARGS.wait, 180)
  sh(`pm2 start ${PM2_CONFIG}`)
  console.log('[start] pm2 已启动 6 实例，等待服务就绪...')
  const deadline = Date.now() + waitSec * 1000
  while (Date.now() < deadline) {
    try {
      const token = await login()
      const { json } = await fetchJson(`${API_BASE}/ext/scheduler/executors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = json?.data ?? json
      const list = Array.isArray(data) ? data : data?.list ?? data?.executors ?? []
      if (list.length >= 6) {
        console.log(`[start] ✅ 6 个执行器心跳已注册: ${list.map((e) => e.executorId?.split('-')[0]).join(', ')}`)
        return token
      }
      console.log(`[start] 存活执行器 ${list.length}/6 ...`)
    } catch { /* 服务未就绪 */ }
    await sleep(3000)
  }
  throw new Error('[start] 等待 6 实例心跳超时')
}

// ══════════════ 子命令：apiconfig ══════════════
async function apiconfig() {
  const token = await login()
  const batch = NUM(ARGS.batch, 300)
  const delay = NUM(ARGS.delay, 500)
  const headers = { Authorization: `Bearer ${token}` }
  const { json: g1 } = await fetchJson(`${API_BASE}/ext/scheduler/config`, { headers })
  console.log(`[apiconfig] GET 当前配置: batch=${g1?.data?.restartBatchSize}, delay=${g1?.data?.restartBatchDelayMs}`)
  const { json: p } = await fetchJson(`${API_BASE}/ext/scheduler/config`, {
    method: 'PUT', headers,
    body: JSON.stringify({ restartBatchSize: batch, restartBatchDelayMs: delay }),
  })
  console.log(`[apiconfig] PUT 压测配置: ${p?.message || 'ok'}`)
  const { json: g2 } = await fetchJson(`${API_BASE}/ext/scheduler/config`, { headers })
  console.log(`[apiconfig] GET 验证: batch=${g2?.data?.restartBatchSize}, delay=${g2?.data?.restartBatchDelayMs}`)
}

// ══════════════ 监控采集 ══════════════

const PS_COUNTER_FILE = path.join(__dirname, 'perf-counters.ps1')

function powerCounter() {
  try {
    const out = shOut(`powershell -NoProfile -ExecutionPolicy Bypass -File "${PS_COUNTER_FILE}"`)
    const lines = out.split('\n').filter(l => l.startsWith('{'))
    if (lines.length === 0) return null
    const j = JSON.parse(lines[0])
    return { disk: j.disk ?? 0, net: j.net ?? 0 }
  } catch {
    return null
  }
}

function cpuSample() {
  const cpus = os.cpus()
  let idle = 0, total = 0
  for (const c of cpus) {
    for (const t of Object.values(c.times)) total += t
    idle += c.times.idle
  }
  return { idle, total }
}

function pm2Snapshot() {
  try {
    const list = JSON.parse(shOut('pm2 jlist'))
    const map = {}
    for (const p of list) {
      if (INSTANCE_NAMES.includes(p.name)) {
        map[p.name] = { cpu: p.monit?.cpu ?? 0, mem: p.monit?.memory ?? 0, status: p.pm2_env?.status, restarts: p.pm2_env?.restart_time ?? 0 }
      }
    }
    return map
  } catch { return {} }
}

// ══════════════ 子命令：monitor ══════════════
async function monitor() {
  const stabilize = NUM(ARGS.stabilize, 30)
  const timeoutSec = NUM(ARGS.timeout, 600)
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  const total = state.total
  fs.mkdirSync(RESULT_DIR, { recursive: true })
  const sampleFile = path.join(RESULT_DIR, `samples-${nowStamp()}.jsonl`)
  const summaryFile = path.join(RESULT_DIR, `summary-${nowStamp()}.json`)

  const conn = await dbConnect()
  const sampleStart = Date.now()
  let prevCpu = cpuSample()
  let lastQuestions = null
  let lastCounterAt = 0
  let counterCache = null
  let lastTerminal = 0
  let lastSampleAt = Date.now()
  let firstTerminalAt = null
  let drain95Sec = null
  let drain100At = null
  let drain100Sec = null
  const samples = []
  const doneAt = { value: null }

  console.log(`[monitor] 开始监控: 总任务=${total}, 稳定期=${stabilize}s, 超时=${timeoutSec}s`)
  const deadline = Date.now() + timeoutSec * 1000

  while (Date.now() < deadline) {
    // 1. DB：状态分布 / 存活执行器 / MySQL 全局状态
    const [statusRows] = await conn.query('SELECT status, COUNT(*) c FROM ext_scheduler_task_instance GROUP BY status')
    const status = Object.fromEntries(statusRows.map((r) => [String(r.status), Number(r.c)]))
    const [execRows] = await conn.query(
      'SELECT COUNT(*) c FROM ext_scheduler_executor WHERE deleteAt IS NULL AND lastHeartbeat > NOW() - INTERVAL 90 SECOND',
    )
    const [stRows] = await conn.query(
      "SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected','Threads_running','Questions')",
    )
    const st = Object.fromEntries(stRows.map((r) => [r.Variable_name, Number(r.Value)]))

    // 2. 系统 + 每实例
    const cpu = cpuSample()
    const cpuPct = 100 * (1 - (cpu.idle - prevCpu.idle) / (cpu.total - prevCpu.total))
    prevCpu = cpu
    const memPct = 100 * (1 - os.freemem() / os.totalmem())
    const pm2 = pm2Snapshot()

    // 3. 磁盘/网络（每 5s 采样一次）
    if (Date.now() - lastCounterAt > 4000) {
      counterCache = powerCounter()
      lastCounterAt = Date.now()
    }

    // 4. 吞吐
    const now = Date.now()
    const dt = (now - lastSampleAt) / 1000
    const terminal = [3, 4, 5, 6, 7].reduce((s, k) => s + (status[String(k)] || 0), 0)
    const tps = dt > 0 ? (terminal - lastTerminal) / dt : 0
    const tSec = (now - sampleStart) / 1000
    const tps10 = samples.length >= 5 ? (terminal - samples[samples.length - 5].terminal) / Math.min(tSec, 10) : tps
    const qps = lastQuestions != null && dt > 0 ? (st.Questions - lastQuestions) / dt : 0
    lastQuestions = st.Questions

    if (terminal > 0 && firstTerminalAt === null) firstTerminalAt = now
    if (drain95Sec === null && terminal >= total * 0.95) drain95Sec = (now - state.seedTs) / 1000
    if (drain100At === null && terminal >= total) { drain100At = now; drain100Sec = (now - state.seedTs) / 1000 }

    const sample = {
      t: fmtNum(tSec),
      status,
      terminal,
      pending: status['1'] || 0,
      running: status['2'] || 0,
      tps: fmtNum(tps),
      tps10: fmtNum(tps10),
      executors: Number(execRows[0].c),
      mysql: { conn: st.Threads_connected, running: st.Threads_running, qps: fmtNum(qps) },
      pm2,
      sys: {
        cpu: fmtNum(cpuPct),
        memPct: fmtNum(memPct),
        diskMBps: counterCache ? fmtNum(counterCache.disk / 1024 / 1024) : null,
        netMBps: counterCache ? fmtNum(counterCache.net / 1024 / 1024) : null,
      },
    }
    samples.push(sample)
    fs.appendFileSync(sampleFile, JSON.stringify(sample) + '\n')

    const pm2Line = Object.values(pm2).length
      ? Object.entries(pm2).map(([n, v]) => `${n}=${v.cpu}%/${fmtMB(v.mem)}`).join(' ')
      : 'pm2 无数据'
    console.log(
      `[t=${sample.t}s] 终态=${terminal}/${total} 瞬时=${sample.tps}/s 10s均=${sample.tps10}/s | ` +
      `PENDING=${sample.pending} RUNNING=${sample.running} 存活=${sample.executors} | ` +
      `系统CPU=${sample.sys.cpu}% 内存=${sample.sys.memPct}%` +
      (sample.sys.diskMBps ? ` 磁盘=${sample.sys.diskMBps}MB/s 网络=${sample.sys.netMBps}MB/s` : '') +
      ` | MySQL 连接=${sample.mysql.conn} 运行=${sample.mysql.running} QPS=${sample.mysql.qps}` +
      `\n    ${pm2Line}`,
    )

    lastSampleAt = now
    lastTerminal = terminal

    if (drain100At !== null && now - drain100At > stabilize * 1000) {
      doneAt.value = true
      console.log(`[monitor] ✅ 100% 终态已稳定 ${stabilize}s，结束采样`)
      break
    }
    await sleep(2000)
  }

  // ── 汇总 ──
  const [finalRows] = await conn.query('SELECT status, COUNT(*) c FROM ext_scheduler_task_instance GROUP BY status')
  const finalStatus = Object.fromEntries(finalRows.map((r) => [String(r.status), Number(r.c)]))
  const [execDist] = await conn.query(
    'SELECT executor, COUNT(*) c FROM ext_scheduler_task_instance WHERE status IN (3,4,5,6,7) GROUP BY executor ORDER BY c DESC',
  )
  await conn.end()

  const success = finalStatus['3'] || 0
  const failed = (finalStatus['4'] || 0) + (finalStatus['6'] || 0) + (finalStatus['7'] || 0)
  const pm2Peak = { cpu: 0, mem: 0 }
  const sysPeak = { cpu: 0, memPct: 0, diskMBps: 0, netMBps: 0 }
  const mysqlPeak = { conn: 0, running: 0, qps: 0 }
  let tpsPeak = 0, tpsPeak10 = 0
  for (const s of samples) {
    tpsPeak = Math.max(tpsPeak, parseFloat(s.tps))
    tpsPeak10 = Math.max(tpsPeak10, parseFloat(s.tps10))
    for (const p of Object.values(s.pm2)) {
      pm2Peak.cpu = Math.max(pm2Peak.cpu, p.cpu)
      pm2Peak.mem = Math.max(pm2Peak.mem, p.mem)
    }
    sysPeak.cpu = Math.max(sysPeak.cpu, parseFloat(s.sys.cpu))
    sysPeak.memPct = Math.max(sysPeak.memPct, parseFloat(s.sys.memPct))
    if (s.sys.diskMBps) sysPeak.diskMBps = Math.max(sysPeak.diskMBps, parseFloat(s.sys.diskMBps))
    if (s.sys.netMBps) sysPeak.netMBps = Math.max(sysPeak.netMBps, parseFloat(s.sys.netMBps))
    mysqlPeak.conn = Math.max(mysqlPeak.conn, s.mysql.conn)
    mysqlPeak.running = Math.max(mysqlPeak.running, s.mysql.running)
    mysqlPeak.qps = Math.max(mysqlPeak.qps, parseFloat(s.mysql.qps))
  }
  const drainSec = drain100Sec ?? fmtNum((Date.now() - state.seedTs) / 1000)
  const summary = {
    total,
    success,
    failed,
    cancelled: finalStatus['5'] || 0,
    successRate: total ? ((success / total) * 100).toFixed(2) + '%' : '0%',
    peakTps: fmtNum(tpsPeak),
    peakTps10: fmtNum(tpsPeak10),
    avgTps: drain100Sec ? fmtNum(total / drain100Sec) : fmtNum(total / ((Date.now() - state.seedTs) / 1000)),
    drain95Sec: drain95Sec != null ? fmtNum(drain95Sec) : null,
    drain100Sec: fmtNum(drainSec),
    firstTerminalDelayMs: firstTerminalAt ? firstTerminalAt - state.seedTs : null,
    executorDistribution: execDist.map((r) => ({ executor: r.executor, count: r.c })),
    pm2Peak,
    sysPeak,
    mysqlPeak,
    sampleCount: samples.length,
    completed: !!doneAt.value,
    sampleFile: path.basename(sampleFile),
  }
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))

  console.log('\n══════════ 压测汇总报告 ══════════')
  console.log(`总任务: ${total} | 成功: ${success} (${summary.successRate}) | 失败/超时: ${failed} | 取消: ${summary.cancelled}`)
  console.log(`吞吐峰值: ${summary.peakTps}/s | 10s 滑动峰值: ${summary.peakTps10}/s | 全程均值: ${summary.avgTps}/s`)
  console.log(`排空 95%: ${summary.drain95Sec ?? '未达到'}s | 100%: ${summary.drain100Sec}s（从种入起算）`)
  console.log(`实例 CPU 峰值: ${pm2Peak.cpu}% | 实例内存峰值: ${fmtMB(pm2Peak.mem)}`)
  console.log(`系统 CPU 峰值: ${sysPeak.cpu}% | 内存峰值: ${sysPeak.memPct}% | 磁盘峰值: ${sysPeak.diskMBps}MB/s | 网络峰值: ${sysPeak.netMBps}MB/s`)
  console.log(`MySQL 峰值: 连接=${mysqlPeak.conn} 运行线程=${mysqlPeak.running} QPS=${mysqlPeak.qps}`)
  console.log('分片分布（按 executor）:')
  for (const d of execDist) console.log(`  ${d.executor}: ${d.c} 条`)
  console.log(`采样明细: ${sampleFile}`)
  console.log(`汇总 JSON: ${summaryFile}`)
  console.log('══════════════════════════════════')
}

// ══════════════ 子命令：stop ══════════════
async function stop() {
  try {
    sh(`pm2 delete ${INSTANCE_NAMES.join(' ')}`)
    console.log('[stop] pm2 6 实例已删除')
  } catch (e) { console.log(`[stop] pm2 删除失败: ${e.message}`) }
  try {
    const conn = await dbConnect()
    await conn.query('UPDATE ext_scheduler_config SET restartBatchSize=200, restartBatchDelayMs=2000 WHERE configKey=?', ['global'])
    await conn.end()
    console.log('[stop] 配置已恢复默认（restartBatchSize=200, restartBatchDelayMs=2000）')
  } catch (e) { console.log(`[stop] SQL 恢复配置失败: ${e.message}`) }
  try {
    const token = await login()
    await fetchJson(`${API_BASE}/ext/scheduler/config`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ restartBatchSize: 200, restartBatchDelayMs: 2000 }),
    })
    console.log('[stop] API 恢复配置完成')
  } catch { /* 实例已停止，API 不可达属正常 */ }
}

// ══════════════ 一键 run ══════════════
async function run() {
  const all = ['clean', 'config', 'seed', 'start', 'apiconfig', 'monitor']
  const only = ARGS._.slice(1).filter((s) => all.includes(s))
  const steps = only.length ? only : all
  const skipStop = ARGS['skip-stop'] === true
  const t0 = Date.now()
  for (const step of steps) {
    console.log(`\n──── 步骤 ${step} ────`)
    try {
      await { clean, config, seed, start, apiconfig, monitor }[step]()
    } catch (e) {
      console.error(`[run] 步骤 ${step} 失败: ${e.message}`)
      if (step === 'monitor') {
        console.log('[run] monitor 异常，现场保留（实例未停止），可手工执行 stop')
        process.exitCode = 1
        return
      }
      throw e
    }
  }
  if (!skipStop) {
    console.log(`\n──── 步骤 stop ────`)
    await stop()
  }
  console.log(`\n[run] 总耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

const COMMANDS = { clean, config, seed, start, apiconfig, monitor, stop, run }
COMMANDS[CMD]().catch((e) => {
  console.error(`\n❌ 执行失败: ${e.message}`)
  process.exit(1)
})
