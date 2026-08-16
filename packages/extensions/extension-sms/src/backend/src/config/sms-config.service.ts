/**
 * @fileoverview 短信配置服务
 * @description 运营商凭证 + 短信模板的 DB 持久化管理，供配置页面与发送链路共用
 *
 * 设计要点：
 *   - 凭证解析优先级：DB（页面配置）→ 环境变量 → 无配置
 *   - 读取走 ICacheService 缓存（getOrSet），写操作后主动 del 失效；
 *     未用 @Cacheable 装饰器（该方法级装饰器仅对 Controller 路由生效，Service 直调不触发）
 *   - API 返回视图必须脱敏 accessKeySecret（仅尾 4 位）
 *   - 模板 scene 唯一（唯一索引含 deleteAt，软删后可重建同名模板）
 */

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  BusinessException,
  NotFoundError,
  CACHE_SERVICE,
  CacheTTL,
  type ICacheService,
} from 'moyan-mfw-base/backend';
import type { SmsProviderSettingItem } from 'moyan-mfw-extension-sms/shared';
import { SmsProviderSetting, SmsTemplate } from './entities';
import { SaveSmsProviderSettingDto, SaveSmsTemplateDto } from './dto';

/** 运营商凭证缓存 key */
const PROVIDER_CACHE_KEY = 'sms:cfg:provider';

/** 模板列表缓存 key */
const TEMPLATES_CACHE_KEY = 'sms:cfg:templates';

/** 脱敏：仅保留尾 4 位 */
function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return `****${secret.slice(-4)}`;
}

@Injectable()
export class SmsConfigService {
  constructor(
    @InjectRepository(SmsProviderSetting)
    private readonly providerRepo: Repository<SmsProviderSetting>,
    @InjectRepository(SmsTemplate)
    private readonly templateRepo: Repository<SmsTemplate>,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) {}

  // ──────────────────────────────────────────────
  // 运营商凭证
  // ──────────────────────────────────────────────

  /**
   * 读取运营商凭证（DB 单行记录，带缓存）
   *
   * 供发送链路（SmsSdkService）解析凭证用，返回原始 secret。
   */
  async getProviderSetting(): Promise<SmsProviderSetting | null> {
    return this.cache.getOrSet(
      PROVIDER_CACHE_KEY,
      () => this.providerRepo.findOne({ where: {}, order: { createdAt: 'DESC' } }),
      CacheTTL.LONG,
    );
  }

  /**
   * 运营商配置 API 视图（secret 脱敏）
   *
   * DB 无配置时降级展示环境变量来源（凭证存在时），两者皆无返回 null。
   */
  async getProviderSettingView(): Promise<SmsProviderSettingItem | null> {
    const dbSetting = await this.getProviderSetting();
    if (dbSetting) {
      return {
        source: 'db',
        provider: dbSetting.provider,
        accessKeyId: dbSetting.accessKeyId,
        accessKeySecretMasked: maskSecret(dbSetting.accessKeySecret),
        defaultSignName: dbSetting.defaultSignName,
      };
    }

    // 环境变量降级展示
    const envKeyId = process.env.SMS_ALIYUN_ACCESS_KEY_ID || process.env.OSS_ACCESS_KEY_ID;
    const envSecret =
      process.env.SMS_ALIYUN_ACCESS_KEY_SECRET || process.env.OSS_ACCESS_KEY_SECRET;
    if (envKeyId && envSecret) {
      return {
        source: 'env',
        provider: process.env.SMS_PROVIDER || 'aliyun',
        accessKeyId: envKeyId,
        accessKeySecretMasked: maskSecret(envSecret),
        defaultSignName: process.env.SMS_ALIYUN_SIGN_NAME ?? null,
      };
    }

    return null;
  }

  /**
   * 保存运营商凭证（单行 upsert）
   *
   * accessKeySecret 留空表示保持已有值不变；首次配置（无已有记录）时必填。
   */
  async saveProviderSetting(dto: SaveSmsProviderSettingDto): Promise<void> {
    const existing = await this.providerRepo.findOne({ where: {} });
    const secret = dto.accessKeySecret?.trim();

    if (existing) {
      await this.providerRepo.update(existing.id, {
        provider: dto.provider,
        accessKeyId: dto.accessKeyId.trim(),
        accessKeySecret: secret || existing.accessKeySecret,
        defaultSignName: dto.defaultSignName?.trim() || null,
      });
    } else {
      if (!secret) {
        throw new BusinessException('首次配置必须填写 AccessKey Secret', 400);
      }
      await this.providerRepo.insert({
        id: randomUUID(),
        provider: dto.provider,
        accessKeyId: dto.accessKeyId.trim(),
        accessKeySecret: secret,
        defaultSignName: dto.defaultSignName?.trim() || null,
      });
    }

    await this.cache.del(PROVIDER_CACHE_KEY);
  }

  // ──────────────────────────────────────────────
  // 短信模板
  // ──────────────────────────────────────────────

  /**
   * 模板列表（带缓存），按 scene 升序
   */
  async listTemplates(): Promise<SmsTemplate[]> {
    return (
      (await this.cache.getOrSet(
        TEMPLATES_CACHE_KEY,
        () => this.templateRepo.find({ order: { scene: 'ASC' } }),
        CacheTTL.LONG,
      )) ?? []
    );
  }

  /**
   * 按场景名查模板（走列表缓存，内存过滤）
   */
  async findTemplateByScene(scene: string): Promise<SmsTemplate | null> {
    const templates = await this.listTemplates();
    return templates.find((t) => t.scene === scene) ?? null;
  }

  /**
   * 保存模板（upsert：按 id 定位更新，无 id 按 scene 定位；两者皆无则新建）
   */
  async upsertTemplate(dto: SaveSmsTemplateDto): Promise<SmsTemplate> {
    const target = dto.id
      ? await this.templateRepo.findOne({ where: { id: dto.id } })
      : await this.templateRepo.findOne({ where: { scene: dto.scene } });

    // scene 唯一性：目标模板存在时，确认 scene 未被其他模板占用
    if (target) {
      const sceneOwner = await this.templateRepo.findOne({ where: { scene: dto.scene } });
      if (sceneOwner && sceneOwner.id !== target.id) {
        throw new BusinessException(`场景 "${dto.scene}" 已被其他模板占用`, 400);
      }
      await this.templateRepo.update(target.id, {
        scene: dto.scene,
        signName: dto.signName.trim(),
        templateCode: dto.templateCode.trim(),
        paramKeys: dto.paramKeys,
        description: dto.description?.trim() || null,
      });
      await this.cache.del(TEMPLATES_CACHE_KEY);
      return this.templateRepo.findOneByOrFail({ id: target.id });
    }

    const dup = await this.templateRepo.findOne({ where: { scene: dto.scene } });
    if (dup) {
      throw new BusinessException(`场景 "${dto.scene}" 已存在`, 400);
    }

    const created = await this.templateRepo.save(
      this.templateRepo.create({
        id: randomUUID(),
        scene: dto.scene,
        signName: dto.signName.trim(),
        templateCode: dto.templateCode.trim(),
        paramKeys: dto.paramKeys,
        description: dto.description?.trim() || null,
      }),
    );
    await this.cache.del(TEMPLATES_CACHE_KEY);
    return created;
  }

  /**
   * 删除模板（软删除）
   */
  async deleteTemplate(id: string): Promise<void> {
    const target = await this.templateRepo.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundError('短信模板不存在');
    }
    await this.templateRepo.softDelete(id);
    await this.cache.del(TEMPLATES_CACHE_KEY);
  }
}
