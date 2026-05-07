import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateDictTables1715000000000 implements MigrationInterface {
  name = 'CreateDictTables1715000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sys_dict_types',
        columns: [
          { name: 'id', type: 'char', length: '36', isPrimary: true },
          { name: 'dict_key', type: 'varchar', length: '64', isUnique: true },
          { name: 'dict_name', type: 'varchar', length: '64' },
          { name: 'module', type: 'varchar', length: '64', isNullable: true, default: null },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', isNullable: true, default: null },
        ],
      }),
      true
    )

    await queryRunner.createTable(
      new Table({
        name: 'sys_dict_items',
        columns: [
          { name: 'id', type: 'char', length: '36', isPrimary: true },
          { name: 'dict_type_id', type: 'char', length: '36' },
          { name: 'item_value', type: 'varchar', length: '64' },
          { name: 'item_label', type: 'varchar', length: '64' },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', isNullable: true, default: null },
        ],
        indices: [{ name: 'idx_dict_type', columnNames: ['dict_type_id'] }],
        foreignKeys: [{
          name: 'fk_dict_items_type',
          columnNames: ['dict_type_id'],
          referencedTableName: 'sys_dict_types',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sys_dict_items')
    await queryRunner.dropTable('sys_dict_types')
  }
}
