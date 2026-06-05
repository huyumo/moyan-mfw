/**
 * @fileoverview 配置管理控制器
 * @description 处理配置管理的 HTTP 请求
 */

import {
  Controller, Get, Put, Delete,
  Body, Param, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public, RequirePermission } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../api-response';
import { ConfigService } from '../service/config.service';
import { BatchUpdateConfigDto, ConfigResponseDto } from '../dto';

@ApiTags('ext-config', '配置管理相关接口')
@Controller('')
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @Get('group/:groupKey')
  @RequirePermission({ permCode: '*:ext:config:*'})
  @ApiOperation({ summary: '按分组获取配置', description: '获取指定分组下的所有配置' })
  @ApiParam({ name: 'groupKey', description: '分组标识' })
  @ApiResponse({ status: 200, description: '获取成功', type: [ConfigResponseDto] })
  async getByGroup(
    @Query('appId') appId: string | undefined,
    @Param('groupKey') groupKey: string,
  ) {
    const appIdNum = appId !== undefined && appId !== 'null' ? Number(appId) : null;
    const result = await this.service.getByGroup(appIdNum, groupKey);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Put('batch')
  @RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['编辑'] })
  @ApiOperation({ summary: '批量更新配置', description: '批量更新指定分组下的配置（upsert 逻辑）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async batchUpdate(@Body() dto: BatchUpdateConfigDto) {
    const appIdNum = dto.appId !== undefined && dto.appId !== null ? dto.appId : null;
    await this.service.batchUpdate(appIdNum, dto.groupKey, dto);
    return ApiResponseUtil.success(null, '更新成功');
  }

  @Delete(':id')
  @RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['删除'] })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除配置' })
  @ApiParam({ name: 'id', description: '配置 ID' })
  async delete(
    @Query('appId') appId: string | undefined,
    @Query('groupKey') groupKey: string,
    @Param('id') id: string,
  ) {
    const appIdNum = appId !== undefined && appId !== 'null' ? Number(appId) : null;
    await this.service.delete(appIdNum, groupKey, Number(id));
    return ApiResponseUtil.success(null, '删除成功');
  }
}
