"use strict";
/**
 * @fileoverview 广告内容服务
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
exports.AdService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ad_entity_1 = require("../entities/ad.entity");
const backend_1 = require("moyan-mfw-base/backend");
let AdService = class AdService {
    adRepo;
    constructor(adRepo) {
        this.adRepo = adRepo;
    }
    async create(dto) {
        return this.adRepo.save(this.adRepo.create(dto));
    }
    async findAll(query) {
        const { placementId, title, linkType, status } = query;
        const whereBuilder = new backend_1.WhereBuilder();
        whereBuilder.eq('a.placementId', placementId).like('a.title', title)
            .eq('a.linkType', linkType).eq('a.status', status);
        const pager = new backend_1.PaginationX(this.adRepo.manager.connection, query);
        const result = await pager.where('main', whereBuilder)
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `SELECT ${select} FROM ext_ad_contents a LEFT JOIN ext_ad_placements p ON a.placementId = p.id ${whereClause} ${orderBy} ${limit}`;
        }).select(`a.*, JSON_OBJECT('id', p.id, 'name', p.name, 'code', p.code) as placement`)
            .defaultOrderBy('a.sortOrder ASC, a.createdAt DESC').getData();
        if (result.data?.length) {
            result.data = result.data.map((item) => ({
                ...item,
                placement: item.placement ? JSON.parse(item.placement) : null,
            }));
        }
        return result;
    }
    async findById(id) {
        const entity = await this.adRepo.findOne({ where: { id } });
        if (!entity)
            throw new backend_1.NotFoundError('广告内容');
        return entity;
    }
    async update(id, dto) {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.adRepo.save(entity);
    }
    async delete(id) {
        const entity = await this.findById(id);
        await this.adRepo.softDelete(entity.id);
    }
};
exports.AdService = AdService;
exports.AdService = AdService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ad_entity_1.Ad)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdService);
//# sourceMappingURL=ad.service.js.map