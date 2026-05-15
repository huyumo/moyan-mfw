"use strict";
/**
 * @fileoverview 添加成员请求 DTO
 * @description 添加应用成员的请求参数
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
exports.AddMemberDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 添加成员请求 DTO
 */
class AddMemberDto {
    /**
     * 用户 ID
     */
    userId;
}
exports.AddMemberDto = AddMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户 ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '用户 ID 不能为空' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddMemberDto.prototype, "userId", void 0);
//# sourceMappingURL=add-member.dto.js.map