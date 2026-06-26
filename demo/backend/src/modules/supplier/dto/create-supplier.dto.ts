/**
 * @fileoverview 创建供应商 DTO
 */

import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateSupplierDto {
  @IsString({ message: '公司名称不能为空' })
  companyName: string;

  @IsOptional()
  @IsString()
  businessLicense?: string;

  @IsOptional()
  @IsPhoneNumber('CN', { message: '联系电话格式不正确' })
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}