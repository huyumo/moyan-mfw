/**
 * @fileoverview 广告内容控制器
 * @description 处理广告内容相关 HTTP 请求
 */
import { AdService } from '../service/ad.service';
import { CreateAdDto, UpdateAdDto, QueryAdDto } from '../dto';
export declare class AdController {
    private service;
    constructor(service: AdService);
    create(dto: CreateAdDto): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    findAll(query: QueryAdDto): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    findById(id: string): Promise<{
        code: number;
        data: unknown;
        message: string;
    }>;
    update(id: string, dto: UpdateAdDto): Promise<{
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
