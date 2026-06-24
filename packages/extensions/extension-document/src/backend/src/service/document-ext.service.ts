/**
 * @fileoverview 文档扩展字段服务（EAV）
 * @description 纯 EAV 字段 CRUD，可独立使用或被 DocumentService 组合
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, FindOptionsWhere } from 'typeorm';
import { DocumentExt } from '../entities/document-ext.entity';
import { ExtFieldItemDto } from '../dto';
import { ExtValueType } from 'moyan-mfw-extension-document/shared';

@Injectable()
export class DocumentExtService {
  constructor(
    @InjectRepository(DocumentExt)
    private readonly repo: Repository<DocumentExt>,
  ) {}

  /** 列出文档的所有扩展字段 */
  async listByDocument(documentId: number): Promise<DocumentExt[]> {
    return this.repo.find({ where: { documentId } });
  }

  /** 按 extKey 查询单个扩展字段 */
  async getByDocumentAndKey(documentId: number, extKey: string): Promise<DocumentExt | null> {
    return this.repo.findOne({ where: { documentId, extKey } });
  }

  /** upsert 单个扩展字段 */
  async upsert(documentId: number, item: ExtFieldItemDto): Promise<DocumentExt> {
    const existing = await this.getByDocumentAndKey(documentId, item.extKey);
    if (existing) {
      existing.extValue = item.extValue;
      if (item.valueType !== undefined) existing.valueType = item.valueType;
      if (item.description !== undefined) existing.description = item.description;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({
      documentId,
      extKey: item.extKey,
      extValue: item.extValue,
      valueType: item.valueType ?? ExtValueType.STRING,
      description: item.description,
    });
    return this.repo.save(entity);
  }

  /** 批量 upsert 扩展字段 */
  async batchUpsert(documentId: number, items: ExtFieldItemDto[]): Promise<void> {
    for (const item of items) {
      await this.upsert(documentId, item);
    }
  }

  /** 软删除扩展字段（可按 extKey） */
  async remove(documentId: number, extKey?: string): Promise<void> {
    const where: FindOptionsWhere<DocumentExt> = { documentId };
    if (extKey) where.extKey = extKey;
    await this.repo.softDelete(where);
  }
}
