import { ImageResourceDto } from '@/common';
/**
 * 用户公共字段基类
 * @description CreateUserDto / AdminCreateUserDto / UpdateUserDto 共享字段
 */
export declare class UserBaseDto {
    nickname?: string;
    avatar?: ImageResourceDto;
    gender?: number;
}
