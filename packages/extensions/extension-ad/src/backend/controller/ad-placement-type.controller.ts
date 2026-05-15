/**
 * @fileoverview 广告位类型配置控制器
 * @description 处理广告位类型配置相关 HTTP 请求
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { AuthGuard, RequirePermission, ApiPaginatedResponse } from '@internal/base-backend'
import { ApiResponseUtil } from '../api-response'
import { AdPlacementTypeService } from '../service/ad-placement-type.service'
import { CreateAdPlacementTypeDto, UpdateAdPlacementTypeDto, QueryAdPlacementTypeDto } from '../dto'

@ApiTags('ad-placement-type', '广告位类型配置相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('ad-placement-types')
export class AdPlacementTypeController {
  constructor(private service: AdPlacementTypeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建广告位类型配置', description: '配置广告位的尺寸类型' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @RequirePermission({ permCode: 'ad:type:create', permissionValue: ['添加'] })
  async create(@Body() dto: CreateAdPlacementTypeDto) {
    const result = await this.service.create(dto)
    return ApiResponseUtil.success(result, '创建成功')
  }

  @Get()
  @ApiOperation({ summary: '查询类型配置列表' })
  @ApiPaginatedResponse(Object)
  @RequirePermission({ permCode: 'ad:type:view' })
  async findAll(@Query() query: QueryAdPlacementTypeDto) {
    const result = await this.service.findAll(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Get(':id')
  @ApiOperation({ summary: '查询类型配置详情' })
  @ApiParam({ name: 'id', description: '类型 ID' })
  @RequirePermission({ permCode: 'ad:type:view' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.findById(id)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Put(':id')
  @ApiOperation({ summary: '更新类型配置' })
  @ApiParam({ name: 'id', description: '类型 ID' })
  @RequirePermission({ permCode: 'ad:type:update', permissionValue: ['编辑'] })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdPlacementTypeDto) {
    const result = await this.service.update(id, dto)
    return ApiResponseUtil.success(result, '更新成功')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除类型配置' })
  @ApiParam({ name: 'id', description: '类型 ID' })
  @RequirePermission({ permCode: 'ad:type:delete', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id)
    return ApiResponseUtil.success(null, '删除成功')
  }
}
