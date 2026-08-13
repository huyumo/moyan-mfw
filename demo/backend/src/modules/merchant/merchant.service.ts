/**
 * @fileoverview 商家服务
 * @description 展示业务层通过框架 SPI 同步维护框架内部状态：
 * - AppEntitySpi：添加/编辑/禁用/启用/删除商家时同步应用实例
 * - UserEntitySpi：三方注册时创建框架用户（扩展注册方式）
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  AppEntitySpi,
  UserEntitySpi,
  CreateAppSpiInput,
} from 'moyan-mfw-base/backend';
import { Merchant } from './entities/merchant.entity';
import {
  CreateMerchantDto,
  UpdateMerchantDto,
  ThirdPartyRegisterDto,
} from './dto/merchant.dto';

/** 商家应用类型编码（与 demo app-types.config.ts 对应） */
const MERCHANT_APP_TYPE_CODE = 'merchant';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    // 业务层入口：注入框架应用实体 SPI，同步维护框架应用状态
    private appEntitySpi: AppEntitySpi,
    // 业务层入口：注入框架用户实体 SPI，扩展注册方式（如三方注册）
    private userEntitySpi: UserEntitySpi,
  ) {}

  /**
   * 添加商家
   * @description 1. 调用 AppEntitySpi.createApp 同步创建应用实例并绑定拥有者；
   * 2. 保存商家扩展表（回填 appId）；商家保存失败时补偿回滚应用
   */
  async create(dto: CreateMerchantDto): Promise<Merchant> {
    // 1. 调用框架 SPI：一步完成建应用实例 + 绑定 owner（成员记录 + owner 角色分配）
    const app = await this.appEntitySpi.createApp({
      appName: dto.merchantName,
      appCode: dto.merchantCode,
      appTypeCode: MERCHANT_APP_TYPE_CODE,
      logo: dto.logo,
      ownerId: dto.ownerId,
    });

    try {
      // 2. 业务侧：保存商家扩展表（回填应用实例 ID）
      const merchant = this.merchantRepository.create({
        ...dto,
        appId: app.id,
        status: 1,
      });
      return await this.merchantRepository.save(merchant);
    } catch (error) {
      // 补偿：商家保存失败时回滚已创建的应用实例，避免脏数据
      await this.appEntitySpi.deleteApp(app.id).catch(() => undefined);
      throw error;
    }
  }

  /**
   * 编辑商家
   * @description 更新商家扩展表 + 通过 SPI 同步应用基础信息
   */
  async update(id: string, dto: UpdateMerchantDto): Promise<Merchant> {
    const merchant = await this.findEntity(id);
    Object.assign(merchant, dto);
    const saved = await this.merchantRepository.save(merchant);

    // 同步框架应用基础信息（店铺名称/logo）
    await this.appEntitySpi.updateApp(merchant.appId, {
      appName: dto.merchantName,
      logo: dto.logo,
    });

    return saved;
  }

  /**
   * 禁用商家
   * @description 业务状态置 0 + 通过 SPI 同步禁用应用实例
   */
  async disable(id: string): Promise<Merchant> {
    const merchant = await this.findEntity(id);
    merchant.status = 0;
    const saved = await this.merchantRepository.save(merchant);

    await this.appEntitySpi.disableApp(merchant.appId);

    return saved;
  }

  /**
   * 启用商家
   */
  async enable(id: string): Promise<Merchant> {
    const merchant = await this.findEntity(id);
    merchant.status = 1;
    const saved = await this.merchantRepository.save(merchant);

    await this.appEntitySpi.enableApp(merchant.appId);

    return saved;
  }

  /**
   * 删除商家
   * @description 通过 SPI 删除应用实例（软删）+ 删除商家扩展表（软删）
   */
  async remove(id: string): Promise<void> {
    const merchant = await this.findEntity(id);

    await this.appEntitySpi.deleteApp(merchant.appId);
    await this.merchantRepository.softDelete(id);
  }

  /**
   * 商家详情（含关联应用信息）
   */
  async findById(id: string): Promise<any> {
    const merchant = await this.findEntity(id);
    const app = await this.appEntitySpi.getApp(merchant.appId).catch(() => null);
    return { ...merchant, app };
  }

  /**
   * 商家列表
   */
  async findAll(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 三方注册（演示扩展注册方式）
   * @description 业务层入口：通过 UserEntitySpi.createUser 创建框架用户（扩展注册方式），
   * 再通过 AppEntitySpi.createApp 创建商家应用并绑定该用户为拥有者
   */
  async registerThirdParty(dto: ThirdPartyRegisterDto): Promise<any> {
    // 1. 校验三方平台标识唯一（业务侧注册方式扩展）
    const existing = await this.userEntitySpi.findByUsername(dto.platformUserId);
    if (existing) {
      throw new BadRequestException('该三方账号已注册');
    }

    // 2. 通过 SPI 创建框架用户（唯一性校验 + 密码加密由框架默认实现保证）
    const user = await this.userEntitySpi.createUser({
      username: dto.platformUserId,
      password: dto.password || randomBytes(8).toString('hex'),
      nickname: dto.nickname || dto.platformUserId,
      phone: dto.phone,
      // 业务扩展属性（框架 User 实体无此字段，忽略）
    });

    // 3. 创建商家应用并绑定该用户为拥有者
    const merchant = await this.create({
      ...dto.merchant,
      ownerId: user.id,
    });

    return {
      user: { id: user.id, username: user.username, nickname: user.nickname },
      merchant,
    };
  }

  /**
   * 内部：按 ID 查询商家实体
   */
  private async findEntity(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }
    return merchant;
  }
}
