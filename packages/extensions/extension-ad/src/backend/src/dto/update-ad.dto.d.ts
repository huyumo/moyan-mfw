/**
 * @fileoverview 更新广告内容请求 DTO
 * @description 更新广告的请求参数
 */
export declare class UpdateAdDto {
    title?: string;
    imageUrl?: string;
    linkType?: string;
    linkUrl?: string;
    miniAppId?: string;
    miniAppPath?: string;
    internalRoute?: string;
    startTime?: string;
    endTime?: string;
    status?: number;
    sortOrder?: number;
}
