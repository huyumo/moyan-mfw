/**
 * @fileoverview 初始化控制器
 * @description 提供系统初始化相关 API 接口
 */

import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { InstallService } from './install.service';
import { InitRequestDto } from './dto/init-request.dto';
import { InitResponseDto, InitStatusResponseDto } from './dto/init-response.dto';

/**
 * 初始化控制器
 */
@ApiTags('系统初始化')
@Controller('install')
export class InstallController {
  constructor(private readonly installService: InstallService) {}

  /**
   * 检查系统是否已初始化
   * @returns 初始化状态
   */
  @Get('status')
  @Public()
  @ApiOperation({ summary: '检查系统是否已初始化' })
  @ApiResponse({
    status: 200,
    type: InitStatusResponseDto,
    description: '返回系统初始化状态',
  })
  async getStatus(): Promise<InitStatusResponseDto> {
    const initialized = await this.installService.isInitialized();
    return { initialized };
  }

  /**
   * 执行系统初始化
   * @param initData 初始化数据
   * @returns 初始化结果
   */
  @Post('init')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行系统初始化' })
  @ApiBody({ type: InitRequestDto })
  @ApiResponse({
    status: 200,
    type: InitResponseDto,
    description: '返回初始化结果',
  })
  @ApiResponse({
    status: 409,
    description: '系统已初始化，无法重复执行',
  })
  async initialize(@Body() initData: InitRequestDto): Promise<InitResponseDto> {
    return this.installService.initialize(initData);
  }
}
