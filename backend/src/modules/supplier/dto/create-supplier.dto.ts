/**
 * @fileoverview 创建供应商 DTO
 */

import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateSupplierProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  companyName: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  businessLicense?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;
}