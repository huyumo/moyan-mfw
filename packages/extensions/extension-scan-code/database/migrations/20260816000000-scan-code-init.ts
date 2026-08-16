import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 扫码扩展包建表迁移
 *
 * 表设计要点（自实际项目 libs/scan-code 迁移，表名统一 ext_ 前缀）：
 *   - ext_scan_code_records：扫码记录主表，id 即二维码内容（扫码后直接 WHERE id = code 查询）
 *     id 长度放宽到 varchar(32)，支持配置页面自定义分组数/每组长度/分隔符
 *   - ext_scan_code_data：业务数据扩展表（EAV），将 data JSON 中需索引字段拆行存储
 *   - ext_scan_code_settings：码生成策略配置（单行，页面管理）
 */
export class ScanCodeInit20260816000000 implements MigrationInterface {
  name = 'ScanCodeInit20260816000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scan_code_records (
        id VARCHAR(32) PRIMARY KEY COMMENT '二维码内容（= 记录ID，如 A5DS-DSDF-O1SF）',
        type INT NOT NULL COMMENT '二维码类型：1=可多次使用, 2=只允许使用一次',
        scene VARCHAR(32) NOT NULL COMMENT '业务场景标识（如 points/gift/pickup）',
        data JSON NOT NULL COMMENT '业务数据（由使用者自行定义约束）',
        status INT NOT NULL DEFAULT 1 COMMENT '状态：1=有效, 2=已使用, 3=已过期',
        expiredAt DATETIME NULL COMMENT '过期时间（null=长期有效）',
        lastUsedAt DATETIME NULL COMMENT '最后使用时间',
        usedCount INT NOT NULL DEFAULT 0 COMMENT '使用次数',
        operatorId VARCHAR(36) NULL COMMENT '操作人ID（核销时记录）',
        storeId VARCHAR(36) NULL COMMENT '门店ID（核销时记录）',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        INDEX idx_scan_code_scene (scene),
        INDEX idx_scan_code_status (status),
        INDEX idx_scan_code_scene_status (scene, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='扫码记录主表'
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scan_code_data (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        scanCodeRecordId VARCHAR(32) NOT NULL COMMENT '关联扫码记录ID（ext_scan_code_records.id）',
        field VARCHAR(50) NOT NULL COMMENT '字段名（如 userId, merchantId）',
        value VARCHAR(255) NOT NULL COMMENT '字段值',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        INDEX idx_scan_data_record (scanCodeRecordId),
        INDEX idx_scan_data_field_value (field, value)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='扫码记录业务数据扩展表（索引查询用）'
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scan_code_settings (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        groupCount INT NOT NULL DEFAULT 3 COMMENT '分组数（默认 3）',
        groupLength INT NOT NULL DEFAULT 4 COMMENT '每组字符数（默认 4）',
        separator VARCHAR(8) NOT NULL DEFAULT '-' COMMENT '分组分隔符（默认 -，空串表示不分隔）',
        charset VARCHAR(16) NOT NULL DEFAULT 'A-Z1-9' COMMENT '字符集预设：A-Z1-9（排除0防混淆）/ A-Z0-9',
        scenes JSON NULL COMMENT '场景白名单（null=不限制）',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='扫码码生成策略配置（单行）'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scan_code_settings`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scan_code_data`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scan_code_records`)
  }
}
