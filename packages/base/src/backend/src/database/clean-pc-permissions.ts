/**
 * 清理 PC 权限脏数据
 * 删除所有 isAutoSync=0 的 PC 权限（保留 pc_root）
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

async function clean() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'moyan_mfw',
  });

  await dataSource.initialize();

  // 删除所有 isAutoSync=0 的 PC 权限（排除 pc_root）
  const result = await dataSource.query(`
    DELETE FROM sys_permissions
    WHERE permission_type = 'PC'
    AND is_auto_sync = 0
    AND perm_code != 'pc_root'
  `);

  process.stdout.write(`已删除 ${result.affectedRows} 条脏数据\n`);
  await dataSource.destroy();
}

clean().catch((err) => {
  process.stderr.write(`${err}\n`);
  process.exit(1);
});