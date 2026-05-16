import { MigrationInterface, QueryRunner } from 'typeorm'

export class AdMedia20260516143000 implements MigrationInterface {
  name = 'AdMedia20260516143000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ext_ad_contents 
      ADD COLUMN mediaType VARCHAR(10) DEFAULT 'image' COMMENT '媒体类型',
      ADD COLUMN media JSON COMMENT '媒体资源（图片或视频）'
    `)

    await queryRunner.query(`
      UPDATE ext_ad_contents 
      SET media = JSON_OBJECT('src', imageUrl, 'width', 0, 'height', 0)
      WHERE imageUrl IS NOT NULL AND imageUrl != ''
    `)

    await queryRunner.query(`
      ALTER TABLE ext_ad_contents DROP COLUMN imageUrl
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ext_ad_contents 
      ADD COLUMN imageUrl VARCHAR(500) COMMENT '广告图片 URL'
    `)

    await queryRunner.query(`
      UPDATE ext_ad_contents 
      SET imageUrl = JSON_UNQUOTE(JSON_EXTRACT(media, '$.src'))
      WHERE media IS NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE ext_ad_contents 
      DROP COLUMN mediaType,
      DROP COLUMN media
    `)
  }
}
