/**
 * @fileoverview 分页响应装饰器
 * @description 用于简化分页接口的 Swagger 文档配置
 */
import { Type } from '@nestjs/common';
/**
 * 分页响应装饰器
 * @description 自动生成分页接口的 Swagger 响应文档
 * @param dataDto 数据 DTO 类
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiPaginatedResponse(UserResponseDto)
 * async findAll(@Query() query: QueryUserDto) {
 *   return this.userService.findAll(query);
 * }
 * ```
 */
export declare class PageResponseDto {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare function ApiPaginatedResponse<T>(dataDto: Type<T>): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
