/**
 * @fileoverview 广告类型配置查询参数 DTO
 * @description 广告位类型配置列表查询参数
 */
import { PaginationQueryDto } from 'moyan-mfw-base/backend';
export declare class QueryAdPlacementTypeDto extends PaginationQueryDto {
    name?: string;
    code?: string;
    status?: number;
}
