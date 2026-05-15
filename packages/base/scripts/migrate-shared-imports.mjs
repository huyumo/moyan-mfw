/**
 * @fileoverview 迁移脚本：将 base 包内所有 `moyan-mfw-base/shared` 引用替换为相对路径
 * @description 迁移后 backend entity 和 frontend .vue 文件通过相对路径引用兄弟目录 src/shared/
 *
 * 用法：node packages/base/scripts/migrate-shared-imports.mjs
 * 前置条件：pnpm install 已完成，子包 package.json + tsconfig 已就位
 * 验证：替换后运行 pnpm --filter @internal/base-backend build 和 pnpm --filter @internal/base-frontend build
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = resolve(__dirname, '..');
const SRC_DIR = resolve(BASE_DIR, 'src');
const SHARED_DIR = resolve(SRC_DIR, 'shared');

const OLD_IMPORT_PATTERN = /from\s+['"]moyan-mfw-base\/shared['"]/g;

function posixRelativePath(fromDir, toDir) {
  const rel = relative(fromDir, toDir).split(sep).join('/');
  return rel.startsWith('.') ? rel : './' + rel;
}

const FILE_MAP = [
  // --- frontend (15 files) ---
  { path: 'src/frontend/views/sys/user/UserForm.vue' },
  { path: 'src/frontend/views/sys/user/Index.vue' },
  { path: 'src/frontend/views/sys/role/Index.vue' },
  { path: 'src/frontend/views/sys/app/Index.vue' },
  { path: 'src/frontend/views/sys/app/AppForm.vue' },
  { path: 'src/frontend/views/sys/app/AppDetail.vue' },
  { path: 'src/frontend/views/sys/member/Index.vue' },
  { path: 'src/frontend/views/sys/member/RoleAssignForm.vue' },
  { path: 'src/frontend/views/sys/app-type/EditForm.vue' },
  { path: 'src/frontend/views/sys/app-type/DetailPopup.vue' },
  { path: 'src/frontend/views/sys/app-type/AppTypeCard.vue' },
  { path: 'src/frontend/views/sys/app-type/AddForm.vue' },
  { path: 'src/frontend/components/layout/profile-panel.vue' },
  { path: 'src/frontend/components/business/role-card/RoleCard.vue' },
  { path: 'src/frontend/components/business/role-card/Index.vue' },

  // --- backend (7 files) ---
  { path: 'src/backend/modules/sys/role/entities/role.entity.ts' },
  { path: 'src/backend/modules/sys/user/entities/user.entity.ts' },
  { path: 'src/backend/modules/sys/permission/entities/permission.entity.ts' },
  { path: 'src/backend/modules/sys/audit-log/entities/audit-log.entity.ts' },
  { path: 'src/backend/modules/sys/app-type/entities/app-type.entity.ts' },
  { path: 'src/backend/modules/sys/app/entities/app.entity.ts' },
  { path: 'src/backend/database/seeds/dict.seeder.ts' },
];

function main() {
  console.log('=== base 包 shared 引用迁移脚本 ===\n');
  console.log(`源目录: ${SRC_DIR}`);
  console.log(`目标目录: ${SHARED_DIR}\n`);

  let changed = 0;
  let skipped = 0;

  for (const entry of FILE_MAP) {
    const absPath = resolve(BASE_DIR, entry.path);
    const fileDir = dirname(absPath);
    const relativePath = posixRelativePath(fileDir, SHARED_DIR);

    let content;
    try {
      content = readFileSync(absPath, 'utf-8');
    } catch {
      console.log(`  ⚠️  文件不存在，跳过: ${entry.path}`);
      skipped++;
      continue;
    }

    if (!OLD_IMPORT_PATTERN.test(content)) {
      console.log(`  -  无需修改: ${entry.path}`);
      skipped++;
      continue;
    }

    OLD_IMPORT_PATTERN.lastIndex = 0;
    const oldLine = content.match(OLD_IMPORT_PATTERN)?.[0] || '';
    const newContent = content.replace(OLD_IMPORT_PATTERN, `from '${relativePath}'`);
    const newLine = newContent.match(/from\s+['"][^'"]+['"]/g)?.find(l => l.includes('shared')) || '';

    writeFileSync(absPath, newContent, 'utf-8');
    changed++;

    console.log(`  [${String(changed).padStart(2, '0')}/${FILE_MAP.length}] ${entry.path}`);
    console.log(`      旧: ${oldLine}`);
    console.log(`      新: ${newLine}\n`);
  }

  console.log(`\n✅ 迁移完成！修改 ${changed} 个文件，跳过 ${skipped} 个。`);
  console.log('\n下一步验证：');
  console.log('  1. pnpm --filter @internal/base-backend build');
  console.log('  2. pnpm --filter @internal/base-frontend build');
  console.log('  3. pnpm --filter @internal/base-shared build');
}

main();