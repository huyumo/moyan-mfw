import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moyan_mfw',
  charset: 'utf8mb4',
});

async function resetPassword() {
  await AppDataSource.initialize();
  console.log('✅ 数据库连接成功');

  const users = [
    { username: 'admin', password: 'Admin@123' },
    { username: 'test', password: 'Test@123' },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await AppDataSource.query(
      `UPDATE sys_user SET password = ? WHERE username = ?`,
      [hashedPassword, user.username]
    );
    console.log(`✅ 已重置用户 ${user.username} 的密码`);
  }

  await AppDataSource.destroy();
  console.log('✅ 密码重置完成');
}

resetPassword().catch(console.error);
