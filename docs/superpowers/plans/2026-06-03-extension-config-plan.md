# 配置管理扩展模块实现规划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 `extension-config` 扩展包，提供配置管理后端 API（含缓存）和前端的 `MfwConfigFormCard` 组件

**Architecture:** 纯组件库模式，后端提供 CRUD + 缓存接口，前端封装 MfwFormCard 组件。扩展包不暴露管理页面，业务层自行构建

**Tech Stack:** NestJS + TypeORM + MySQL + CacheModule (Redis/Memory), Vue 3 + Element Plus + TSX

---

## 文件结构总览

```
packages/extensions/extension-config/
├── src/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   │   └── config.entity.ts              [新建]
│   │   │   ├── dto/
│   │   │   │   ├── index.ts                       [新建]
│   │   │   │   ├── config.dto.ts                  [新建]
│   │   │   │   └── res/
│   │   │   │       └── config-response.dto.ts     [新建]
│   │   │   ├── service/
│   │   │   │   └── config.service.ts              [新建]
│   │   │   ├── controller/
│   │   │   │   ├── config.controller.ts           [新建]
│   │   │   │   └── config-pub.controller.ts       [新建]
│   │   │   ├── api-response.ts                    [新建]
│   │   │   ├── index.ts                           [新建]
│   │   │   └── config.module.ts                   [新建]
│   │   ├── package.json                           [新建]
│   │   └── tsconfig.json                          [新建]
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── config-form-card/
│   │   │   │       ├── types.ts                   [新建]
│   │   │   │       ├── index.tsx                  [新建]
│   │   │   │       └── mod.ts                     [新建]
│   │   │   └── index.ts                           [新建]
│   │   ├── package.json                           [新建]
│   │   └── tsconfig.json                          [新建]
│   └── shared/
│       ├── src/
│       │   ├── constants.ts                       [新建]
│       │   ├── permission-values.ts               [新建]
│       │   └── index.ts                           [新建]
│       ├── package.json                           [新建]
│       └── tsconfig.json                          [新建]
├── database/
│   └── migrations/
│       └── 20260603000000-config.ts              [新建]
├── package.json                                   [新建]
└── tsconfig.json                                  [新建]
```

---

### Task 1: Shared 层 — 常量与权限定义

**Files:**
- Create: `packages/extensions/extension-config/src/shared/src/constants.ts`
- Create: `packages/extensions/extension-config/src/shared/src/permission-values.ts`
- Create: `packages/extensions/extension-config/src/shared/src/index.ts`
- Create: `packages/extensions/extension-config/src/shared/package.json`
- Create: `packages/extensions/extension-config/src/shared/tsconfig.json`

- [ ] **Step 1: 创建 constants.ts**

```typescript
/**
 * @fileoverview 配置管理共享常量
 */

/**
 * 配置类型枚举
 * @description 0=公共（无需认证可访问），1=私有（需管理员权限）
 */
export enum ConfigType {
  PUBLIC = 0,
  PRIVATE = 1,
}
```

- [ ] **Step 2: 创建 permission-values.ts**

```typescript
/**
 * @fileoverview 配置管理扩展包权限定义
 * @description 声明本扩展包使用的权限标签，供业务层统一收集注入
 *
 * 使用方式：
 *   业务层 backend/src/main.ts 中：
 *   import { CONFIG_PERMISSION_VALUES } from 'moyan-mfw-extension-config/shared'
 *   createBaseBackendApp({ permissionValues: [...CONFIG_PERMISSION_VALUES] })
 *
 * 注意：'查看'、'编辑'、'删除' 已在框架 DEFAULT_PERMISSION_VALUES 中，
 * 无需重复声明。待业务需要时追加扩展包独有的标签。
 */

export const CONFIG_PERMISSION_VALUES: readonly string[] = [
  // '查看'、'编辑'、'删除' 已在框架 DEFAULT_PERMISSION_VALUES 中
  // 待业务需要时追加扩展包独有的标签
] as const;

export type ConfigExtensionPermissionName = (typeof CONFIG_PERMISSION_VALUES)[number];
```

- [ ] **Step 3: 创建 shared/src/index.ts**

```typescript
/**
 * @fileoverview 配置管理共享模块入口
 */

export * from './constants';
export * from './permission-values';
```

- [ ] **Step 4: 创建 shared/package.json**

```json
{
  "name": "@internal/config-shared",
  "private": true,
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@internal/base-shared": "workspace:*",
    "moyan-mfw-base": "workspace:*"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 5: 创建 shared/tsconfig.json**

```json
{
  "extends": "../../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 6: Commit**

```bash
cd packages/extensions/extension-config
git add src/shared/
git commit -m "feat(config): add shared layer (ConfigType enum, permission values)"
```

---

### Task 2: Backend 层 — 实体与 DTO

**Files:**
- Create: `packages/extensions/extension-config/src/backend/src/entities/config.entity.ts`
- Create: `packages/extensions/extension-config/src/backend/src/dto/index.ts`
- Create: `packages/extensions/extension-config/src/backend/src/dto/config.dto.ts`
- Create: `packages/extensions/extension-config/src/backend/src/dto/res/config-response.dto.ts`
- Create: `packages/extensions/extension-config/src/backend/package.json`
- Create: `packages/extensions/extension-config/src/backend/tsconfig.json`

- [ ] **Step 1: 创建 config.entity.ts**

```typescript
/**
 * @fileoverview 配置管理实体
 * @description 存储应用配置数据，支持公共/私有分类和租户隔离
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';
import { ConfigType } from '../../../shared';

@Entity('mfw_config')
@Index('idx_app_group', ['appId', 'groupKey'])
@Index('uk_app_group_config', ['appId', 'groupKey', 'configKey', 'deleteAt'], { unique: true })
export class Config extends Base {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true, comment: '应用 ID，NULL 表示全局配置' })
  appId: number | null;

  @Column({ name: 'group_key', length: 64, comment: '配置分组标识' })
  groupKey: string;

  @Column({ name: 'config_key', length: 128, comment: '配置项标识' })
  configKey: string;

  @Column({ name: 'config_value', type: 'json', comment: '配置值 {data: any}' })
  configValue: { data: any };

  @Column({
    name: 'config_type',
    type: 'tinyint',
    default: ConfigType.PUBLIC,
    comment: '配置类型：0=公共 1=私有',
  })
  configType: ConfigType;

  @Column({ length: 256, nullable: true, comment: '配置描述' })
  description: string;
}
```

- [ ] **Step 2: 创建 config.dto.ts**

```typescript
/**
 * @fileoverview 配置管理 DTO 定义
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, IsNumber, IsEnum, IsObject,
  ValidateNested, IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigType } from '../../../../shared';

export class ConfigValueDto {
  @ApiProperty({ description: '配置数据' })
  @IsObject()
  data: any;
}

export class CreateConfigDto {
  @ApiPropertyOptional({ description: '应用 ID，NULL 表示全局配置' })
  @IsOptional()
  @IsNumber()
  appId: number | null;

  @ApiProperty({ description: '配置分组标识' })
  @IsNotEmpty({ message: '分组标识不能为空' })
  @IsString()
  groupKey: string;

  @ApiProperty({ description: '配置项标识' })
  @IsNotEmpty({ message: '配置项标识不能为空' })
  @IsString()
  configKey: string;

  @ApiProperty({ description: '配置值' })
  @ValidateNested()
  @Type(() => ConfigValueDto)
  configValue: { data: any };

  @ApiProperty({ description: '配置类型', enum: ConfigType })
  @IsEnum(ConfigType)
  configType: ConfigType;

  @ApiPropertyOptional({ description: '配置描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BatchUpdateConfigDto {
  @ApiProperty({ description: '配置分组标识' })
  @IsNotEmpty({ message: '分组标识不能为空' })
  @IsString()
  groupKey: string;

  @ApiPropertyOptional({ description: '应用 ID，NULL 表示全局配置' })
  @IsOptional()
  @IsNumber()
  appId: number | null;

  @ApiProperty({ description: '配置项列表', type: [BatchUpdateItemDto] })
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItemDto)
  items: BatchUpdateItemDto[];
}

export class BatchUpdateItemDto {
  @ApiProperty({ description: '配置项标识' })
  @IsNotEmpty({ message: '配置项标识不能为空' })
  @IsString()
  configKey: string;

  @ApiProperty({ description: '配置值' })
  @ValidateNested()
  @Type(() => ConfigValueDto)
  configValue: { data: any };

  @ApiPropertyOptional({ description: '配置描述' })
  @IsOptional()
  @IsString()
  description?: string;

  // 注意：不包含 configType 字段，防止类型被篡改
}
```

- [ ] **Step 3: 创建 config-response.dto.ts**

```typescript
/**
 * @fileoverview 配置管理响应 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigType } from '../../../../../shared';

export class ConfigResponseDto {
  @ApiProperty({ description: '配置 ID' })
  id: number;

  @ApiPropertyOptional({ description: '应用 ID', nullable: true })
  appId: number | null;

  @ApiProperty({ description: '配置分组标识' })
  groupKey: string;

  @ApiProperty({ description: '配置项标识' })
  configKey: string;

  @ApiProperty({ description: '配置值' })
  configValue: { data: any };

  @ApiProperty({ description: '配置类型', enum: ConfigType })
  configType: ConfigType;

  @ApiPropertyOptional({ description: '配置描述', nullable: true })
  description: string | null;
}
```

- [ ] **Step 4: 创建 dto/index.ts**

```typescript
/**
 * @fileoverview DTO 统一导出
 */

export * from './config.dto';
export * from './res/config-response.dto';
```

- [ ] **Step 5: 创建 backend/package.json**

```json
{
  "name": "@internal/config-backend",
  "private": true,
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json && tsc-alias",
    "dev": "nest start --watch",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@internal/base-shared": "workspace:*",
    "@internal/config-shared": "workspace:*",
    "moyan-mfw-base": "workspace:*",
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "@nestjs/typeorm": "catalog:",
    "@nestjs/swagger": "catalog:",
    "typeorm": "catalog:",
    "class-transformer": "catalog:",
    "class-validator": "catalog:",
    "reflect-metadata": "catalog:",
    "rxjs": "catalog:"
  },
  "devDependencies": {
    "@nestjs/cli": "catalog:",
    "@nestjs/schematics": "catalog:",
    "tsc-alias": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 6: 创建 backend/tsconfig.json**

```json
{
  "extends": "../../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "strictPropertyInitialization": false,
    "noImplicitAny": false,
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 7: Commit**

```bash
git add src/backend/src/entities/ src/backend/src/dto/ src/backend/package.json src/backend/tsconfig.json
git commit -m "feat(config): add backend entity and DTOs"
```

---

### Task 3: Backend 层 — Service

**Files:**
- Create: `packages/extensions/extension-config/src/backend/src/service/config.service.ts`

- [ ] **Step 1: 创建 config.service.ts**

```typescript
/**
 * @fileoverview 配置管理服务
 * @description 提供配置的 CRUD 操作，支持缓存和事务
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';
import { Cacheable, CacheEvict } from 'moyan-mfw-base/backend';
import { Config } from '../entities/config.entity';
import { BatchUpdateConfigDto, CreateConfigDto } from '../dto';
import { ConfigType } from '../../../shared';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private readonly repo: Repository<Config>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 按分组获取所有配置
   */
  @Cacheable({ key: 'config:{appId}:{groupKey}', ttl: 3600 })
  async getByGroup(appId: number | null, groupKey: string): Promise<Config[]> {
    return this.repo.find({ where: { appId, groupKey } });
  }

  /**
   * 获取公共配置（无需 appId）
   */
  @Cacheable({ key: 'config:pub:{groupKey}', ttl: 3600 })
  async getPublicByGroup(groupKey: string): Promise<Config[]> {
    return this.repo.find({ where: { groupKey, configType: ConfigType.PUBLIC } });
  }

  /**
   * 批量更新分组下的配置（upsert 逻辑）
   */
  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async batchUpdate(appId: number | null, groupKey: string, dto: BatchUpdateConfigDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // 查询已有配置的类型，防止 configType 被篡改
      const existingConfigs = await manager.find(Config, {
        where: { appId, groupKey },
        select: ['id', 'configKey', 'configType'],
      });
      const existingMap = new Map(existingConfigs.map((c) => [c.configKey, c]));

      for (const item of dto.items) {
        const existing = existingMap.get(item.configKey);
        if (existing) {
          // 已有配置：仅更新 value 和 description，保持原有 configType
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

  /**
   * 删除单个配置（软删除）
   */
  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async delete(appId: number | null, groupKey: string, id: number): Promise<void> {
    const config = await this.repo.findOne({ where: { id, appId, groupKey } });
    if (!config) {
      return;
    }
    await this.repo.softDelete(id);
  }

  /**
   * 创建单个配置
   */
  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async create(appId: number | null, groupKey: string, dto: CreateConfigDto): Promise<Config> {
    const entity = this.repo.create({ ...dto, appId, groupKey });
    return this.repo.save(entity);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/backend/src/service/
git commit -m "feat(config): add ConfigService with cache and transaction support"
```

---

### Task 4: Backend 层 — Controller

**Files:**
- Create: `packages/extensions/extension-config/src/backend/src/api-response.ts`
- Create: `packages/extensions/extension-config/src/backend/src/controller/config.controller.ts`
- Create: `packages/extensions/extension-config/src/backend/src/controller/config-pub.controller.ts`

- [ ] **Step 1: 创建 api-response.ts**

```typescript
/**
 * @fileoverview API 响应工具包装
 * @description base-backend 的 ApiResponseUtil 被声明为 export type，通过 require 获取运行时值
 */
const bb = require('moyan-mfw-base/backend');
export const ApiResponseUtil = bb.ApiResponseUtil as {
  success: (data: unknown, message: string) => { code: number; data: unknown; message: string };
  error: (message: string, code?: number) => { code: number; message: string };
};
```

- [ ] **Step 2: 创建 config.controller.ts（管理接口）**

```typescript
/**
 * @fileoverview 配置管理控制器
 * @description 处理配置管理的 HTTP 请求，需要 JWT 认证和权限校验
 */

import {
  Controller, Get, Put, Delete,
  Body, Param, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RequirePermission } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../api-response';
import { ConfigService } from '../service/config.service';
import { BatchUpdateConfigDto, ConfigResponseDto } from '../dto';

@ApiTags('ext-config', '配置管理相关接口')
@ApiBearerAuth('Authorization')
@Controller('')
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @Get('group/:groupKey')
  @ApiOperation({ summary: '按分组获取配置', description: '获取指定分组下的所有配置' })
  @ApiParam({ name: 'groupKey', description: '分组标识' })
  @ApiResponse({ status: 200, description: '获取成功', type: [ConfigResponseDto] })
  @RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['查看'] })
  async getByGroup(
    @Query('appId') appId: string | undefined,
    @Param('groupKey') groupKey: string,
  ) {
    const appIdNum = appId !== undefined && appId !== 'null' ? Number(appId) : null;
    const result = await this.service.getByGroup(appIdNum, groupKey);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Put('batch')
  @ApiOperation({ summary: '批量更新配置', description: '批量更新指定分组下的配置（upsert 逻辑）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['编辑'] })
  async batchUpdate(@Body() dto: BatchUpdateConfigDto) {
    const appIdNum = dto.appId !== undefined && dto.appId !== null ? dto.appId : null;
    await this.service.batchUpdate(appIdNum, dto.groupKey, dto);
    return ApiResponseUtil.success(null, '更新成功');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除配置' })
  @ApiParam({ name: 'id', description: '配置 ID' })
  @RequirePermission({ permCode: '*:ext:config:*', permissionValue: ['删除'] })
  async delete(
    @Query('appId') appId: string | undefined,
    @Query('groupKey') groupKey: string,
    @Param('id') id: string,
  ) {
    const appIdNum = appId !== undefined && appId !== 'null' ? Number(appId) : null;
    await this.service.delete(appIdNum, groupKey, Number(id));
    return ApiResponseUtil.success(null, '删除成功');
  }
}
```

> **注意**：`hintSuccess: true` 是前端 API 调用选项，后端 Controller 不需要也不应在响应体中包含此字段。前端使用 moyan-api 生成的客户端时，通过 `{ hintSuccess: true }` 选项传入。

- [ ] **Step 3: 创建 config-pub.controller.ts（公开接口）**

```typescript
/**
 * @fileoverview 配置公开接口控制器
 * @description 无需认证即可访问的公开配置接口
 */

import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../api-response';
import { ConfigService } from '../service/config.service';
import { ConfigResponseDto } from '../dto';

@ApiTags('ext-config-pub', '配置公开接口')
@Controller('pub')
export class ConfigPubController {
  constructor(private readonly service: ConfigService) {}

  @Get(':groupKey')
  @Public()
  @ApiOperation({ summary: '获取公开配置', description: '无需认证，仅返回公共配置（configType=0）' })
  @ApiParam({ name: 'groupKey', description: '分组标识' })
  @ApiResponse({ status: 200, description: '获取成功', type: [ConfigResponseDto] })
  async getPublicByGroup(@Param('groupKey') groupKey: string) {
    const result = await this.service.getPublicByGroup(groupKey);
    return ApiResponseUtil.success(result, '查询成功');
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/backend/src/api-response.ts src/backend/src/controller/
git commit -m "feat(config): add management and public controllers"
```

---

### Task 5: Backend 层 — 模块与入口

**Files:**
- Create: `packages/extensions/extension-config/src/backend/src/config.module.ts`
- Create: `packages/extensions/extension-config/src/backend/src/index.ts`

- [ ] **Step 1: 创建 config.module.ts**

```typescript
/**
 * @fileoverview 配置管理模块
 * @description 注册路由前缀、实体和控制器
 */

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

- [ ] **Step 2: 创建 backend/src/index.ts**

```typescript
/**
 * @fileoverview 配置管理后端入口
 */

export * from './config.module';
export * from './service/config.service';
export * from './dto';
export * from './entities/config.entity';

// 导出权限定义，供业务层收集
export { CONFIG_PERMISSION_VALUES } from '../../shared';
```

- [ ] **Step 3: Commit**

```bash
git add src/backend/src/config.module.ts src/backend/src/index.ts
git commit -m "feat(config): add ConfigModule and backend entry point"
```

---

### Task 6: Frontend 层 — 类型与组件

**Files:**
- Create: `packages/extensions/extension-config/src/frontend/src/components/config-form-card/types.ts`
- Create: `packages/extensions/extension-config/src/frontend/src/components/config-form-card/index.tsx`
- Create: `packages/extensions/extension-config/src/frontend/src/components/config-form-card/mod.ts`
- Create: `packages/extensions/extension-config/src/frontend/src/index.ts`
- Create: `packages/extensions/extension-config/src/frontend/package.json`
- Create: `packages/extensions/extension-config/src/frontend/tsconfig.json`

- [ ] **Step 1: 创建 types.ts**

```typescript
/**
 * @fileoverview MfwConfigFormCard 类型定义
 */

import type { FormItemConfig, FormGroupConfig } from 'moyan-mfw-base/frontend';
import { ConfigType } from '../../../../shared/src/constants';

/** 配置表单项配置 */
export interface ConfigFormItemConfig extends FormItemConfig {
  /** 配置类型 */
  configType?: ConfigType;
  /** 配置描述 */
  description?: string;
}

/** Props 接口 */
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

/** 暴露实例接口 */
export interface MfwConfigFormCardExpose {
  /** 确认提交（内部调用 validate + API 批量更新） */
  onConfirm: () => Promise<void>;
  /** 重置表单（重新拉取后端数据） */
  reset: () => Promise<void>;
}
```

- [ ] **Step 2: 创建 index.tsx**

```tsx
/**
 * @fileoverview MfwConfigFormCard 配置表单卡片组件
 * @description 基于 MfwFormCard 二次封装，支持按 configType 分 Tab 显示
 */

import {
  defineComponent, ref, computed, onMounted, h, type PropType, type Ref
} from 'vue';
import { ElTabs, ElTabPane, ElMessage, ElSkeleton } from 'element-plus';
import { MfwFormCard } from 'moyan-mfw-base/frontend';
import type { MfwFormCardInstance } from 'moyan-mfw-base/frontend';
import type {
  MfwConfigFormCardProps,
  MfwConfigFormCardExpose,
  ConfigFormItemConfig,
} from './types';
import { ConfigType } from '../../../../shared/src/constants';

export default defineComponent({
  name: 'MfwConfigFormCard',

  props: {
    appId: {
      type: [Number, null] as PropType<MfwConfigFormCardProps['appId']>,
      default: null,
    },
    groupKey: {
      type: String as PropType<MfwConfigFormCardProps['groupKey']>,
      required: true,
    },
    items: {
      type: Array as PropType<MfwConfigFormCardProps['items']>,
      default: () => [],
    },
    formGroup: {
      type: Object as PropType<MfwConfigFormCardProps['formGroup']>,
    },
    privateTabTitle: {
      type: String as PropType<MfwConfigFormCardProps['privateTabTitle']>,
      default: '敏感配置',
    },
    publicTabTitle: {
      type: String as PropType<MfwConfigFormCardProps['publicTabTitle']>,
      default: '公开配置',
    },
  },

  setup(props, { expose }) {
    const loading = ref(true);
    const activeTab = ref('public');
    const publicFormRef = ref<MfwFormCardInstance>();
    const privateFormRef = ref<MfwFormCardInstance>();
    const publicFormData: Ref<Record<string, any>> = ref({});
    const privateFormData: Ref<Record<string, any>> = ref({});

    // 按 configType 分类
    const publicItems = computed(() =>
      props.items.filter((i) => i.configType === ConfigType.PUBLIC)
    );
    const privateItems = computed(() =>
      props.items.filter((i) => i.configType === ConfigType.PRIVATE)
    );
    const hasBothTypes = computed(
      () => publicItems.value.length > 0 && privateItems.value.length > 0
    );

    /**
     * 加载配置数据
     */
    const loadConfig = async () => {
      loading.value = true;
      try {
        // 组件内部直接调用后端接口，不依赖 moyan-api 生成的客户端
        const appIdParam = props.appId !== null ? String(props.appId) : 'null';
        const response = await fetch(
          `/api/ext/config/group/${props.groupKey}?appId=${appIdParam}`
        );
        if (!response.ok) {
          throw new Error('Failed to load config');
        }
        const result = await response.json();
        const configs = result.data || [];

        // 填充表单数据
        publicFormData.value = {};
        privateFormData.value = {};
        for (const config of configs) {
          const value = config.configValue?.data ?? '';
          if (config.configType === ConfigType.PUBLIC) {
            publicFormData.value[config.configKey] = value;
          } else {
            privateFormData.value[config.configKey] = value;
          }
        }
      } catch (error) {
        ElMessage.error('加载配置失败');
      } finally {
        loading.value = false;
      }
    };

    /**
     * 确认提交
     */
    const onConfirm = async () => {
      // 先验证所有可见的表单
      const formsToValidate: MfwFormCardInstance[] = [];
      if (publicItems.value.length > 0) {
        if (publicFormRef.value) formsToValidate.push(publicFormRef.value);
      }
      if (privateItems.value.length > 0) {
        if (privateFormRef.value) formsToValidate.push(privateFormRef.value);
      }

      for (const form of formsToValidate) {
        await (form as any).validate();
      }

      // 构建提交数据
      const items: Array<{ configKey: string; configValue: { data: any }; description?: string }> = [];
      for (const item of props.items) {
        const formData = item.configType === ConfigType.PUBLIC
          ? publicFormData.value
          : privateFormData.value;
        items.push({
          configKey: item.key,
          configValue: { data: formData[item.key] ?? '' },
          description: (item as ConfigFormItemConfig).description,
        });
      }

      // 调用批量更新 API
      const response = await fetch('/api/ext/config/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupKey: props.groupKey,
          appId: props.appId,
          items,
        }),
      });

      if (!response.ok) {
        ElMessage.error('保存配置失败');
        throw new Error('Failed to save config');
      }

      ElMessage.success('配置保存成功');
    };

    /**
     * 重置表单
     */
    const reset = async () => {
      await loadConfig();
    };

    onMounted(() => {
      loadConfig();
    });

    expose<MfwConfigFormCardExpose>({ onConfirm, reset });

    return () => {
      if (loading.value) {
        return h(ElSkeleton, { animated: true });
      }

      const renderForm = (
        formRefKey: 'publicFormRef' | 'privateFormRef',
        template: ConfigFormItemConfig[],
        formData: Record<string, any>
      ) => {
        return h(MfwFormCard, {
          ref: formRefKey === 'publicFormRef' ? publicFormRef : privateFormRef,
          formData,
          template,
          formGroup: props.formGroup,
        });
      };

      // 同时包含公共和私有配置时，分 Tab 显示
      if (hasBothTypes.value) {
        return h(ElTabs, { modelValue: activeTab.value, 'onUpdate:modelValue': (v: string) => { activeTab.value = v; } }, () => [
          h(ElTabPane, { label: props.publicTabTitle, name: 'public' }, () =>
            renderForm('publicFormRef', publicItems.value, publicFormData.value)
          ),
          h(ElTabPane, { label: props.privateTabTitle, name: 'private' }, () =>
            renderForm('privateFormRef', privateItems.value, privateFormData.value)
          ),
        ]);
      }

      // 仅一种类型时，直接渲染
      if (publicItems.value.length > 0) {
        return renderForm('publicFormRef', publicItems.value, publicFormData.value);
      }
      if (privateItems.value.length > 0) {
        return renderForm('privateFormRef', privateItems.value, privateFormData.value);
      }
      return null;
    };
  },
});
```

- [ ] **Step 3: 创建 mod.ts**

```typescript
/**
 * @fileoverview MfwConfigFormCard 组件导出
 */

export { default as MfwConfigFormCard } from './index';
export type * from './types';
```

- [ ] **Step 4: 创建 frontend/src/index.ts**

```typescript
/**
 * @fileoverview 配置管理前端入口
 * @description 仅导出组件，不注册路由
 */

export * from './components/config-form-card/mod';
```

- [ ] **Step 5: 创建 frontend/package.json**

```json
{
  "name": "@internal/config-frontend",
  "private": true,
  "type": "module",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "vite build --config vite.config.mts && vue-tsc --emitDeclarationOnly -p tsconfig.json",
    "typecheck": "vue-tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@element-plus/icons-vue": "catalog:",
    "@internal/base-shared": "workspace:*",
    "@internal/config-shared": "workspace:*",
    "@vueuse/core": "catalog:",
    "axios": "catalog:",
    "element-plus": "catalog:",
    "moyan-mfw-base": "workspace:*",
    "moyan-mfw-extension-config": "workspace:*",
    "pinia": "catalog:",
    "vue": "catalog:",
    "vue-router": "catalog:"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "catalog:",
    "@vitejs/plugin-vue-jsx": "catalog:",
    "sass": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vue-tsc": "catalog:"
  }
}
```

- [ ] **Step 6: 创建 frontend/tsconfig.json**

```json
{
  "extends": "../../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "allowImportingTsExtensions": true,
    "emitDeclarationOnly": true,
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 7: Commit**

```bash
git add src/frontend/
git commit -m "feat(config): add frontend MfwConfigFormCard component"
```

---

### Task 7: 数据库迁移

**Files:**
- Create: `packages/extensions/extension-config/database/migrations/20260603000000-config.ts`

- [ ] **Step 1: 创建迁移文件**

```typescript
/**
 * @fileoverview 配置管理表迁移
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class Config20260603000000 implements MigrationInterface {
  name = 'Config20260603000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`mfw_config\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`app_id\` bigint DEFAULT NULL,
        \`group_key\` varchar(64) NOT NULL,
        \`config_key\` varchar(128) NOT NULL,
        \`config_value\` json NOT NULL,
        \`config_type\` tinyint NOT NULL DEFAULT '0',
        \`description\` varchar(256) DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`update_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`delete_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_app_group_config\` (\`app_id\`, \`group_key\`, \`config_key\`, \`delete_at\`),
        KEY \`idx_app_group\` (\`app_id\`, \`group_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `mfw_config`');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add database/
git commit -m "feat(config): add database migration for mfw_config table"
```

---

### Task 8: 扩展包根配置

**Files:**
- Create: `packages/extensions/extension-config/package.json`
- Create: `packages/extensions/extension-config/tsconfig.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "moyan-mfw-extension-config",
  "version": "1.0.0",
  "description": "MFW 配置管理扩展包",
  "exports": {
    "./backend": {
      "types": "./src/backend/dist/index.d.ts",
      "import": "./src/backend/dist/index.js",
      "require": "./src/backend/dist/index.js"
    },
    "./backend/*": {
      "types": "./src/backend/dist/*.d.ts",
      "import": "./src/backend/dist/*.js",
      "require": "./src/backend/dist/*"
    },
    "./frontend": {
      "types": "./src/frontend/dist/index.d.ts",
      "import": "./src/frontend/dist/index.mjs",
      "require": "./src/frontend/dist/index.mjs",
      "style": "./src/frontend/dist/style.css"
    },
    "./frontend/*": {
      "types": "./src/frontend/dist/*.d.ts",
      "import": "./src/frontend/dist/*",
      "require": "./src/frontend/dist/*"
    },
    "./shared": {
      "types": "./src/shared/dist/index.d.ts",
      "import": "./src/shared/dist/index.js",
      "require": "./src/shared/dist/index.js"
    },
    "./shared/*": {
      "types": "./src/shared/dist/*.d.ts",
      "import": "./src/shared/dist/*",
      "require": "./src/shared/dist/*"
    }
  },
  "typesVersions": {
    "*": {
      "*": [
        "./src/*/dist/*.d.ts",
        "./src/*/dist/index.d.ts"
      ]
    }
  },
  "license": "MIT",
  "keywords": [
    "moyan",
    "mfw",
    "extension",
    "config",
    "配置管理"
  ],
  "files": [
    "src/backend/dist",
    "src/frontend/dist",
    "src/shared/dist",
    "database/migrations",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=20.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./src/backend/tsconfig.json" },
    { "path": "./src/frontend/tsconfig.json" },
    { "path": "./src/shared/tsconfig.json" }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json tsconfig.json
git commit -m "feat(config): add extension-config root configuration"
```

---

### Task 9: 类型检查验证

- [ ] **Step 1: 运行类型检查**

```bash
cd packages/extensions/extension-config
pnpm typecheck
```

预期：零错误通过。

- [ ] **Step 2: 如有错误，逐个修复**

- [ ] **Step 3: 确认零错误后 Commit**

```bash
git add .
git commit -m "chore(config): fix type errors"
```
