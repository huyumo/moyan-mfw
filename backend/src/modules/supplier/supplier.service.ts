/**
 * @fileoverview 供应商服务
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierMemberProfile } from './entities/supplier-member-profile.entity';
import { CreateSupplierProfileDto } from './dto/create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(SupplierMemberProfile)
    private supplierProfileRepository: Repository<SupplierMemberProfile>,
  ) {}

  async create(dto: CreateSupplierProfileDto): Promise<SupplierMemberProfile> {
    const profile = this.supplierProfileRepository.create(dto);
    return this.supplierProfileRepository.save(profile);
  }

  async findAll(): Promise<SupplierMemberProfile[]> {
    return this.supplierProfileRepository.find({
      relations: ['member'],
    });
  }

  async findOne(id: string): Promise<SupplierMemberProfile | null> {
    return this.supplierProfileRepository.findOne({
      where: { id },
      relations: ['member'],
    });
  }

  async update(id: string, dto: Partial<CreateSupplierProfileDto>): Promise<SupplierMemberProfile | null> {
    await this.supplierProfileRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.supplierProfileRepository.delete(id);
  }
}