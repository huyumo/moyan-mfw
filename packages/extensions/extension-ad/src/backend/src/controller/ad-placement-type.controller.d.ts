/**
 * @fileoverview 广告位类型配置控制器
 * @description 处理广告位类型配置相关 HTTP 请求
 */
import { AdPlacementTypeService } from '../service/ad-placement-type.service';
import { CreateAdPlacementTypeDto, UpdateAdPlacementTypeDto, QueryAdPlacementTypeDto } from '../dto';
export declare class AdPlacementTypeController {
    private service;
    constructor(service: AdPlacementTypeService);
    create(dto: CreateAdPlacementTypeDto): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    findAll(query: QueryAdPlacementTypeDto): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    findById(id: string): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    update(id: string, dto: UpdateAdPlacementTypeDto): Promise<{
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
