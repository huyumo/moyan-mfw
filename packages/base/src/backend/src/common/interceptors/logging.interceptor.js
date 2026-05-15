"use strict";
/**
 * @fileoverview 日志拦截器
 * @description 拦截请求并记录日志，包括请求参数、响应结果和执行时间
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
/**
 * 日志拦截器
 * @description 记录每个请求的详细信息，包括执行时间和响应状态
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: LoggingInterceptor,
 *   },
 * ],
 * ```
 */
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    logger = new common_1.Logger(LoggingInterceptor_1.name);
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const method = request.method;
        const url = request.url;
        const now = Date.now();
        return next.handle().pipe((0, operators_1.tap)(() => {
            const executionTime = Date.now() - now;
            this.logger.log(`${method} ${url} - ${response.statusCode} - ${executionTime}ms`);
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map