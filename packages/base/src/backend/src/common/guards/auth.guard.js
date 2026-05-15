"use strict";
/**
 * @fileoverview 认证守卫
 * @description 验证用户身份，解析 JWT Token 并注入到请求中
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../decorators/public.decorator");
/**
 * 认证守卫
 * @description 验证请求是否携带有效的 JWT Token
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * providers: [AuthGuard],
 *
 * // 在控制器中使用
 * @UseGuards(AuthGuard)
 * class MyController {}
 * ```
 */
let AuthGuard = class AuthGuard {
    jwtService;
    reflector;
    constructor(jwtService, reflector) {
        this.jwtService = jwtService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        // 如果是公共接口，直接放行
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new common_1.UnauthorizedException('未授权，请先登录');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            // 将用户信息注入到请求中
            request['user'] = {
                id: payload.sub,
                username: payload.username,
                roleIds: payload.roleIds,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token 无效或已过期');
        }
        return true;
    }
    /**
     * 从请求头中提取 Token
     * @param request - HTTP 请求对象
     * @returns Token 字符串或 null
     */
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map