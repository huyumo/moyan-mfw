/**
 * @fileoverview 创建用户请求 DTO
 * @description 创建用户的请求参数
 */
import { UserBaseDto } from './user-base.dto';
/**
 * 创建用户请求 DTO
 */
export declare class CreateUserDto extends UserBaseDto {
    username: string;
    password: string;
    phone?: string;
    email?: string;
}
