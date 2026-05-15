/**
 * @fileoverview 共享类型定义
 * @description 前后端共用的数据结构类型
 */
import type { LinkType } from './constants';
export interface AdPlacementTypeItem {
    id: string;
    name: string;
    code: string;
    width: number;
    height: number;
    description?: string;
    status: number;
    sortOrder: number;
    createdAt: string;
    updateAt?: string;
}
export interface AdPlacementItem {
    id: string;
    name: string;
    code: string;
    placementTypeId: string;
    placementType?: AdPlacementTypeItem;
    description?: string;
    status: number;
    sortOrder: number;
    createdAt: string;
    updateAt?: string;
}
export interface AdItem {
    id: string;
    placementId: string;
    placement?: AdPlacementItem;
    title: string;
    imageUrl: string;
    linkType: LinkType;
    linkUrl?: string;
    miniAppId?: string;
    miniAppPath?: string;
    internalRoute?: string;
    startTime?: string;
    endTime?: string;
    status: number;
    sortOrder: number;
    createdAt: string;
    updateAt?: string;
}
