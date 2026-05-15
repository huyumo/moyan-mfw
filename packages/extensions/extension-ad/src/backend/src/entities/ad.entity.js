"use strict";
/**
 * @fileoverview 广告内容实体
 * @description 定义广告位中的具体广告内容
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
exports.Ad = void 0;
const typeorm_1 = require("typeorm");
const backend_1 = require("moyan-mfw-base/backend");
const shared_1 = require("moyan-mfw-base/shared");
const ad_placement_entity_1 = require("./ad-placement.entity");
let Ad = class Ad extends backend_1.Base {
    id;
    placementId;
    placement;
    title;
    imageUrl;
    linkUrl;
    linkType;
    miniAppId;
    miniAppPath;
    internalRoute;
    startTime;
    endTime;
    status;
    sortOrder;
};
exports.Ad = Ad;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Ad.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '广告位 ID' }),
    __metadata("design:type", String)
], Ad.prototype, "placementId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ad_placement_entity_1.AdPlacement, (p) => p.ads),
    (0, typeorm_1.JoinColumn)({ name: 'placementId' }),
    __metadata("design:type", ad_placement_entity_1.AdPlacement)
], Ad.prototype, "placement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, comment: '广告标题' }),
    __metadata("design:type", String)
], Ad.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, comment: '广告图片 URL' }),
    __metadata("design:type", String)
], Ad.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, comment: '跳转链接' }),
    __metadata("design:type", String)
], Ad.prototype, "linkUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, comment: '跳转类型: miniapp | internal | external' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Ad.prototype, "linkType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '小程序 AppId（linkType=miniapp 时）' }),
    __metadata("design:type", String)
], Ad.prototype, "miniAppId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '小程序路径（linkType=miniapp 时）' }),
    __metadata("design:type", String)
], Ad.prototype, "miniAppPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: 'App 内部路由路径（linkType=internal 时）' }),
    __metadata("design:type", String)
], Ad.prototype, "internalRoute", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true, comment: '投放开始时间' }),
    __metadata("design:type", Date)
], Ad.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true, comment: '投放结束时间' }),
    __metadata("design:type", Date)
], Ad.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Ad.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' }),
    __metadata("design:type", Number)
], Ad.prototype, "sortOrder", void 0);
exports.Ad = Ad = __decorate([
    (0, typeorm_1.Entity)('ext_ad_contents')
], Ad);
//# sourceMappingURL=ad.entity.js.map