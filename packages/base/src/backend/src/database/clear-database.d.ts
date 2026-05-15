/**
 * @fileoverview 数据库清理脚本
 * @description 清空所有表数据，用于重新初始化
 *
 * 使用方式：
 * 1. 确保数据库已配置好 .env 文件
 * 2. 运行：pnpm db:clear
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
export declare const AppDataSource: DataSource;
