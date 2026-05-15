/**
 * @fileoverview 应用类型配置自动同步
 * @description 在服务启动时同步业务应用类型配置到数据库
 */
import { DataSource } from 'typeorm';
import { AppTypeConfig } from '../../../types/app-config.types';
/**
 * 同步应用类型配置到数据库
 *
 * 同步规则：
 * 1. 只处理业务应用类型（排除 system/admin 内置类型）
 * 2. 已存在的应用类型跳过，但检查并补充缺失的内置角色
 * 3. 使用事务保证数据一致性
 * 4. 处理并发竞争（唯一约束冲突视为已存在）
 */
export declare function syncAppTypesConfig(dataSource: DataSource, appTypes: AppTypeConfig[]): Promise<void>;
