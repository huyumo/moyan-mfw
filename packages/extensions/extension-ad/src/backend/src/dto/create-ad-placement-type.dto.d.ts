/**
 * @fileoverview 创建广告类型配置请求 DTO
 * @description 创建广告位类型配置的请求参数
 */
export declare class CreateAdPlacementTypeDto {
    name: string;
    code: string;
    width: number;
    height: number;
    description?: string;
    sortOrder?: number;
}
