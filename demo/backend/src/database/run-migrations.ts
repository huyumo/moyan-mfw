/**
 * @fileoverview 执行数据库迁移脚本
 * @description 执行 demo/database/migrations 下未执行的迁移（如账本账户扩展列）
 *
 * 用法：npx ts-node src/database/run-migrations.ts
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { dataSource } from './data-source';

config({ path: '.env' });

async function main() {
  await dataSource.initialize();
  const executed = await dataSource.runMigrations();
  console.log(
    executed.length > 0
      ? `已执行迁移: ${executed.map((m) => m.name).join(', ')}`
      : '无待执行迁移',
  );
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('迁移执行失败:', err);
  process.exit(1);
});
