/**
 * @fileoverview 临时脚本：执行 ledger migration SQL 建表
 * @description 从 extension-ledger 的 migration 文件提取 SQL 并执行（CREATE TABLE IF NOT EXISTS 幂等）
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'moyan_mfw',
    multipleStatements: true,
  });

  const migrationPath = path.resolve(__dirname, '../../../packages/extensions/extension-ledger/database/migrations/20260814000000-create-ledger-tables.ts');
  const content = fs.readFileSync(migrationPath, 'utf-8');

  // 提取所有 queryRunner.query(`...`) 中的 SQL（模板字符串中已无嵌套反引号）
  const regex = /queryRunner\.query\(\s*`([\s\S]*?)`\s*\)/g;
  let m;
  let count = 0;
  while ((m = regex.exec(content)) !== null) {
    const sql = m[1].trim();
    if (!sql) continue;
    // 只执行 up() 的建表语句，跳过 down() 的 DROP
    if (/^DROP\s+TABLE/i.test(sql)) continue;
    try {
      await conn.query(sql);
      count++;
      console.log('OK:', sql.slice(0, 60).replace(/\s+/g, ' '), '...');
    } catch (e) {
      if (String(e.message).includes('already exists')) {
        console.log('SKIP (exists):', sql.slice(0, 50).replace(/\s+/g, ' '));
      } else {
        console.error('FAIL:', e.message);
        process.exit(1);
      }
    }
  }

  // 验证表存在
  const [tables] = await conn.query("SHOW TABLES LIKE 'ext_ledger%'");
  console.log('tables:', tables.map((t) => Object.values(t)[0]).join(', '));

  console.log('done, executed:', count);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
