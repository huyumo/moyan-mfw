"use strict";
/**
 * @fileoverview 审计日志实体
 * @description 记录系统操作审计日志
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
const audit_log_decorator_1 = require("../../../../common/decorators/audit-log.decorator");
const shared_1 = require("moyan-mfw-base/shared");
/**
 * 审计日志实体
 * @description 记录系统操作审计日志
 */
let AuditLog = class AuditLog {
    /**
     * 日志 ID
     */
    id;
    /**
     * 所属模块
     */
    module;
    /**
     * 事件名称
     */
    event;
    /**
     * 操作人 ID
     */
    operatorId;
    /**
     * 操作人名称
     */
    operatorName;
    /**
     * 目标 ID
     */
    targetId;
    /**
     * 目标类型
     */
    targetType;
    /**
     * 描述
     */
    description;
    /**
     * 快照
     */
    snapshot;
    /**
     * IP 地址
     */
    ip;
    /**
     * User-Agent
     */
    userAgent;
    /**
     * 创建时间
     */
    createAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: audit_log_decorator_1.AuditModule, comment: (0, shared_1.toDescription)(shared_1.AuditModuleDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AuditLog.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '事件名称' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AuditLog.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '操作人 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AuditLog.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '操作人名称' }),
    __metadata("design:type", String)
], AuditLog.prototype, "operatorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true, comment: '操作目标 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AuditLog.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '操作目标类型' }),
    __metadata("design:type", String)
], AuditLog.prototype, "targetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', comment: '操作描述' }),
    __metadata("design:type", String)
], AuditLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true, comment: '数据快照 - before/after' }),
    __metadata("design:type", Object)
], AuditLog.prototype, "snapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '操作 IP 地址' }),
    __metadata("design:type", String)
], AuditLog.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: 'User-Agent' }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', comment: '创建时间' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], AuditLog.prototype, "createAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('sys_audit_logs')
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map