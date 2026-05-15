/**
 * @fileoverview 广告内容服务
 */
import { Repository } from 'typeorm';
import { Ad } from '../entities/ad.entity';
import { CreateAdDto, UpdateAdDto, QueryAdDto } from '../dto';
import { PaginationResult } from 'moyan-mfw-base/backend';
export declare class AdService {
    private adRepo;
    constructor(adRepo: Repository<Ad>);
    create(dto: CreateAdDto): Promise<Ad>;
    findAll(query: QueryAdDto): Promise<PaginationResult<any>>;
    findById(id: string): Promise<Ad>;
    update(id: string, dto: UpdateAdDto): Promise<Ad>;
    delete(id: string): Promise<void>;
}
