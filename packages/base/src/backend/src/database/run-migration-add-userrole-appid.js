"use strict";
/**
 * @fileoverview 迁移执行器：sys_user_roles 添加 appId 字段
 * @description 连接数据库并执行完整的迁移流程（幂等，可安全重跑）
 *
 * 使用方式：npx ts-node src/database/run-migration-add-userrole-appid.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
const path_1 = require("path");
const promise_1 = require("mysql2/promise");
const envPaths = [
    (0, path_1.resolve)(__dirname, '../../../../backend/.env.local'),
    (0, path_1.resolve)(__dirname, '../../../../backend/.env'),
    (0, path_1.resolve)(__dirname, '../../.env'),
];
for (const p of envPaths) {
    if ((0, fs_1.existsSync)(p)) {
        (0, dotenv_1.config)({ path: p });
        process.stdout.write(`加载配置: ${p}\n`);
        break;
    }
}
async function columnExists(conn, table, column) {
    const [rows] = await conn.execute(`SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [process.env.DB_NAME || 'moyan_mfw', table, column]);
    return rows[0].cnt > 0;
}
async function main() {
    const connection = await (0, promise_1.createConnection)({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USERNAME || 'moyan_mfw',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'moyan_mfw',
        multipleStatements: true,
    });
    process.stdout.write('数据库连接成功\n');
    try {
        // ---- Step 1: 添加 appId 列（幂等） ----
        if (await columnExists(connection, 'sys_user_roles', 'appId')) {
            process.stdout.write('Step 1: appId 列已存在，跳过\n');
        }
        else {
            process.stdout.write('Step 1: 添加 appId 列...\n');
            await connection.execute(`ALTER TABLE sys_user_roles ADD COLUMN appId CHAR(36) NULL COMMENT '应用实例 ID'`);
            process.stdout.write('  ✓ 完成\n');
        }
        // ---- Step 2: 填充已有记录的 appId ----
        process.stdout.write('Step 2: 填充已有记录的 appId...\n');
        const [updateResult] = await connection.execute(`
      UPDATE sys_user_roles ur
      JOIN sys_app_members am ON am.userId = ur.userId
      JOIN sys_roles r ON r.id = ur.roleId
      SET ur.appId = am.appId
      WHERE ur.appId IS NULL
        AND (r.appId = am.appId OR r.appTypeId = (SELECT appTypeId FROM sys_apps WHERE id = am.appId))
    `);
        process.stdout.write(`  ✓ 已更新 ${updateResult.changedRows || 0} 条记录\n`);
        // ---- Step 3: 删除无归属的歧义记录 ----
        process.stdout.write('Step 3: 删除无归属的歧义记录...\n');
        const [deleteResult] = await connection.execute(`DELETE FROM sys_user_roles WHERE appId IS NULL`);
        process.stdout.write(`  ✓ 已删除 ${deleteResult.affectedRows || 0} 条记录\n`);
        // ---- Step 4: appId 设为 NOT NULL（幂等） ----
        process.stdout.write('Step 4: 设置 appId 为 NOT NULL...\n');
        const [colInfo] = await connection.execute(`SELECT IS_NULLABLE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sys_user_roles' AND COLUMN_NAME = 'appId'`, [process.env.DB_NAME || 'moyan_mfw']);
        if (colInfo[0]?.IS_NULLABLE === 'NO') {
            process.stdout.write('  ✓ appId 已是 NOT NULL，跳过\n');
        }
        else {
            await connection.execute(`ALTER TABLE sys_user_roles MODIFY COLUMN appId CHAR(36) NOT NULL COMMENT '应用实例 ID - 角色分配所属的具体应用实例'`);
            process.stdout.write('  ✓ 完成\n');
        }
        // ---- Step 5: 重建唯一约束（幂等） ----
        process.stdout.write('Step 5: 重建唯一约束...\n');
        // 检查新索引是否已存在
        const [newIdx] = await connection.execute(`SHOW INDEX FROM sys_user_roles WHERE Key_name = 'idx_unique_user_role_app'`);
        if (newIdx.length > 0) {
            process.stdout.write('  ✓ 新唯一约束已存在，跳过\n');
        }
        else {
            // 删除旧的唯一索引（去重：SHOW INDEX 每列返回一行）
            const [indexes] = await connection.execute(`SHOW INDEX FROM sys_user_roles WHERE Non_unique = 0 AND Key_name != 'PRIMARY'`);
            const dropped = new Set();
            for (const idx of indexes) {
                if (!dropped.has(idx.Key_name)) {
                    dropped.add(idx.Key_name);
                    process.stdout.write(`  删除旧唯一索引: ${idx.Key_name}\n`);
                    await connection.execute(`ALTER TABLE sys_user_roles DROP INDEX \`${idx.Key_name}\``);
                }
            }
            await connection.execute(`ALTER TABLE sys_user_roles ADD UNIQUE INDEX idx_unique_user_role_app (userId, roleId, appId)`);
            process.stdout.write('  ✓ 已创建新唯一约束: (userId, roleId, appId)\n');
        }
        // ---- Step 6: 确认 appId 索引（幂等） ----
        process.stdout.write('Step 6: 确认 appId 索引...\n');
        const [appIdIndexes] = await connection.execute(`SHOW INDEX FROM sys_user_roles WHERE Key_name = 'idx_user_roles_appId'`);
        if (appIdIndexes.length > 0) {
            process.stdout.write('  ✓ appId 索引已存在\n');
        }
        else {
            await connection.execute(`CREATE INDEX idx_user_roles_appId ON sys_user_roles(appId)`);
            process.stdout.write('  ✓ 已创建 appId 索引\n');
        }
        process.stdout.write('\n✅ 迁移完成\n');
    }
    catch (error) {
        process.stderr.write(`❌ 迁移失败: ${error}\n`);
        process.exit(1);
    }
    finally {
        await connection.end();
    }
}
main();
//# sourceMappingURL=run-migration-add-userrole-appid.js.map