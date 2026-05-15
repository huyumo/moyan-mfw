"use strict";
/**
 * @fileoverview 广告位类型配置服务
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
exports.AdPlacementTypeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ad_placement_type_entity_1 = require("../entities/ad-placement-type.entity");
const ad_placement_entity_1 = require("../entities/ad-placement.entity");
const backend_1 = require("moyan-mfw-base/backend");
let AdPlacementTypeService = class AdPlacementTypeService {
    typeRepo;
    constructor(typeRepo) {
        this.typeRepo = typeRepo;
    }
    async create(dto) {
        const existing = await this.typeRepo.findOne({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('类型编码已存在');
        return this.typeRepo.save(this.typeRepo.create(dto));
    }
    async findAll(query) {
        const { name, code, status } = query;
        const whereBuilder = new backend_1.WhereBuilder();
        whereBuilder.like('t.name', name).like('t.code', code).eq('t.status', status);
        const pager = new backend_1.PaginationX(this.typeRepo.manager.connection, query);
        return pager.where('main', whereBuilder)
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `SELECT ${select} FROM ext_ad_placement_types t ${whereClause} ${orderBy} ${limit}`;
        }).select('t.*').defaultOrderBy('t.sortOrder ASC, t.createdAt DESC').getData();
    }
    async findById(id) {
        const entity = await this.typeRepo.findOne({ where: { id } });
        if (!entity)
            throw new backend_1.NotFoundError('广告位类型配置');
        return entity;
    }
    async update(id, dto) {
        const entity = await this.findById(id);
        if (dto.code && dto.code !== entity.code) {
            const existing = await this.typeRepo.findOne({ where: { code: dto.code } });
            if (existing)
                throw new common_1.ConflictException('类型编码已存在');
        }
        Object.assign(entity, dto);
        return this.typeRepo.save(entity);
    }
    async delete(id) {
        const entity = await this.findById(id);
        const childCount = await this.typeRepo.manager
            .getRepository(ad_placement_entity_1.AdPlacement).count({ where: { placementTypeId: id } });
        if (childCount > 0) {
            throw new common_1.ConflictException(`该类型下有 ${childCount} 个广告位，请先删除关联广告位`);
        }
        await this.typeRepo.softDelete(entity.id);
    }
};
exports.AdPlacementTypeService = AdPlacementTypeService;
exports.AdPlacementTypeService = AdPlacementTypeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ad_placement_type_entity_1.AdPlacementType)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdPlacementTypeService);
//# sourceMappingURL=ad-placement-type.service.js.map