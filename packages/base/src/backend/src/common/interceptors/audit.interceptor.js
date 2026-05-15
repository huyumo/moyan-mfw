"use strict";
/**
 * @fileoverview 审计日志拦截器
 * @description 拦截标记了 @AuditLog 的请求，记录审计日志到数据库
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const audit_log_decorator_1 = require("../decorators/audit-log.decorator");
const audit_log_service_1 = require("../../modules/sys/audit-log/audit-log.service");
/**
 * 审计日志拦截器
 * @description 记录操作审计日志，包括操作人、操作时间、操作内容等，并写入数据库
 *
 * @example
 * ```typescript
 * // 在模块中通过 APP_INTERCEPTOR 注册
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: AuditInterceptor,
 *   },
 * ],
 * ```
 */
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    reflector;
    auditLogService;
    logger = new common_1.Logger(AuditInterceptor_1.name);
    constructor(reflector, auditLogService) {
        this.reflector = reflector;
        this.auditLogService = auditLogService;
    }
    intercept(context, next) {
        const auditLog = this.reflector.get(audit_log_decorator_1.AUDIT_LOG, context.getHandler()) || this.reflector.get(audit_log_decorator_1.AUDIT_LOG, context.getClass());
        if (!auditLog) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const now = Date.now();
        return next.handle().pipe((0, operators_1.mergeMap)((response) => {
            const executionTime = Date.now() - now;
            return (0, rxjs_1.from)(this.writeAuditLog(auditLog, user, request, executionTime)).pipe((0, operators_1.tap)(() => {
                this.logger.log(`[AUDIT] ${auditLog.module}.${auditLog.event} - ${user?.username || 'anonymous'} - ${executionTime}ms`);
            }), (0, operators_1.catchError)((error) => {
                this.logger.error(`[AUDIT ERROR] ${auditLog.module}.${auditLog.event} - ${error.message}`, error.stack);
                return (0, rxjs_1.of)(response);
            }));
        }));
    }
    async writeAuditLog(auditLog, user, request, _executionTime) {
        await this.auditLogService.create({
            module: auditLog.module,
            event: auditLog.event,
            description: auditLog.description || '',
            operatorId: user?.id || 'anonymous',
            operatorName: user?.username || 'anonymous',
            targetType: '',
            ip: request.ip || '',
            userAgent: request.headers['user-agent'] || '',
        });
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_log_service_1.AuditLogService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map