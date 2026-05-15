"use strict";
/**
 * @fileoverview 数据库清理脚本
 * @description 清空所有表数据，用于重新初始化
 *
 * 使用方式：
 * 1. 确保数据库已配置好 .env 文件
 * 2. 运行：pnpm db:clear
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
(0, dotenv_1.config)({ path: '.env' });
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'moyan_mfw',
    charset: 'utf8mb4',
    synchronize: false,
    logging: false,
    entities: ['src/modules/sys/**/*.entity{.ts,.js}'],
});
/**
 * 表清理顺序（考虑外键依赖）
 */
const tablesToClear = [
    'sys_role_permissions',
    'sys_app_type_permissions',
    'sys_user_roles',
    'sys_user_apps',
    'sys_app_members',
    'sys_permissions',
    'sys_roles',
    'sys_apps',
    'sys_app_types',
    'sys_users',
    'sys_audit_logs',
];
async function clearTables(dataSource) {
    process.stdout.write('开始清空数据库表...\n');
    for (const table of tablesToClear) {
        try {
            await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0`);
            await dataSource.query(`TRUNCATE TABLE ${table}`);
            await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`);
            process.stdout.write(`  已清空表：${table}\n`);
        }
        catch {
            process.stdout.write(`  表 ${table} 不存在或清空失败，跳过\n`);
        }
    }
    process.stdout.write('数据库表清空完成！\n');
}
async function main() {
    try {
        await exports.AppDataSource.initialize();
        process.stdout.write('数据库连接成功\n');
        await clearTables(exports.AppDataSource);
        await exports.AppDataSource.destroy();
        process.stdout.write('数据库连接已关闭\n');
    }
    catch (error) {
        process.stderr.write(`数据库清理失败: ${error}\n`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=clear-database.js.map