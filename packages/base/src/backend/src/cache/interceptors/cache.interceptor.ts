/**
 * @fileoverview 缓存拦截器
 * @description 拦截 @Cacheable / @CacheEvict 注解的方法，自动处理缓存读写
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {
  CACHE_OPTIONS,
  CACHE_EVICT_OPTIONS,
  CACHE_METHOD_KEY,
  CacheableOptions,
  CacheEvictOptions,
} from '../decorators/cache.decorator';
import { CACHE_SERVICE } from '../cache.module';
import { ICacheService } from '../interfaces/cache-service.interface';
import { CacheTTL } from '../constants/cache.constants';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const cacheConfig = this.reflector.get<CacheableOptions>(CACHE_OPTIONS, handler);
    const evictConfig = this.reflector.get<CacheEvictOptions>(CACHE_EVICT_OPTIONS, handler);

    if (evictConfig) {
      return next.handle().pipe(
        tap(async () => {
          const keys = this.resolveKeys(evictConfig.keys, context, handler);
          for (const key of keys) {
            if (key.includes('*')) {
              await this.cache.delByPattern(key);
            } else {
              await this.cache.del(key);
            }
          }
        }),
      );
    }

    if (cacheConfig) {
      const key = this.resolveKey(cacheConfig.key, context, handler);
      const ttl = cacheConfig.ttl ?? CacheTTL.DEFAULT;

      return from(this.cache.get(key)).pipe(
        switchMap((cached) => {
          if (cached !== null) return of(cached);

          return next.handle().pipe(
            switchMap((result) => {
              if (result !== undefined && result !== null) {
                return from(this.cache.set(key, result, ttl)).pipe(
                  switchMap(() => of(result)),
                );
              }
              return of(result);
            }),
          );
        }),
      );
    }

    return next.handle();
  }

  private resolveKey(template: string, context: ExecutionContext, handler: any): string {
    const paramMap: Map<number, string> =
      Reflect.getMetadata(CACHE_METHOD_KEY, context.getClass().prototype, handler.name) || new Map();

    return template.replace(/\{#(\w+)\}/g, (_, name: string) => {
      for (const [idx, n] of paramMap) {
        if (n === name) {
          const args = context.getArgs();
          return String(args[idx] ?? '');
        }
      }
      const req = context.switchToHttp().getRequest();
      return String(req.body?.[name] ?? req.params?.[name] ?? req.query?.[name] ?? '');
    });
  }

  private resolveKeys(
    keys: string | string[],
    context: ExecutionContext,
    handler: any,
  ): string[] {
    const list = Array.isArray(keys) ? keys : [keys];
    return list.map((k) => this.resolveKey(k, context, handler));
  }
}
