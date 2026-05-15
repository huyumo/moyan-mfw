"use strict";
/**
 * @fileoverview 权限常量定义
 * @description 定义全局权限位运算常量和工具函数（支持代码扩展）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_CONFIG = exports.PERMISSION_VALUES = exports.EXTENSION_PERMISSION_VALUES = exports.DEFAULT_PERMISSION_VALUES = void 0;
exports.registerPermissionValues = registerPermissionValues;
exports.getPermissionValues = getPermissionValues;
exports.buildPerValue = buildPerValue;
exports.getPermValue = getPermValue;
exports.parsePerValue = parsePerValue;
exports.hasPermission = hasPermission;
exports.getPermissionOptions = getPermissionOptions;
exports.initPermissionValueCache = initPermissionValueCache;
exports.getPermissionValueCache = getPermissionValueCache;
/**
 * 默认权限配置（基础框架提供�?
 * 这些权限值在 base-backend �?base-frontend 中已使用，不可覆�?
 */
exports.DEFAULT_PERMISSION_VALUES = [
    '添加', // 0: 1n << 0 = 1n
    '编辑', // 1: 1n << 1 = 2n
    '删除', // 2: 1n << 2 = 4n
    '导出', // 3: 1n << 3 = 8n
    '导入', // 4: 1n << 4 = 16n
];
/**
 * 扩展权限配置（可选）
 * 业务项目可以添加更多权限，如�?审批', '拒绝', '发布', '归档'
 */
exports.EXTENSION_PERMISSION_VALUES = [
    '审批', // 5: 1n << 5 = 32n
    '拒绝', // 6: 1n << 6 = 64n
    '发布', // 7: 1n << 7 = 128n
    '归档', // 8: 1n << 8 = 256n
];
/**
 * 业务扩展权限值存�?
 * 通过 registerPermissionValues 函数注册
 */
let customPermissionValues = [];
/**
 * 注册业务扩展权限�?
 * @param values - 业务自定义权限值数�?
 *
 * @example
 * ```typescript
 * // �?backend/src/permissions.ts 中调�?
 * registerPermissionValues(['上架', '发货', '退�?]);
 * ```
 */
function registerPermissionValues(values) {
    customPermissionValues = values;
}
/**
 * 获取完整的权限值列�?
 * @returns 所有权限值（默认 + 扩展 + 业务自定义）
 */
function getPermissionValues() {
    return [
        ...exports.DEFAULT_PERMISSION_VALUES,
        ...exports.EXTENSION_PERMISSION_VALUES,
        ...customPermissionValues,
    ];
}
/**
 * 当前生效的权限值列�?
 */
exports.PERMISSION_VALUES = getPermissionValues();
/**
 * 全局权限配置对象
 */
exports.PERMISSION_CONFIG = {
    values: exports.PERMISSION_VALUES,
};
/**
 * 根据权限名称数组构建位运算权限�?
 * @param names - 权限名称数组，如 ['添加', '编辑']
 * @returns bigint 位运算�?
 *
 * @example
 * ```typescript
 * buildPerValue(['添加']) // 1n
 * buildPerValue(['添加', '编辑']) // 3n
 * buildPerValue(['添加', '删除']) // 5n
 * ```
 */
function buildPerValue(names) {
    let result = 0n;
    for (const name of names) {
        const value = permissionValueCache.get(name);
        if (value === undefined) {
            throw new Error(`未知的权限名称：${name}`);
        }
        result |= typeof value === 'bigint' ? value : BigInt(value);
    }
    return result;
}
/**
 * 根据权限名称获取单个权限位�?
 * @param name - 权限名称
 * @returns bigint 单个权限位�?
 *
 * @example
 * ```typescript
 * getPermValue('添加') // 1n
 * getPermValue('编辑') // 2n
 * ```
 */
function getPermValue(name) {
    const values = getPermissionValues();
    const index = values.indexOf(name);
    if (index === -1) {
        throw new Error(`未知的权限名称：${name}`);
    }
    return 1n << BigInt(index);
}
/**
 * 根据位运算值解析为权限名称数组
 * @param value - 位运算�?
 * @returns 权限名称数组
 *
 * @example
 * ```typescript
 * parsePerValue(3n) // ['添加', '编辑']
 * parsePerValue(5n) // ['添加', '删除']
 * ```
 */
function parsePerValue(value) {
    const values = getPermissionValues();
    const result = [];
    for (let i = 0; i < values.length; i++) {
        if ((value & (1n << BigInt(i))) !== 0n) {
            result.push(values[i]);
        }
    }
    return result;
}
/**
 * 检查是否包含指定权�?
 * @param value - 位运算�?
 * @param name - 权限名称
 * @returns boolean 是否包含
 *
 * @example
 * ```typescript
 * hasPermission(3n, '添加') // true
 * hasPermission(3n, '删除') // false
 * ```
 */
function hasPermission(value, name) {
    const values = getPermissionValues();
    const index = values.indexOf(name);
    if (index === -1) {
        return false;
    }
    return (value & (1n << BigInt(index))) !== 0n;
}
/**
 * 获取所有权限选项（用�?UI 展示�?
 * @returns 权限选项数组 {name, label, value}
 */
function getPermissionOptions() {
    const values = getPermissionValues();
    return values.map((name, index) => ({
        name,
        label: name,
        value: 1n << BigInt(index),
    }));
}
/**
 * 运行时权限值缓存（name → bitValue）
 * 由 PermissionValueSyncService 在 onDatabaseReady 后填充
 */
let permissionValueCache = new Map();
function initPermissionValueCache(values) {
    permissionValueCache = new Map(values.map((v) => [v.name, typeof v.bitValue === 'bigint' ? v.bitValue : BigInt(v.bitValue)]));
}
function getPermissionValueCache() {
    return permissionValueCache;
}
//# sourceMappingURL=permissions.js.map