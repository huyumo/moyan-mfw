/**
 * @fileoverview 扫码配置管理控制器
 * @description 供扫码配置页面调用：码生成策略的读取/保存
 *
 * 路由前缀 ext/scan-code（Module 级 RouterModule 注入），最终路径 /api/ext/scan-code/config/*
 */

import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SkipPermission } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../../api-response';
import { ScanCodeConfigService } from '../scan-code-config.service';
import { SaveScanCodeSettingDto } from '../dto/scan-code-setting.dto';

@ApiTags('scan-code-config', '扫码配置管理接口')
@ApiBearerAuth('Authorization')
@SkipPermission()
@Controller('config')
export class ScanCodeConfigController {
  constructor(private readonly scanCodeConfigService: ScanCodeConfigService) {}

  @Get('settings')
  @ApiOperation({
    summary: '获取码生成策略配置',
    description: '未配置过时返回默认值（3 组 × 4 字符 + "-" 分隔，场景不限制）',
  })
  async getSettings() {
    const result = await this.scanCodeConfigService.getSettings();
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Put('settings')
  @ApiOperation({
    summary: '保存码生成策略配置',
    description:
      '单行 upsert。码内容总长度（分组字符 + 分隔符）不可超过 32 字符；场景白名单空数组 = 不限制',
  })
  async saveSettings(@Body() dto: SaveScanCodeSettingDto) {
    const result = await this.scanCodeConfigService.saveSettings(dto);
    return ApiResponseUtil.success(result, '保存成功');
  }
}
