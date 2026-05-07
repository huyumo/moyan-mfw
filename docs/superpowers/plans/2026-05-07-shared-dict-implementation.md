# moyan-shared-dict Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `moyan-shared-dict` framework package + `business-dict` private package, then migrate existing inline dict definitions and unify dictionary rendering across the project.

**Architecture:** A `moyan-shared-dict` package (in `packages/shared-dict/`) provides the decorator/tool/core infrastructure and built-in generic dicts (`StatusDict`, `BoolDict`). A private `business-dict` package (at repo root level) holds project-specific business dicts. Both use `@DictMeta` class decorator + `@DictEntry` property decorator. A global singleton `Map` in `registry.ts` auto-collects all registered dicts. Backend seeder syncs all dicts to `sys_dict_types` / `sys_dict_items` tables via `getAllDicts()`.

**Tech Stack:** TypeScript, `reflect-metadata`, Vue 3 + Element Plus (frontend), NestJS + TypeORM (backend)

**Spec:** `docs/superpowers/specs/2026-05-07-shared-dict-design.md`

---

### Task 1: Create `packages/shared-dict/` directory structure

**Files:**
- Create: `packages/shared-dict/package.json`
- Create: `packages/shared-dict/tsconfig.json`
- Create: `packages/shared-dict/src/core/types.ts`
- Create: `packages/shared-dict/src/core/decorator.ts`
- Create: `packages/shared-dict/src/core/registry.ts`
- Create: `packages/shared-dict/src/core/helper.ts`
- Create: `packages/shared-dict/src/core/index.ts`
- Create: `packages/shared-dict/src/base/status.ts`
- Create: `packages/shared-dict/src/base/index.ts`
- Create: `packages/shared-dict/src/index.ts`

- [ ] **Step 1: Create `packages/shared-dict/package.json`**

```json
{
  "name": "moyan-shared-dict",
  "version": "0.1.0",
  "description": "Shared dictionary definitions for moyan frontend and backend",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "reflect-metadata": "^0.2.2"
  },
  "peerDependencies": {},
  "devDependencies": {
    "typescript": "^5.1.3"
  }
}
```

- [ ] **Step 2: Create `packages/shared-dict/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/shared-dict/src/core/types.ts`**

```typescript
export interface DictItem {
  value: string | number
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export interface DictMetaOptions {
  key: string
  label: string
  module?: string
}
```

- [ ] **Step 4: Create `packages/shared-dict/src/core/decorator.ts`**

```typescript
import type { DictMetaOptions, DictItem } from './types'
import { registerDict } from './registry'

export const META_KEY = Symbol('dict:meta')
export const ITEMS_KEY = Symbol('dict:items')

export function DictMeta(options: DictMetaOptions): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(META_KEY, options, target)
    registerDict(target)
  }
}

export function DictEntry(item: Omit<DictItem, 'value'>): PropertyDecorator {
  return (target: any, propertyKey) => {
    const items: Array<{ key: string; item: Omit<DictItem, 'value'> }> =
      Reflect.getOwnMetadata(ITEMS_KEY, target) || []
    items.push({ key: String(propertyKey), item })
    Reflect.defineMetadata(ITEMS_KEY, items, target)
  }
}
```

- [ ] **Step 5: Create `packages/shared-dict/src/core/registry.ts`**

```typescript
import { META_KEY, ITEMS_KEY } from './decorator'
import type { DictItem, DictMetaOptions } from './types'

const registry = new Map<string, any>()

export function registerDict(dictClass: any): void {
  registry.set(dictClass.name, dictClass)
}

export function getAllDicts(): Array<{
  key: string
  label: string
  module?: string
  items: DictItem[]
}> {
  return Array.from(registry.values()).map(cls => {
    const meta: DictMetaOptions | undefined = Reflect.getOwnMetadata(META_KEY, cls)
    const entries: Array<{ key: string; item: Omit<DictItem, 'value'> }> =
      Reflect.getOwnMetadata(ITEMS_KEY, cls) || []

    return {
      key: meta?.key ?? '',
      label: meta?.label ?? '',
      module: meta?.module,
      items: entries.map(({ key, item }) => ({
        ...item,
        value: cls[key],
      })),
    }
  })
}
```

- [ ] **Step 6: Create `packages/shared-dict/src/core/helper.ts`**

```typescript
import { META_KEY, ITEMS_KEY } from './decorator'
import type { DictItem, DictMetaOptions } from './types'

export function toItems<T>(dictClass: T): DictItem[] {
  const entries: Array<{ key: string; item: Omit<DictItem, 'value'> }> =
    Reflect.getOwnMetadata(ITEMS_KEY, (dictClass as any).prototype ?? dictClass) || []

  return entries.map(({ key, item }) => ({
    ...item,
    value: (dictClass as any)[key],
  }))
}

export function getLabel<T>(dictClass: T, value: string | number): string {
  return toItems(dictClass).find(i => i.value === value)?.label ?? '--'
}

export function getMeta<T>(dictClass: T): DictMetaOptions | undefined {
  return Reflect.getOwnMetadata(META_KEY, dictClass)
}

export function toDescription<T>(dictClass: T): string {
  const meta = getMeta(dictClass)
  const name = meta?.label ?? ''
  const mapping = toItems(dictClass).map(i => `${i.value}=${i.label}`).join(', ')
  return `${name}: ${mapping}`
}

export function toDbItems<T>(dictClass: T): Array<{ value: string | number; label: string }> {
  return toItems(dictClass).map(({ value, label }) => ({ value, label }))
}
```

- [ ] **Step 7: Create `packages/shared-dict/src/core/index.ts`**

```typescript
export * from './types'
export * from './decorator'
export * from './registry'
export * from './helper'
```

- [ ] **Step 8: Create `packages/shared-dict/src/base/status.ts`**

```typescript
import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'status', label: '通用状态' })
export class StatusDict {
  @DictEntry({ label: '启用', type: 'success' })  static ENABLED  = 1
  @DictEntry({ label: '禁用', type: 'info'   })  static DISABLED = 0
}

@DictMeta({ key: 'bool', label: '布尔值' })
export class BoolDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
```

- [ ] **Step 9: Create `packages/shared-dict/src/base/index.ts`**

```typescript
export * from './status'
```

- [ ] **Step 10: Create `packages/shared-dict/src/index.ts`**

```typescript
export * from './core'
export * from './base'
```

- [ ] **Step 11: Install dependencies and verify build**

Run:
```powershell
cd packages/shared-dict
pnpm install
npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 12: Commit**

```powershell
git add packages/shared-dict/
git commit -m "feat: create moyan-shared-dict package with core decorator/helper/registry infrastructure"
```

---

### Task 2: Configure workspace links for `moyan-shared-dict`

**Files:**
- Modify: `pnpm-workspace.yaml:1-9`
- Modify: `tsconfig.json:22-27`

- [ ] **Step 1: Add `packages/shared-dict` to `pnpm-workspace.yaml`**

Change the `packages:` section from the current explicit list to include `packages/shared-dict`. Replace the first line `- packages/base-backend` section with `- packages/*` pattern that already works for `packages/`:

Current:
```yaml
packages:
  - packages/base-backend
  - packages/base-frontend
  - packages/component-demo
  - frontend
  - backend
  - examples
  - docs
  - .harness
```

Replace with:
```yaml
packages:
  - packages/base-backend
  - packages/base-frontend
  - packages/component-demo
  - packages/shared-dict
  - frontend
  - backend
  - examples
  - docs
  - .harness
```

- [ ] **Step 2: Add `moyan-shared-dict` path mapping to root `tsconfig.json`**

Add to the `paths` object in `compilerOptions`:
```json
"moyan-shared-dict": ["./packages/shared-dict/src"]
```

After insertion, the `paths` block should be:
```json
"paths": {
  "moyan-mfw-core": ["./packages/core/dist"],
  "moyan-mfw-base-backend": ["./packages/base-backend/dist"],
  "moyan-mfw-base-frontend": ["./packages/base-frontend/dist"],
  "moyan-mfw-base-api": ["./packages/base-api/dist"],
  "moyan-shared-dict": ["./packages/shared-dict/src"]
}
```

- [ ] **Step 3: Run `pnpm install` from project root**

```powershell
pnpm install
```
Expected: No errors, `moyan-shared-dict` symlinked in `node_modules`.

- [ ] **Step 4: Verify `base-backend` can import from `moyan-shared-dict`**

Create a temporary test:
```powershell
cd packages/base-backend
node -e "require('moyan-shared-dict')"
```
Or test via tsc:
```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```powershell
git add pnpm-workspace.yaml tsconfig.json pnpm-lock.yaml
git commit -m "chore: add moyan-shared-dict to workspace and tsconfig paths"
```

---

### Task 3: Create `business-dict/` private package

**Files:**
- Create: `business-dict/package.json`
- Create: `business-dict/tsconfig.json`
- Create: `business-dict/src/user.ts`
- Create: `business-dict/src/supplier.ts`
- Create: `business-dict/src/index.ts`
- Modify: `pnpm-workspace.yaml:8`

- [ ] **Step 1: Create `business-dict/package.json`**

```json
{
  "name": "business-dict",
  "version": "0.1.0",
  "private": true,
  "description": "Business-specific dictionary definitions for this moyan project",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "moyan-shared-dict": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.1.3"
  }
}
```

- [ ] **Step 2: Create `business-dict/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `business-dict/src/user.ts`**

```typescript
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'gender', label: '性别', module: '用户管理' })
export class GenderDict {
  @DictEntry({ label: '未知', type: 'info'    })  static UNKNOWN = 0
  @DictEntry({ label: '男',   type: 'primary' })  static MALE    = 1
  @DictEntry({ label: '女',   type: 'danger'  })  static FEMALE  = 2
}

@DictMeta({ key: 'developer', label: '开发者', module: '用户管理' })
export class DeveloperDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
```

- [ ] **Step 4: Create `business-dict/src/supplier.ts`**

```typescript
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'supplier_status', label: '供应商状态', module: '供应商管理' })
export class SupplierStatusDict {
  @DictEntry({ label: '待审核', type: 'warning' })  static PENDING   = 0
  @DictEntry({ label: '已通过', type: 'success' })  static APPROVED  = 1
  @DictEntry({ label: '已拒绝', type: 'danger'  })  static REJECTED  = 2
}
```

- [ ] **Step 5: Create `business-dict/src/index.ts`**

```typescript
export * from './user'
export * from './supplier'
```

- [ ] **Step 6: Add `business-dict` to `pnpm-workspace.yaml`**

Append to the `packages:` list:
```yaml
  - business-dict
```

- [ ] **Step 7: Run `pnpm install` from project root**

```powershell
pnpm install
```
Expected: No errors, `business-dict` symlinked in `node_modules`.

- [ ] **Step 8: Verify TypeScript compilation**

```powershell
cd business-dict
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 9: Commit**

```powershell
git add business-dict/ pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat: create business-dict package with GenderDict, DeveloperDict, SupplierStatusDict"
```

---

### Task 4: Add dependencies to `backend` and `frontend` + entry injection

**Files:**
- Modify: `backend/package.json:25-43`
- Modify: `frontend/package.json:12-17`
- Modify: `backend/src/main.ts:9-11`

- [ ] **Step 1: Add dependencies to `backend/package.json`**

Add two lines to the `dependencies` object:
```json
"moyan-shared-dict": "workspace:*",
"business-dict": "workspace:*"
```

Place them near the top, right after `"moyan-base-backend": "workspace:*"`:
```json
"dependencies": {
  "moyan-base-backend": "workspace:*",
  "moyan-shared-dict": "workspace:*",
  "business-dict": "workspace:*",
  ... (rest unchanged)
}
```

- [ ] **Step 2: Add dependencies to `frontend/package.json`**

Add two lines to the `dependencies` object:
```json
"moyan-shared-dict": "workspace:*",
"business-dict": "workspace:*"
```

Place them right after `"moyan-mfw-base-frontend": "workspace:*"`:
```json
"dependencies": {
  "@element-plus/icons-vue": "^2.3.1",
  "element-plus": "^2.5.3",
  "moyan-mfw-base-frontend": "workspace:*",
  "moyan-shared-dict": "workspace:*",
  "business-dict": "workspace:*",
  "vue-router": "^4.2.5"
}
```

- [ ] **Step 3: Add `import 'business-dict'` to `backend/src/main.ts`**

Add after the existing imports, before `const swaggerGroups`:

```typescript
import 'business-dict'
```

Insert right after line 9 (`import './permissions';`):
```typescript
import './permissions';
import 'business-dict';
```

- [ ] **Step 4: Run `pnpm install`**

```powershell
pnpm install
```
Expected: No errors.

- [ ] **Step 5: Verify backend compilation**

```powershell
cd backend
npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```powershell
git add backend/package.json frontend/package.json backend/src/main.ts pnpm-lock.yaml
git commit -m "chore: add moyan-shared-dict and business-dict dependencies to backend/frontend"
```

---

### Task 5: Update backend Entity `User` with `toDescription`

**Files:**
- Modify: `packages/base-backend/src/modules/sys/user/entities/user.entity.ts:67-88`
- Modify: `packages/base-backend/src/modules/sys/user/dto/res/user-response.dto.ts:56-76`

- [ ] **Step 1: Update `user.entity.ts` — import and `gender` column**

Add imports at top (after existing imports):
```typescript
import { StatusDict, toDescription } from 'moyan-shared-dict'
import { GenderDict, DeveloperDict } from 'business-dict'
```

Replace the `gender` column (lines 68-72):
```typescript
@Column({ type: 'tinyint', default: GenderDict.UNKNOWN, comment: toDescription(GenderDict) })
gender: number
```

Replace the `userStatus` column (lines 74-80):
```typescript
@Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
@Index()
userStatus: number
```

Replace the `isDeveloper` column (lines 83-87):
```typescript
@Column({ type: 'tinyint', default: DeveloperDict.NO, comment: toDescription(DeveloperDict) })
isDeveloper: number
```

- [ ] **Step 2: Update `user-response.dto.ts` — change `isDeveloper` from `boolean` to `number`**

Change line 75 from:
```typescript
isDeveloper: boolean;
```
to:
```typescript
isDeveloper: number;
```

Also update the description comment (lines 70-73) to reflect the value mapping:
```typescript
/**
 * 是否开发者 (1:是 0:否)
 */
@ApiProperty({ description: '是否开发者 (1:是 0:否)' })
@Expose()
isDeveloper: number;
```

- [ ] **Step 3: Verify backend compilation**

```powershell
cd packages/base-backend
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add packages/base-backend/src/modules/sys/user/entities/user.entity.ts packages/base-backend/src/modules/sys/user/dto/res/user-response.dto.ts
git commit -m "refactor: use shared dict for User entity comments, unify isDeveloper to number"
```

---

### Task 6: Create `dict.seeder.ts` in `base-backend`

**Files:**
- Create: `packages/base-backend/src/database/seeds/dict.seeder.ts`

- [ ] **Step 1: Create `dict.seeder.ts`**

```typescript
import { getAllDicts } from 'moyan-shared-dict'
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
```

- [ ] **Step 2: Import and call `seedDicts` in `backend/src/database/run-seeds.ts`**

Add import after the `SupplierMemberProfile` import:
```typescript
import { seedDicts } from 'moyan-base-backend/database/seeds/dict.seeder'
```

Then add `import 'business-dict'` at the top (after line 5 `import 'reflect-metadata'`):
```typescript
import 'reflect-metadata'
import 'business-dict'
```

Add `await seedDicts(AppDataSource)` after `await runSeeds(...)`:
```typescript
await runSeeds(AppDataSource, process.env.ADMIN_DEFAULT_PASSWORD);
await seedDicts(AppDataSource);
```

- [ ] **Step 3: Verify TypeScript compilation**

```powershell
cd backend
npx tsc --noEmit
```
Expected: No errors. If `import 'moyan-base-backend/database/seeds/dict.seeder'` doesn't resolve, export `seedDicts` from the base-backend index or use the `@database/*` path alias.

Check: the base-backend tsconfig has path `@database/*` → `src/database/*`, so the import can be written as:
```typescript
import { seedDicts } from '@database/seeds/dict.seeder'
```

But that only works within base-backend. For the backend consumer, we need to export via the base-backend package's `main` entry. Let's add an export.

**Additional step**: Ensure `packages/base-backend/src/index.ts` exports the seeder:

```typescript
export { seedDicts } from './database/seeds/dict.seeder'
```

Then in `backend/src/database/run-seeds.ts`:
```typescript
import { seedDicts } from 'moyan-base-backend'
```

- [ ] **Step 4: Commit**

```powershell
git add packages/base-backend/src/database/seeds/dict.seeder.ts packages/base-backend/src/index.ts backend/src/database/run-seeds.ts
git commit -m "feat: add dict.seeder.ts with getAllDicts() auto-discovery"
```

---

### Task 7: Migrate `packages/base-frontend/src/views/sys/user/Index.vue`

**Files:**
- Modify: `packages/base-frontend/src/views/sys/user/Index.vue:23-68`

- [ ] **Step 1: Update imports**

Remove the old import:
```typescript
import type { DictItem } from '../../../components';
```

Add new imports:
```typescript
import { toItems, StatusDict } from 'moyan-shared-dict'
import { GenderDict, DeveloperDict } from 'business-dict'
```

- [ ] **Step 2: Remove old inline dict constants**

Delete lines 42-66 (the `STATUS`, `GENDER`, `GENDER_DICT`, `DEVELOPER_DICT` constants).

- [ ] **Step 3: Update `gender` column render (around line 118-121)**

Replace:
```typescript
render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: row.gender, dict: GENDER_DICT, asTag: true }),
```
With:
```typescript
render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: row.gender, dict: toItems(GenderDict), asTag: true }),
```

- [ ] **Step 4: Update `isDeveloper` column render (around line 124-128)**

Replace:
```typescript
render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: row.isDeveloper ? 1 : 0, dict: DEVELOPER_DICT, asTag: true }),
```
With:
```typescript
render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: row.isDeveloper, dict: toItems(DeveloperDict), asTag: true }),
```

- [ ] **Step 5: Update `userStatus` search template options (around line 93-100)**

Replace:
```typescript
elProps: {
  options: [
    { label: '启用', value: STATUS.ENABLED },
    { label: '禁用', value: STATUS.DISABLED },
  ],
},
```
With:
```typescript
elProps: {
  options: toItems(StatusDict).map(({ value, label }) => ({ value, label })),
},
```

- [ ] **Step 6: Update `handleStatusChange` (around line 199-202)**

Replace:
```typescript
const status = enabled ? STATUS.ENABLED : STATUS.DISABLED;
```
With:
```typescript
const status = enabled ? StatusDict.ENABLED : StatusDict.DISABLED;
```

- [ ] **Step 7: Verify TypeScript compilation**

```powershell
cd packages/base-frontend
npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 8: Commit**

```powershell
git add packages/base-frontend/src/views/sys/user/Index.vue
git commit -m "refactor: migrate user list page to use moyan-shared-dict and business-dict"
```

---

### Task 8: Create database migration for `sys_dict_types` + `sys_dict_items`

**Files:**
- Create: `packages/base-backend/src/database/migrations/1700000000000-create-dict-tables.ts` (use actual timestamp)

- [ ] **Step 1: Generate or create the migration**

Using TypeORM CLI from the backend:
```powershell
cd backend
pnpm migration:generate src/database/migrations/CreateDictTables
```

Or create manually:

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateDictTables1700000000000 implements MigrationInterface {
  name = 'CreateDictTables1700000000000'

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
          { name: 'updated_at', type: 'datetime', isNullable: true, default: null, onUpdate: 'CURRENT_TIMESTAMP' },
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
          { name: 'updated_at', type: 'datetime', isNullable: true, default: null, onUpdate: 'CURRENT_TIMESTAMP' },
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
```

- [ ] **Step 2: Commit**

```powershell
git add packages/base-backend/src/database/migrations/
git commit -m "feat: add sys_dict_types and sys_dict_items migration"
```

---

### Task 9: Verify end-to-end

**Files:** None (verification only)

- [ ] **Step 1: Verify backend full TypeScript compilation**

```powershell
cd backend
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 2: Verify frontend full TypeScript compilation**

```powershell
cd frontend
pnpm run typecheck:vue
```
Expected: No errors.

- [ ] **Step 3: Verify `packages/base-backend` compilation**

```powershell
cd packages/base-backend
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Verify `packages/shared-dict` compilation**

```powershell
cd packages/shared-dict
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Verify `business-dict` compilation**

```powershell
cd business-dict
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit any remaining changes**

```powershell
git add -A
git commit -m "chore: final verification — all packages compile cleanly"
```

---

### Task 10: Run existing tests to detect regressions

**Files:** None (test run only)

- [ ] **Step 1: Run `base-frontend` dict-format spec**

```powershell
cd packages/base-frontend
pnpm run test -- dict-format
```
Expected: All tests pass. (The `toItems()` function returns the same `DictItem[]` shape as the old inline constants.)

- [ ] **Step 2: Run backend tests**

```powershell
cd backend
pnpm run test
```
Expected: No new failures.

- [ ] **Step 3: If tests fail, fix and commit**

Fix any failures, then:
```powershell
git add -A
git commit -m "fix: resolve test failures from dict migration"
```
