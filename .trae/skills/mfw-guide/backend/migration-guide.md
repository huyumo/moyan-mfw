---
version: "1.0"
last_updated: "2026-04-25"
scope: backend
triggers:
  - "数据库迁移"
  - "migration"
  - "Entity 变更"
  - "种子数据"
  - "schema 变更"
dependencies: ["new-backend-module"]
maturity: stable
tags: [后端, 数据库, 迁移, 种子数据, TypeORM]
---

# 数据库迁移规范

## TypeORM Migration 流程

### 创建迁移

当 Entity 字段发生变更时，需要生成数据库迁移文件：

```bash
cd packages/base-backend

# 1. 修改 Entity 文件后，生成迁移文件
pnpm run migration:generate src/database/migrations/MigrationName

# 2. 执行迁移
pnpm run migration:run

# 3. 回滚迁移（如需）
pnpm run migration:revert
```

### 迁移文件命名

- 格式：`{timestamp}-{描述}.ts`
- 示例：`1700000000000-AddOrderTable.ts`
- 自动生成时 TypeORM 会自动加时间戳前缀

### 手动创建迁移

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderTable1700000000000 implements MigrationInterface {
  name = 'AddOrderTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sys_orders (
        id CHAR(36) NOT NULL,
        name VARCHAR(64) NOT NULL,
        status INT DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE sys_orders`);
  }
}
```

### 迁移最佳实践

- 每个 `up()` 必须有对应的 `down()` 用于回滚
- 生产环境执行迁移前必须备份数据库
- 迁移文件一旦合并到主分支，不应再修改
- 数据迁移和结构迁移分开处理

## 种子数据管理

### 种子数据位置

`packages/base-backend/src/database/seeds/`

### 种子数据顺序（系统初始化）

1. 应用类型 → `sys_app_types`
2. admin 用户 → `sys_users`
3. 权限树 → `sys_permissions`
4. 超级管理员角色 → `sys_roles`
5. 应用实例 → `sys_apps`
6. 权限池 → `sys_app_type_permissions`
7. 角色权限 → `sys_role_permissions`
8. 拥有者绑定 → `sys_app_members`

### 运行种子数据

```bash
cd packages/base-backend
pnpm run seed
```

### 清空数据库

```bash
cd packages/base-backend
pnpm run db:clear
```

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm run migration:generate` | 生成迁移文件 |
| `pnpm run migration:run` | 执行迁移 |
| `pnpm run migration:revert` | 回滚最后一次迁移 |
| `pnpm run seed` | 运行种子数据 |
| `pnpm run db:clear` | 清空数据库 |

## 反模式（Red Flags）— 立即停止

- ✋ 手动修改数据库结构而不创建迁移 → 必须通过 migration 管理
- ✋ 迁移文件中只写 `up()` 不写 `down()` → 必须支持回滚
- ✋ 生产环境迁移前不备份 → 迁移前必须备份
- ✋ 修改已合并的迁移文件 → 应创建新的迁移来修正
- ✋ 种子数据中硬编码用户密码 → 使用 `hashPassword` 加密
- ✋ 跳过种子数据顺序 → 初始化有依赖关系，必须按序执行
