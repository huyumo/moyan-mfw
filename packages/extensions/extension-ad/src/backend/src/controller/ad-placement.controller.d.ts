/**
 * @fileoverview 广告位控制器
 * @description 处理广告位相关 HTTP 请求
 */
import { AdPlacementService } from '../service/ad-placement.service';
import { CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto } from '../dto';
export declare class AdPlacementController {
    private service;
    constructor(service: AdPlacementService);
    create(dto: CreateAdPlacementDto): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    findAll(query: QueryAdPlacementDto): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    findById(id: string): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    update(id: string, dto: UpdateAdPlacementDto): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    delete(id: string): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
}
