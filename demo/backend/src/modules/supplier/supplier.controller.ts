/**
 * @fileoverview 供应商控制器
 */

import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Permission } from '../../permissions';

@ApiTags('supplier')
@Controller('supplier')
@Permission('supplier:manage')
export class SupplierController {
  constructor(private supplierService: SupplierService) {}

  @Post('profile/:memberId')
  @ApiOperation({ summary: '创建供应商档案' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Permission('supplier:manage', ['上架'])
  async createProfile(
    @Param('memberId') memberId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.supplierService.createSupplierProfile(memberId, dto);
  }

  @Get('profile/:memberId')
  @ApiOperation({ summary: '获取供应商档案' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(@Param('memberId') memberId: string) {
    return this.supplierService.getSupplierProfile(memberId);
  }

  @Put('profile/:memberId')
  @ApiOperation({ summary: '更新供应商档案' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Permission('supplier:manage', ['发货'])
  async updateProfile(
    @Param('memberId') memberId: string,
    @Body() dto: Partial<CreateSupplierDto>,
  ) {
    return this.supplierService.updateSupplierProfile(memberId, dto);
  }

  @Get('profiles')
  @ApiOperation({ summary: '获取供应商档案列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Permission('supplier:manage', ['退款','上架', '添加'])
  async listProfiles() {
    return this.supplierService.listSupplierProfiles();
  }
}