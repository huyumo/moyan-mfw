/**
 * @fileoverview 修复 mfw_document.images 列历史脏数据
 * @description 将 images 列从旧格式（string[] 或损坏的 [[],[]]）规范化为
 *   DocumentImage[]（{src,width?,height?}）。空数组/无效数据置为 NULL。
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixImagesType20260806000000 implements MigrationInterface {
  name = 'FixImagesType20260806000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 逐行读取并规范化 images 列
    const rows: Array<{ id: number; images: any }> = await queryRunner.query(
      `SELECT id, images FROM mfw_document WHERE images IS NOT NULL`,
    );

    for (const row of rows) {
      let normalized: Array<{ src: string; width?: number; height?: number }> | null = null;

      try {
        const raw = row.images;
        if (Array.isArray(raw) && raw.length > 0) {
          const items: Array<{ src: string; width?: number; height?: number }> = [];
          for (const item of raw) {
            // 已是对象格式 { src }
            if (item && typeof item === 'object' && typeof item.src === 'string' && item.src) {
              items.push({ src: item.src, width: item.width, height: item.height });
            }
            // 旧格式：纯字符串 URL
            else if (typeof item === 'string' && item) {
              items.push({ src: item });
            }
            // 其他无效元素（如空数组 []）跳过
          }
          normalized = items.length > 0 ? items : null;
        } else {
          // 空数组或非数组 -> 置 NULL
          normalized = null;
        }
      } catch {
        normalized = null;
      }

      await queryRunner.query(
        `UPDATE mfw_document SET images = ? WHERE id = ?`,
        [JSON.stringify(normalized), row.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚无法精确还原旧格式，仅将对象数组中的 src 提取为字符串数组
    const rows: Array<{ id: number; images: any }> = await queryRunner.query(
      `SELECT id, images FROM mfw_document WHERE images IS NOT NULL`,
    );

    for (const row of rows) {
      let reverted: string[] | null = null;
      try {
        const raw = row.images;
        if (Array.isArray(raw)) {
          const urls = raw
            .map((item: any) => (item && typeof item === 'object' && typeof item.src === 'string' ? item.src : null))
            .filter((u: string | null): u is string => !!u);
          reverted = urls.length > 0 ? urls : null;
        }
      } catch {
        reverted = null;
      }

      await queryRunner.query(
        `UPDATE mfw_document SET images = ? WHERE id = ?`,
        [JSON.stringify(reverted), row.id],
      );
    }
  }
}
