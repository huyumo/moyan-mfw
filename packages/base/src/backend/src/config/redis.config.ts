/**
 * @fileoverview Redis 配置
 * @description Redis 连接配置，用于缓存和会话存储
 */

import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',

  port: parseInt(process.env.REDIS_PORT || '6379', 10),

  password: process.env.REDIS_PASSWORD || '',

  db: parseInt(process.env.REDIS_DB || '0', 10),

  keyPrefix: process.env.REDIS_KEY_PREFIX || 'mfw:',

  defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '1800', 10),
}));
