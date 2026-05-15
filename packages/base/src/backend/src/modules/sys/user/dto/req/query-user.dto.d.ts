/**
 * @fileoverview 用户查询参数 DTO
 * @description 用户列表查询参数
 */
import { PaginationQueryDto } from '../../../../../common';
/**
 * 用户查询参数 DTO
 */
export declare class QueryUserDto extends PaginationQueryDto {
    /**
     * 用户名（模糊查询）
     */
    username?: string;
    /**
     * 手机号
     */
    phone?: string;
    /**
     * 状态 (1:启用 0:禁用)
     */
    userStatus?: number;
}
