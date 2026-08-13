/**
 * @fileoverview 商家模块请求 DTO
 * @description 商家管理接口入参（添加/编辑/三方注册）
 * 注意：框架全局 ValidationPipe 开启 whitelist，未带 class-validator 装饰器的字段会被剥离
 */

import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建商家请求参数
 */
export class CreateMerchantDto {
  /** 店铺名称（同步为应用名称） */
  @IsNotEmpty({ message: '店铺名称不能为空' })
  @IsString()
  merchantName: string;

  /** 商家编码（业务唯一，同步为应用编码） */
  @IsNotEmpty({ message: '商家编码不能为空' })
  @IsString()
  merchantCode: string;

  /** 简称 */
  @IsOptional()
  @IsString()
  shortName?: string;

  /** 店铺 logo（JSON） */
  @IsOptional()
  logo?: any;

  /** 店铺设置（JSON） */
  @IsOptional()
  shopSettings?: any;

  /** 分佣配置（JSON） */
  @IsOptional()
  commissionConfig?: any;

  /** 商家管理员（框架用户 ID），同步为应用拥有者 owner */
  @IsOptional()
  @IsString()
  ownerId?: string;
}

/**
 * 更新商家请求参数
 */
export class UpdateMerchantDto {
  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  logo?: any;

  @IsOptional()
  shopSettings?: any;

  @IsOptional()
  commissionConfig?: any;
}

/**
 * 三方注册请求参数（演示通过 UserEntitySpi 扩展注册方式）
 */
export class ThirdPartyRegisterDto {
  /** 三方平台标识（如微信 openId） */
  @IsNotEmpty({ message: '三方平台标识不能为空' })
  @IsString()
  platformUserId: string;

  /** 三方平台类型（如 wechat / alipay） */
  @IsNotEmpty({ message: '三方平台类型不能为空' })
  @IsString()
  platformType: string;

  /** 昵称 */
  @IsOptional()
  @IsString()
  nickname?: string;

  /** 手机号 */
  @IsOptional()
  @IsString()
  phone?: string;

  /** 密码（可选，默认随机生成） */
  @IsOptional()
  @IsString()
  password?: string;

  /** 商家信息 */
  @ValidateNested()
  @Type(() => CreateMerchantDto)
  merchant: CreateMerchantDto;
}
