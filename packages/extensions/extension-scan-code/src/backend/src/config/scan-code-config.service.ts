/**
 * @fileoverview 扫码码生成策略配置服务
 * @description ext_scan_code_settings 单行配置的读取/保存，供配置页面与 generate 链路共用
 *
 * 设计要点：
 *   - 读取走 ICacheService 缓存（getOrSet），保存后主动 del 失效
 *   - 无配置行时返回默认值（3 组 × 4 字符 + '-'，不落库；页面保存时才落库）
 *   - 保存时校验码内容总长度 ≤ 32（主键列宽）
 */

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  BusinessException,
  CACHE_SERVICE,
  CacheTTL,
  type ICacheService,
} from 'moyan-mfw-base/backend';
import { ScanCodeSetting } from '../entities/scan-code-setting.entity';
import { ScanCodeManager, DEFAULT_CODE_FORMAT, MAX_CODE_LENGTH } from '../scan-code-manager';
import type { CodeFormatOptions } from '../types';
import { SaveScanCodeSettingDto } from './dto/scan-code-setting.dto';

/** 配置缓存 key */
const SETTINGS_CACHE_KEY = 'scan-code:cfg:settings';

@Injectable()
export class ScanCodeConfigService {
  constructor(
    @InjectRepository(ScanCodeSetting)
    private readonly repo: Repository<ScanCodeSetting>,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) {}

  /**
   * 读取码格式配置（带缓存；无配置行时返回默认值）
   */
  async getCodeFormat(): Promise<Required<CodeFormatOptions>> {
    const setting = await this.getSettingsRow();
    if (!setting) {
      return { ...DEFAULT_CODE_FORMAT };
    }
    return {
      groupCount: setting.groupCount,
      groupLength: setting.groupLength,
      separator: setting.separator,
      charset: setting.charset as Required<CodeFormatOptions>['charset'],
    };
  }

  /**
   * 读取场景白名单（null=不限制）
   */
  async getSceneWhitelist(): Promise<string[] | null> {
    const setting = await this.getSettingsRow();
    return setting?.scenes ?? null;
  }

  /**
   * 读取完整配置（配置页面 GET 用；无配置行返回默认值）
   */
  async getSettings(): Promise<ScanCodeSetting> {
    const row = await this.getSettingsRow();
    if (row) {
      return row;
    }
    // 无配置行：返回默认值（内存对象，不落库）
    return {
      id: '',
      ...DEFAULT_CODE_FORMAT,
      charset: DEFAULT_CODE_FORMAT.charset,
      scenes: null,
    } as ScanCodeSetting;
  }

  /**
   * 保存配置（单行 upsert，含合法性校验）
   */
  async saveSettings(dto: SaveScanCodeSettingDto): Promise<ScanCodeSetting> {
    // 码内容总长度校验（分组字符 + 分隔符 ≤ 主键列宽 32）
    const totalLength = ScanCodeManager.computeCodeLength({
      groupCount: dto.groupCount,
      groupLength: dto.groupLength,
      separator: dto.separator,
      charset: dto.charset as CodeFormatOptions['charset'],
    });
    if (totalLength > MAX_CODE_LENGTH) {
      throw new BusinessException(
        `码内容长度超限：${totalLength} > ${MAX_CODE_LENGTH}，请调整分组数/每组长度/分隔符`,
        400,
      );
    }

    // 场景白名单：空数组视为不限制（存 null）
    const scenes = dto.scenes && dto.scenes.length > 0 ? dto.scenes : null;

    const existing = await this.repo.findOne({ where: {} });
    if (existing) {
      await this.repo.update(existing.id, {
        groupCount: dto.groupCount,
        groupLength: dto.groupLength,
        separator: dto.separator,
        charset: dto.charset,
        scenes,
      });
      await this.cache.del(SETTINGS_CACHE_KEY);
      return this.repo.findOneByOrFail({ id: existing.id });
    }

    const created = await this.repo.save(
      this.repo.create({
        id: randomUUID(),
        groupCount: dto.groupCount,
        groupLength: dto.groupLength,
        separator: dto.separator,
        charset: dto.charset,
        scenes,
      }),
    );
    await this.cache.del(SETTINGS_CACHE_KEY);
    return created;
  }

  /**
   * 读取配置行（带缓存，可能为 null）
   */
  private async getSettingsRow(): Promise<ScanCodeSetting | null> {
    return this.cache.getOrSet(
      SETTINGS_CACHE_KEY,
      () => this.repo.findOne({ where: {}, order: { createdAt: 'DESC' } }),
      CacheTTL.LONG,
    );
  }
}
