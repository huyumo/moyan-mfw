/**
 * @fileoverview 广告内容实体
 * @description 定义广告位中的具体广告内容
 */
import { Base } from 'moyan-mfw-base/backend';
import { AdPlacement } from './ad-placement.entity';
export declare class Ad extends Base {
    id: string;
    placementId: string;
    placement: AdPlacement;
    title: string;
    imageUrl: string;
    linkUrl: string;
    linkType: string;
    miniAppId: string;
    miniAppPath: string;
    internalRoute: string;
    startTime: Date;
    endTime: Date;
    status: number;
    sortOrder: number;
}
