# 配置管理扩展模块设计文档

> 日期：2026-06-03

## 1. 概述

配置管理扩展模块（`extension-config`）是一个纯组件库模式的扩展包，提供通用配置管理后端 API 和前端的 `MfwConfigFormCard` 组件。业务层自行构建管理页面，按 `groupKey` 分组使用。

### 核心特性

- 配置按分组（`groupKey`）管理，每个 `MfwConfigFormCard` 实例对应一个分组
- 配置类型：公共（无需认证可访问）/ 私有（需管理员权限）
- 租户隔离：`appId` 可为 `null`（全局配置）或非 `null`（租户私有配置）
- 缓存支持：基于框架 `CacheModule`（Redis/Memory 自动适配）
- 前端仅导出组件，不暴露具体页面

### 方案选择

选择了 **方案 B：纯组件库模式**。扩展包不提供管理页面，业务层自行引入组件并构建页面。

---

## 2. 扩展包结构

```
packages/extensions/extension-config/
├── src/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   │   └── config.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── config.dto.ts
│   │   │   │   └── res/
│   │   │   │       └── config-response.dto.ts
│   │   │   ├── service/
│   │   │   │   └── config.service.ts
│   │   │   ├── controller/
│   │   │   │   ├── config.controller.ts
│   │   │   │   └── config-pub.controller.ts
│   │   │   ├── api-response.ts
│   │   │   └── config.module.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── config-form-card/
│   │   │   │       ├── types.ts
│   │   │   │       ├── index.tsx
│   │   │   │       └── mod.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/
│       ├── src/
│       │   ├── constants.ts
│       │   ├── permission-values.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── database/migrations/
└── package.json
```

> **注意**：不包含 `apis/` 目录，前端通过 `moyan-api` 工具自动生成 API 调用代码。

---

## 3. 数据库设计

### 3.1 实体：ConfigEntity

表名：`mfw_config`

| 字段          | 类型         | 约束                    | 说明                           |
|--------------|-------------|------------------------|-------------------------------|
| id           | bigint      | PK, AUTO_INCREMENT     | 主键                          |
| app_id       | bigint      | NULLABLE, INDEX        | NULL=全局，非NULL=租户隔离       |
| group_key    | varchar(64) | NOT NULL, INDEX        | 分组标识（如 "mail"）          |
| config_key   | varchar(128)| NOT NULL               | 配置项标识（如 "host"）        |
| config_value | json        | NOT NULL               | 配置值 `{data: any}`           |
| config_type  | tinyint     | NOT NULL, DEFAULT 0    | 0=公共 1=私有                  |
| description  | varchar(256)| NULLABLE               | 描述                          |
| createdAt    | datetime    | 继承 Base              | 创建时间                      |
| updateAt     | datetime    | 继承 Base              | 更新时间                      |
| deleteAt     | datetime    | 继承 Base, 软删除       | 删除时间                      |

唯一索引：`uk_app_group_config(app_id, group_key, config_key, delete_at)`

> **重要**：唯一索引包含 `delete_at` 字段，避免软删除后重新创建同 key 配置时触发唯一约束冲突。

TypeORM Entity 定义：
```typescript
@Entity('mfw_config')
@Index('idx_app_group', ['appId', 'groupKey'])
@Index('uk_app_group_config', ['appId', 'groupKey', 'configKey', 'deleteAt'], { unique: true })
export class Config extends Base {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: true })
  appId: number | null;

  @Column({ name: 'group_key', length: 64 })
  groupKey: string;

  @Column({ name: 'config_key', length: 128 })
  configKey: string;

  @Column({ name: 'config_value', type: 'json' })
  configValue: { data: any };

  @Column({ name: 'config_type', type: 'tinyint', default: 0 })
  configType: ConfigType;

  @Column({ length: 256, nullable: true })
  description: string;
}
```

---

## 4. 后端设计

### 4.1 常量定义（shared 层）

```typescript
// shared/src/constants.ts
export enum ConfigType {
  PUBLIC = 0,
  PRIVATE = 1,
}
```

### 4.2 权限定义（shared 层）

使用项目位运算权限模型，与 extension-ad 一致：

```typescript
// shared/src/permission-values.ts
export const CONFIG_PERMISSION_VALUES: readonly string[] = ['查看', '编辑', '删除'];
```

Controller 中使用方式：
```typescript
@RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['查看'] })
@RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['编辑'] })
@RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['删除'] })
```

### 4.3 DTO 定义

```typescript
// shared/src/constants.ts
import { ConfigType } from './constants';

// dto/config.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigType } from '../shared';

export class ConfigValueDto {
  @IsObject()
  data: any;
}

export class CreateConfigDto {
  @IsOptional()
  @IsNumber()
  appId: number | null;

  @IsString()
  groupKey: string;

  @IsString()
  configKey: string;

  @ValidateNested()
  @Type(() => ConfigValueDto)
  configValue: { data: any };

  @IsEnum(ConfigType)
  configType: ConfigType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class BatchUpdateConfigDto {
  @IsString()
  groupKey: string;

  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItemDto)
  items: BatchUpdateItemDto[];
}

export class BatchUpdateItemDto {
  @IsString()
  configKey: string;

  @ValidateNested()
  @Type(() => ConfigValueDto)
  configValue: { data: any };

  @IsOptional()
  @IsString()
  description?: string;

  // 注意：不包含 configType 字段，防止篡改
}
```

```typescript
// dto/res/config-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ConfigType } from '../../shared';

export class ConfigResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true })
  appId: number | null;

  @ApiProperty()
  groupKey: string;

  @ApiProperty()
  configKey: string;

  @ApiProperty()
  configValue: { data: any };

  @ApiProperty({ enum: ConfigType })
  configType: ConfigType;

  @ApiProperty({ nullable: true })
  description: string | null;
}
```

### 4.4 Service 层

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';
import { Cacheable, CacheEvict } from 'moyan-mfw-base/backend';
import { Config } from '../entities/config.entity';
import { BatchUpdateConfigDto, CreateConfigDto } from '../dto';
import { ConfigType } from '../../shared';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private readonly repo: Repository<Config>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cacheable({ key: 'config:{appId}:{groupKey}', ttl: 3600 })
  async getByGroup(appId: number | null, groupKey: string): Promise<Config[]> {
    return this.repo.find({ where: { appId, groupKey } });
  }

  @Cacheable({ key: 'config:pub:{groupKey}', ttl: 3600 })
  async getPublicByGroup(groupKey: string): Promise<Config[]> {
    return this.repo.find({ where: { groupKey, configType: ConfigType.PUBLIC } });
  }

  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async batchUpdate(appId: number | null, groupKey: string, dto: BatchUpdateConfigDto): Promise<void> {
    // 使用 dataSource.transaction 确保原子性（反模式：禁止 createQueryRunner）
    await this.dataSource.transaction(async (manager) => {
      // 先查询已有配置的类型，防止 configType 被篡改
      const existingConfigs = await manager.find(Config, {
        where: { appId, groupKey },
        select: ['id', 'configKey', 'configType'],
      });
      const existingMap = new Map(existingConfigs.map(c => [c.configKey, c]));

      for (const item of dto.items) {
        const existing = existingMap.get(item.configKey);
        if (existing) {
          // 已有配置：更新 value 和 description，保持原有 configType
          await manager.update(Config, { id: existing.id }, {
            configValue: item.configValue,
            description: item.description ?? null,
          });
        } else {
          // 新配置：默认使用 PUBLIC 类型
          await manager.insert(Config, {
            appId,
            groupKey,
            configKey: item.configKey,
            configValue: item.configValue,
            configType: ConfigType.PUBLIC,
            description: item.description ?? null,
          });
        }
      }
    });
  }

  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async delete(appId: number | null, groupKey: string, id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
```

**缓存说明**：
- 使用框架 `@Cacheable` 装饰器自动读缓存
- 使用框架 `@CacheEvict` 装饰器自动清除缓存
- 缓存驱动自动适配：Redis（有 Redis 时）或 Memory（无 Redis 时）
- TTL 默认 3600 秒
- `groupKey` 作为 Service 方法独立参数传入，确保 `@CacheEvict` 能正确解析 `{groupKey}` 占位符

### 4.5 Controller 层

```typescript
// config.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { Config } from './entities/config.entity';
import { ConfigController } from './controller/config.controller';
import { ConfigPubController } from './controller/config-pub.controller';
import { ConfigService } from './service/config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Config]),
    RouterModule.register([{ path: 'ext/config', module: ConfigModule }]),
  ],
  controllers: [ConfigController, ConfigPubController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

> 使用 `RouterModule` 注册 `/ext/config` 前缀，Controller 只声明相对路径，与 extension-ad 一致。

**管理接口** `@Controller('')`（需 JWT + 权限 + Swagger 装饰器）

| 方法   | 路径                        | 说明                | 权限              |
|--------|----------------------------|--------------------|-------------------|
| GET    | `/group/:groupKey`         | 按分组获取全部配置   | `@RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['查看'] })` |
| PUT    | `/batch`                   | 批量更新配置         | `@RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['编辑'] })` |
| DELETE | `/:id`                     | 删除配置             | `@RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['删除'] })` |

> 管理接口的请求体中包含 `appId` 字段，由前端传入。删除接口返回 `{ hintSuccess: true }`。

**公开接口** `@Controller('pub')`（`@Public()` 装饰器）

| 方法   | 路径                | 说明                          |
|--------|--------------------|-------------------------------|
| GET    | `/:groupKey`       | 仅返回公共配置（configType=0） |

> `@Public()` 来自 `moyan-mfw-base/backend`。

---

## 5. 前端设计

### 5.1 类型定义

```typescript
// components/config-form-card/types.ts

import type { FormItemConfig, FormGroupConfig } from 'moyan-mfw-base/frontend';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

export interface ConfigFormItemConfig extends FormItemConfig {
  /** 配置类型 */
  configType?: ConfigType;
  /** 配置描述 */
  description?: string;
}

export interface MfwConfigFormCardProps {
  /** 应用 ID（null=全局，非null=租户配置） */
  appId: number | null;
  /** 配置分组标识 */
  groupKey: string;
  /** 表单项配置 */
  items: ConfigFormItemConfig[];
  /** 分组 UI 配置（直接使用 MfwFormCard 的 FormGroupConfig） */
  formGroup?: FormGroupConfig;
  /** 私有配置标签页标题 */
  privateTabTitle?: string;
  /** 公共配置标签页标题 */
  publicTabTitle?: string;
}

export interface MfwConfigFormCardExpose {
  /** 确认提交（内部调用 validate + API 批量更新） */
  onConfirm: () => Promise<void>;
  /** 重置表单（重新拉取后端数据） */
  reset: () => Promise<void>;
}
```

> **注意**：`ConfigType` 直接引用 shared 层的数值枚举，前后端类型一致。

### 5.2 组件行为

1. **挂载**：自动调用管理接口获取配置数据，填充到 `formData`，显示 loading 状态
2. **分类**：按 `configType` 将 `items` 分为「公共」和「私有」两个 Tab
3. **提交**：`onConfirm()` 内部先调用 `MfwFormCard.validate()`，验证通过后调用批量更新 API
4. **重置**：重新拉取后端数据覆盖本地 formData
5. **错误处理**：API 调用失败时显示 `ElMessage.error`，不阻断用户操作

### 5.3 组件渲染结构

```
<el-tabs>（当 items 同时包含公共和私有配置时）
  ├── <el-tab-pane label="公开配置">
  │     └── <MfwFormCard :template="publicItems" :form-data="publicFormData" :form-group="..." />
  └── <el-tab-pane label="敏感配置">
        └── <MfwFormCard :template="privateItems" :form-data="privateFormData" :form-group="..." />

<el-form>（当 items 仅有一种类型时，不渲染 Tabs）
  └── <MfwFormCard :template="items" :form-data="formData" :form-group="..." />
```

### 5.4 导出策略

```typescript
// frontend/src/index.ts
export { default as MfwConfigFormCard } from './components/config-form-card';
export type * from './components/config-form-card/types';
```

> 不注册任何路由（无 `views/` 目录），不手动编写 `apis/` 目录。业务层通过 `moyan-api` 生成 API 后自行调用。组件内部使用 axios 直接调用后端接口。

### 5.5 业务层使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MfwConfigFormCard, ConfigType } from 'moyan-mfw-extension-config/frontend';
import type { MfwConfigFormCardExpose } from 'moyan-mfw-extension-config/frontend';

const formRef = ref<MfwConfigFormCardExpose>();
const appId = ref<number | null>(null); // null=全局

const items = [
  { key: 'host', label: 'SMTP 服务器', component: 'el-input', configType: ConfigType.PUBLIC },
  { key: 'password', label: '密码', component: 'el-input', configType: ConfigType.PRIVATE, elProps: { type: 'password' } },
];
</script>

<template>
  <MfwConfigFormCard ref="formRef" :app-id="appId" group-key="mail" :items="items" />
  <el-button @click="formRef?.onConfirm()">保存</el-button>
</template>
```

---

## 6. 数据库迁移

```sql
CREATE TABLE `mfw_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app_id` bigint DEFAULT NULL,
  `group_key` varchar(64) NOT NULL,
  `config_key` varchar(128) NOT NULL,
  `config_value` json NOT NULL,
  `config_type` tinyint NOT NULL DEFAULT '0',
  `description` varchar(256) DEFAULT NULL,
  `create_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `delete_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_app_group_config` (`app_id`, `group_key`, `config_key`, `delete_at`),
  KEY `idx_app_group` (`app_id`, `group_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> 注意：`create_at/update_at/delete_at` 在 TypeORM Entity 中由 `Base` 基类的 `createdAt/updateAt/deleteAt` 映射。

---

## 7. 注意事项与边界

1. **appId 由前端传入**：前端通过 props 传入 `appId`（`null`=全局，具体值=租户），后端不自动推断。管理员可管理全局配置和应用配置，应用管理员仅管理自身配置，权限由业务层控制
2. **事务包裹**：`batchUpdate` 使用 `dataSource.transaction(callback)` 确保原子性，部分失败时全部回滚
3. **configType 防篡改**：批量更新时不允许修改已有配置的 `configType`，新配置默认使用 `PUBLIC` 类型
4. **软删除唯一索引**：唯一索引包含 `delete_at` 字段，避免软删除后重建冲突
5. **公开接口安全**：`@Public()` 装饰器绕过 JWT 认证，但仅返回 `configType = 0` 的数据
6. **缓存一致性**：写入/删除后立即 `@CacheEvict`，`groupKey` 作为方法参数确保缓存 key 正确解析
7. **反模式规避**：
   - 不使用 `emit('confirm')`，使用 `defineExpose({ onConfirm })`
   - 不使用 `createQueryRunner`，使用 `dataSource.transaction(callback)`
   - 不使用 `@Request() req`，使用 `@User() user: UserDto`
   - 删除 API 返回 `{ hintSuccess: true }`
8. **组件命名**：使用 `MfwConfigFormCard` 前缀，符合 ESLint 规范要求
