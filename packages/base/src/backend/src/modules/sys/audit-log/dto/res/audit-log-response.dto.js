"use strict";
/**
 * @fileoverview 审计日志响应 DTO
 * @description 审计日志信息的响应数据结构
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
exports.AuditLogResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const audit_log_decorator_1 = require("../../../../../common/decorators/audit-log.decorator");
/**
 * 审计日志响应 DTO
 */
class AuditLogResponseDto {
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
}
exports.AuditLogResponseDto = AuditLogResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '日志 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所属模块', enum: audit_log_decorator_1.AuditModule }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '事件名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "event", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '操作人 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "operatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '操作人名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "operatorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '目标 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "targetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '目标类型' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '描述' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '快照', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], AuditLogResponseDto.prototype, "snapshot", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP 地址' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "ip", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User-Agent', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], AuditLogResponseDto.prototype, "createAt", void 0);
//# sourceMappingURL=audit-log-response.dto.js.map