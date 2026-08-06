/**
 * @fileoverview 文档主实体
 * @description 通用文档管理主表，精简字段 + 统计字段
 */

import { Entity, PrimaryGeneratedColumn, Column, Index, AfterLoad } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';
import { DocumentType, DocumentStatus, DocumentImage } from 'moyan-mfw-extension-document/shared';

@Entity('mfw_document')
@Index('idx_app_dockey', ['appId', 'docKey'])
@Index('uk_only_key', ['onlyKey', 'deleteAt'], { unique: true })
export class Document extends Base {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true, comment: '应用 ID，NULL 表示全局' })
  appId?: number;

  @Column({ name: 'doc_key', type: 'varchar', length: 64, comment: '文档类型标识' })
  @Index()
  docKey: string;

  @Column({ name: 'only_key', type: 'varchar', length: 64, comment: '唯一业务键' })
  @Index()
  onlyKey: string;

  @Column({ name: 'doc_group', type: 'varchar', length: 64, nullable: true, comment: '文档分组' })
  @Index()
  docGroup?: string;

  @Column({ type: 'varchar', length: 256, comment: '标题' })
  title: string;

  @Column({ type: 'longtext', nullable: true, comment: '正文内容' })
  content?: string;

  @Column({ type: 'text', nullable: true, comment: '摘要' })
  summary?: string;

  @Column({ type: 'varchar', length: 16, default: DocumentType.IMAGE_TEXT, comment: '类型：图文/视频' })
  type: string;

  @Column({ type: 'json', nullable: true, comment: '图片资源列表（{src,width,height}）' })
  images?: DocumentImage[];

  @Column({ type: 'text', nullable: true, comment: '视频 URL' })
  video?: string;

  @Column({ type: 'varchar', length: 512, nullable: true, comment: '标签' })
  tags?: string;

  @Column({ type: 'tinyint', default: DocumentStatus.DRAFT, comment: '状态：0=草稿 1=已发布 2=下线' })
  status: number;

  @Column({ name: 'virtual_pageviews', type: 'int', default: 0, comment: '虚拟浏览量' })
  virtualPageviews: number;

  @Column({ type: 'int', default: 0, comment: '真实浏览量' })
  pageviews: number;

  @Column({ name: 'counter_1', type: 'int', default: 0, comment: '通用计数器1' })
  counter1: number;

  @Column({ name: 'counter_2', type: 'int', default: 0, comment: '通用计数器2' })
  counter2: number;

  @Column({ name: 'counter_3', type: 'int', default: 0, comment: '通用计数器3' })
  counter3: number;

  @Column({ name: 'announcement_start_time', type: 'varchar', length: 32, nullable: true, comment: '公告开始时间' })
  announcementStartTime?: string;

  @Column({ name: 'announcement_end_time', type: 'varchar', length: 32, nullable: true, comment: '公告结束时间' })
  announcementEndTime?: string;

  @Column({ name: 'sort_order', type: 'int', nullable: true, comment: '排序号' })
  @Index()
  sortOrder?: number;

  /** 虚拟字段：总浏览量 = 真实 + 虚拟 */
  viewPageviews: number;

  @AfterLoad()
  computeViewPageviews(): void {
    this.viewPageviews = (this.pageviews || 0) + (this.virtualPageviews || 0);
  }
}
