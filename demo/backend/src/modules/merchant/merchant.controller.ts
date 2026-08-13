/**
 * @fileoverview 商家控制器
 * @description 商家管理接口：添加/编辑/禁用/启用/删除/详情/列表 + 三方注册示例
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { MerchantService } from './merchant.service';
import {
  CreateMerchantDto,
  UpdateMerchantDto,
  ThirdPartyRegisterDto,
} from './dto/merchant.dto';

/**
 * 商家控制器
 * @description 业务层商家管理接口，内部通过框架 SPI 同步维护应用/用户状态
 */
@ApiTags('merchant', '商家管理（SPI 示例）')
@ApiBearerAuth('Authorization')
@Controller('merchants')
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  /**
   * 添加商家
   * @description 同步创建框架应用实例并绑定拥有者
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '添加商家',
    description: '创建商家扩展表，并通过 SPI 同步创建应用实例（含 owner 绑定）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() dto: CreateMerchantDto) {
    return this.merchantService.create(dto);
  }

  /**
   * 三方注册（扩展注册方式示例）
   * @description 通过 UserEntitySpi 创建框架用户 + 创建商家应用绑定拥有者
   */
  @Post('register-third-party')
  @ApiOperation({
    summary: '三方注册',
    description: '演示扩展注册方式：业务层通过 UserEntitySpi 创建用户并创建商家应用',
  })
  @ApiResponse({ status: 201, description: '注册成功' })
  registerThirdParty(@Body() dto: ThirdPartyRegisterDto) {
    return this.merchantService.registerThirdParty(dto);
  }

  /**
   * 商家列表
   */
  @Get()
  @ApiOperation({ summary: '商家列表' })
  findAll() {
    return this.merchantService.findAll();
  }

  /**
   * 商家详情
   */
  @Get(':id')
  @ApiOperation({ summary: '商家详情（含关联应用信息）' })
  findById(@Param('id') id: string) {
    return this.merchantService.findById(id);
  }

  /**
   * 编辑商家
   */
  @Put(':id')
  @ApiOperation({ summary: '编辑商家', description: '更新商家扩展表并同步应用基础信息' })
  update(@Param('id') id: string, @Body() dto: UpdateMerchantDto) {
    return this.merchantService.update(id, dto);
  }

  /**
   * 禁用商家
   * @description 业务状态置 0 + SPI 同步禁用应用实例
   */
  @Put(':id/disable')
  @ApiOperation({ summary: '禁用商家', description: '禁用商家并同步禁用应用实例' })
  disable(@Param('id') id: string) {
    return this.merchantService.disable(id);
  }

  /**
   * 启用商家
   */
  @Put(':id/enable')
  @ApiOperation({ summary: '启用商家', description: '启用商家并同步启用应用实例' })
  enable(@Param('id') id: string) {
    return this.merchantService.enable(id);
  }

  /**
   * 删除商家
   * @description SPI 同步删除应用实例 + 删除商家扩展表
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除商家', description: '删除商家并同步删除应用实例' })
  remove(@Param('id') id: string) {
    return this.merchantService.remove(id);
  }
}
