/**
 * @fileoverview 广告内容控制器
 * @description 处理广告内容相关 HTTP 请求
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { AuthGuard, RequirePermission, ApiResponseUtil, ApiPaginatedResponse } from 'moyan-base-backend'
import { AdService } from '../service/ad.service'
import { CreateAdDto, UpdateAdDto, QueryAdDto } from '../dto'

@ApiTags('ad-content', '广告内容相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('ad-contents')
export class AdController {
  constructor(private service: AdService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建广告内容', description: '在指定广告位下创建新的广告内容' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @RequirePermission({ permCode: 'ad:content:create', permissionValue: ['添加'] })
  async create(@Body() dto: CreateAdDto) {
    const result = await this.service.create(dto)
    return ApiResponseUtil.success(result, '创建成功')
  }

  @Get()
  @ApiOperation({ summary: '查询广告内容列表', description: '分页查询广告内容列表' })
  @ApiPaginatedResponse(Object)
  @RequirePermission({ permCode: 'ad:content:view' })
  async findAll(@Query() query: QueryAdDto) {
    const result = await this.service.findAll(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Get(':id')
  @ApiOperation({ summary: '查询广告内容详情' })
  @ApiParam({ name: 'id', description: '广告 ID' })
  @RequirePermission({ permCode: 'ad:content:view' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.findById(id)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Put(':id')
  @ApiOperation({ summary: '更新广告内容' })
  @ApiParam({ name: 'id', description: '广告 ID' })
  @RequirePermission({ permCode: 'ad:content:update', permissionValue: ['编辑'] })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdDto) {
    const result = await this.service.update(id, dto)
    return ApiResponseUtil.success(result, '更新成功')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除广告内容' })
  @ApiParam({ name: 'id', description: '广告 ID' })
  @RequirePermission({ permCode: 'ad:content:delete', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id)
    return ApiResponseUtil.success(null, '删除成功')
  }
}
