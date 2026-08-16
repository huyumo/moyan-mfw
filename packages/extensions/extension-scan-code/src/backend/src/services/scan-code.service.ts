/**
 * @fileoverview 通用二维码内容生成器服务（NestJS 封装层）
 * @description 提供统一的扫码记录生成和解析能力，供各类业务使用。
 *
 * 核心设计：
 * - code（= id）既是二维码内容，也是数据库记录ID
 * - 扫码后传入 code，后端直接 WHERE id = code 查询
 * - type 区分二维码类型：1=可多次使用, 2=只允许使用一次
 * - scene 标识业务场景（如 points/gift/lottery/pickup），可经配置页面设置白名单
 * - data 为 JSON 字段，由使用者自行定义约束
 * - 码格式（分组/分隔符/字符集）由配置页面管理（ext_scan_code_settings），每次生成立即读取
 *
 * 核心校验逻辑委托给纯 TS 层的 ScanCodeManager，本层只负责数据库操作。
 *
 * 并发安全：
 * - use() 方法使用条件更新（WHERE status = ACTIVE）防止重复核销
 * - 单次使用券：UPDATE ... SET status=USED WHERE id=? AND status=ACTIVE
 *   如果 affected=0 说明已被其他请求核销，抛出异常
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ScanCodeRecord, ScanCodeData } from '../entities';
import { ScanCodeManager, ScanCodeType, ScanCodeStatus } from '..';
import type { GenerateOptions, GenerateResult } from '../types';
import { NotFoundError, BusinessException } from 'moyan-mfw-base/backend';
import { ScanCodeConfigService } from '../config/scan-code-config.service';

@Injectable()
export class ScanCodeService {
  constructor(
    @InjectRepository(ScanCodeRecord)
    private readonly repo: Repository<ScanCodeRecord>,
    @InjectRepository(ScanCodeData)
    private readonly dataRepo: Repository<ScanCodeData>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ScanCodeConfigService,
  ) {}

  // ──────────────────────────────────────────────
  // 生成
  // ──────────────────────────────────────────────

  /**
   * 生成二维码内容
   *
   * data 完整存入 JSON 字段，indexFields 指定的字段额外写入扩展表供索引查询。
   * 码格式来自配置页面（ext_scan_code_settings），场景受白名单限制（配置了白名单时）。
   *
   * @param options 生成参数
   * @returns 二维码内容（= 记录ID）
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const codeFormat = await this.configService.getCodeFormat();
    await this.assertSceneAllowed(options.scene);

    const prepared = ScanCodeManager.prepareGenerate(options, codeFormat);

    const record = this.repo.create(prepared);
    const saved = await this.repo.save(record);

    // 按 indexFields 写入扩展表
    if (options.indexFields && options.indexFields.length > 0) {
      await this.saveIndexFields(saved.id, prepared.data, options.indexFields);
    }

    return { code: saved.id };
  }

  /**
   * 在事务内生成二维码内容
   *
   * @param manager 事务管理器
   * @param options 生成参数
   * @returns 二维码内容（= 记录ID）
   */
  async generateInTransaction(
    manager: any,
    options: GenerateOptions,
  ): Promise<GenerateResult> {
    const codeFormat = await this.configService.getCodeFormat();
    await this.assertSceneAllowed(options.scene);

    const prepared = ScanCodeManager.prepareGenerate(options, codeFormat);

    const record = manager.create(ScanCodeRecord, prepared);
    const saved = await manager.save(record);

    // 按 indexFields 写入扩展表（使用传入的 manager 保证同事务）
    if (options.indexFields && options.indexFields.length > 0) {
      await this.saveIndexFieldsInTransaction(manager, saved.id, prepared.data, options.indexFields);
    }

    return { code: saved.id };
  }

  /**
   * 场景白名单校验（配置了白名单时，仅允许白名单内场景）
   */
  private async assertSceneAllowed(scene: string): Promise<void> {
    const whitelist = await this.configService.getSceneWhitelist();
    if (whitelist && whitelist.length > 0 && !whitelist.includes(scene)) {
      throw new BusinessException(
        `业务场景 "${scene}" 不在白名单内（允许: ${whitelist.join(', ')}）`,
        400,
      );
    }
  }

  /**
   * 写入索引字段到扩展表
   */
  private async saveIndexFields(
    scanCodeRecordId: string,
    data: Record<string, any>,
    indexFields: string[],
  ): Promise<void> {
    const rows = indexFields
      .filter((field) => data[field] !== undefined && data[field] !== null)
      .map((field) =>
        this.dataRepo.create({
          scanCodeRecordId,
          field,
          value: String(data[field]),
        }),
      );
    if (rows.length > 0) {
      await this.dataRepo.save(rows);
    }
  }

  /**
   * 在事务内写入索引字段到扩展表
   */
  private async saveIndexFieldsInTransaction(
    manager: any,
    scanCodeRecordId: string,
    data: Record<string, any>,
    indexFields: string[],
  ): Promise<void> {
    const dataRepo = manager.getRepository(ScanCodeData);
    const rows = indexFields
      .filter((field) => data[field] !== undefined && data[field] !== null)
      .map((field) =>
        dataRepo.create({
          scanCodeRecordId,
          field,
          value: String(data[field]),
        }),
      );
    if (rows.length > 0) {
      await dataRepo.save(rows);
    }
  }

  /**
   * 按业务字段查询扫码记录（走扩展表索引）
   *
   * 例如：查某用户的推广码
   *   findByDataField('userId', user.id)
   */
  async findByDataField(field: string, value: string): Promise<ScanCodeRecord[]> {
    return this.repo
      .createQueryBuilder('record')
      .innerJoin('ext_scan_code_data', 'data', 'data.scanCodeRecordId = record.id')
      .where('data.field = :field', { field })
      .andWhere('data.value = :value', { value })
      .getMany();
  }

  // ──────────────────────────────────────────────
  // 解析
  // ──────────────────────────────────────────────

  /**
   * 解析二维码内容
   *
   * @param code 二维码内容（= 记录ID）
   * @returns 扫码记录详情
   */
  async parse(code: string): Promise<ScanCodeRecord> {
    const record = await this.repo.findOne({ where: { id: code } });

    if (!record) {
      throw new NotFoundError('二维码内容无效，未找到对应记录');
    }

    // 检查过期：自动将已过期的有效记录标记为过期
    const newStatus = ScanCodeManager.checkExpired(record);
    if (newStatus !== null) {
      await this.repo.update(record.id, { status: newStatus });
      record.status = newStatus;
    }

    return record;
  }

  // ──────────────────────────────────────────────
  // 使用（核销）
  // ──────────────────────────────────────────────

  /**
   * 使用二维码（核销）
   *
   * 并发安全：使用条件更新防止重复核销
   * - 单次使用：UPDATE SET status=USED WHERE id=? AND status=ACTIVE
   *   如果 affected=0，说明已被其他请求核销，抛出异常
   * - 多次使用：直接递增 usedCount，无并发问题
   *
   * @param code 二维码内容
   * @param operatorId 操作人ID
   * @param storeId 门店ID（可选）
   * @returns 使用后的记录
   */
  async use(
    code: string,
    operatorId: string,
    storeId?: string,
  ): Promise<ScanCodeRecord> {
    // 查询记录并检查过期
    const record = await this.repo.findOne({ where: { id: code } });

    if (!record) {
      throw new NotFoundError('二维码内容无效，未找到对应记录');
    }

    // 检查过期：自动将已过期的有效记录标记为过期
    const newStatus = ScanCodeManager.checkExpired(record);
    if (newStatus !== null) {
      await this.repo.update(record.id, { status: newStatus });
      record.status = newStatus;
    }

    if (record.status === ScanCodeStatus.EXPIRED) {
      throw new BadRequestException('二维码已过期');
    }

    const now = new Date();

    if (record.type === ScanCodeType.SINGLE_USE) {
      if (record.status === ScanCodeStatus.USED) {
        throw new BadRequestException('二维码已使用，不可重复核销');
      }

      // 条件更新：只有 status=ACTIVE 时才能更新为 USED（防止并发重复核销）
      const result = await this.repo.update(
        { id: record.id, status: ScanCodeStatus.ACTIVE },
        {
          status: ScanCodeStatus.USED,
          lastUsedAt: now,
          usedCount: record.usedCount + 1,
          operatorId,
          storeId: storeId ?? null,
        },
      );

      if (result.affected === 0) {
        // 被其他并发请求抢先核销
        throw new BadRequestException('二维码已使用，不可重复核销');
      }
    } else {
      // 多次使用：直接递增使用次数（无并发冲突）
      await this.repo.increment({ id: record.id }, 'usedCount', 1);
      await this.repo.update(record.id, {
        lastUsedAt: now,
        operatorId,
        storeId: storeId ?? null,
      });
    }

    // 返回更新后的记录
    return this.findById(record.id);
  }

  // ──────────────────────────────────────────────
  // 查询
  // ──────────────────────────────────────────────

  /**
   * 根据ID查询记录详情
   */
  async findById(id: string): Promise<ScanCodeRecord> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundError('记录不存在');
    }
    return record;
  }

  // ──────────────────────────────────────────────
  // 更新
  // ──────────────────────────────────────────────

  /**
   * 更新业务数据（合并策略：新 data 会与旧 data 合并）
   *
   * @param code 二维码内容（= 记录ID）
   * @param data 要合并的业务数据
   */
  async updateData(code: string, data: Record<string, any>): Promise<void> {
    const record = await this.repo.findOne({ where: { id: code } });
    if (!record) {
      throw new NotFoundError('记录不存在，无法更新');
    }

    await this.repo.update(code, {
      data: { ...record.data, ...data },
    });
  }

  /**
   * 在事务内更新业务数据
   *
   * @param manager 事务管理器
   * @param code 二维码内容（= 记录ID）
   * @param data 要合并的业务数据
   */
  async updateDataInTransaction(
    manager: any,
    code: string,
    data: Record<string, any>,
  ): Promise<void> {
    const recordRepo = manager.getRepository(ScanCodeRecord);
    const record = await recordRepo.findOne({ where: { id: code } });
    if (!record) {
      throw new NotFoundError('记录不存在，无法更新');
    }

    await recordRepo.update(code, {
      data: { ...record.data, ...data },
    });
  }
}
