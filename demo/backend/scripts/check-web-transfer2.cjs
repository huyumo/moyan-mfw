const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'moyan_mfw' });
  const [rows] = await conn.query("SELECT transferNo, bizRef, bizType, needReview, auditStatus, postStatus, holdType, amount, fromAccountId FROM ext_ledger_transfer WHERE bizRef = 'web-biz-2'");
  console.log('制单结果:', JSON.stringify(rows, null, 2));
  const [frozen] = await conn.query("SELECT balance, frozen, pendingOut FROM ext_ledger_account WHERE id = '54901412-cf68-4482-9245-6d5c0c1cfd23'");
  console.log('转出方:', JSON.stringify(frozen));
  await conn.end();
})();
