/**
 * @fileoverview 供应商模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SupplierMemberProfile } from './entities/supplier-member-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierMemberProfile])],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}