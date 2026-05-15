import 'reflect-metadata'
import { getAllDicts } from 'moyan-mfw-base/shared';
import type { DataSource } from 'typeorm'

export async function seedDicts(dataSource: DataSource) {
  const dicts = getAllDicts()

  for (const dict of dicts) {
    await dataSource.query(
      `INSERT INTO sys_dict_types (id, dict_key, dict_name, module, created_at)
       VALUES (UUID(), ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE dict_name = VALUES(dict_name), module = VALUES(module)`,
      [dict.key, dict.label, dict.module ?? null]
    )

    const [row]: any[] = await dataSource.query(
      `SELECT id FROM sys_dict_types WHERE dict_key = ?`, [dict.key]
    )

    for (let i = 0; i < dict.items.length; i++) {
      const item = dict.items[i]
      await dataSource.query(
        `INSERT INTO sys_dict_items (id, dict_type_id, item_value, item_label, sort_order, created_at)
         VALUES (UUID(), ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE item_label = VALUES(item_label), sort_order = VALUES(sort_order)`,
        [row.id, String(item.value), item.label, i]
      )
    }
  }
}
