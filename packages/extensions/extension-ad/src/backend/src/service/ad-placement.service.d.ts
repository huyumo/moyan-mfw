/**
 * @fileoverview 广告位服务
 */
import { Repository } from 'typeorm';
import { AdPlacement } from '../entities/ad-placement.entity';
import { CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto } from '../dto';
import { PaginationResult } from 'moyan-mfw-base/backend';
export declare class AdPlacementService {
    private placementRepo;
    constructor(placementRepo: Repository<AdPlacement>);
    create(dto: CreateAdPlacementDto): Promise<AdPlacement>;
    findAll(query: QueryAdPlacementDto): Promise<PaginationResult<any>>;
    findById(id: string): Promise<AdPlacement>;
    update(id: string, dto: UpdateAdPlacementDto): Promise<AdPlacement>;
    delete(id: string): Promise<void>;
}
