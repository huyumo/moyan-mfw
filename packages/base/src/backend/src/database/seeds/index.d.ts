/**
 * @fileoverview 数据库种子数据执行脚本
 * @description 执行所有种子数据，初始化系统基础数据
 */
import { DataSource } from 'typeorm';
/**
 * 种子数据执行函数
 *
 * 执行顺序：
 * 1. 应用类型 → 2. 用户 → 3. 权限 → 4. 角色 → 5. 应用实例 → 6. 权限池 → 7. 角色权限 → 8. 拥有者绑定
 */
export declare function runSeeds(dataSource: DataSource, adminPassword?: string): Promise<void>;
