"use strict";
/**
 * @fileoverview 公共接口装饰器
 * @description 标记接口为公共接口，无需认证即可访问
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
/**
 * 公共接口标识键
 * @description 用于 Reflector 获取公共接口标识
 */
exports.IS_PUBLIC_KEY = 'isPublic';
/**
 * 公共接口装饰器
 * @description 标记控制器方法为公共接口，无需认证即可访问
 *
 * @example
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   @Public()
 *   @Post('login')
 *   async login(@Body() dto: LoginDto) {}
 * }
 * ```
 */
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
//# sourceMappingURL=public.decorator.js.map