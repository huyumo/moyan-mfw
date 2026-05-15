"use strict";
/**
 * @fileoverview 执行种子数据脚本
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
const index_1 = require("./seeds/index");
(0, dotenv_1.config)({ path: '.env' });
const AppDataSource = new typeorm_1.DataSource({
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
async function main() {
    try {
        await AppDataSource.initialize();
        process.stdout.write('数据库连接成功\n');
        await (0, index_1.runSeeds)(AppDataSource);
        await AppDataSource.destroy();
        process.stdout.write('完成\n');
    }
    catch (error) {
        process.stderr.write(`失败: ${error}\n`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=run-seeds.js.map