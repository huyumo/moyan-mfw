/**
 * @fileoverview ProvinceCityDistrict 省市区行政区划数据工具
 * @description 基于高德地图 DistrictSearch 获取省市区三级行政区划树，支持内存缓存
 */

import { loadAmapSdk } from './amap-config';
import type { SimplyDataItem, ProvinceCityDistrictOptions } from './types';

/** 默认行政级别 */
const DEFAULT_LEVEL = 3;

/** 默认搜索关键词 */
const DEFAULT_KEYWORD = '中国';

/**
 * 省市区行政区划数据工具类
 *
 * 通过高德 DistrictSearch 获取行政区划树，并将其转换为简化结构。
 * 使用单例 + 内存缓存，同一 level + keyword 组合只请求一次。
 */
export class ProvinceCityDistrict {
  /** 原始数据缓存（按 level + keyword 组合存储） */
  private originalCache = new Map<string, any[]>();

  /** 简化数据缓存（按 level + keyword 组合存储） */
  private simplyCache = new Map<string, SimplyDataItem[]>();

  /** 单例实例 */
  private static instance: ProvinceCityDistrict | null = null;

  /**
   * 获取单例实例
   *
   * @returns ProvinceCityDistrict 单例
   */
  static getInstance(): ProvinceCityDistrict {
    if (!ProvinceCityDistrict.instance) {
      ProvinceCityDistrict.instance = new ProvinceCityDistrict();
    }
    return ProvinceCityDistrict.instance;
  }

  /**
   * 生成缓存键
   *
   * @param level - 行政级别
   * @param keyword - 搜索关键词
   * @returns 缓存键字符串
   */
  private getCacheKey(level: number, keyword: string): string {
    return `${level}_${keyword}`;
  }

  /**
   * 从高德地图获取原始行政区划数据
   *
   * @param level - 行政级别（下钻层级数）
   * @param keyword - 搜索关键词
   * @returns 原始行政区划列表
   */
  private async fetchOriginal(level: number, keyword: string): Promise<any[]> {
    const cacheKey = this.getCacheKey(level, keyword);

    const cached = this.originalCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const AMap = await loadAmapSdk();

    return new Promise<any[]>((resolve, reject) => {
      const district = new AMap.DistrictSearch({
        subdistrict: level,
        showbiz: false,
      });

      district.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result?.districtList?.[0]?.districtList) {
          const data = result.districtList[0].districtList;
          this.originalCache.set(cacheKey, data);
          resolve(data);
        } else {
          reject(new Error('获取行政区划数据失败'));
        }
      });
    });
  }

  /**
   * 将原始行政区划数据转换为简化结构
   *
   * @param original - 原始数据
   * @returns 简化数据树
   */
  private transformToSimply(original: any[]): SimplyDataItem[] {
    const handler = (arr: any[]): SimplyDataItem[] => {
      return arr.map((item) => {
        const newItem: SimplyDataItem = {
          value: item.adcode,
          label: item.name,
          level: item.level,
          center: item.center
            ? `${item.center.lng},${item.center.lat}`
            : undefined,
        };
        if (item.districtList && item.districtList.length > 0) {
          newItem.children = handler(item.districtList);
        }
        return newItem;
      });
    };
    return handler(original);
  }

  /**
   * 获取简化行政区划数据
   *
   * @param options - 配置选项
   * @returns 简化行政区划树
   * @example
   * ```ts
   * const pcd = getProvinceCityDistrict();
   * const tree = await pcd.getSimplyData();
   * ```
   */
  async getSimplyData(
    options?: ProvinceCityDistrictOptions,
  ): Promise<SimplyDataItem[]> {
    const level = options?.level ?? DEFAULT_LEVEL;
    const keyword = options?.keyword ?? DEFAULT_KEYWORD;
    const cacheKey = this.getCacheKey(level, keyword);

    const cached = this.simplyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const original = await this.fetchOriginal(level, keyword);
    const simply = this.transformToSimply(original);
    this.simplyCache.set(cacheKey, simply);
    return simply;
  }

  /**
   * 清除缓存数据
   */
  clearCache(): void {
    this.originalCache.clear();
    this.simplyCache.clear();
  }
}

/**
 * 获取 ProvinceCityDistrict 单例
 *
 * @returns ProvinceCityDistrict 实例
 */
export function getProvinceCityDistrict(): ProvinceCityDistrict {
  return ProvinceCityDistrict.getInstance();
}
