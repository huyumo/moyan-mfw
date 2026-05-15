"use strict";
/**
 * @fileoverview 分页响应装饰器
 * @description 用于简化分页接口的 Swagger 文档配置
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
exports.PageResponseDto = void 0;
exports.ApiPaginatedResponse = ApiPaginatedResponse;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
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
class PageResponseDto {
    total;
    page;
    pageSize;
    totalPages;
    hasNext;
    hasPrev;
}
exports.PageResponseDto = PageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '总数量' }),
    __metadata("design:type", Number)
], PageResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前页码' }),
    __metadata("design:type", Number)
], PageResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量' }),
    __metadata("design:type", Number)
], PageResponseDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '总页数' }),
    __metadata("design:type", Number)
], PageResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有下一页' }),
    __metadata("design:type", Boolean)
], PageResponseDto.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有上一页' }),
    __metadata("design:type", Boolean)
], PageResponseDto.prototype, "hasPrev", void 0);
function ApiPaginatedResponse(dataDto) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(dataDto), (0, swagger_1.ApiExtraModels)(PageResponseDto), 
    // ApiResponse({
    //   status: 200,
    //   description: '查询成功',
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       list: {
    //         type: 'array',
    //         items: { $ref: `#/components/schemas/${dataDto.name}` },
    //       },
    //       total: { type: 'number', description: '总数量' },
    //       page: { type: 'number', description: '当前页码' },
    //       pageSize: { type: 'number', description: '每页数量' },
    //       totalPages: { type: 'number', description: '总页数' },
    //       hasNext: { type: 'boolean', description: '是否有下一页' },
    //       hasPrev: { type: 'boolean', description: '是否有上一页' },
    //     },
    //   },
    // }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        schema: {
            type: 'object',
            allOf: [
                { $ref: `#/components/schemas/${PageResponseDto.name}` },
                {
                    properties: {
                        list: {
                            type: 'array',
                            items: { $ref: `#/components/schemas/${dataDto.name}` },
                        },
                    },
                    required: ['list'],
                }
            ],
        },
    }));
}
//# sourceMappingURL=api-paginated-response.decorator.js.map