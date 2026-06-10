/**
 * @fileoverview 应用实例装饰器
 * @description 从请求中提取当前应用实例信息（需配合 AppInterceptor 使用）
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppDto } from '../types/app.dto';

/**
 * 应用实例装饰器
 * @description 自动从请求中解析当前操作的应用实例信息，需配合 AppInterceptor 使用
 *
 * @example
 * ```typescript
 * @Get(':appId/profile')
 * async getAppProfile(@App() app: AppDto) {
 *   return this.service.getAppProfile(app);
 * }
 *
 * @Post(':appId/settings')
 * async updateSettings(@Body() dto: SettingsDto, @App() app: AppDto) {
 *   return this.service.updateSettings(app.id, dto);
 * }
 * ```
 */
export const App = createParamDecorator(
  (data: keyof AppDto | undefined, ctx: ExecutionContext): AppDto | AppDto[keyof AppDto] | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const app = request['app'] as AppDto | undefined;

    if (!app) {
      return undefined;
    }

    if (data) {
      return app[data];
    }

    return app;
  },
);
