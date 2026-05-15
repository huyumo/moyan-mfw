/**
 * @fileoverview 广告内容查询参数 DTO
 * @description 广告列表查询参数
 */
import { PaginationQueryDto } from 'moyan-mfw-base/backend';
export declare class QueryAdDto extends PaginationQueryDto {
    placementId?: string;
    title?: string;
    linkType?: string;
    status?: number;
}
