"use strict";
/**
 * @fileoverview 更新成员角色请求 DTO
 * @description 更新应用成员角色的请求参数
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
exports.UpdateMemberRolesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 更新成员角色请求 DTO
 */
class UpdateMemberRolesDto {
    /**
     * 角色 ID 列表（全量替换）
     */
    roleIds;
}
exports.UpdateMemberRolesDto = UpdateMemberRolesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色 ID 列表（全量替换）', isArray: true }),
    (0, class_validator_1.IsNotEmpty)({ message: '角色 ID 列表不能为空' }),
    (0, class_validator_1.IsArray)({ message: '角色 ID 必须是数组' }),
    (0, class_validator_1.IsUUID)('4', { each: true, message: '角色 ID 必须是有效的 UUID' }),
    __metadata("design:type", Array)
], UpdateMemberRolesDto.prototype, "roleIds", void 0);
//# sourceMappingURL=update-member-roles.dto.js.map