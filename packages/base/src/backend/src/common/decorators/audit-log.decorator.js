"use strict";
/**
 * @fileoverview 审计日志装饰器
 * @description 标记需要记录审计日志的接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = exports.AuditModule = exports.AUDIT_LOG = void 0;
const common_1 = require("@nestjs/common");
/**
 * 审计日志标识键
 */
exports.AUDIT_LOG = 'audit_log';
/**
 * 审计日志模块枚举
 */
var AuditModule;
(function (AuditModule) {
    AuditModule["AUTH"] = "AUTH";
    AuditModule["USER"] = "USER";
    AuditModule["ROLE"] = "ROLE";
    AuditModule["PERMISSION"] = "PERMISSION";
    AuditModule["APP"] = "APP";
    AuditModule["APP_TYPE"] = "APP_TYPE";
    AuditModule["MEMBER"] = "MEMBER";
    AuditModule["SYSTEM"] = "SYSTEM";
    AuditModule["UPLOAD"] = "UPLOAD";
})(AuditModule || (exports.AuditModule = AuditModule = {}));
/**
 * 审计日志装饰器
 * @description 标记控制器方法需要记录审计日志
 *
 * @param options - 审计日志选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @AuditLog({ module: AuditModule.USER, event: 'CREATE_USER', description: '创建用户' })
 *   @Post()
 *   async create(@Body() dto: CreateUserDto) {}
 * }
 * ```
 */
const AuditLog = (options) => (0, common_1.SetMetadata)(exports.AUDIT_LOG, options);
exports.AuditLog = AuditLog;
//# sourceMappingURL=audit-log.decorator.js.map