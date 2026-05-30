/**
 * @fileoverview 缓存装饰器
 * @description 声明式缓存注解：@Cacheable 读缓存、@CacheEvict 删缓存、@CacheMethodKey 标记参数
 */

import { SetMetadata } from '@nestjs/common';

export const CACHE_OPTIONS = Symbol('cache:options');
export const CACHE_EVICT_OPTIONS = Symbol('cache:evict');
export const CACHE_METHOD_KEY = Symbol('cache:method_key');

export interface CacheableOptions {
  key: string;
  ttl?: number;
  unlessNull?: boolean;
}

export interface CacheEvictOptions {
  keys: string | string[];
}

export function Cacheable(options: CacheableOptions) {
  return SetMetadata(CACHE_OPTIONS, options);
}

export function CacheEvict(options: CacheEvictOptions) {
  return SetMetadata(CACHE_EVICT_OPTIONS, options);
}

export function CacheMethodKey(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (!propertyKey) {
      return;
    }
    const existing: Map<number, string> =
      Reflect.getMetadata(CACHE_METHOD_KEY, target, propertyKey) || new Map();
    existing.set(parameterIndex, name);
    Reflect.defineMetadata(CACHE_METHOD_KEY, existing, target, propertyKey);
  };
}
