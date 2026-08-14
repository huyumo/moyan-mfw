require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const [rows] = await conn.query(
    `SELECT entryNo, transferNo, direction, signedAmount, extra, createdAt FROM ext_ledger_entry WHERE accountId = ? ORDER BY id`,
    ['eb3cc2f5-3e12-4ae2-9473-718767aafc3d']
  );
  let sum = 0n;
  for (const r of rows) { sum += BigInt(r.signedAmount); console.log(r.entryNo, 'signed=' + r.signedAmount, 'extra=' + JSON.stringify(r.extra), new Date(r.createdAt).toISOString().slice(0,19)); }
  console.log('SIGMA=' + sum.toString());
  const [acc] = await conn.query(`SELECT balance, totalIncome, totalOutcome FROM ext_ledger_account WHERE id = ?`, ['eb3cc2f5-3e12-4ae2-9473-718767aafc3d']);
  console.log('ACCOUNT balance=' + acc[0].balance + ' income=' + acc[0].totalIncome + ' outcome=' + acc[0].totalOutcome);
  await conn.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
