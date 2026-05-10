/**
 * @fileoverview 广告位控制器
 * @description 处理广告位相关 HTTP 请求
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { AuthGuard, RequirePermission, ApiResponseUtil, ApiPaginatedResponse } from 'moyan-base-backend'
import { AdPlacementService } from '../service/ad-placement.service'
import { CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto } from '../dto'

@ApiTags('ad-placement', '广告位相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('ad-placements')
export class AdPlacementController {
  constructor(private service: AdPlacementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建广告位', description: '创建新的广告位' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @RequirePermission({ permCode: 'ad:placement:create', permissionValue: ['添加'] })
  async create(@Body() dto: CreateAdPlacementDto) {
    const result = await this.service.create(dto)
    return ApiResponseUtil.success(result, '创建成功')
  }

  @Get()
  @ApiOperation({ summary: '查询广告位列表', description: '分页查询广告位列表，包含关联的类型配置' })
  @ApiPaginatedResponse(Object)
  @RequirePermission({ permCode: 'ad:placement:view' })
  async findAll(@Query() query: QueryAdPlacementDto) {
    const result = await this.service.findAll(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Get(':id')
  @ApiOperation({ summary: '查询广告位详情' })
  @ApiParam({ name: 'id', description: '广告位 ID' })
  @RequirePermission({ permCode: 'ad:placement:view' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.findById(id)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Put(':id')
  @ApiOperation({ summary: '更新广告位' })
  @ApiParam({ name: 'id', description: '广告位 ID' })
  @RequirePermission({ permCode: 'ad:placement:update', permissionValue: ['编辑'] })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdPlacementDto) {
    const result = await this.service.update(id, dto)
    return ApiResponseUtil.success(result, '更新成功')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除广告位' })
  @ApiParam({ name: 'id', description: '广告位 ID' })
  @RequirePermission({ permCode: 'ad:placement:delete', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id)
    return ApiResponseUtil.success(null, '删除成功')
  }
}
