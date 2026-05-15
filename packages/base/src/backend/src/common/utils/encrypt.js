"use strict";
/**
 * @fileoverview 加密工具函数
 * @description 提供密码加密、验证等加密相关功能
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcrypt = __importStar(require("bcrypt"));
/**
 * 默认盐值 rounds
 * @description bcrypt 加密的盐值 rounds，值越大越安全但越慢
 */
const SALT_ROUNDS = 10;
/**
 * 密码加密
 * @param password - 明文密码
 * @returns 加密后的密码哈希
 *
 * @example
 * ```typescript
 * const hash = await hashPassword('123456');
 * ```
 */
async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
/**
 * 密码验证
 * @param password - 明文密码
 * @param hash - 加密后的密码哈希
 * @returns 是否匹配
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword('123456', hash);
 * ```
 */
async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
//# sourceMappingURL=encrypt.js.map