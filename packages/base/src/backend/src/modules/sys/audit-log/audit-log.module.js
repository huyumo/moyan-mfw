"use strict";
/**
 * @fileoverview 审计日志模块
 * @description 审计日志模块定义，包含审计日志服务和控制器
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const audit_log_service_1 = require("./audit-log.service");
const audit_log_controller_1 = require("./audit-log.controller");
const audit_interceptor_1 = require("../../../common/interceptors/audit.interceptor");
/**
 * 审计日志模块
 * @description 提供审计日志管理相关功能
 */
let AuditLogModule = class AuditLogModule {
};
exports.AuditLogModule = AuditLogModule;
exports.AuditLogModule = AuditLogModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([audit_log_entity_1.AuditLog])],
        providers: [
            audit_log_service_1.AuditLogService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_interceptor_1.AuditInterceptor,
            },
        ],
        controllers: [audit_log_controller_1.AuditLogController],
        exports: [audit_log_service_1.AuditLogService],
    })
], AuditLogModule);
//# sourceMappingURL=audit-log.module.js.map