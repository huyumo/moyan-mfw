/**
 * @fileoverview 商家模块
 * @description 展示业务层通过框架 SPI 集成：
 * - MerchantService：注入 AppEntitySpi / UserEntitySpi（业务层入口）
 * - 监听器：实现框架监听器接口并自注册（框架层入口）
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { MerchantMemberListener } from './merchant-member.listener';
import { MerchantUserListener } from './merchant-user.listener';
import { Merchant } from './entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant])],
  controllers: [MerchantController],
  providers: [MerchantService, MerchantMemberListener, MerchantUserListener],
  exports: [MerchantService],
})
export class MerchantModule {}
