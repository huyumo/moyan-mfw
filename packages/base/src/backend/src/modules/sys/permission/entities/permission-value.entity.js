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
exports.PermissionValue = void 0;
const typeorm_1 = require("typeorm");
let PermissionValue = class PermissionValue {
    bitValue;
    name;
    bitPosition;
    status;
};
exports.PermissionValue = PermissionValue;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'bit_value', type: 'bigint' }),
    __metadata("design:type", BigInt)
], PermissionValue.prototype, "bitValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], PermissionValue.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bit_position', type: 'int' }),
    __metadata("design:type", Number)
], PermissionValue.prototype, "bitPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], PermissionValue.prototype, "status", void 0);
exports.PermissionValue = PermissionValue = __decorate([
    (0, typeorm_1.Entity)('sys_permission_values'),
    (0, typeorm_1.Unique)(['name']),
    (0, typeorm_1.Unique)(['bitPosition'])
], PermissionValue);
//# sourceMappingURL=permission-value.entity.js.map