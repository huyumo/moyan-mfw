"use strict";
/**
 * @fileoverview 广告位类型配置实体
 * @description 定义广告位的类型和尺寸配置
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
exports.AdPlacementType = void 0;
const typeorm_1 = require("typeorm");
const backend_1 = require("moyan-mfw-base/backend");
const shared_1 = require("moyan-mfw-base/shared");
const ad_placement_entity_1 = require("./ad-placement.entity");
let AdPlacementType = class AdPlacementType extends backend_1.Base {
    id;
    name;
    code;
    width;
    height;
    description;
    status;
    sortOrder;
    placements;
};
exports.AdPlacementType = AdPlacementType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdPlacementType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '类型名称' }),
    __metadata("design:type", String)
], AdPlacementType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '类型编码 - 唯一标识' }),
    __metadata("design:type", String)
], AdPlacementType.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: '宽度(px)' }),
    __metadata("design:type", Number)
], AdPlacementType.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: '高度(px)' }),
    __metadata("design:type", Number)
], AdPlacementType.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '类型描述' }),
    __metadata("design:type", String)
], AdPlacementType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], AdPlacementType.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' }),
    __metadata("design:type", Number)
], AdPlacementType.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ad_placement_entity_1.AdPlacement, (p) => p.placementType),
    __metadata("design:type", Array)
], AdPlacementType.prototype, "placements", void 0);
exports.AdPlacementType = AdPlacementType = __decorate([
    (0, typeorm_1.Entity)('ext_ad_placement_types'),
    (0, typeorm_1.Unique)(['code'])
], AdPlacementType);
//# sourceMappingURL=ad-placement-type.entity.js.map