/**
 * @fileoverview 缓存常量
 * @description TTL 分级常量与速率限制预设
 */

export const CacheTTL = {
  SHORT: 180,
  DEFAULT: 1800,
  MEDIUM: 3600,
  LONG: 7200,
} as const;

export const RateLimit = {
  LOGIN: { max: 5, window: 60 },
  CAPTCHA: { max: 1, window: 60 },
  GLOBAL: { max: 20, window: 1 },
  SENSITIVE: { max: 3, window: 600 },
} as const;
