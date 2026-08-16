/**
 * @fileoverview 短信配置管理控制器
 * @description 供短信配置页面调用：运营商凭证 + 模板 CRUD
 *
 * 路由前缀 ext/sms（Module 级 RouterModule 注入），最终路径 /api/ext/sms/config/*
 */

import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SkipPermission } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../../api-response';
import { SmsConfigService } from '../sms-config.service';
import { SaveSmsProviderSettingDto, SaveSmsTemplateDto } from '../dto';

@ApiTags('sms-config', '短信配置管理接口')
@ApiBearerAuth('Authorization')
@SkipPermission()
@Controller('config')
export class SmsConfigController {
  constructor(private readonly smsConfigService: SmsConfigService) {}

  @Get('provider-setting')
  @ApiOperation({
    summary: '获取运营商配置',
    description:
      '返回当前生效的运营商凭证（secret 脱敏）。DB 配置优先，降级读环境变量，均无配置返回 null',
  })
  async getProviderSetting() {
    const result = await this.smsConfigService.getProviderSettingView();
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Put('provider-setting')
  @ApiOperation({
    summary: '保存运营商配置',
    description: '单行 upsert。accessKeySecret 留空表示保持不变；首次配置必填',
  })
  async saveProviderSetting(@Body() dto: SaveSmsProviderSettingDto) {
    await this.smsConfigService.saveProviderSetting(dto);
    return ApiResponseUtil.success(null, '保存成功');
  }

  @Get('templates')
  @ApiOperation({ summary: '获取短信模板列表', description: '全部模板，按场景名升序' })
  async listTemplates() {
    const result = await this.smsConfigService.listTemplates();
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Put('templates')
  @ApiOperation({
    summary: '保存短信模板',
    description: 'upsert：传 id 按 id 更新，不传按 scene 定位；scene 全局唯一',
  })
  async saveTemplate(@Body() dto: SaveSmsTemplateDto) {
    const result = await this.smsConfigService.upsertTemplate(dto);
    return ApiResponseUtil.success(result, '保存成功');
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除短信模板', description: '软删除' })
  @ApiParam({ name: 'id', description: '模板 ID' })
  async deleteTemplate(@Param('id') id: string) {
    await this.smsConfigService.deleteTemplate(id);
    return ApiResponseUtil.success(null, '删除成功');
  }
}
