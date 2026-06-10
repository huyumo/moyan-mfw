/**
 * @fileoverview 应用信息拦截器
 * @description 从请求中提取 appId，查询应用信息并注入到 request['app']
 */

import { Inject, Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { resolveAppId } from '../decorators/app-id.decorator';
import { AppInfoDto } from '../types/app-info.dto';
import { CACHE_SERVICE } from '../../cache/cache.module';
import { ICacheService } from '../../cache/interfaces/cache-service.interface';
import { CacheTTL } from '../../cache/constants/cache.constants';

/** 应用信息缓存键前缀 */
const APP_CACHE_KEY = 'app:info:';

/**
 * 应用信息拦截器
 * @description 自动从请求中解析 appId，查询应用信息并注入到 request.app
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: AppInfoInterceptor,
 *   },
 * ],
 * ```
 */
@Injectable()
export class AppInfoInterceptor implements NestInterceptor {
  constructor(
    private dataSource: DataSource,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const appId = resolveAppId(request);

    if (appId) {
      const app = await this.findAppById(appId);
      if (app) {
        request['app'] = app;
      }
    }

    return next.handle();
  }

  /**
   * 根据 ID 查询应用信息（优先读缓存）
   * @param id - 应用实例 ID
   * @returns 应用信息 DTO 或 null
   */
  private async findAppById(id: string): Promise<AppInfoDto | null> {
    const cacheKey = `${APP_CACHE_KEY}${id}`;

    return this.cache.getOrSet<AppInfoDto>(cacheKey, async () => {
      const result = await this.dataSource.query(
        `SELECT 
          a.id,
          a.appName,
          a.appCode,
          a.appTypeId,
          a.ownerId,
          a.appStatus,
          t.typeCode as appTypeCode,
          t.multiAppEnabled
        FROM sys_apps a
        LEFT JOIN sys_app_types t ON a.appTypeId = t.id
        WHERE a.id = ? AND a.deleteAt IS NULL`,
        [id],
      );

      if (!result || result.length === 0) {
        return null;
      }

      return result[0] as AppInfoDto;
    }, CacheTTL.MEDIUM);
  }
}
