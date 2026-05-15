"use strict";
/**
 * @fileoverview 应用实例 ID 装饰器
 * @description 从请求中提取当前应用实例 ID
 *
 * 优先级：路由 params > 请求 body > 请求 query > 请求头 X-App-Id
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppId = void 0;
exports.resolveAppId = resolveAppId;
const common_1 = require("@nestjs/common");
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
exports.AppId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return resolveAppId(request);
});
function resolveAppId(request) {
    return request.params?.appId
        || request.body?.appId
        || request.query?.appId
        || request.headers?.['x-app-id']
        || undefined;
}
//# sourceMappingURL=app-id.decorator.js.map