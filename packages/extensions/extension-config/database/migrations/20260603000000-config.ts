/**
 * @fileoverview 配置管理表迁移
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class Config20260603000000 implements MigrationInterface {
  name = 'Config20260603000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`mfw_config\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`app_id\` bigint DEFAULT NULL,
        \`group_key\` varchar(64) NOT NULL,
        \`config_key\` varchar(128) NOT NULL,
        \`config_value\` json NOT NULL,
        \`config_type\` tinyint NOT NULL DEFAULT '0',
        \`description\` varchar(256) DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`update_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`delete_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_app_group_config\` (\`app_id\`, \`group_key\`, \`config_key\`, \`delete_at\`),
        KEY \`idx_app_group\` (\`app_id\`, \`group_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `mfw_config`');
  }
}
