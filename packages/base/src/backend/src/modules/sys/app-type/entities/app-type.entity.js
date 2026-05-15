"use strict";
/**
 * @fileoverview 应用类型实体
 * @description 应用分类/应用类型定义
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
exports.AppType = void 0;
const typeorm_1 = require("typeorm");
const shared_1 = require("moyan-mfw-base/shared");
/**
 * 应用类型实体
 * @description 应用分类表，定义系统中的应用类型
 */
let AppType = class AppType {
    /**
     * 应用类型 ID
     */
    id;
    /**
     * 类型名称
     */
    typeName;
    /**
     * 类型编码
     */
    typeCode;
    /**
     * 类型描述
     */
    typeDesc;
    /**
     * 图标
     */
    icon;
    /**
     * 是否支持多应用
     */
    multiAppEnabled;
    /**
     * 类型状态
     */
    typeStatus;
    /**
     * 排序
     */
    sortOrder;
};
exports.AppType = AppType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AppType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '类型名称 - 应用类型的中文名称' }),
    __metadata("design:type", String)
], AppType.prototype, "typeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '类型编码 - 应用类型的唯一标识' }),
    __metadata("design:type", String)
], AppType.prototype, "typeCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '类型描述 - 应用类型的详细描述' }),
    __metadata("design:type", String)
], AppType.prototype, "typeDesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true, comment: '图标 URL 或图标名称' }),
    __metadata("design:type", String)
], AppType.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.MultiAppEnabledDict.NO, comment: (0, shared_1.toDescription)(shared_1.MultiAppEnabledDict) }),
    __metadata("design:type", Number)
], AppType.prototype, "multiAppEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], AppType.prototype, "typeStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' }),
    __metadata("design:type", Number)
], AppType.prototype, "sortOrder", void 0);
exports.AppType = AppType = __decorate([
    (0, typeorm_1.Entity)('sys_app_types'),
    (0, typeorm_1.Unique)(['typeCode'])
], AppType);
//# sourceMappingURL=app-type.entity.js.map