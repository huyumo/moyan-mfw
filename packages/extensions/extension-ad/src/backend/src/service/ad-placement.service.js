"use strict";
/**
 * @fileoverview 广告位服务
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdPlacementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ad_placement_entity_1 = require("../entities/ad-placement.entity");
const ad_entity_1 = require("../entities/ad.entity");
const backend_1 = require("moyan-mfw-base/backend");
let AdPlacementService = class AdPlacementService {
    placementRepo;
    constructor(placementRepo) {
        this.placementRepo = placementRepo;
    }
    async create(dto) {
        const existing = await this.placementRepo.findOne({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('广告位编码已存在');
        return this.placementRepo.save(this.placementRepo.create(dto));
    }
    async findAll(query) {
        const { name, code, placementTypeId, status } = query;
        const whereBuilder = new backend_1.WhereBuilder();
        whereBuilder.like('p.name', name).like('p.code', code)
            .eq('p.placementTypeId', placementTypeId).eq('p.status', status);
        const pager = new backend_1.PaginationX(this.placementRepo.manager.connection, query);
        const result = await pager.where('main', whereBuilder)
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `SELECT ${select} FROM ext_ad_placements p LEFT JOIN ext_ad_placement_types t ON p.placementTypeId = t.id ${whereClause} ${orderBy} ${limit}`;
        }).select(`p.*, JSON_OBJECT('id', t.id, 'name', t.name, 'code', t.code, 'width', t.width, 'height', t.height) as placementType`)
            .defaultOrderBy('p.sortOrder ASC, p.createdAt DESC').getData();
        if (result.data?.length) {
            result.data = result.data.map((item) => ({
                ...item,
                placementType: item.placementType ? JSON.parse(item.placementType) : null,
            }));
        }
        return result;
    }
    async findById(id) {
        const entity = await this.placementRepo.findOne({ where: { id } });
        if (!entity)
            throw new backend_1.NotFoundError('广告位');
        return entity;
    }
    async update(id, dto) {
        const entity = await this.findById(id);
        if (dto.code && dto.code !== entity.code) {
            const existing = await this.placementRepo.findOne({ where: { code: dto.code } });
            if (existing)
                throw new common_1.ConflictException('广告位编码已存在');
        }
        Object.assign(entity, dto);
        return this.placementRepo.save(entity);
    }
    async delete(id) {
        const entity = await this.findById(id);
        const childCount = await this.placementRepo.manager
            .getRepository(ad_entity_1.Ad).count({ where: { placementId: id } });
        if (childCount > 0) {
            throw new common_1.ConflictException(`该广告位下有 ${childCount} 条广告内容，请先删除关联广告内容`);
        }
        await this.placementRepo.softDelete(entity.id);
    }
};
exports.AdPlacementService = AdPlacementService;
exports.AdPlacementService = AdPlacementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ad_placement_entity_1.AdPlacement)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdPlacementService);
//# sourceMappingURL=ad-placement.service.js.map