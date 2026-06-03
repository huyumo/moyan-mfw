# 配置管理扩展模块设计文档

> 日期：2026-06-03

## 1. 概述

配置管理扩展模块（`extension-config`）是一个纯组件库模式的扩展包，提供通用配置管理后端 API 和前端的 `ConfigFormCard` 组件。业务层自行构建管理页面，按 `groupKey` 分组使用。

### 核心特性

- 配置按分组（`groupKey`）管理，每个 `ConfigFormCard` 实例对应一个分组
- 配置类型：公共（无需认证可访问）/ 私有（需管理员权限）
- 租户隔离：`appId` 可为 `null`（全局配置）或非 `null`（租户私有配置）
- 缓存支持：基于框架 `CacheModule`（Redis/Memory 自动适配）
- 前端仅导出 `ConfigFormCard` 组件，不暴露具体页面

### 方案选择

选择了 **方案 B：纯组件库模式**，而非方案 A（含管理页面）。扩展包不提供管理页面，业务层自行引入组件并构建页面。

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
│   │   │   ├── apis/config/
│   │   │   │   ├── index.ts
│   │   │   │   └── schemas.ts
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

唯一索引：`uk_app_group_config(app_id, group_key, config_key)`

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

### 4.2 DTO 定义

**CreateConfigDto**
```typescript
{ appId?: number; groupKey: string; configKey: string; configValue: { data: any }; configType: ConfigType; description?: string }
```

**BatchUpdateConfigDto**
```typescript
{ groupKey: string; items: Array<{ configKey: string; configValue: { data: any }; configType: ConfigType; description?: string }> }
```

**ConfigResponseDto**
```typescript
{ id: number; appId: number | null; groupKey: string; configKey: string; configValue: { data: any }; configType: ConfigType; description: string | null }
```

### 4.3 Service 层

**ConfigService** 方法：

| 方法                      | 说明                                       | 缓存操作                         |
|--------------------------|-------------------------------------------|---------------------------------|
| `getByGroup(appId, groupKey)` | 按分组获取所有配置                        | `@Cacheable({ key: 'config:{appId}:{groupKey}', ttl: 3600 })` |
| `getPublicByGroup(groupKey)`  | 获取公共配置（无需 appId）               | `@Cacheable({ key: 'config:pub:{groupKey}', ttl: 3600 })` |
| `batchUpdate(appId, dto)`     | 批量更新一个分组下的配置（upsert 逻辑）  | `@CacheEvict({ keys: 'config:{appId}:{groupKey}' })` |
| `delete(appId, groupKey, configKey)` | 删除单个配置                      | `@CacheEvict({ keys: 'config:{appId}:{groupKey}' })` |

**缓存说明**：
- 使用框架 `@Cacheable` 装饰器自动读缓存
- 使用框架 `@CacheEvict` 装饰器自动清除缓存
- 缓存驱动自动适配：Redis（有 Redis 时）或 Memory（无 Redis 时）
- TTL 默认 3600 秒

### 4.4 Controller 层

**管理接口** `@Controller('ext/config')`（需 JWT + 权限）

| 方法   | 路径                        | 说明                | 权限         |
|--------|----------------------------|--------------------|-------------|
| GET    | `/group/:groupKey`         | 按分组获取全部配置   | 配置查看权限  |
| PUT    | `/batch`                   | 批量更新配置         | 配置编辑权限  |
| DELETE | `/:id`                     | 删除配置             | 配置删除权限  |

> 管理接口的请求体中包含 `appId` 字段，由前端传入。

**公开接口** `@Controller('ext/config/pub')`（`@Public()` 装饰器）

| 方法   | 路径                | 说明                          |
|--------|--------------------|-------------------------------|
| GET    | `/:groupKey`       | 仅返回公共配置（configType=0） |

### 4.5 权限定义（shared 层）

```typescript
// shared/src/permission-values.ts
export const CONFIG_PERMISSIONS = {
  VIEW: 'config:view',
  EDIT: 'config:edit',
  DELETE: 'config:delete',
};
```

### 4.6 模块注册

```typescript
// config.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([ConfigEntity])],
  controllers: [ConfigController, ConfigPubController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

---

## 5. 前端设计

### 5.1 类型定义

```typescript
// components/config-form-card/types.ts

import type { FormItemConfig, FormGroupConfig } from 'moyan-mfw-base/frontend';

export enum ConfigType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface ConfigFormItemConfig extends FormItemConfig {
  /** 配置类型 */
  configType?: ConfigType;
  /** 配置描述 */
  description?: string;
}

export interface ConfigFormCardProps {
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

export interface ConfigFormCardExpose {
  /** 确认提交 */
  onConfirm: () => Promise<boolean>;
  /** 重置表单 */
  reset: () => void;
}
```

### 5.2 组件行为

1. **挂载**：自动调用 `GET /ext/config/group/:groupKey` 获取配置数据，填充到 `formData`
2. **分类**：按 `configType` 将 `items` 分为「公共」和「私有」两个 Tab
3. **提交**：调用 `defineExpose({ onConfirm })`，内部调用 `PUT /ext/config/batch` 批量更新
4. **重置**：重新拉取后端数据覆盖本地 formData

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
export { default as ConfigFormCard } from './components/config-form-card';
export type * from './components/config-form-card/types';
export * from './apis/config';
```

不注册任何路由（无 `views/` 目录），业务层自行引入使用。

### 5.5 业务层使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ConfigFormCard, ConfigType } from 'moyan-mfw-extension-config/frontend';
import type { ConfigFormCardExpose } from 'moyan-mfw-extension-config/frontend';

const formRef = ref<ConfigFormCardExpose>();

const items = [
  { key: 'host', label: 'SMTP 服务器', component: 'el-input', configType: ConfigType.PUBLIC },
  { key: 'password', label: '密码', component: 'el-input', configType: ConfigType.PRIVATE, elProps: { type: 'password' } },
];

const handleSubmit = async () => {
  await formRef.value?.onConfirm();
};
</script>

<template>
  <ConfigFormCard ref="formRef" :app-id="appId" group-key="mail" :items="items" />
  <el-button @click="handleSubmit">保存</el-button>
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
  UNIQUE KEY `uk_app_group_config` (`app_id`, `group_key`, `config_key`),
  KEY `idx_app_group` (`app_id`, `group_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> 注意：`create_at/update_at/delete_at` 在 TypeORM Entity 中由 `Base` 基类的 `createdAt/updateAt/deleteAt` 映射。

---

## 7. 注意事项与边界

1. **appId 由前端传入**：前端通过 props 传入 `appId`（`null`=全局，具体值=租户），后端不自动推断。管理员可管理全局配置和应用配置，应用管理员仅管理自身配置，权限由业务层控制
2. **Upsert 逻辑**：批量更新使用 `save` 方法（存在则更新，不存在则插入），基于唯一索引 `uk_app_group_config` 判断
3. **公开接口安全**：`@Public()` 装饰器绕过 JWT 认证，但仅返回 `configType = 0` 的数据
4. **缓存一致性**：写入/删除后立即 `@CacheEvict`，确保读取到最新数据。`appId` 为 `null` 时使用 `config:null:{groupKey}` 作为缓存 key，确保全局配置与应用配置缓存隔离
5. **反模式规避**：
   - 不使用 `emit('confirm')`，使用 `defineExpose({ onConfirm })`
   - 分页使用 `PaginationX + WhereBuilder`（如果后续需要列表查询）
   - 不使用 `@Request() req`，使用 `@User() user: UserDto`
