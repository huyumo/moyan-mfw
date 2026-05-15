"use strict";
/**
 * @fileoverview TypeORM 数据源配置
 * @description 用于迁移命令行工具的数据源配置
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSource = void 0;
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
const database_config_1 = __importDefault(require("../config/database.config"));
// 加载 .env 文件
(0, dotenv_1.config)({ path: '.env' });
// 导出 DataSource 实例供 CLI 使用
exports.dataSource = new typeorm_1.DataSource((0, database_config_1.default)());
//# sourceMappingURL=data-source.js.map