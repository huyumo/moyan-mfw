/**
 * @fileoverview 供应商控制器
 */

import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierProfileDto } from './dto/create-supplier.dto';
import { SupplierMemberProfile } from './entities/supplier-member-profile.entity';

@ApiTags('供应商')
@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @ApiOperation({ summary: '创建供应商档案' })
  @ApiResponse({ status: 201, description: '创建成功', type: SupplierMemberProfile })
  create(@Body() dto: CreateSupplierProfileDto): Promise<SupplierMemberProfile> {
    return this.supplierService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有供应商档案' })
  @ApiResponse({ status: 200, description: '获取成功', type: [SupplierMemberProfile] })
  findAll(): Promise<SupplierMemberProfile[]> {
    return this.supplierService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个供应商档案' })
  @ApiResponse({ status: 200, description: '获取成功', type: SupplierMemberProfile })
  findOne(@Param('id') id: string): Promise<SupplierMemberProfile | null> {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新供应商档案' })
  @ApiResponse({ status: 200, description: '更新成功', type: SupplierMemberProfile })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSupplierProfileDto>,
  ): Promise<SupplierMemberProfile | null> {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除供应商档案' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string): Promise<void> {
    return this.supplierService.remove(id);
  }
}