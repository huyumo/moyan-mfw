/**
 * @fileoverview 广告位类型配置实体
 * @description 定义广告位的类型和尺寸配置
 */
import { Base } from 'moyan-mfw-base/backend';
import { AdPlacement } from './ad-placement.entity';
export declare class AdPlacementType extends Base {
    id: string;
    name: string;
    code: string;
    width: number;
    height: number;
    description: string;
    status: number;
    sortOrder: number;
    placements: AdPlacement[];
}
