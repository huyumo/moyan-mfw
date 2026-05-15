/**
 * @fileoverview 广告位类型配置服务
 */
import { Repository } from 'typeorm';
import { AdPlacementType } from '../entities/ad-placement-type.entity';
import { CreateAdPlacementTypeDto, UpdateAdPlacementTypeDto, QueryAdPlacementTypeDto } from '../dto';
import { PaginationResult } from 'moyan-mfw-base/backend';
export declare class AdPlacementTypeService {
    private typeRepo;
    constructor(typeRepo: Repository<AdPlacementType>);
    create(dto: CreateAdPlacementTypeDto): Promise<AdPlacementType>;
    findAll(query: QueryAdPlacementTypeDto): Promise<PaginationResult<any>>;
    findById(id: string): Promise<AdPlacementType>;
    update(id: string, dto: UpdateAdPlacementTypeDto): Promise<AdPlacementType>;
    delete(id: string): Promise<void>;
}
