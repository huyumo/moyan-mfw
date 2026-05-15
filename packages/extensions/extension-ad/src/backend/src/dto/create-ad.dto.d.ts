/**
 * @fileoverview 创建广告内容请求 DTO
 * @description 创建广告的请求参数
 */
export declare class CreateAdDto {
    placementId: string;
    title: string;
    imageUrl: string;
    linkType: string;
    linkUrl?: string;
    miniAppId?: string;
    miniAppPath?: string;
    internalRoute?: string;
    startTime?: string;
    endTime?: string;
    sortOrder?: number;
}
