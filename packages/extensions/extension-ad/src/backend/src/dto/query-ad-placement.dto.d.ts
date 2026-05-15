/**
 * @fileoverview 广告位查询参数 DTO
 * @description 广告位列表查询参数
 */
import { PaginationQueryDto } from 'moyan-mfw-base/backend';
export declare class QueryAdPlacementDto extends PaginationQueryDto {
    name?: string;
    code?: string;
    placementTypeId?: string;
    status?: number;
}
