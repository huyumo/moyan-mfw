/**
 * @fileoverview 文档管理表迁移
 * @description 创建 mfw_document 主表与 mfw_document_ext EAV 扩展表
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class Document20260623000000 implements MigrationInterface {
  name = 'Document20260623000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`mfw_document\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`app_id\` bigint DEFAULT NULL COMMENT '应用 ID，NULL 表示全局',
        \`doc_key\` varchar(64) NOT NULL COMMENT '文档类型标识',
        \`only_key\` varchar(64) NOT NULL COMMENT '唯一业务键',
        \`doc_group\` varchar(64) DEFAULT NULL COMMENT '文档分组',
        \`title\` varchar(256) NOT NULL COMMENT '标题',
        \`content\` longtext NOT NULL COMMENT '正文',
        \`summary\` text COMMENT '摘要',
        \`type\` varchar(16) NOT NULL DEFAULT '图文' COMMENT '类型：图文/视频',
        \`images\` json DEFAULT NULL COMMENT '图片 URL 列表',
        \`video\` text COMMENT '视频 URL',
        \`tags\` varchar(512) DEFAULT NULL COMMENT '标签',
        \`status\` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0=草稿 1=已发布 2=已下线',
        \`virtual_pageviews\` int NOT NULL DEFAULT '0' COMMENT '虚拟浏览量',
        \`pageviews\` int NOT NULL DEFAULT '0' COMMENT '浏览量',
        \`counter_1\` int NOT NULL DEFAULT '0' COMMENT '通用计数器 1',
        \`counter_2\` int NOT NULL DEFAULT '0' COMMENT '通用计数器 2',
        \`counter_3\` int NOT NULL DEFAULT '0' COMMENT '通用计数器 3',
        \`announcement_start_time\` varchar(32) DEFAULT NULL COMMENT '公告开始时间',
        \`announcement_end_time\` varchar(32) DEFAULT NULL COMMENT '公告结束时间',
        \`sort_order\` int DEFAULT NULL COMMENT '排序',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`update_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`delete_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_only_key\` (\`only_key\`, \`delete_at\`),
        KEY \`idx_app_dockey\` (\`app_id\`, \`doc_key\`),
        KEY \`idx_doc_group\` (\`doc_group\`),
        KEY \`idx_sort_order\` (\`sort_order\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE \`mfw_document_ext\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`document_id\` bigint NOT NULL COMMENT '文档 ID',
        \`ext_key\` varchar(128) NOT NULL COMMENT '扩展属性键',
        \`ext_value\` json NOT NULL COMMENT '扩展属性值 {data: any}',
        \`value_type\` varchar(16) NOT NULL DEFAULT 'string' COMMENT '值类型：string/number/boolean/json',
        \`description\` varchar(256) DEFAULT NULL COMMENT '描述',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`update_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`delete_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_doc_key\` (\`document_id\`, \`ext_key\`, \`delete_at\`),
        KEY \`idx_document_id\` (\`document_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `mfw_document_ext`');
    await queryRunner.query('DROP TABLE `mfw_document`');
  }
}
