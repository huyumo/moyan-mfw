"use strict";
/**
 * @fileoverview 审计日志查询参数 DTO
 * @description 审计日志列表查询参数
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
exports.QueryAuditLogDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const audit_log_decorator_1 = require("../../../../../common/decorators/audit-log.decorator");
const common_1 = require("../../../../../common");
/**
 * 审计日志查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
class QueryAuditLogDto extends common_1.PaginationQueryDto {
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
     * 目标 ID
     */
    targetId;
    /**
     * 开始时间
     */
    startTime;
    /**
     * 结束时间
     */
    endTime;
    /**
     * 排序字段
     * @default 'createAt'
     */
    sortField = 'createAt';
}
exports.QueryAuditLogDto = QueryAuditLogDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所属模块', enum: audit_log_decorator_1.AuditModule, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(audit_log_decorator_1.AuditModule),
    __metadata("design:type", String)
], QueryAuditLogDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '事件名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditLogDto.prototype, "event", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '操作人 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditLogDto.prototype, "operatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '目标 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditLogDto.prototype, "targetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '开始时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditLogDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '结束时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditLogDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'createAt', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAuditLogDto.prototype, "sortField", void 0);
//# sourceMappingURL=query-audit-log.dto.js.map