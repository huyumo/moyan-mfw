/**
 * @fileoverview 图片资源工具函数
 * @description 提供图片资源地址提取等通用方法
 */

import type { ImageResource } from '../components/upload/types';

/**
 * 从图片资源中提取 URL 地址
 * @param image - 图片资源，支持字符串 URL、ImageResource 对象或 undefined
 * @returns 图片 URL 地址，无有效值时返回 undefined
 */
export function getImageSrc(image: string | ImageResource | undefined): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return image.src;
}
