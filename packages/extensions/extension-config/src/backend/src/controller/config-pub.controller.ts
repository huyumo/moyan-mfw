/**
 * @fileoverview 配置公开接口控制器
 * @description 无需认证即可访问的公开配置接口
 */

import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../api-response';
import { ConfigService } from '../service/config.service';
import { ConfigResponseDto } from '../dto';

@ApiTags('ext-config-pub', '配置公开接口')
@Controller('pub')
export class ConfigPubController {
  constructor(private readonly service: ConfigService) {}

  @Get(':groupKey')
  @Public()
  @ApiOperation({ summary: '获取公开配置', description: '无需认证，仅返回公共配置（configType=0）' })
  @ApiParam({ name: 'groupKey', description: '分组标识' })
  @ApiResponse({ status: 200, description: '获取成功', type: [ConfigResponseDto] })
  async getPublicByGroup(@Param('groupKey') groupKey: string) {
    const result = await this.service.getPublicByGroup(groupKey);
    return ApiResponseUtil.success(result, '查询成功');
  }
}
