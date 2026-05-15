/**
 * @fileoverview 应用类型查询参数 DTO
 * @description 应用类型列表查询参数
 */
import { PaginationQueryDto } from '../../../../../common';
/**
 * 应用类型查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export declare class QueryAppTypeDto extends PaginationQueryDto {
    /**
     * 类型名称（模糊查询）
     */
    typeName?: string;
    /**
     * 类型编码（模糊查询）
     */
    typeCode?: string;
    /**
     * 类型状态
     */
    typeStatus?: number;
    /**
     * 排序字段
     * @default 'sortOrder'
     */
    sortField?: string;
}
