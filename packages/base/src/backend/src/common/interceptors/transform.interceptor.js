"use strict";
/**
 * @fileoverview 响应转换拦截器
 * @description 统一转换响应格式，将数据封装到标准响应结构中
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const class_transformer_1 = require("class-transformer");
/**
 * 响应转换拦截器
 * @description 将响应数据统一封装为标准格式
 *
 * @example
 * ```typescript
 * // 标准响应格式
 * {
 *   code: 0,
 *   data: { ... },
 *   message: 'success',
 *   timestamp: '2026-03-31T12:00:00.000Z'
 * }
 * ```
 */
let TransformInterceptor = class TransformInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => {
            // 使用 classToPlain 转换 DTO，触发 @Transform 装饰器
            const plainData = (0, class_transformer_1.classToPlain)(data);
            // 如果数据已经是标准响应格式（包含 code 字段），直接返回
            if (plainData && typeof plainData === 'object' && 'code' in plainData) {
                return plainData;
            }
            // 否则封装为标准响应格式
            const response = {
                code: 0,
                data: plainData,
                message: 'success',
                timestamp: new Date().toISOString(),
            };
            return response;
        }));
    }
};
exports.TransformInterceptor = TransformInterceptor;
exports.TransformInterceptor = TransformInterceptor = __decorate([
    (0, common_1.Injectable)()
], TransformInterceptor);
//# sourceMappingURL=transform.interceptor.js.map