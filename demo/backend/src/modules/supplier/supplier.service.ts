/**
 * @fileoverview 供应商服务
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierMemberProfile } from './entities/supplier-member-profile.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(SupplierMemberProfile)
    private supplierProfileRepository: Repository<SupplierMemberProfile>,
  ) {}

  async createSupplierProfile(memberId: string, dto: CreateSupplierDto): Promise<SupplierMemberProfile> {
    const profile = this.supplierProfileRepository.create({
      ...dto,
    });
    profile.member = { id: memberId } as any;
    return this.supplierProfileRepository.save(profile);
  }

  async getSupplierProfile(memberId: string): Promise<SupplierMemberProfile | null> {
    return this.supplierProfileRepository.findOne({
      where: { member: { id: memberId } as any },
      relations: ['member'],
    });
  }

  async updateSupplierProfile(memberId: string, dto: Partial<CreateSupplierDto>): Promise<SupplierMemberProfile> {
    const profile = await this.getSupplierProfile(memberId);
    if (!profile) {
      throw new Error('供应商档案不存在');
    }
    Object.assign(profile, dto);
    return this.supplierProfileRepository.save(profile);
  }

  async listSupplierProfiles(): Promise<SupplierMemberProfile[]> {
    return this.supplierProfileRepository.find({
      relations: ['member'],
    });
  }
}