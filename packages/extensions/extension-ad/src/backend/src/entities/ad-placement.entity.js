"use strict";
/**
 * @fileoverview 广告位实体
 * @description 定义广告位，关联广告位类型
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
exports.AdPlacement = void 0;
const typeorm_1 = require("typeorm");
const backend_1 = require("moyan-mfw-base/backend");
const shared_1 = require("moyan-mfw-base/shared");
const ad_placement_type_entity_1 = require("./ad-placement-type.entity");
const ad_entity_1 = require("./ad.entity");
let AdPlacement = class AdPlacement extends backend_1.Base {
    id;
    name;
    code;
    placementTypeId;
    placementType;
    description;
    status;
    sortOrder;
    ads;
};
exports.AdPlacement = AdPlacement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdPlacement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '广告位名称' }),
    __metadata("design:type", String)
], AdPlacement.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '广告位编码 - 唯一标识' }),
    __metadata("design:type", String)
], AdPlacement.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '广告位类型 ID' }),
    __metadata("design:type", String)
], AdPlacement.prototype, "placementTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ad_placement_type_entity_1.AdPlacementType),
    (0, typeorm_1.JoinColumn)({ name: 'placementTypeId' }),
    __metadata("design:type", ad_placement_type_entity_1.AdPlacementType)
], AdPlacement.prototype, "placementType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '广告位描述' }),
    __metadata("design:type", String)
], AdPlacement.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], AdPlacement.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' }),
    __metadata("design:type", Number)
], AdPlacement.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ad_entity_1.Ad, (ad) => ad.placement),
    __metadata("design:type", Array)
], AdPlacement.prototype, "ads", void 0);
exports.AdPlacement = AdPlacement = __decorate([
    (0, typeorm_1.Entity)('ext_ad_placements'),
    (0, typeorm_1.Unique)(['code'])
], AdPlacement);
//# sourceMappingURL=ad-placement.entity.js.map