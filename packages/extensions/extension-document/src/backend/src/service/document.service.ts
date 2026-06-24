/**
 * @fileoverview 文档管理服务
 * @description 文档主表 CRUD + 扩展字段事务管理
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import type { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Document } from '../entities/document.entity';
import { DocumentExt } from '../entities/document-ext.entity';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentListQueryDto,
  CounterUpdateDto,
  ExtFieldItemDto,
} from '../dto';
import { PaginationResult } from 'moyan-mfw-base/backend';
import { ExtValueType } from 'moyan-mfw-extension-document/shared';

/** 计数字段属性名 → 数据库列名映射 */
const COUNTER_FIELD_COLUMNS: Record<string, string> = {
  pageviews: 'pageviews',
  virtualPageviews: 'virtual_pageviews',
  counter1: 'counter_1',
  counter2: 'counter_2',
  counter3: 'counter_3',
};

/** 允许排序的字段白名单（属性名） */
const ALLOWED_SORT_FIELDS = ['id', 'createdAt', 'updateAt', 'sortOrder', 'pageviews', 'virtualPageviews'];

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
    @InjectRepository(DocumentExt)
    private readonly extRepo: Repository<DocumentExt>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** 分页查询文档列表（QueryBuilder 参数化，防注入） */
  async getList(query: DocumentListQueryDto): Promise<PaginationResult<Document>> {
    const qb = this.repo.createQueryBuilder('doc');
    qb.where('doc.deleteAt IS NULL');
    this.applyAppScope(qb, query.appId);
    if (query.docKey) qb.andWhere('doc.docKey = :docKey', { docKey: query.docKey });
    if (query.keyword) {
      qb.andWhere('(doc.title LIKE :kw OR doc.summary LIKE :kw)', { kw: `%${query.keyword}%` });
    }
    if (query.docGroup) qb.andWhere('doc.docGroup = :docGroup', { docGroup: query.docGroup });
    if (query.status !== undefined && query.status !== null) {
      qb.andWhere('doc.status = :status', { status: query.status });
    }
    if (query.startDate) qb.andWhere('doc.createdAt >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('doc.createdAt <= :endDate', { endDate: query.endDate });

    if (query.sortField && ALLOWED_SORT_FIELDS.includes(query.sortField)) {
      qb.orderBy(`doc.${query.sortField}`, query.sortOrder || 'DESC');
    } else {
      qb.orderBy('doc.sortOrder', 'DESC').addOrderBy('doc.id', 'DESC');
    }

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return new PaginationResult(list, total, page, pageSize);
  }

  /** 按 ID 查询，可选自增 pageviews */
  async getOneById(id: number, incView = false): Promise<Document> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('文档不存在');
    if (incView) {
      await this.repo.increment({ id }, 'pageviews', 1);
      doc.pageviews = (doc.pageviews || 0) + 1;
      doc.viewPageviews = doc.pageviews + (doc.virtualPageviews || 0);
    }
    return doc;
  }

  /** 按 onlyKey 查询，可选自增 pageviews */
  async getOneByOnlyKey(onlyKey: string, incView = false): Promise<Document> {
    const doc = await this.repo.findOne({ where: { onlyKey } });
    if (!doc) throw new NotFoundException('文档不存在');
    if (incView) {
      await this.repo.increment({ onlyKey }, 'pageviews', 1);
      doc.pageviews = (doc.pageviews || 0) + 1;
      doc.viewPageviews = doc.pageviews + (doc.virtualPageviews || 0);
    }
    return doc;
  }

  /** 创建文档（事务：主表 + 扩展字段） */
  async create(dto: CreateDocumentDto): Promise<Document> {
    const onlyKey = dto.onlyKey || this.generateOnlyKey();
    return this.dataSource.transaction(async (manager) => {
      const docRepo = manager.getRepository(Document);
      const extRepo = manager.getRepository(DocumentExt);
      const { extFields, ...mainFields } = dto;
      const entity = docRepo.create({
        ...mainFields,
        onlyKey,
        appId: dto.appId ?? undefined,
      });
      if (!entity.summary && entity.content) {
        entity.summary = this.extractSummary(entity.content);
      }
      const saved = await docRepo.save(entity);
      saved.viewPageviews = (saved.pageviews || 0) + (saved.virtualPageviews || 0);
      if (extFields?.length) {
        await extRepo.save(
          extFields.map((item) =>
            extRepo.create({
              documentId: saved.id,
              extKey: item.extKey,
              extValue: item.extValue,
              valueType: item.valueType ?? ExtValueType.STRING,
              description: item.description,
            }),
          ),
        );
      }
      return saved;
    });
  }

  /** 更新文档（事务：主表 + 扩展字段 upsert，未包含的 extKey 不动） */
  async update(id: number, dto: UpdateDocumentDto): Promise<Document> {
    return this.dataSource.transaction(async (manager) => {
      const docRepo = manager.getRepository(Document);
      const extRepo = manager.getRepository(DocumentExt);
      const existing = await docRepo.findOne({ where: { id } });
      if (!existing) throw new NotFoundException('文档不存在');
      const { extFields, ...mainFields } = dto;
      Object.assign(existing, mainFields);
      if (mainFields.content !== undefined && !mainFields.summary) {
        existing.summary = this.extractSummary(mainFields.content);
      }
      await docRepo.save(existing);
      if (extFields?.length) {
        for (const item of extFields) {
          const found = await extRepo.findOne({ where: { documentId: id, extKey: item.extKey } });
          if (found) {
            found.extValue = item.extValue;
            if (item.valueType !== undefined) found.valueType = item.valueType;
            if (item.description !== undefined) found.description = item.description;
            await extRepo.save(found);
          } else {
            await extRepo.save(
              extRepo.create({
                documentId: id,
                extKey: item.extKey,
                extValue: item.extValue,
                valueType: item.valueType ?? ExtValueType.STRING,
                description: item.description,
              }),
            );
          }
        }
      }
      const reloaded = await docRepo.findOne({ where: { id } });
      return reloaded as Document;
    });
  }

  /** 软删除文档 + 关联扩展字段 */
  async delete(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Document).softDelete(id);
      await manager.getRepository(DocumentExt).softDelete({ documentId: id });
    });
  }

  /** 计数器原子自增（白名单 + 参数化） */
  async updateTotals(dto: CounterUpdateDto): Promise<void> {
    const column = COUNTER_FIELD_COLUMNS[dto.field];
    if (!column) {
      throw new BadRequestException('不支持的字段');
    }
    await this.dataSource.query(
      `UPDATE \`mfw_document\` SET \`${column}\` = \`${column}\` + 1 WHERE id = ?`,
      [dto.id],
    );
  }

  /** 获取文档分组字典（distinct） */
  async getDocGroupDict(docKey?: string, appId?: number | null): Promise<string[]> {
    const qb = this.repo
      .createQueryBuilder('doc')
      .select('DISTINCT doc.docGroup', 'docGroup')
      .where('doc.deleteAt IS NULL')
      .andWhere('doc.docGroup IS NOT NULL');
    if (docKey) qb.andWhere('doc.docKey = :docKey', { docKey });
    this.applyAppScope(qb, appId);
    const rows = await qb.getRawMany<{ docGroup: string }>();
    return rows.map((r) => r.docGroup).filter(Boolean);
  }

  /** 获取文档扩展字段 */
  async getExtFields(documentId: number): Promise<DocumentExt[]> {
    return this.extRepo.find({ where: { documentId } });
  }

  /** 批量更新文档扩展字段 */
  async batchUpdateExt(documentId: number, items: ExtFieldItemDto[]): Promise<void> {
    for (const item of items) {
      const found = await this.extRepo.findOne({ where: { documentId, extKey: item.extKey } });
      if (found) {
        found.extValue = item.extValue;
        if (item.valueType !== undefined) found.valueType = item.valueType;
        if (item.description !== undefined) found.description = item.description;
        await this.extRepo.save(found);
      } else {
        await this.extRepo.save(
          this.extRepo.create({
            documentId,
            extKey: item.extKey,
            extValue: item.extValue,
            valueType: item.valueType ?? ExtValueType.STRING,
            description: item.description,
          }),
        );
      }
    }
  }

  /** 应用多租户 appId 作用域 */
  private applyAppScope(qb: SelectQueryBuilder<Document>, appId: number | null | undefined): void {
    if (appId === undefined) return;
    if (appId === null) {
      qb.andWhere('doc.appId IS NULL');
    } else {
      qb.andWhere('doc.appId = :appId', { appId });
    }
  }

  /** 生成唯一业务键 */
  private generateOnlyKey(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /** 从正文提取摘要 */
  private extractSummary(content: string): string {
    const text = content
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-zA-Z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 200);
  }
}
