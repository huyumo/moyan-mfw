/**
 * @fileoverview 成员查询参数 DTO
 * @description 成员列表查询参数
 */
import { PaginationQueryDto } from '../../../../../common';
/**
 * 成员查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export declare class QueryMemberDto extends PaginationQueryDto {
    /**
     * 用户昵称（模糊查询）
     */
    nickname?: string;
    /**
     * 用户名（模糊查询）
     */
    username?: string;
}
