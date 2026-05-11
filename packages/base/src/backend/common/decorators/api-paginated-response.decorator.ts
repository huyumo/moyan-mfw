/**
 * @fileoverview 分页响应装饰器
 * @description 用于简化分页接口的 Swagger 文档配置
 */

import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, ApiResponse } from '@nestjs/swagger';

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

export class PageResponseDto {
  @ApiProperty({ description: '总数量' })
  total: number;
  @ApiProperty({ description: '当前页码' })
  page: number;
  @ApiProperty({ description: '每页数量' })
  pageSize: number;
  @ApiProperty({ description: '总页数' })
  totalPages: number;
  @ApiProperty({ description: '是否有下一页' })
  hasNext: boolean;
  @ApiProperty({ description: '是否有上一页' })
  hasPrev: boolean;
}



export function ApiPaginatedResponse<T>(dataDto: Type<T>) {
  return applyDecorators(
    ApiExtraModels(dataDto),
    ApiExtraModels(PageResponseDto),
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
    ApiResponse({
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
    }),
  );



}
