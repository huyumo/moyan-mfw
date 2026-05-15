"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 清理 PC 权限脏数据
 * 删除所有 isAutoSync=0 的 PC 权限（保留 pc_root）
 */
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, '../../../.env') });
async function clean() {
    const dataSource = new typeorm_1.DataSource({
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
//# sourceMappingURL=clean-pc-permissions.js.map