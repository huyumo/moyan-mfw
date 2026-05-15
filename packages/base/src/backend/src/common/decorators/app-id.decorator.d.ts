/**
 * @fileoverview 应用实例 ID 装饰器
 * @description 从请求中提取当前应用实例 ID
 *
 * 优先级：路由 params > 请求 body > 请求 query > 请求头 X-App-Id
 */
/**
 * 应用实例 ID 装饰器
 * @description 自动从请求中解析当前操作的应用实例 ID
 *
 * @example
 * ```typescript
 * @Get(':appId/members')
 * async getMembers(@AppId() appId: string) {
 *   return this.service.getMembers(appId);
 * }
 *
 * @Post('create')
 * async create(@Body() dto: CreateDto, @AppId() appId: string) {
 *   return this.service.create(appId, dto);
 * }
 * ```
 */
export declare const AppId: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare function resolveAppId(request: any): string | undefined;
