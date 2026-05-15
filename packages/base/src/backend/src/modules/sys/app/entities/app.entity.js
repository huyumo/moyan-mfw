"use strict";
/**
 * @fileoverview 应用实例实体
 * @description 应用实例定义，存储应用的基本信息
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const common_1 = require("@/common");
const shared_1 = require("moyan-mfw-base/shared");
/**
 * 应用实例实体
 * @description 应用实例表，存储系统中的应用实例信息
 */
let App = class App extends base_entity_1.Base {
    /**
     * 应用实例 ID
     */
    id;
    /**
     * 应用名称
     */
    appName;
    /**
     * 应用编码
     */
    appCode;
    /**
     * 应用描述
     */
    appDesc;
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 负责人 ID
     */
    ownerId;
    /**
     * 应用 Logo
     */
    logo;
    /**
     * 应用状态
     */
    appStatus;
    /**
     * 排序号
     */
    sortOrder;
};
exports.App = App;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], App.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, comment: '应用名称 - 应用的中文名称' }),
    __metadata("design:type", String)
], App.prototype, "appName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '应用编码 - 应用的唯一标识' }),
    __metadata("design:type", String)
], App.prototype, "appCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512, nullable: true, comment: '应用描述 - 应用的详细描述' }),
    __metadata("design:type", String)
], App.prototype, "appDesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true, comment: '应用类型 ID - 关联应用类型表' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], App.prototype, "appTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true, comment: '负责人 ID - 应用负责人的用户 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], App.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true, comment: '应用 Logo - ImageResource 对象' }),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], App.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], App.prototype, "appStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' }),
    __metadata("design:type", Number)
], App.prototype, "sortOrder", void 0);
exports.App = App = __decorate([
    (0, typeorm_1.Entity)('sys_apps'),
    (0, typeorm_1.Unique)(['appCode'])
], App);
//# sourceMappingURL=app.entity.js.map