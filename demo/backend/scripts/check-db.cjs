const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'moyan_mfw' });
  const [rows] = await conn.query('SELECT transferNo, bizType, needReview, auditStatus, postStatus, holdType, amount, fromAccountId, reversedFromTransferNo, retryCount FROM ext_ledger_transfer ORDER BY createdAt DESC LIMIT 8');
  console.table(rows);
  const [acc] = await conn.query('SELECT id, balance, frozen, pendingOut, totalIncome, totalOutcome FROM ext_ledger_account');
  console.table(acc);
  await conn.end();
})();
