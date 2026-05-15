/**
 * @fileoverview 应用查询参数 DTO
 * @description 应用列表查询参数
 */
import { PaginationQueryDto } from '../../../../../common';
/**
 * 应用查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export declare class QueryAppDto extends PaginationQueryDto {
    /**
     * 应用名称（模糊查询）
     */
    appName?: string;
    /**
     * 应用编码（模糊查询）
     */
    appCode?: string;
    /**
     * 应用类型 ID
     */
    appTypeId?: string;
    /**
     * 拥有者 ID
     */
    ownerId?: string;
    /**
     * 应用状态
     */
    appStatus?: number;
}
