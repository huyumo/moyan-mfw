/**
 * @fileoverview 更新用户请求 DTO
 * @description 更新用户的请求参数
 */
import { UserBaseDto } from './user-base.dto';
/**
 * 更新用户请求 DTO
 */
export declare class UpdateUserDto extends UserBaseDto {
    phone?: string;
    email?: string;
}
