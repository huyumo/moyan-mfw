/**
 * @fileoverview 应用信息装饰器
 * @description 从请求中提取当前应用实例信息（需配合 AppInfoInterceptor 使用）
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppInfoDto } from '../types/app-info.dto';

/**
 * 应用信息装饰器
 * @description 自动从请求中解析当前操作的应用实例信息，需配合 AppInfoInterceptor 使用
 *
 * @example
 * ```typescript
 * @Get(':appId/profile')
 * async getAppProfile(@AppInfo() app: AppInfoDto) {
 *   return this.service.getAppProfile(app);
 * }
 *
 * @Post(':appId/settings')
 * async updateSettings(@Body() dto: SettingsDto, @AppInfo('appCode') appCode: string) {
 *   return this.service.updateSettings(appCode, dto);
 * }
 * ```
 */
export const AppInfo = createParamDecorator(
  (data: keyof AppInfoDto | undefined, ctx: ExecutionContext): AppInfoDto | AppInfoDto[keyof AppInfoDto] | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const app = request['app'] as AppInfoDto | undefined;

    if (!app) {
      return undefined;
    }

    if (data) {
      return app[data];
    }

    return app;
  },
);
