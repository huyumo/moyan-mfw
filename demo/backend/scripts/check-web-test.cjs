const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'moyan_mfw' });
  const [rows] = await conn.query("SELECT holderId, balance, totalIncome, currency, createdAt FROM ext_ledger_account WHERE holderId = 'web-test-h1'");
  console.log('开户结果:', JSON.stringify(rows, null, 2));
  await conn.end();
})();
