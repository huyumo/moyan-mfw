/**
 * @fileoverview AMap JS API 全局配置与 SDK 加载器
 * @description 提供全局配置存储、SDK 加载缓存，供 MfwAlimapPicker 及省市区数据工具共用
 */

import AMapLoader from '@amap/amap-jsapi-loader';
import type { AmapConfig } from './types';

/** 默认插件列表 */
const DEFAULT_PLUGINS = [
  'AMap.DistrictSearch',
  'AMap.Geocoder',
  'AMap.PlaceSearch',
  'AMap.CitySearch',
];

/** 默认 JS API 版本 */
const DEFAULT_VERSION = '2.0';

/** 全局配置（模块级单例） */
let amapConfig: AmapConfig | null = null;

/** SDK 加载缓存 Promise（避免重复加载） */
let sdkLoadPromise: Promise<any> | null = null;

/**
 * 配置 AMap JS API 凭证
 *
 * 应在应用初始化时调用一次，例如 main.ts 中：
 * ```ts
 * configureAmap({ key: 'your-key', securityJsCode: 'your-code' });
 * ```
 *
 * @param config - AMap 配置对象
 */
export function configureAmap(config: AmapConfig): void {
  amapConfig = {
    version: DEFAULT_VERSION,
    plugins: DEFAULT_PLUGINS,
    ...config,
  };
}

/**
 * 获取当前 AMap 全局配置
 *
 * @returns 当前配置，未配置时返回 null
 */
export function getAmapConfig(): AmapConfig | null {
  return amapConfig;
}

/**
 * 加载 AMap JS SDK
 *
 * 首次调用时设置 `window._AMapSecurityConfig` 并通过 `@amap/amap-jsapi-loader` 加载 SDK，
 * 后续调用返回缓存的 Promise，避免重复加载。
 *
 * @returns 解析为 AMap 命名空间的 Promise
 * @throws 未调用 `configureAmap` 或加载失败时抛出错误
 */
export function loadAmapSdk(): Promise<any> {
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  if (!amapConfig) {
    return Promise.reject(
      new Error('[MfwAlimapPicker] 请先调用 configureAmap(config) 配置高德地图凭证'),
    );
  }

  // 设置安全密钥（JS API 2.0 要求）
  (window as any)._AMapSecurityConfig = {
    securityJsCode: amapConfig.securityJsCode,
  };

  sdkLoadPromise = AMapLoader.load({
    key: amapConfig.key,
    version: amapConfig.version || DEFAULT_VERSION,
    plugins: amapConfig.plugins || DEFAULT_PLUGINS,
  }).catch((err: any) => {
    // 加载失败时清除缓存，允许重试
    sdkLoadPromise = null;
    throw err;
  });

  return sdkLoadPromise;
}
