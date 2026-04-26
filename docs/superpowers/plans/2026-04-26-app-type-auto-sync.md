# 应用类型配置自动同步实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现应用类型配置自动同步功能，在启动时根据配置同步业务应用类型到数据库。

**Architecture:** 创建独立的同步模块 `app-type-sync.ts`，在 `createBaseBackendApp` 中根据 `syncAppTypes` 配置项决定是否执行同步。同步逻辑使用事务保证数据一致性，处理并发竞争场景。

**Tech Stack:** NestJS, TypeORM, TypeScript

---

## 文件结构

```
packages/base-backend/src/
├── modules/sys/app-type/
│   ├── app-type-sync.ts        ← 新建：同步逻辑
│   ├── app-type.service.ts     (不修改)
│   ├── app-type.module.ts      (不修改)
│   └── ...
├── create-base-backend-app.ts  ← 修改：调用同步函数
├── types/app-config.types.ts   ← 修改：添加 syncAppTypes 配置项
├── index.ts                    ← 修改：导出同步函数
└── utils/
    └── app-type-validator.ts   (不修改)
```

---

### Task 1: 添加 syncAppTypes 配置项

**Files:**
- Modify: `packages/base-backend/src/types/app-config.types.ts`

- [ ] **Step 1: 在 CreateBaseBackendAppOptions 接口中添加 syncAppTypes 配置项**

在 `appTypes?: AppTypeConfig[];` 后面添加：

```typescript
/** 是否在启动时同步应用类型配置到数据库，默认 false */
syncAppTypes?: boolean;
```

- [ ] **Step 2: 运行构建验证**

Run: `npm run build`
Expected: 构建成功，无错误

---

### Task 2: 创建 app-type-sync.ts 同步模块

**Files:**
- Create: `packages/base-backend/src/modules/sys/app-type/app-type-sync.ts`

- [ ] **Step 1: 创建同步模块文件**

```typescript
/**
 * @fileoverview 应用类型配置自动同步
 * @description 在服务启动时同步业务应用类型配置到数据库
 */

import { DataSource, EntityManager } from 'typeorm';
import { AppType } from './entities/app-type.entity';
import { Role } from '../role/entities/role.entity';
import { AppTypeConfig } from '../../../types/app-config.types';
import { BUILTIN_APP_TYPES } from '../../../utils/app-type-validator';

/**
 * 同步应用类型配置到数据库
 * 
 * 同步规则：
 * 1. 只处理业务应用类型（排除 system/admin 内置类型）
 * 2. 已存在的应用类型跳过，但检查并补充缺失的内置角色
 * 3. 使用事务保证数据一致性
 * 4. 处理并发竞争（唯一约束冲突视为已存在）
 */
export async function syncAppTypesConfig(
  dataSource: DataSource,
  appTypes: AppTypeConfig[],
): Promise<void> {
  if (!appTypes || appTypes.length === 0) {
    return;
  }

  const businessAppTypes = appTypes.filter(
    (config) => !BUILTIN_APP_TYPES.includes(config.typeCode)
  );

  if (businessAppTypes.length === 0) {
    return;
  }

  process.stdout.write('🔄 开始同步业务应用类型配置...\n');

  for (const config of businessAppTypes) {
    await syncSingleAppType(dataSource, config);
  }

  process.stdout.write('✅ 业务应用类型配置同步完成\n');
}

/**
 * 同步单个应用类型（使用事务）
 */
async function syncSingleAppType(
  dataSource: DataSource,
  config: AppTypeConfig,
): Promise<void> {
  await dataSource.transaction(async (manager: EntityManager) => {
    const appTypeRepo = manager.getRepository(AppType);
    const roleRepo = manager.getRepository(Role);

    const existingAppType = await appTypeRepo.findOne({
      where: { typeCode: config.typeCode },
    });

    if (existingAppType) {
      process.stdout.write(`  √ 应用类型已存在：${config.typeName} (${config.typeCode})\n`);
      
      if (config.builtinRole && config.builtinRole.length > 0) {
        await syncBuiltinRoles(manager, existingAppType.id, config.builtinRole);
      }
      return;
    }

    try {
      const newAppType = appTypeRepo.create({
        typeName: config.typeName,
        typeCode: config.typeCode,
        typeDesc: config.typeDesc || '',
        icon: config.icon || '',
        multiAppEnabled: config.multiAppEnabled,
        typeStatus: 1,
        sortOrder: 0,
      });

      const savedAppType = await appTypeRepo.save(newAppType);
      process.stdout.write(`  ✓ 创建应用类型：${config.typeName} (${config.typeCode})\n`);

      if (config.builtinRole && config.builtinRole.length > 0) {
        await createBuiltinRoles(manager, savedAppType.id, config.builtinRole);
      }
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        process.stdout.write(`  √ 应用类型并发创建冲突：${config.typeName} (${config.typeCode}) - 视为已存在\n`);
        
        const existing = await appTypeRepo.findOne({
          where: { typeCode: config.typeCode },
        });
        if (existing && config.builtinRole && config.builtinRole.length > 0) {
          await syncBuiltinRoles(manager, existing.id, config.builtinRole);
        }
      } else {
        throw error;
      }
    }
  });
}

/**
 * 同步内置角色（补充缺失的角色）
 */
async function syncBuiltinRoles(
  manager: EntityManager,
  appTypeId: string,
  builtinRoles: Array<{ roleCode: string; roleName: string }>,
): Promise<void> {
  const roleRepo = manager.getRepository(Role);

  for (const roleConfig of builtinRoles) {
    const existingRole = await roleRepo.findOne({
      where: { roleCode: roleConfig.roleCode },
    });

    if (existingRole) {
      process.stdout.write(`    √ 内置角色已存在：${roleConfig.roleName} (${roleConfig.roleCode})\n`);
      continue;
    }

    try {
      await roleRepo.save({
        roleName: roleConfig.roleName,
        roleCode: roleConfig.roleCode,
        roleDesc: `${roleConfig.roleName}（内置角色）`,
        appTypeId,
        isBuiltin: 1,
        isOwner: 0,
        roleStatus: 1,
        sortOrder: 0,
      });
      process.stdout.write(`    ✓ 补充内置角色：${roleConfig.roleName} (${roleConfig.roleCode})\n`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        process.stdout.write(`    √ 内置角色并发创建冲突：${roleConfig.roleName} (${roleConfig.roleCode}) - 视为已存在\n`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * 创建内置角色（新应用类型）
 */
async function createBuiltinRoles(
  manager: EntityManager,
  appTypeId: string,
  builtinRoles: Array<{ roleCode: string; roleName: string }>,
): Promise<void> {
  const roleRepo = manager.getRepository(Role);

  for (const roleConfig of builtinRoles) {
    try {
      await roleRepo.save({
        roleName: roleConfig.roleName,
        roleCode: roleConfig.roleCode,
        roleDesc: `${roleConfig.roleName}（内置角色）`,
        appTypeId,
        isBuiltin: 1,
        isOwner: 0,
        roleStatus: 1,
        sortOrder: 0,
      });
      process.stdout.write(`    ✓ 创建内置角色：${roleConfig.roleName} (${roleConfig.roleCode})\n`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        process.stdout.write(`    √ 内置角色并发创建冲突：${roleConfig.roleName} (${roleConfig.roleCode}) - 视为已存在\n`);
      } else {
        throw error;
      }
    }
  }
}
```

- [ ] **Step 2: 运行构建验证**

Run: `npm run build`
Expected: 构建成功，无错误

---

### Task 3: 修改 create-base-backend-app.ts 调用同步函数

**Files:**
- Modify: `packages/base-backend/src/create-base-backend-app.ts`

- [ ] **Step 1: 在 onAppInit 钩子执行后添加同步调用**

找到 `await hooksExecutor.onAppInit();` 行（约第94行），在其后添加：

```typescript
await hooksExecutor.onAppInit();

// 根据配置决定是否同步应用类型
if (options.syncAppTypes && allAppTypes.length > 0) {
  const { syncAppTypesConfig } = await import('./modules/sys/app-type/app-type-sync');
  await syncAppTypesConfig(dataSource, allAppTypes);
}
```

- [ ] **Step 2: 运行构建验证**

Run: `npm run build`
Expected: 构建成功，无错误

---

### Task 4: 导出同步函数

**Files:**
- Modify: `packages/base-backend/src/index.ts`

- [ ] **Step 1: 在导出区域添加同步函数导出**

在文件末尾添加：

```typescript
// === 应用类型同步 ===
export { syncAppTypesConfig } from './modules/sys/app-type/app-type-sync';
```

- [ ] **Step 2: 运行构建验证**

Run: `npm run build`
Expected: 构建成功，无错误

---

### Task 5: 更新业务层 main.ts 使用示例

**Files:**
- Modify: `backend/src/main.ts`

- [ ] **Step 1: 添加 syncAppTypes 配置**

在 `createBaseBackendApp` 调用中添加 `syncAppTypes: true`：

```typescript
const app = await createBaseBackendApp({
  name: '墨焱业务后端',
  appTypes: appTypesConfig,
  syncAppTypes: true,  // 开发阶段开启同步
  modules: [AppModule],
  hooks: {
    onAppInit: async (ctx) => {
      console.log('[Backend] 应用初始化完成');
    },
  },
});
```

- [ ] **Step 2: 运行构建验证**

Run: `npm run build` (在 backend 目录)
Expected: 构建成功，无错误

---

### Task 6: 验证功能

- [ ] **Step 1: 启动服务验证**

Run: `npm run start:dev` (在 backend 目录)
Expected: 
- 服务启动成功
- 控制台输出同步日志（如果 syncAppTypes=true）
- 数据库中存在 supplier 应用类型

- [ ] **Step 2: 检查数据库**

查询 `sys_app_types` 表，确认 supplier 类型已创建。

---

### Task 7: 提交代码

- [ ] **Step 1: 提交变更**

```bash
git add packages/base-backend/src/modules/sys/app-type/app-type-sync.ts
git add packages/base-backend/src/types/app-config.types.ts
git add packages/base-backend/src/create-base-backend-app.ts
git add packages/base-backend/src/index.ts
git add backend/src/main.ts
git add docs/superpowers/specs/2026-04-26-app-type-auto-sync-design.md
git commit -m "feat: 添加应用类型配置自动同步功能

- 新增 syncAppTypes 配置项，默认关闭
- 创建 app-type-sync.ts 同步模块
- 支持事务保证数据一致性
- 处理并发竞争场景
- 只同步业务应用类型，不影响内置类型"
```