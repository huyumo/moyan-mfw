"use strict";
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
exports.PermissionValuesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const skip_permission_decorator_1 = require("../../../common/decorators/skip-permission.decorator");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const permissions_1 = require("../../../common/constants/permissions");
let PermissionValuesController = class PermissionValuesController {
    getPermissionValues() {
        const cache = (0, permissions_1.getPermissionValueCache)();
        const result = [];
        let pos = 0;
        for (const [name, bitValue] of cache) {
            result.push({ name, bitPosition: pos++, bitValue: bitValue.toString() });
        }
        return result;
    }
};
exports.PermissionValuesController = PermissionValuesController;
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, skip_permission_decorator_1.SkipPermission)(),
    (0, swagger_1.ApiOperation)({ summary: '获取权限值标签映射表', description: '返回所有活跃的权限值标签及其位运算值' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionValuesController.prototype, "getPermissionValues", null);
exports.PermissionValuesController = PermissionValuesController = __decorate([
    (0, swagger_1.ApiTags)('permission-values', '权限值标签映射'),
    (0, common_1.Controller)('permission-values')
], PermissionValuesController);
//# sourceMappingURL=permission-values.controller.js.map