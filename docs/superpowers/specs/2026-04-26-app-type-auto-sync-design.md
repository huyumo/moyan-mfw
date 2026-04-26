# 应用类型配置自动同步设计

## 一、背景与问题

### 问题描述

业务层在 `backend/src/app-types.config.ts` 定义了应用类型配置：

```typescript
export const appTypesConfig: AppTypeConfig[] = [
  {
    typeName: '供应商',
    typeCode: 'supplier',
    typeDesc: '供应商应用类型，用于管理供应商相关业务',
    multiAppEnabled: 1,
    builtinRole: [
      { roleCode: 'supplier_admin', roleName: '供应商管理员' },
      { roleCode: 'supplier_member', roleName: '供应商成员' },
    ],
  },
];
```

但启动服务后，数据库中没有新增定义的应用类型。

### 根本原因

数据流断裂：业务层定义的 `appTypesConfig` 没有被传递到种子数据初始化逻辑中。当前初始化逻辑只在 `/install` 接口被调用时执行，且只处理内置类型 `system`。

### 业务需求

1. **迭代开发场景**：系统开发是迭代过程，后期版本可能新增应用类型
2. **不影响已有数据**：新增应用类型不应影响已有系统的数据结构
3. **不依赖 /install 接口**：应用类型同步应在启动时自动完成
4. **可配置开关**：系统定型后可关闭同步，减少启动开销

---

## 二、设计目标

1. 启动时可配置同步业务应用类型到数据库
2. 完全不影响内置类型（system/admin）的初始化流程
3. 已存在的应用类型完全跳过，保护用户自定义修改
4. 内置角色：已存在则跳过，不存在则创建（包括补充缺失角色）
5. 使用事务保证数据一致性
6. 处理并发竞争（多实例启动场景）
7. 提供配置开关，默认关闭，开发阶段可手动开启

---

## 三、同步规则

### 3.1 类型区分

| 类型 | typeCode | 管理方式 |
|------|----------|----------|
| 内置类型 | system, admin | 由 `/install` 接口管理，启动同步完全跳过 |
| 业务类型 | supplier, ... | 启动时可配置同步 |

### 3.2 同步策略

| 场景 | 处理方式 |
|------|----------|
| syncAppTypes=false | 不执行同步 |
| 内置类型（system/admin） | 完全跳过 |
| 业务类型已存在 | 跳过类型，但检查并补充缺失的内置角色 |
| 业务类型不存在 | 创建应用类型 + 创建内置角色（事务内） |
| 内置角色已存在 | 跳过，不重复创建 |
| 内置角色不存在 | 创建并关联到应用类型 |
| 并发创建冲突 | 捕获唯一约束错误，视为"已存在"处理 |

---

## 四、技术设计

### 4.1 配置项定义

在 `CreateBaseBackendAppOptions` 中添加 `syncAppTypes` 配置项：

```typescript
/** 创建后端应用选项 */
export interface CreateBaseBackendAppOptions {
  // ... 其他配置项
  
  /** 是否在启动时同步应用类型配置到数据库，默认 false */
  syncAppTypes?: boolean;
}
```

### 4.2 同步时机

在 `createBaseBackendApp` 中，`onAppInit` 钩子执行后，根据配置决定是否同步：

```
启动流程：
1. 数据库连接建立
2. onDatabaseReady 钩子执行
3. onAppInit 钩子执行
4. 检查 syncAppTypes 配置
   - true: 执行同步
   - false: 跳过同步
5. 应用就绪，开始监听
```

选择 `onAppInit` 的原因：
- 所有 NestJS 模块已就绪
- 可以使用 DataSource 直接操作数据库
- 不影响模块初始化流程

### 4.3 数据流

```
main.ts (appTypesConfig)
  → createBaseBackendApp({ 
       appTypes: appTypesConfig,
       syncAppTypes: true  // 开发阶段手动开启
     })
  → 检查 syncAppTypes === true
  → 过滤内置类型，得到业务类型列表
  → onAppInit 后调用 syncAppTypesConfig(dataSource, businessAppTypes)
  → 数据库检查 typeCode 是否存在
  → 不存在：事务内创建 AppType + 创建 Role
  → 已存在：检查并补充缺失角色
```

### 4.4 文件结构

```
packages/base-backend/src/
├── modules/sys/app-type/
│   ├── app-type-sync.ts        ← 新建：同步逻辑
│   ├── app-type.service.ts
│   ├── app-type.module.ts
│   └── ...
├── create-base-backend-app.ts  ← 修改：调用同步函数（根据配置）
├── types/app-config.types.ts   ← 修改：添加 syncAppTypes 配置项
├── index.ts                    ← 修改：导出同步函数（可选）
└── utils/
    └── app-type-validator.ts   ← 已有：内置类型定义
```

---

## 五、核心实现

### 5.1 types/app-config.types.ts 修改

添加 `syncAppTypes` 配置项：

```typescript
/** 创建后端应用选项 */
export interface CreateBaseBackendAppOptions {
  name?: string;
  database?: DatabaseConfig;
  redis?: RedisConfig;
  jwt?: JwtConfig;
  cors?: CorsOptions | boolean;
  security?: SecurityConfig;
  logger?: LoggerConfig;
  appTypes?: AppTypeConfig[];
  
  /** 是否在启动时同步应用类型配置到数据库，默认 false */
  syncAppTypes?: boolean;
  
  userAttributes?: UserAttributeConfig[];
  memberAttributes?: MemberAttributeConfig[];
  permissions?: PermissionConfig[];
  permissionValues?: string[];
  seeds?: SeedConfig[];
  modules?: Type<any>[];
  providers?: Provider[];
  middlewares?: Array<NestMiddleware>;
  exceptionFilters?: Array<Type<ExceptionFilter>>;
  interceptors?: Array<Type<NestInterceptor>>;
  migrations?: MigrationConfig;
  swagger?: SwaggerGroupConfig[];
  hooks?: HookConfig;
  auditLog?: AuditLogConfig;
}
```

### 5.2 app-type-sync.ts

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

### 5.3 create-base-backend-app.ts 修改

在 `onAppInit` 钩子执行后，根据配置决定是否同步：

```typescript
await hooksExecutor.onAppInit();

// 根据配置决定是否同步应用类型
if (options.syncAppTypes && allAppTypes.length > 0) {
  const { syncAppTypesConfig } = await import('./modules/sys/app-type/app-type-sync');
  await syncAppTypesConfig(dataSource, allAppTypes);
}
```

### 5.4 业务层使用示例

```typescript
// backend/src/main.ts
import { createBaseBackendApp } from 'moyan-base-backend';
import { appTypesConfig } from './app-types.config';
import { AppModule } from './app.modules';

async function bootstrap() {
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

  await app.listen(3000);
}

bootstrap();
```

### 5.5 index.ts 导出（可选）

```typescript
export { syncAppTypesConfig } from './modules/sys/app-type/app-type-sync';
```

---

## 六、边界条件验证

### 6.1 syncAppTypes=false（默认）

- 不执行任何同步逻辑
- 应用类型完全由 `/install` 接口或手动管理
- 结果：启动更快，无额外开销

### 6.2 首次启动 + syncAppTypes=true

- `/install` 接口创建 system 类型 + super_admin 角色
- 启动同步创建 supplier 类型 + supplier_admin/supplier_member 角色
- 结果：两种类型共存，互不影响

### 6.3 已有系统新增应用类型 + syncAppTypes=true

- 数据库已有 system、supplier 类型
- 配置新增 customer 类型
- 启动同步只创建 customer 类型
- 结果：已有类型不受影响

### 6.4 配置修改已有类型 + syncAppTypes=true

- 数据库已有 supplier 类型（用户可能已修改 typeName）
- 配置中 supplier 类型有更新
- 启动同步检测到已存在，跳过类型创建，但检查角色
- 结果：用户修改被保护，缺失角色被补充

### 6.5 内置角色缺失 + syncAppTypes=true

- 数据库已有 supplier 类型，但缺少 supplier_member 角色
- 配置中有 supplier_admin、supplier_member
- 启动同步跳过 supplier 类型，补充 supplier_member 角色
- 结果：缺失角色被补充

### 6.6 并发竞争（多实例启动）+ syncAppTypes=true

- 两个实例同时启动，检测到 supplier 不存在
- 两个实例同时尝试创建
- 一个成功，另一个触发唯一约束错误
- 错误被捕获，视为"已存在"，继续检查角色
- 结果：只有一个 supplier 类型被创建，角色正确同步

---

## 七、测试场景

| 场景 | 预期结果 |
|------|----------|
| syncAppTypes=false（默认） | 不执行同步 |
| syncAppTypes=true + 首次启动 | system 由 /install 创建，supplier 由同步创建 |
| syncAppTypes=true + 已有系统新增配置 | 只创建新类型，已有类型不受影响 |
| syncAppTypes=true + 配置修改已有类型 | 跳过类型，补充缺失角色 |
| syncAppTypes=true + 角色缺失 | 补充缺失角色 |
| syncAppTypes=true + 空配置 | 不执行同步 |
| syncAppTypes=true + 只有内置类型配置 | 不执行同步（过滤后为空） |
| syncAppTypes=true + 多实例并发启动 | 只创建一个类型，角色正确同步 |

---

## 八、使用建议

### 8.1 开发阶段

```typescript
createBaseBackendApp({
  appTypes: appTypesConfig,
  syncAppTypes: true,  // 开启同步，自动创建新应用类型
});
```

### 8.2 生产环境（系统定型后）

```typescript
createBaseBackendApp({
  appTypes: appTypesConfig,
  syncAppTypes: false,  // 或不配置（默认 false），减少启动开销
});
```

---

## 九、回滚方案

如果需要移除自动同步功能：

1. 删除 `app-type-sync.ts`
2. 移除 `create-base-backend-app.ts` 中的同步调用
3. 移除 `types/app-config.types.ts` 中的 `syncAppTypes` 配置项
4. 移除 `index.ts` 中的导出

不影响现有 `/install` 接口功能。