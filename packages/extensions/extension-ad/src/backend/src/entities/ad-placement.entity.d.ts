/**
 * @fileoverview 广告位实体
 * @description 定义广告位，关联广告位类型
 */
import { Base } from 'moyan-mfw-base/backend';
import { AdPlacementType } from './ad-placement-type.entity';
import { Ad } from './ad.entity';
export declare class AdPlacement extends Base {
    id: string;
    name: string;
    code: string;
    placementTypeId: string;
    placementType: AdPlacementType;
    description: string;
    status: number;
    sortOrder: number;
    ads: Ad[];
}
