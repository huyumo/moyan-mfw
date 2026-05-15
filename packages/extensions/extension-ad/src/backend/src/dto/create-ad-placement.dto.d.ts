/**
 * @fileoverview 创建广告位请求 DTO
 * @description 创建广告位的请求参数
 */
export declare class CreateAdPlacementDto {
    name: string;
    code: string;
    placementTypeId: string;
    description?: string;
    sortOrder?: number;
}
