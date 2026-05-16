/**
 * @fileoverview 广告位控制器
 * @description 处理广告位相关 HTTP 请求
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { AuthGuard, RequirePermission, ApiPaginatedResponse, Public, SkipPermission } from 'moyan-mfw-base/backend'
import { ApiResponseUtil } from '../api-response'
import { AdPlacementService } from '../service/ad-placement.service'
import { CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto, AdPlacementResponseDto } from '../dto'

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
  @RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['添加'] })
  async create(@Body() dto: CreateAdPlacementDto) {
    const result = await this.service.create(dto)
    return ApiResponseUtil.success(result, '创建成功')
  }

  @Get()
  @ApiOperation({ summary: '查询广告位列表', description: '分页查询广告位列表，包含关联的类型配置' })
  @ApiPaginatedResponse(AdPlacementResponseDto)
  @RequirePermission({ permCode: '*:ext:ad:*' })
  async findAll(@Query() query: QueryAdPlacementDto) {
    const result = await this.service.findAll(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Get('by-code')
  @Public()
  @SkipPermission()
  @ApiOperation({ summary: '按编码获取广告位及广告（公开接口）', description: '根据广告位编码查询广告位及其当前有效的广告列表，无需登录' })
  @ApiQuery({ name: 'code', description: '广告位编码', example: 'home-top-banner' })
  async getByCode(@Query('code') code: string) {
    const result = await this.service.findByCodeWithAds(code)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Get(':id')
  @ApiOperation({ summary: '查询广告位详情' })
  @ApiParam({ name: 'id', description: '广告位 ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.findById(id)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Put(':id')
  @ApiOperation({ summary: '更新广告位' })
  @ApiParam({ name: 'id', description: '广告位 ID' })
  @RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['编辑'] })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdPlacementDto) {
    const result = await this.service.update(id, dto)
    return ApiResponseUtil.success(result, '更新成功')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除广告位' })
  @ApiParam({ name: 'id', description: '广告位 ID' })
  @RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id)
    return ApiResponseUtil.success(null, '删除成功')
  }
}
