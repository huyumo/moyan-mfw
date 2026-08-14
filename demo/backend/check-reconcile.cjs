require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  // 查两份报告
  const [reports] = await conn.query(
    `SELECT id, triggerType, totalAccounts, diffCount, diffs, status, operatorId, notes, createdAt FROM ext_ledger_reconcile_report WHERE id IN (?, ?)`,
    ['425345f1-2aa0-49c7-911e-0cadca6a83b4', 'c7f01a79-be21-4069-bf5a-0b95a854ff8d']
  );
  for (const r of reports) {
    console.log('=== 报告', r.id, '| 状态', r.status, '| diffCount', r.diffCount, '| 时间', r.createdAt.toISOString());
    console.log('diffs:', JSON.stringify(r.diffs, null, 1).slice(0, 1200));
  }
  await conn.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
