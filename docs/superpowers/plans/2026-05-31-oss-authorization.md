# OSS 授权接口集成 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `packages/base/src/backend` 的 `upload` 模块内集成阿里云 OSS STS `getAuthorization` 接口。

**Architecture:** 新增 `OssService` 子服务（依赖 `ali-oss` STS），通过 `ConfigService` 读取环境变量配置，由 `UploadFileController` 暴露 `GET /upload-files/oss-authorization` 端点。

**Tech Stack:** NestJS + `ali-oss` (STS) + `@nestjs/config` + `@nestjs/swagger`

**Spec:** `docs/superpowers/specs/2026-05-31-oss-authorization-design.md`

---

### Task 1: 安装 `ali-oss` 依赖

**Files:**
- Modify: `packages/base/src/backend/package.json`

- [ ] **Step 1: 安装依赖**

```bash
pnpm --filter @internal/base-backend add ali-oss
```

- [ ] **Step 2: 验证安装**

```bash
node -e "require('ali-oss')"
```
Expected: 无报错，输出 STS 类相关模块信息。

---

### Task 2: 创建 OSS 配置文件

**Files:**
- Create: `packages/base/src/backend/src/config/oss.config.ts`

- [ ] **Step 1: 创建 `oss.config.ts`**

```typescript
/**
 * @fileoverview OSS 配置
 * @description 阿里云 OSS STS 临时凭证及 Bucket 配置
 */

export default () => ({
  oss: {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    roleArn: process.env.OSS_ROLE_ARN || '',
    tokenExpireTime: parseInt(process.env.OSS_TOKEN_EXPIRE_TIME || '3600', 10),
    bucket: process.env.OSS_BUCKET || '',
    endpoint: process.env.OSS_ENDPOINT || '',
    timeout: parseInt(process.env.OSS_TIMEOUT || '60', 10),
  },
});
```

- [ ] **Step 2: 修改 `config/index.ts`** — 新增导出

在 `config/index.ts` 末尾追加：

```typescript
export { default as ossConfig } from './oss.config';
```

- [ ] **Step 3: 修改 `app.module.ts`** — 注册配置

修改 `app.module.ts` 第 17 行 import：

```typescript
import { databaseConfig, appConfig, redisConfig, userConfig, ossConfig } from './config';
```

修改第 162 行 `load` 数组：

```typescript
load: [databaseConfig, appConfig, redisConfig, userConfig, ossConfig],
```

- [ ] **Step 4: 类型检查验证**

```bash
cd packages/base/src/backend && pnpm typecheck
```
Expected: 零错误。

---

### Task 3: 创建 OSS 服务

**Files:**
- Create: `packages/base/src/backend/src/modules/sys/upload/oss.service.ts`

- [ ] **Step 1: 创建 `oss.service.ts`**

```typescript
/**
 * @fileoverview OSS 服务
 * @description 提供阿里云 OSS STS 临时凭证授权
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STS } from 'ali-oss';

@Injectable()
export class OssService {
  constructor(private configService: ConfigService) {}

  async getAuthorization() {
    const ossConfig = this.configService.get('oss');
    const client = new STS({
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
    });
    const result = await client.assumeRole(
      ossConfig.roleArn,
      '',
      ossConfig.tokenExpireTime,
    );
    return {
      accessKeyId: result.credentials.AccessKeyId,
      accessKeySecret: result.credentials.AccessKeySecret,
      securityToken: result.credentials.SecurityToken,
      stsToken: result.credentials.SecurityToken,
      expiration: result.credentials.Expiration,
      bucket: ossConfig.bucket,
      endpoint: ossConfig.endpoint,
      timeout: ossConfig.timeout,
    };
  }
}
```

- [ ] **Step 2: 类型检查验证**

```bash
cd packages/base/src/backend && pnpm typecheck
```
Expected: 零错误。

---

### Task 4: 创建响应 DTO

**Files:**
- Create: `packages/base/src/backend/src/modules/sys/upload/dto/res/oss-authorization.dto.ts`

- [ ] **Step 1: 创建 DTO 文件**

```typescript
/**
 * @fileoverview OSS 授权响应 DTO
 * @description OSS STS 临时凭证授权接口响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';

export class OssAuthorizationDto {
  @ApiProperty({ description: '临时 AccessKeyId' })
  accessKeyId: string;

  @ApiProperty({ description: '临时 AccessKeySecret' })
  accessKeySecret: string;

  @ApiProperty({ description: '安全令牌' })
  securityToken: string;

  @ApiProperty({ description: 'STS Token（同 securityToken）' })
  stsToken: string;

  @ApiProperty({ description: '凭证过期时间（ISO 8601）' })
  expiration: string;

  @ApiProperty({ description: 'OSS Bucket 名称' })
  bucket: string;

  @ApiProperty({ description: 'OSS Endpoint' })
  endpoint: string;

  @ApiProperty({ description: '上传超时时间（秒）' })
  timeout: number;
}
```

- [ ] **Step 2: 类型检查验证**

```bash
cd packages/base/src/backend && pnpm typecheck
```
Expected: 零错误。

---

### Task 5: 注册 OssService 到 upload 模块

**Files:**
- Modify: `packages/base/src/backend/src/modules/sys/upload/upload.module.ts`
- Modify: `packages/base/src/backend/src/modules/sys/upload/index.ts`

- [ ] **Step 1: 修改 `upload.module.ts`**

在 `providers` 和 `exports` 中加入 `OssService`：

```typescript
import { OssService } from './oss.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  providers: [UploadFileService, OssService],
  controllers: [UploadFileController],
  exports: [UploadFileService, OssService],
})
export class UploadFileModule {}
```

- [ ] **Step 2: 修改 `upload/index.ts`** — 追加导出

```typescript
export * from './oss.service';
```

- [ ] **Step 3: 类型检查验证**

```bash
cd packages/base/src/backend && pnpm typecheck
```
Expected: 零错误。

---

### Task 6: 在 controller 新增 OSS 授权端点

**Files:**
- Modify: `packages/base/src/backend/src/modules/sys/upload/upload.controller.ts`

- [ ] **Step 1: 修改 controller**

追加 import（`Get` 装饰器、`OssService`、`OssAuthorizationDto`）和新端点：

```typescript
import { Get } from '@nestjs/common';
import { OssService } from './oss.service';
import { OssAuthorizationDto } from './dto/res/oss-authorization.dto';

// 构造函数注入 OssService:
constructor(
  private uploadFileService: UploadFileService,
  private ossService: OssService,
) {}

// 类末尾追加方法:
@Get('oss-authorization')
@ApiOperation({ summary: '获取 OSS 上传授权', description: '获取阿里云 OSS STS 临时凭证，用于前端直传' })
@ApiResponse({ status: 200, description: '获取成功', type: OssAuthorizationDto })
async getOssAuthorization() {
  const result = await this.ossService.getAuthorization();
  return ApiResponseUtil.success(result, '获取 OSS 授权成功');
}
```

- [ ] **Step 2: 类型检查验证**

```bash
cd packages/base/src/backend && pnpm typecheck
```
Expected: 零错误。

---

### Task 7: 最终验证

- [ ] **Step 1: 运行完整类型检查**

```bash
cd packages/base/src/backend && pnpm typecheck
```
Expected: 零错误。

- [ ] **Step 2: 确认文件结构**

```
packages/base/src/backend/src/
├── config/
│   ├── index.ts          (已修改)
│   └── oss.config.ts     (新增)
├── app.module.ts         (已修改)
└── modules/sys/upload/
    ├── index.ts           (已修改)
    ├── upload.module.ts   (已修改)
    ├── upload.controller.ts (已修改)
    ├── upload.service.ts  (未改)
    ├── oss.service.ts     (新增)
    └── dto/res/
        └── oss-authorization.dto.ts (新增)
```

---

### 备选任务 T8 (可选): 单元测试

若后续需要，创建 `packages/base/src/backend/src/modules/sys/upload/oss.service.spec.ts`，mock `STS` 和 `ConfigService`，验证 `getAuthorization()` 返回结构。

**当前跳过理由：** 项目中 `src/backend` 目录下无 `.spec.ts` 文件，测试基础设施在 `packages/base/tests/integration/` 且为 E2E 风格。OSS 外部 API 不写 E2E。
