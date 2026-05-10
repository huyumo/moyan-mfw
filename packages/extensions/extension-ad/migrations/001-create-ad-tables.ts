import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateAdTables001 implements MigrationInterface {
  name = 'CreateAdTables001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'ext_ad_placement_types',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true, default: '(UUID())' },
        { name: 'name', type: 'varchar', length: '64' },
        { name: 'code', type: 'varchar', length: '64', isUnique: true },
        { name: 'width', type: 'int' },
        { name: 'height', type: 'int' },
        { name: 'description', type: 'varchar', length: '255', isNullable: true },
        { name: 'status', type: 'tinyint', default: 1 },
        { name: 'sortOrder', type: 'int', default: 0 },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updateAt', type: 'datetime', isNullable: true },
        { name: 'deleteAt', type: 'datetime', isNullable: true },
      ],
    }))

    await queryRunner.createTable(new Table({
      name: 'ext_ad_placements',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true, default: '(UUID())' },
        { name: 'name', type: 'varchar', length: '64' },
        { name: 'code', type: 'varchar', length: '64', isUnique: true },
        { name: 'placementTypeId', type: 'char', length: '36' },
        { name: 'description', type: 'varchar', length: '255', isNullable: true },
        { name: 'status', type: 'tinyint', default: 1 },
        { name: 'sortOrder', type: 'int', default: 0 },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updateAt', type: 'datetime', isNullable: true },
        { name: 'deleteAt', type: 'datetime', isNullable: true },
      ],
      foreignKeys: [
        { columnNames: ['placementTypeId'], referencedTableName: 'ext_ad_placement_types', referencedColumnNames: ['id'] },
      ],
    }))

    await queryRunner.createTable(new Table({
      name: 'ext_ad_contents',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true, default: '(UUID())' },
        { name: 'placementId', type: 'char', length: '36' },
        { name: 'title', type: 'varchar', length: '128' },
        { name: 'imageUrl', type: 'varchar', length: '500' },
        { name: 'linkUrl', type: 'varchar', length: '500', isNullable: true },
        { name: 'linkType', type: 'varchar', length: '32' },
        { name: 'miniAppId', type: 'varchar', length: '255', isNullable: true },
        { name: 'miniAppPath', type: 'varchar', length: '255', isNullable: true },
        { name: 'internalRoute', type: 'varchar', length: '255', isNullable: true },
        { name: 'startTime', type: 'datetime', isNullable: true },
        { name: 'endTime', type: 'datetime', isNullable: true },
        { name: 'status', type: 'tinyint', default: 1 },
        { name: 'sortOrder', type: 'int', default: 0 },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updateAt', type: 'datetime', isNullable: true },
        { name: 'deleteAt', type: 'datetime', isNullable: true },
      ],
      foreignKeys: [
        { columnNames: ['placementId'], referencedTableName: 'ext_ad_placements', referencedColumnNames: ['id'] },
      ],
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ext_ad_contents')
    await queryRunner.dropTable('ext_ad_placements')
    await queryRunner.dropTable('ext_ad_placement_types')
  }
}
