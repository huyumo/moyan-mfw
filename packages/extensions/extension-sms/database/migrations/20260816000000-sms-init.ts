import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 短信扩展包建表迁移
 *
 * 表设计要点：
 *   - ext_sms_provider_settings：运营商凭证单行配置（页面管理），列名 camelCase 对齐实体属性
 *   - ext_sms_templates：短信模板表（替代原内存注册表），scene 唯一（含 deleteAt 支持软删后重建）
 */
export class SmsInit20260816000000 implements MigrationInterface {
  name = 'SmsInit20260816000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_sms_provider_settings (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        provider VARCHAR(32) NOT NULL COMMENT '运营商：aliyun（预留 tencent/huawei）',
        accessKeyId VARCHAR(128) NOT NULL COMMENT 'AccessKey ID',
        accessKeySecret VARCHAR(256) NOT NULL COMMENT 'AccessKey Secret',
        defaultSignName VARCHAR(64) NULL COMMENT '默认短信签名（可被模板级签名覆盖）',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短信运营商凭证配置（单行）'
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_sms_templates (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        scene VARCHAR(64) NOT NULL COMMENT '业务场景名（如 login_code）',
        signName VARCHAR(64) NOT NULL COMMENT '短信签名',
        templateCode VARCHAR(64) NOT NULL COMMENT '模板 Code（如 SMS_509465234）',
        paramKeys JSON NOT NULL COMMENT '模板参数 key 列表',
        description VARCHAR(255) NULL COMMENT '模板描述',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        UNIQUE INDEX uk_sms_template_scene (scene, deleteAt),
        INDEX idx_sms_template_code (templateCode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短信模板'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ext_sms_templates`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_sms_provider_settings`)
  }
}
