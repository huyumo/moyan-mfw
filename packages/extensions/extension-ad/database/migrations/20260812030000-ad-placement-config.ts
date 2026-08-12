import { MigrationInterface, QueryRunner } from 'typeorm'

export class AdPlacementConfig20260812030000 implements MigrationInterface {
  name = 'AdPlacementConfig20260812030000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ext_ad_placements
      ADD COLUMN supportVideo TINYINT(1) DEFAULT 0 COMMENT '是否支持视频广告',
      ADD COLUMN supportSchedule TINYINT(1) DEFAULT 0 COMMENT '是否支持投放时间'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ext_ad_placements
      DROP COLUMN supportVideo,
      DROP COLUMN supportSchedule
    `)
  }
}
