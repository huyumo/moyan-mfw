"use strict";
/**
 * @fileoverview 用户查询参数 DTO
 * @description 用户列表查询参数
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
exports.QueryUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const common_1 = require("../../../../../common");
/**
 * 用户查询参数 DTO
 */
class QueryUserDto extends common_1.PaginationQueryDto {
    /**
     * 用户名（模糊查询）
     */
    username;
    /**
     * 手机号
     */
    phone;
    /**
     * 状态 (1:启用 0:禁用)
     */
    userStatus;
}
exports.QueryUserDto = QueryUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '手机号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态 (1:启用 0:禁用)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QueryUserDto.prototype, "userStatus", void 0);
//# sourceMappingURL=query-user.dto.js.map